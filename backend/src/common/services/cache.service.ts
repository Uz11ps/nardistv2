import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  /**
   * Получить значение из кэша
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  /**
   * Установить значение в кэш
   */
  async set(key: string, value: any, ttl: number = 60): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), ttl);
  }

  /**
   * Удалить значение из кэша
   */
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Удалить все ключи по паттерну
   */
  async deletePattern(pattern: string): Promise<void> {
    const client = this.redis.getClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  /**
   * Инвалидировать кэш пользователя
   */
  async invalidateUserCache(userId: number): Promise<void> {
    await this.deletePattern(`cache:*:user:${userId}*`);
    await this.delete(`user:${userId}:data`);
  }

  /**
   * Инвалидировать кэш игры
   */
  async invalidateGameCache(roomId: string): Promise<void> {
    await this.delete(`game:${roomId}:state`);
    await this.delete(`game:${roomId}:players`);
  }
}

