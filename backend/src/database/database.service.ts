import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    // Парсим DATABASE_URL: postgresql://user:password@host:port/database
    const url = new URL(databaseUrl);
    
    this.pool = new Pool({
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.slice(1), // убираем первый /
      user: url.username,
      password: url.password,
      max: 20, // максимальное количество клиентов в пуле
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Тестируем подключение
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('Database connection pool closed');
    }
  }

  // Получить клиент из пула
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  // Выполнить запрос
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      this.logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 50)}...`);
      return result;
    } catch (error) {
      this.logger.error(`Query failed: ${text}`, error);
      throw error;
    }
  }

  // Выполнить запрос в транзакции
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Вспомогательная функция для экранирования имен колонок
  private escapeColumn(name: string): string {
    // Если имя содержит заглавные буквы или специальные символы, оборачиваем в кавычки
    if (/[A-Z]/.test(name) || name.includes('-') || name.includes(' ')) {
      return `"${name}"`;
    }
    return name;
  }

  // Простые методы для удобства
  async findOne<T = any>(table: string, where: Record<string, any>): Promise<T | null> {
    const keys = Object.keys(where);
    const values = Object.values(where);
    const conditions = keys.map((key, index) => `${this.escapeColumn(key)} = $${index + 1}`).join(' AND ');
    
    const result = await this.query<T>(`SELECT * FROM ${table} WHERE ${conditions} LIMIT 1`, values);
    return result.rows[0] || null;
  }

  async findMany<T = any>(table: string, where?: Record<string, any>, options?: { limit?: number; orderBy?: string }): Promise<T[]> {
    let query = `SELECT * FROM ${table}`;
    const values: any[] = [];
    let paramIndex = 1;

    if (where && Object.keys(where).length > 0) {
      const keys = Object.keys(where);
      const conditions = keys.map((key) => {
        const value = where[key];
        if (Array.isArray(value)) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
          return `${key} IN (${placeholders})`;
        }
        return `${key} = $${paramIndex++}`;
      }).join(' AND ');
      query += ` WHERE ${conditions}`;
      values.push(...Object.values(where).flat());
    }

    if (options?.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }

    if (options?.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(options.limit);
    }

    const result = await this.query<T>(query, values);
    return result.rows;
  }

  async create<T = any>(table: string, data: Record<string, any>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const escapedKeys = keys.map(k => this.escapeColumn(k));
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    
    const result = await this.query<T>(
      `INSERT INTO ${table} (${escapedKeys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async update<T = any>(table: string, where: Record<string, any>, data: Record<string, any>): Promise<T> {
    const dataKeys = Object.keys(data);
    const whereKeys = Object.keys(where);
    const dataValues = Object.values(data);
    const whereValues = Object.values(where);
    
    const setClause = dataKeys.map((key, index) => `${this.escapeColumn(key)} = $${index + 1}`).join(', ');
    const whereClause = whereKeys.map((key, index) => `${this.escapeColumn(key)} = $${dataKeys.length + index + 1}`).join(' AND ');
    
    const result = await this.query<T>(
      `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`,
      [...dataValues, ...whereValues]
    );
    return result.rows[0];
  }

  async delete(table: string, where: Record<string, any>): Promise<void> {
    const keys = Object.keys(where);
    const values = Object.values(where);
    const conditions = keys.map((key, index) => `${this.escapeColumn(key)} = $${index + 1}`).join(' AND ');
    
    await this.query(`DELETE FROM ${table} WHERE ${conditions}`, values);
  }

  async count(table: string, where?: Record<string, any>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    const values: any[] = [];

    if (where && Object.keys(where).length > 0) {
      const keys = Object.keys(where);
      const conditions = keys.map((key, index) => `${this.escapeColumn(key)} = $${index + 1}`).join(' AND ');
      query += ` WHERE ${conditions}`;
      values.push(...Object.values(where));
    }

    const result = await this.query<{ count: string }>(query, values);
    return parseInt(result.rows[0].count, 10);
  }
}
