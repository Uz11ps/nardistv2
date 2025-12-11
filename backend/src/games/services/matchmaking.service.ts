import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { GameMode } from '../types/game.types';

interface MatchmakingQueue {
  userId: number;
  mode: GameMode;
  betAmount?: number;
  districtId?: number;
  joinedAt: number;
}

@Injectable()
export class MatchmakingService {
  private readonly QUEUE_KEY = 'matchmaking:queue';
  private readonly QUEUE_TTL = 300; // 5 минут в очереди

  constructor(private readonly redis: RedisService) {}

  /**
   * Добавить игрока в очередь поиска
   */
  async joinQueue(userId: number, mode: GameMode, betAmount?: number, districtId?: number): Promise<void> {
    const queueItem: MatchmakingQueue = {
      userId,
      mode,
      betAmount,
      districtId,
      joinedAt: Date.now(),
    };

    await this.redis.zadd(
      this.QUEUE_KEY,
      Date.now(),
      JSON.stringify(queueItem),
    );
    await this.redis.expire(this.QUEUE_KEY, this.QUEUE_TTL);
  }

  /**
   * Удалить игрока из очереди
   */
  async leaveQueue(userId: number): Promise<void> {
    const queue = await this.getQueue();
    const item = queue.find(q => q.userId === userId);
    if (item) {
      await this.redis.zrem(this.QUEUE_KEY, JSON.stringify(item));
    }
  }

  /**
   * Найти соперника для игрока
   */
  async findOpponent(userId: number, mode: GameMode, betAmount?: number, districtId?: number): Promise<MatchmakingQueue | null> {
    const queue = await this.getQueue();
    
    // Ищем соперника с подходящими параметрами
    const opponent = queue.find(q => 
      q.userId !== userId &&
      q.mode === mode &&
      (betAmount === undefined || q.betAmount === betAmount) &&
      (districtId === undefined || q.districtId === districtId)
    );

    if (opponent) {
      // Удаляем обоих из очереди
      await this.leaveQueue(userId);
      await this.leaveQueue(opponent.userId);
      return opponent;
    }

    return null;
  }

  /**
   * Получить очередь
   */
  private async getQueue(): Promise<MatchmakingQueue[]> {
    const now = Date.now();
    const maxAge = now - (this.QUEUE_TTL * 1000);
    
    // Получаем все элементы очереди
    const items = await this.redis.zrange(this.QUEUE_KEY, 0, -1);
    
    const queue: MatchmakingQueue[] = [];
    for (const item of items) {
      try {
        const parsed: MatchmakingQueue = JSON.parse(item);
        // Проверяем, не истекло ли время
        if (parsed.joinedAt > maxAge) {
          queue.push(parsed);
        } else {
          // Удаляем устаревшие записи
          await this.redis.zrem(this.QUEUE_KEY, item);
        }
      } catch (e) {
        // Удаляем некорректные записи
        await this.redis.zrem(this.QUEUE_KEY, item);
      }
    }

    return queue;
  }

  /**
   * Проверить, находится ли игрок в очереди
   */
  async isInQueue(userId: number): Promise<boolean> {
    const queue = await this.getQueue();
    return queue.some(q => q.userId === userId);
  }
}

