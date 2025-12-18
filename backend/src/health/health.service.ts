import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const isHealthy = checks.every((check) => check.status === 'fulfilled');

    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
    };
  }

  async detailedCheck() {
    const [dbCheck, redisCheck] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return {
      status: dbCheck.status === 'fulfilled' && redisCheck.status === 'fulfilled' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck.status === 'fulfilled' 
          ? { status: 'ok', ...dbCheck.value }
          : { status: 'error', error: dbCheck.reason?.message || 'Unknown error' },
        redis: redisCheck.status === 'fulfilled'
          ? { status: 'ok', ...redisCheck.value }
          : { status: 'error', error: redisCheck.reason?.message || 'Unknown error' },
      },
    };
  }

  private async checkDatabase() {
    try {
      const start = Date.now();
      await this.db.query('SELECT 1');
      const responseTime = Date.now() - start;
      return { responseTime };
    } catch (error) {
      throw new Error('Database connection failed');
    }
  }

  private async checkRedis() {
    try {
      const start = Date.now();
      await this.redis.getClient().ping();
      const responseTime = Date.now() - start;
      return { responseTime };
    } catch (error) {
      throw new Error('Redis connection failed');
    }
  }
}

