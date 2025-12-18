import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface GameMetrics {
  totalGames: number;
  activeGames: number;
  completedGames: number;
  averageDuration: number;
  gamesByMode: Record<string, number>;
  gamesByStatus: Record<string, number>;
}

interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsLast24h: number;
  errorsLastHour: number;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
}

@Injectable()
export class MetricsService {
  private responseTimes: number[] = [];
  private errorCounts: Map<string, number> = new Map();
  private requestCount = 0;
  private lastResetTime = Date.now();

  constructor(private readonly db: DatabaseService) {
    // Очищаем старые метрики каждые 5 минут
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 5 * 60 * 1000);
  }

  /**
   * Записать время ответа
   */
  recordResponseTime(duration: number) {
    this.responseTimes.push(duration);
    this.requestCount++;
    
    // Храним только последние 1000 записей
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  /**
   * Записать ошибку
   */
  recordError(errorType: string) {
    const count = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, count + 1);
  }

  /**
   * Получить метрики игр
   */
  async getGameMetrics(): Promise<GameMetrics> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalGames, completedGames, gamesByModeResult, gamesByDuration] = await Promise.all([
      this.db.count('game_history', {}),
      this.db.query(
        'SELECT COUNT(*) as count FROM game_history WHERE "winnerId" IS NOT NULL'
      ).then(r => parseInt(r.rows[0].count, 10)),
      this.db.query(
        'SELECT mode, COUNT(*) as count FROM game_history GROUP BY mode'
      ),
      this.db.query(
        'SELECT duration FROM game_history WHERE "createdAt" >= $1 AND duration IS NOT NULL',
        [last24h]
      ),
    ]);

    const gamesByMode: Array<{ mode: string; _count: number }> = gamesByModeResult.rows.map(r => ({
      mode: r.mode,
      _count: parseInt(r.count, 10),
    }));

    const gamesByModeMap: Record<string, number> = {};
    gamesByMode.forEach((item) => {
      gamesByModeMap[item.mode] = item._count;
    });

    const durations = gamesByDuration.rows
      .map((g) => g.duration)
      .filter((d): d is number => d !== null && typeof d === 'number');
    const averageDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    return {
      totalGames,
      activeGames: 0, // TODO: Получать из Redis/WebSocket
      completedGames,
      averageDuration: Math.round(averageDuration),
      gamesByMode: gamesByModeMap,
      gamesByStatus: {
        completed: completedGames,
        inProgress: totalGames - completedGames,
      },
    };
  }

  /**
   * Получить метрики ошибок
   */
  getErrorMetrics(): ErrorMetrics {
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );

    const errorsByType: Record<string, number> = {};
    this.errorCounts.forEach((count, type) => {
      errorsByType[type] = count;
    });

    return {
      totalErrors,
      errorsByType,
      errorsLast24h: totalErrors, // TODO: Хранить по времени
      errorsLastHour: totalErrors, // TODO: Хранить по времени
    };
  }

  /**
   * Получить метрики производительности
   */
  getPerformanceMetrics(): PerformanceMetrics {
    if (this.responseTimes.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        requestsPerSecond: 0,
      };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const average = sorted.reduce((sum, t) => sum + t, 0) / sorted.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    const elapsed = (Date.now() - this.lastResetTime) / 1000;
    const requestsPerSecond = elapsed > 0 ? this.requestCount / elapsed : 0;

    return {
      averageResponseTime: Math.round(average),
      p95ResponseTime: sorted[p95Index] || 0,
      p99ResponseTime: sorted[p99Index] || 0,
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
    };
  }

  /**
   * Получить все метрики
   */
  async getAllMetrics() {
    const [gameMetrics, errorMetrics, performanceMetrics] = await Promise.all([
      this.getGameMetrics(),
      Promise.resolve(this.getErrorMetrics()),
      Promise.resolve(this.getPerformanceMetrics()),
    ]);

    return {
      timestamp: new Date().toISOString(),
      games: gameMetrics,
      errors: errorMetrics,
      performance: performanceMetrics,
    };
  }

  /**
   * Очистить старые метрики
   */
  private cleanupOldMetrics() {
    // Очищаем счетчики каждые 5 минут (для демонстрации)
    // В реальном приложении нужно хранить метрики с временными метками
    if (this.responseTimes.length > 500) {
      this.responseTimes = this.responseTimes.slice(-500);
    }
  }

  /**
   * Сбросить метрики
   */
  resetMetrics() {
    this.responseTimes = [];
    this.errorCounts.clear();
    this.requestCount = 0;
    this.lastResetTime = Date.now();
  }
}

