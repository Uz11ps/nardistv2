import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class TrainerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  /**
   * Проверить подписку
   */
  async checkSubscription(userId: number): Promise<boolean> {
    return this.subscriptionService.hasActiveSubscription(userId);
  }

  /**
   * Получить список позиций для тренировки
   */
  async getTrainingPositions(userId: number, mode: 'SHORT' | 'LONG' = 'SHORT') {
    const hasSubscription = await this.checkSubscription(userId);
    if (!hasSubscription) {
      throw new Error('Trainer available only for subscribers');
    }

    // Предопределенные позиции для тренировки
    const positions = this.getPredefinedPositions(mode);

    return {
      mode,
      positions,
      total: positions.length,
    };
  }

  /**
   * Получить конкретную позицию для тренировки
   */
  async getTrainingPosition(userId: number, positionId: string) {
    const hasSubscription = await this.checkSubscription(userId);
    if (!hasSubscription) {
      throw new Error('Trainer available only for subscribers');
    }

    const positions = this.getPredefinedPositions('SHORT');
    const position = positions.find((p) => p.id === positionId);

    if (!position) {
      throw new Error('Position not found');
    }

    return position;
  }

  /**
   * Проверить правильность хода в позиции
   */
  async validateMove(
    userId: number,
    positionId: string,
    move: { from: number; to: number; dieValue: number },
  ) {
    const hasSubscription = await this.checkSubscription(userId);
    if (!hasSubscription) {
      throw new Error('Trainer available only for subscribers');
    }

    const position = await this.getTrainingPosition(userId, positionId);
    
    // Проверяем, является ли ход оптимальным
    const isOptimal = this.isOptimalMove(position, move);
    const alternatives = isOptimal ? [] : this.getAlternativeMoves(position, move);

    return {
      isOptimal,
      alternatives,
      explanation: isOptimal
        ? 'Отличный ход! Это оптимальное решение для данной позиции.'
        : 'Этот ход не является оптимальным. Рассмотрите альтернативные варианты.',
    };
  }

  /**
   * Получить статистику тренировок пользователя
   */
  async getTrainingStats(userId: number) {
    const hasSubscription = await this.checkSubscription(userId);
    if (!hasSubscription) {
      throw new Error('Trainer available only for subscribers');
    }

    // TODO: Сохранять статистику тренировок в БД
    return {
      totalPositions: 0,
      completedPositions: 0,
      correctMoves: 0,
      incorrectMoves: 0,
      accuracy: 0,
    };
  }

  /**
   * Предопределенные позиции для тренировки
   */
  private getPredefinedPositions(mode: 'SHORT' | 'LONG') {
    // Базовые позиции для тренировки
    return [
      {
        id: 'position_1',
        name: 'Базовая позиция: Защита блотки',
        description: 'Защитите свою блотку от атаки соперника',
        mode,
        gameState: {
          board: Array(24).fill(0).map((_, i) => {
            if (i === 0) return { color: 'WHITE', count: 2 };
            if (i === 5) return { color: 'BLACK', count: 5 };
            if (i === 7) return { color: 'BLACK', count: 3 };
            if (i === 11) return { color: 'WHITE', count: 5 };
            if (i === 12) return { color: 'BLACK', count: 5 };
            if (i === 16) return { color: 'WHITE', count: 3 };
            if (i === 18) return { color: 'WHITE', count: 5 };
            if (i === 23) return { color: 'BLACK', count: 2 };
            return null;
          }),
          currentPlayer: 'WHITE',
          dice: [3, 4],
        },
        optimalMoves: [
          { from: 0, to: 3, dieValue: 3 },
          { from: 0, to: 4, dieValue: 4 },
        ],
        difficulty: 'EASY',
      },
      {
        id: 'position_2',
        name: 'Агрессивная игра: Атака на блотку',
        description: 'Атакуйте блотку соперника для получения преимущества',
        mode,
        gameState: {
          board: Array(24).fill(0).map((_, i) => {
            if (i === 1) return { color: 'WHITE', count: 1 };
            if (i === 5) return { color: 'BLACK', count: 5 };
            if (i === 7) return { color: 'BLACK', count: 3 };
            if (i === 11) return { color: 'WHITE', count: 5 };
            if (i === 12) return { color: 'BLACK', count: 5 };
            if (i === 16) return { color: 'WHITE', count: 3 };
            if (i === 18) return { color: 'WHITE', count: 5 };
            if (i === 23) return { color: 'BLACK', count: 2 };
            return null;
          }),
          currentPlayer: 'WHITE',
          dice: [5, 6],
        },
        optimalMoves: [
          { from: 11, to: 16, dieValue: 5 },
          { from: 11, to: 17, dieValue: 6 },
        ],
        difficulty: 'MEDIUM',
      },
      // Добавить больше позиций...
    ];
  }

  /**
   * Проверить, является ли ход оптимальным
   */
  private isOptimalMove(position: any, move: { from: number; to: number; dieValue: number }): boolean {
    return position.optimalMoves.some(
      (optimal: any) =>
        optimal.from === move.from &&
        optimal.to === move.to &&
        optimal.dieValue === move.dieValue,
    );
  }

  /**
   * Получить альтернативные ходы
   */
  private getAlternativeMoves(position: any, move: { from: number; to: number; dieValue: number }): any[] {
    // Возвращаем оптимальные ходы как альтернативы
    return position.optimalMoves.filter(
      (optimal: any) =>
        !(optimal.from === move.from && optimal.to === move.to && optimal.dieValue === move.dieValue),
    );
  }
}

