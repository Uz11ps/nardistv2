import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EconomyService } from '../economy/economy.service';
import { InventoryService } from '../inventory/inventory.service';
import { SiegesService } from '../sieges/sieges.service';

@Injectable()
export class GameHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly economyService: EconomyService,
    private readonly inventoryService: InventoryService,
    private readonly siegesService: SiegesService,
  ) {}

  async saveGame(data: {
    roomId: string;
    mode: string;
    whitePlayerId: number;
    blackPlayerId: number;
    winnerId?: number;
    gameState: any;
    moves: any[];
    duration?: number;
    betAmount?: number;
    districtId?: number;
  }) {
    const { betAmount, districtId, winnerId, whitePlayerId, blackPlayerId } = data;

    // Обрабатываем экономику игры (если была ставка)
    let commission = 0;
    if (betAmount && betAmount > 0 && winnerId) {
      const economyResult = await this.economyService.processGameEconomy({
        whitePlayerId,
        blackPlayerId,
        winnerId,
        betAmount,
        districtId,
      });
      commission = economyResult.totalCommission;
    }

    // Извлекаем seed и hash из gameState для сохранения
    const gameStateData = data.gameState as any;
    const seed = gameStateData.seed || null;
    const seedHash = gameStateData.seedHash || null;
    
    // Сохраняем игру с seed и hash
    const gameHistory = await this.prisma.gameHistory.create({
      data: {
        roomId: data.roomId,
        mode: data.mode,
        whitePlayerId,
        blackPlayerId,
        winnerId,
        gameState: {
          ...gameStateData,
          seed, // Сохраняем seed для проверки честности
          seedHash, // Сохраняем hash для верификации
        },
        moves: data.moves,
        duration: data.duration,
        betAmount,
        commission,
        districtId,
      },
    });

    // Применяем расход энергии и жизней
    if (winnerId) {
      await this.applyGameCosts(whitePlayerId, whitePlayerId === winnerId);
      await this.applyGameCosts(blackPlayerId, blackPlayerId === winnerId);
    }

    // Применяем износ предметов
    if (winnerId) {
      const gameState = data.gameState as any;
      const diceRollsCount = gameState.diceRollsCount || { white: 0, black: 0 };
      
      await this.inventoryService.applyGameWear(whitePlayerId, data.mode, diceRollsCount.white);
      await this.inventoryService.applyGameWear(blackPlayerId, data.mode, diceRollsCount.black);
    }

    // Если игра проходила в районе с активной осадой, регистрируем результат
    if (districtId && winnerId) {
      try {
        const activeSiege = await this.prisma.siege.findFirst({
          where: {
            districtId,
            status: 'ACTIVE',
          },
        });

        if (activeSiege) {
          await this.siegesService.recordSiegeGame(
            activeSiege.id,
            whitePlayerId,
            blackPlayerId,
            winnerId,
            gameHistory.id,
          );
        }
      } catch (error) {
        // Игнорируем ошибки при регистрации осады (не критично)
        console.error('Error recording siege game:', error);
      }
    }

    // Проверяем онбординг для обоих игроков
    if (winnerId) {
      const isBotGame = blackPlayerId === -1 || whitePlayerId === -1;
      await this.checkOnboardingGames(whitePlayerId, blackPlayerId, isBotGame);
    }

    return gameHistory;
  }

  /**
   * Применить расход энергии и жизней после игры
   */
  private async applyGameCosts(userId: number, isWinner: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return;
    }

    // Расход энергии: победа -5, поражение -10
    const energyCost = isWinner ? 5 : 10;
    const newEnergy = Math.max(0, user.energy - energyCost);

    // Расход жизней: поражение -1
    const livesCost = isWinner ? 0 : 1;
    const newLives = Math.max(0, user.lives - livesCost);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        energy: newEnergy,
        lives: newLives,
      },
    });
  }

  async getUserHistory(
    userId: number,
    filters?: {
      limit?: number;
      mode?: 'SHORT' | 'LONG';
      result?: 'win' | 'loss' | 'draw';
      opponentId?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const limit = filters?.limit || 50;
    const where: any = {
      OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
    };

    if (filters?.mode) {
      where.mode = filters.mode;
    }

    if (filters?.opponentId) {
      where.OR = [
        { whitePlayerId: userId, blackPlayerId: filters.opponentId },
        { blackPlayerId: userId, whitePlayerId: filters.opponentId },
      ];
    }

    if (filters?.result) {
      if (filters.result === 'win') {
        where.winnerId = userId;
      } else if (filters.result === 'loss') {
        where.winnerId = { not: userId };
        where.NOT = { winnerId: null };
      } else if (filters.result === 'draw') {
        where.winnerId = null;
      }
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.gameHistory.findMany({
      where,
      include: {
        whitePlayer: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            photoUrl: true,
          },
        },
        blackPlayer: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        whitePlayer: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            photoUrl: true,
          },
        },
        blackPlayer: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getGameReplay(gameId: number) {
    return this.prisma.gameHistory.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });
  }

  /**
   * Проверить и обновить прогресс онбординга для игроков
   */
  private async checkOnboardingGames(
    whitePlayerId: number,
    blackPlayerId: number,
    isBotGame: boolean,
  ) {
    try {
      // Проверяем, является ли это игрой с ботом (ID бота = -1)
      if (isBotGame) {
        // Обновляем прогресс для обоих игроков (если один из них - бот)
        for (const playerId of [whitePlayerId, blackPlayerId]) {
          if (playerId > 0) {
            const user = await this.prisma.user.findUnique({
              where: { id: playerId },
            });

            if (user && !user.onboardingBotGameCompleted) {
              await this.prisma.user.update({
                where: { id: playerId },
                data: { onboardingBotGameCompleted: true },
              });

              // Обновляем прогресс квеста
              await this.updateOnboardingQuestProgress(playerId, 'Тренировка с ботом', 1);
              await this.checkOnboardingCompletion(playerId);
            }
          }
        }
      } else {
        // Это быстрая игра с реальным соперником
        for (const playerId of [whitePlayerId, blackPlayerId]) {
          if (playerId > 0) {
            const user = await this.prisma.user.findUnique({
              where: { id: playerId },
            });

            if (user && !user.onboardingQuickGameCompleted) {
              await this.prisma.user.update({
                where: { id: playerId },
                data: { onboardingQuickGameCompleted: true },
              });

              // Обновляем прогресс квеста
              await this.updateOnboardingQuestProgress(playerId, 'Первая онлайн-партия', 1);
              await this.checkOnboardingCompletion(playerId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking onboarding games:', error);
    }
  }

  /**
   * Обновить прогресс онбординг-квеста
   */
  private async updateOnboardingQuestProgress(
    userId: number,
    questTitle: string,
    progress: number,
  ) {
    try {
      const quest = await this.prisma.quest.findFirst({
        where: {
          type: 'ONBOARDING',
          title: questTitle,
        },
      });

      if (quest) {
        const questProgress = await this.prisma.questProgress.upsert({
          where: {
            questId_userId: {
              questId: quest.id,
              userId,
            },
          },
          update: {
            progress: Math.min(progress, quest.target),
            completed: progress >= quest.target,
            completedAt: progress >= quest.target ? new Date() : null,
          },
          create: {
            questId: quest.id,
            userId,
            progress: Math.min(progress, quest.target),
            completed: progress >= quest.target,
            completedAt: progress >= quest.target ? new Date() : null,
          },
        });

        // Если квест выполнен, награждаем пользователя
        if (questProgress.completed && questProgress.completedAt) {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              narCoin: { increment: quest.rewardCoin },
              xp: { increment: quest.rewardXp },
            },
          });
        }
      }
    } catch (error) {
      console.error('Error updating onboarding quest progress:', error);
    }
  }

  /**
   * Проверить, завершен ли весь онбординг
   */
  private async checkOnboardingCompletion(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return;
      }

      const allCompleted =
        user.onboardingBotGameCompleted &&
        user.onboardingQuickGameCompleted &&
        user.onboardingCityViewed;

      if (allCompleted && !user.onboardingCompleted) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { onboardingCompleted: true },
        });
      }
    } catch (error) {
      console.error('Error checking onboarding completion:', error);
    }
  }
}

