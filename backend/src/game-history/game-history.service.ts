import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EconomyService } from '../economy/economy.service';
import { InventoryService } from '../inventory/inventory.service';
import { SiegesService } from '../sieges/sieges.service';

@Injectable()
export class GameHistoryService {
  constructor(
    private readonly db: DatabaseService,
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
    const gameHistory = await this.db.create('game_history', {
      roomId: data.roomId,
      mode: data.mode,
      whitePlayerId,
      blackPlayerId,
      winnerId: winnerId || null,
      gameState: JSON.stringify({
        ...gameStateData,
        seed, // Сохраняем seed для проверки честности
        seedHash, // Сохраняем hash для верификации
      }),
      moves: JSON.stringify(data.moves),
      duration: data.duration || null,
      betAmount: betAmount || null,
      commission: commission || null,
      districtId: districtId || null,
      createdAt: new Date(),
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
        const activeSiege = await this.db.query(
          'SELECT * FROM sieges WHERE "districtId" = $1 AND status = $2 LIMIT 1',
          [districtId, 'ACTIVE']
        ).then(r => r.rows[0]);

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
    const user = await this.db.findOne('users', { id: userId });

    if (!user) {
      return;
    }

    // Расход энергии: победа -5, поражение -10
    const energyCost = isWinner ? 5 : 10;
    const newEnergy = Math.max(0, user.energy - energyCost);

    // Расход жизней: поражение -1
    const livesCost = isWinner ? 0 : 1;
    const newLives = Math.max(0, user.lives - livesCost);

    await this.db.query(
      'UPDATE users SET energy = $1, lives = $2 WHERE id = $3',
      [newEnergy, newLives, userId]
    );
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
    let query = `SELECT gh.*, 
              w.id as "whiteId", w.nickname as "whiteNickname", w."firstName" as "whiteFirstName", w."photoUrl" as "whitePhotoUrl",
              b.id as "blackId", b.nickname as "blackNickname", b."firstName" as "blackFirstName", b."photoUrl" as "blackPhotoUrl"
       FROM game_history gh
       LEFT JOIN users w ON gh."whitePlayerId" = w.id
       LEFT JOIN users b ON gh."blackPlayerId" = b.id
       WHERE (gh."whitePlayerId" = $1 OR gh."blackPlayerId" = $1)`;
    
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters?.mode) {
      query += ` AND gh.mode = $${paramIndex}`;
      params.push(filters.mode);
      paramIndex++;
    }

    if (filters?.opponentId) {
      query += ` AND ((gh."whitePlayerId" = $1 AND gh."blackPlayerId" = $${paramIndex}) OR (gh."blackPlayerId" = $1 AND gh."whitePlayerId" = $${paramIndex}))`;
      params.push(filters.opponentId);
      paramIndex++;
    }

    if (filters?.result) {
      if (filters.result === 'win') {
        query += ` AND gh."winnerId" = $1`;
      } else if (filters.result === 'loss') {
        query += ` AND gh."winnerId" != $1 AND gh."winnerId" IS NOT NULL`;
      } else if (filters.result === 'draw') {
        query += ` AND gh."winnerId" IS NULL`;
      }
    }

    if (filters?.startDate) {
      query += ` AND gh."createdAt" >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      query += ` AND gh."createdAt" <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += ` ORDER BY gh."createdAt" DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const games = await this.db.query(query, params);

    return games.rows.map(g => ({
      ...g,
      whitePlayer: {
        id: g.whiteId,
        nickname: g.whiteNickname,
        firstName: g.whiteFirstName,
        photoUrl: g.whitePhotoUrl,
      },
      blackPlayer: {
        id: g.blackId,
        nickname: g.blackNickname,
        firstName: g.blackFirstName,
        photoUrl: g.blackPhotoUrl,
      },
      gameState: typeof g.gameState === 'string' ? JSON.parse(g.gameState) : g.gameState,
      moves: typeof g.moves === 'string' ? JSON.parse(g.moves) : g.moves,
    }));
  }

  async getGameReplay(gameId: number) {
    const game = await this.db.query(
      `SELECT gh.*, 
              w.* as "whitePlayer",
              b.* as "blackPlayer"
       FROM game_history gh
       LEFT JOIN users w ON gh."whitePlayerId" = w.id
       LEFT JOIN users b ON gh."blackPlayerId" = b.id
       WHERE gh.id = $1`,
      [gameId]
    ).then(r => r.rows[0]);

    if (!game) {
      return null;
    }

    return {
      ...game,
      gameState: typeof game.gameState === 'string' ? JSON.parse(game.gameState) : game.gameState,
      moves: typeof game.moves === 'string' ? JSON.parse(game.moves) : game.moves,
    };
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
            const user = await this.db.findOne('users', { id: playerId });

            if (user && !user.onboardingBotGameCompleted) {
              await this.db.update('users',
                { id: playerId },
                { onboardingBotGameCompleted: true }
              );

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
            const user = await this.db.findOne('users', { id: playerId });

            if (user && !user.onboardingQuickGameCompleted) {
              await this.db.update('users',
                { id: playerId },
                { onboardingQuickGameCompleted: true }
              );

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
      const quest = await this.db.query(
        'SELECT * FROM quests WHERE type = $1 AND title = $2 LIMIT 1',
        ['ONBOARDING', questTitle]
      ).then(r => r.rows[0]);

      if (quest) {
        // Проверяем существующий прогресс
        const existingProgress = await this.db.query(
          'SELECT * FROM quest_progress WHERE "questId" = $1 AND "userId" = $2',
          [quest.id, userId]
        ).then(r => r.rows[0]);

        const newProgress = Math.min(progress, quest.target);
        const completed = newProgress >= quest.target;
        const completedAt = completed ? new Date() : null;

        if (existingProgress) {
          await this.db.update('quest_progress',
            { questId: quest.id, userId },
            {
              progress: newProgress,
              completed,
              completedAt,
            }
          );
        } else {
          await this.db.create('quest_progress', {
            questId: quest.id,
            userId,
            progress: newProgress,
            completed,
            completedAt,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Если квест выполнен, награждаем пользователя
        if (completed && completedAt) {
          await this.db.query(
            'UPDATE users SET "narCoin" = "narCoin" + $1, xp = xp + $2 WHERE id = $3',
            [quest.rewardCoin, quest.rewardXp, userId]
          );
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
      const user = await this.db.findOne('users', { id: userId });

      if (!user) {
        return;
      }

      const allCompleted =
        user.onboardingBotGameCompleted &&
        user.onboardingQuickGameCompleted &&
        user.onboardingCityViewed;

      if (allCompleted && !user.onboardingCompleted) {
        await this.db.update('users',
          { id: userId },
          { onboardingCompleted: true }
        );
      }
    } catch (error) {
      console.error('Error checking onboarding completion:', error);
    }
  }
}
