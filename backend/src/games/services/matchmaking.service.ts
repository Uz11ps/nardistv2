import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GameMode } from '../types/game.types';

interface MatchmakingQueue {
  userId: number;
  mode: GameMode;
  betAmount?: number;
  districtId?: number;
  joinedAt: number;
  isPremium?: boolean; // Приоритет для подписчиков
  rating?: number; // Рейтинг игрока для подбора соперников
}

@Injectable()
export class MatchmakingService {
  private readonly QUEUE_KEY = 'matchmaking:queue';
  private readonly QUEUE_TTL = 300; // 5 минут в очереди
  private readonly RATING_TOLERANCE = 200; // Допустимая разница в рейтинге (±200)
  private readonly RATING_EXPANSION = 50; // Расширение диапазона каждые 10 секунд

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Добавить игрока в очередь поиска
   */
  async joinQueue(userId: number, mode: GameMode, betAmount?: number, districtId?: number): Promise<void> {
    // Проверяем, есть ли у пользователя активная подписка
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    const hasActiveSubscription = user?.subscription 
      && user.subscription.isActive 
      && new Date() < user.subscription.endDate;

    // Получаем рейтинг игрока для данного режима
    const rating = await this.prisma.rating.findUnique({
      where: {
        userId_mode: {
          userId,
          mode,
        },
      },
    });

    const queueItem: MatchmakingQueue = {
      userId,
      mode,
      betAmount,
      districtId,
      joinedAt: Date.now(),
      isPremium: hasActiveSubscription,
      rating: rating?.rating || 1500, // Дефолтный рейтинг 1500
    };

    // Подписчики получают приоритет (меньший score = выше в очереди)
    // Обычные игроки: score = Date.now()
    // Подписчики: score = Date.now() - 1000000 (приоритет)
    const score = hasActiveSubscription ? Date.now() - 1000000 : Date.now();

    await this.redis.zadd(
      this.QUEUE_KEY,
      score,
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
    
    // Проверяем, есть ли у пользователя активная подписка
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    const hasActiveSubscription = user?.subscription 
      && user.subscription.isActive 
      && new Date() < user.subscription.endDate;

    // Получаем рейтинг игрока
    const userRating = await this.prisma.rating.findUnique({
      where: {
        userId_mode: {
          userId,
          mode,
        },
      },
    });
    const playerRating = userRating?.rating || 1500;

    // Вычисляем время ожидания в очереди
    const waitTime = Date.now() - (queue.find(q => q.userId === userId)?.joinedAt || Date.now());
    const waitSeconds = Math.floor(waitTime / 1000);
    
    // Расширяем диапазон рейтинга со временем ожидания
    const ratingRange = this.RATING_TOLERANCE + (Math.floor(waitSeconds / 10) * this.RATING_EXPANSION);
    const minRating = playerRating - ratingRange;
    const maxRating = playerRating + ratingRange;

    // Сначала ищем среди подписчиков с близким рейтингом (если сам подписчик)
    const priorityOpponents = queue.filter(q => 
      q.userId !== userId &&
      q.mode === mode &&
      (betAmount === undefined || q.betAmount === betAmount) &&
      (districtId === undefined || q.districtId === districtId) &&
      (hasActiveSubscription ? q.isPremium : true) && // Подписчики предпочитают подписчиков
      q.rating !== undefined &&
      q.rating >= minRating &&
      q.rating <= maxRating
    );

    // Сортируем по близости рейтинга
    priorityOpponents.sort((a, b) => {
      const diffA = Math.abs((a.rating || 1500) - playerRating);
      const diffB = Math.abs((b.rating || 1500) - playerRating);
      return diffA - diffB;
    });

    // Если есть приоритетные соперники, берем ближайшего по рейтингу
    let opponent = priorityOpponents.length > 0 
      ? priorityOpponents[0]
      : null;

    // Если не нашли среди приоритетных, ищем среди всех с подходящим рейтингом
    if (!opponent) {
      const allOpponents = queue.filter(q => 
        q.userId !== userId &&
        q.mode === mode &&
        (betAmount === undefined || q.betAmount === betAmount) &&
        (districtId === undefined || q.districtId === districtId) &&
        q.rating !== undefined &&
        q.rating >= minRating &&
        q.rating <= maxRating
      );

      // Сортируем по близости рейтинга
      allOpponents.sort((a, b) => {
        const diffA = Math.abs((a.rating || 1500) - playerRating);
        const diffB = Math.abs((b.rating || 1500) - playerRating);
        return diffA - diffB;
      });

      opponent = allOpponents.length > 0 ? allOpponents[0] : null;
    }

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

