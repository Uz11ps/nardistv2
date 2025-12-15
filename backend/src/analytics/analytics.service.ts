import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  /**
   * Проверить, есть ли у пользователя активная подписка
   */
  async checkSubscription(userId: number): Promise<boolean> {
    return this.subscriptionService.hasActiveSubscription(userId);
  }

  /**
   * Получить аналитику игры для пользователя
   */
  async getGameAnalytics(userId: number, gameId: number) {
    // Проверяем подписку
    const hasSubscription = await this.checkSubscription(userId);
    if (!hasSubscription) {
      throw new Error('Analytics available only for subscribers');
    }

    const game = await this.prisma.gameHistory.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: {
          select: {
            id: true,
            nickname: true,
            level: true,
          },
        },
        blackPlayer: {
          select: {
            id: true,
            nickname: true,
            level: true,
          },
        },
      },
    });

    if (!game) {
      throw new Error('Game not found');
    }

    // Проверяем, что пользователь участвовал в игре
    if (game.whitePlayerId !== userId && game.blackPlayerId !== userId) {
      throw new Error('Access denied');
    }

    const moves = (game.moves as any[]) || [];
    const gameState = game.gameState as any;
    const isWinner = game.winnerId === userId;

    // Анализируем ходы
    const analysis = this.analyzeMoves(moves, userId, gameState);

    return {
      game: {
        id: game.id,
        mode: game.mode,
        winnerId: game.winnerId,
        duration: game.duration,
        createdAt: game.createdAt,
      },
      analysis,
      recommendations: this.generateRecommendations(analysis, isWinner),
    };
  }

  /**
   * Анализ ходов игры
   */
  private analyzeMoves(moves: any[], userId: number, gameState: any) {
    const playerMoves = moves.filter((m) => m.playerId === userId);
    const errors: Array<{ moveIndex: number; type: string; description: string; severity: 'low' | 'medium' | 'high' }> = [];
    const goodMoves: Array<{ moveIndex: number; description: string }> = [];

    playerMoves.forEach((move, index) => {
      // Анализ безопасности хода
      if (this.isBlotMove(move, gameState)) {
        errors.push({
          moveIndex: index,
          type: 'BLOT',
          description: 'Оставлена блотка (уязвимая фишка)',
          severity: 'high',
        });
      }

      // Анализ агрессивности
      if (this.isAggressiveMove(move, gameState)) {
        goodMoves.push({
          moveIndex: index,
          description: 'Агрессивный ход - хорошая тактика',
        });
      }

      // Анализ защиты
      if (this.isDefensiveMove(move, gameState)) {
        goodMoves.push({
          moveIndex: index,
          description: 'Защитный ход - безопасная игра',
        });
      }

      // Анализ пропущенных возможностей
      if (this.isMissedOpportunity(move, gameState)) {
        errors.push({
          moveIndex: index,
          type: 'MISSED_OPPORTUNITY',
          description: 'Пропущена возможность улучшить позицию',
          severity: 'medium',
        });
      }
    });

    return {
      totalMoves: playerMoves.length,
      errors,
      goodMoves,
      errorRate: playerMoves.length > 0 ? (errors.length / playerMoves.length) * 100 : 0,
    };
  }

  /**
   * Проверка, оставлена ли блотка
   */
  private isBlotMove(move: any, gameState: any): boolean {
    // Упрощенная проверка: если фишка осталась одна на точке
    // В реальной игре нужен более сложный анализ
    return false; // TODO: Реализовать проверку блоток
  }

  /**
   * Проверка агрессивного хода
   */
  private isAggressiveMove(move: any, gameState: any): boolean {
    // Агрессивный ход - это атака на фишки соперника
    return false; // TODO: Реализовать проверку агрессивности
  }

  /**
   * Проверка защитного хода
   */
  private isDefensiveMove(move: any, gameState: any): boolean {
    // Защитный ход - это создание примочек или защита блоток
    return false; // TODO: Реализовать проверку защиты
  }

  /**
   * Проверка пропущенной возможности
   */
  private isMissedOpportunity(move: any, gameState: any): boolean {
    // Пропущенная возможность - когда был лучший ход
    return false; // TODO: Реализовать анализ альтернативных ходов
  }

  /**
   * Генерация рекомендаций на основе анализа
   */
  private generateRecommendations(analysis: any, isWinner: boolean): string[] {
    const recommendations: string[] = [];

    if (analysis.errorRate > 30) {
      recommendations.push('Высокий процент ошибок. Рекомендуется больше внимания уделять безопасности ходов.');
    }

    if (analysis.errors.some((e: any) => e.type === 'BLOT')) {
      recommendations.push('Старайтесь не оставлять блотки без защиты.');
    }

    if (analysis.goodMoves.length < analysis.totalMoves * 0.3) {
      recommendations.push('Попробуйте играть более агрессивно или более защитно, в зависимости от позиции.');
    }

    if (isWinner) {
      recommendations.push('Отличная игра! Продолжайте в том же духе.');
    } else {
      recommendations.push('Проанализируйте ошибки и попробуйте улучшить свою игру.');
    }

    return recommendations;
  }

  /**
   * Получить общую статистику игрока
   */
  async getPlayerStats(userId: number) {
    const hasSubscription = await this.checkSubscription(userId);
    if (!hasSubscription) {
      throw new Error('Analytics available only for subscribers');
    }

    const games = await this.prisma.gameHistory.findMany({
      where: {
        OR: [
          { whitePlayerId: userId },
          { blackPlayerId: userId },
        ],
      },
    });

    const wins = games.filter((g) => g.winnerId === userId).length;
    const losses = games.length - wins;
    const winRate = games.length > 0 ? (wins / games.length) * 100 : 0;

    // Статистика по режимам
    const shortGames = games.filter((g) => g.mode === 'SHORT');
    const longGames = games.filter((g) => g.mode === 'LONG');

    return {
      totalGames: games.length,
      wins,
      losses,
      winRate: winRate.toFixed(1),
      shortGames: {
        total: shortGames.length,
        wins: shortGames.filter((g) => g.winnerId === userId).length,
      },
      longGames: {
        total: longGames.length,
        wins: longGames.filter((g) => g.winnerId === userId).length,
      },
      averageDuration: games.length > 0
        ? Math.round(games.reduce((sum, g) => sum + (g.duration || 0), 0) / games.length)
        : 0,
    };
  }
}

