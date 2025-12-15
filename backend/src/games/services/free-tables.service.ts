import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GameMode } from '../types/game.types';

export interface FreeTable {
  id: string;
  hostId: number;
  mode: GameMode;
  betAmount?: number;
  minRating?: number;
  maxRating?: number;
  turnTimeLimit?: number; // в секундах
  createdAt: number;
  hostName?: string;
  hostRating?: number;
}

@Injectable()
export class FreeTablesService {
  private readonly TABLES_KEY = 'free-tables:list';
  private readonly TABLE_TTL = 3600; // 1 час

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Создать свободный стол
   */
  async createTable(
    hostId: number,
    mode: GameMode,
    betAmount?: number,
    minRating?: number,
    maxRating?: number,
    turnTimeLimit?: number,
  ): Promise<FreeTable> {
    // Получаем информацию о хосте
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
      include: {
        ratings: {
          where: { mode },
        },
      },
    });

    if (!host) {
      throw new Error('Host not found');
    }

    const hostRating = host.ratings[0]?.rating || 1500;

    const tableId = `table:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    
    const table: FreeTable = {
      id: tableId,
      hostId,
      mode,
      betAmount,
      minRating,
      maxRating,
      turnTimeLimit: turnTimeLimit || 60,
      createdAt: Date.now(),
      hostName: host.nickname || host.firstName,
      hostRating,
    };

    // Сохраняем в Redis
    await this.redis.set(
      `free-table:${tableId}`,
      JSON.stringify(table),
      this.TABLE_TTL,
    );

    // Добавляем в список столов
    await this.redis.zadd(
      this.TABLES_KEY,
      Date.now(),
      tableId,
    );
    await this.redis.expire(this.TABLES_KEY, this.TABLE_TTL);

    return table;
  }

  /**
   * Получить список свободных столов
   */
  async getTables(filters?: {
    mode?: GameMode;
    minRating?: number;
    maxRating?: number;
    maxBet?: number;
  }): Promise<FreeTable[]> {
    const tableIds = await this.redis.zrange(this.TABLES_KEY, 0, -1);
    const tables: FreeTable[] = [];

    for (const tableId of tableIds) {
      const tableData = await this.redis.get(`free-table:${tableId}`);
      if (tableData) {
        try {
          const table: FreeTable = JSON.parse(tableData);
          
          // Проверяем фильтры
          if (filters) {
            if (filters.mode && table.mode !== filters.mode) {
              continue;
            }
            if (filters.minRating && table.hostRating && table.hostRating < filters.minRating) {
              continue;
            }
            if (filters.maxRating && table.hostRating && table.hostRating > filters.maxRating) {
              continue;
            }
            if (filters.maxBet && table.betAmount && table.betAmount > filters.maxBet) {
              continue;
            }
          }

          // Проверяем, не истек ли стол
          const age = Date.now() - table.createdAt;
          if (age < this.TABLE_TTL * 1000) {
            tables.push(table);
          } else {
            // Удаляем устаревший стол
            await this.removeTable(tableId);
          }
        } catch (e) {
          // Удаляем некорректные записи
          await this.removeTable(tableId);
        }
      }
    }

    // Сортируем по времени создания (новые первыми)
    return tables.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Удалить стол
   */
  async removeTable(tableId: string): Promise<void> {
    await this.redis.del(`free-table:${tableId}`);
    await this.redis.zrem(this.TABLES_KEY, tableId);
  }

  /**
   * Присоединиться к столу
   */
  async joinTable(tableId: string, playerId: number): Promise<FreeTable | null> {
    const tableData = await this.redis.get(`free-table:${tableId}`);
    if (!tableData) {
      return null;
    }

    const table: FreeTable = JSON.parse(tableData);

    // Проверяем, что игрок не является хостом
    if (table.hostId === playerId) {
      throw new Error('Cannot join your own table');
    }

    // Проверяем рейтинг игрока
    if (table.minRating || table.maxRating) {
      const player = await this.prisma.user.findUnique({
        where: { id: playerId },
        include: {
          ratings: {
            where: { mode: table.mode },
          },
        },
      });

      const playerRating = player?.ratings[0]?.rating || 1500;

      if (table.minRating && playerRating < table.minRating) {
        throw new Error('Your rating is too low for this table');
      }
      if (table.maxRating && playerRating > table.maxRating) {
        throw new Error('Your rating is too high for this table');
      }
    }

    // Удаляем стол из списка (он больше не свободный)
    await this.removeTable(tableId);

    return table;
  }

  /**
   * Получить стол по ID
   */
  async getTable(tableId: string): Promise<FreeTable | null> {
    const tableData = await this.redis.get(`free-table:${tableId}`);
    if (!tableData) {
      return null;
    }

    return JSON.parse(tableData);
  }
}

