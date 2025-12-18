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

    // Сохраняем игру
    const gameHistory = await this.db.create('game_history', {
      roomId: data.roomId,
      mode: data.mode,
      whitePlayerId,
      blackPlayerId,
      winnerId: winnerId || null,
      gameState: JSON.stringify(data.gameState),
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

  async getUserHistory(userId: number, limit: number = 50) {
    const games = await this.db.query(
      `SELECT gh.*, 
              w.id as "whiteId", w.nickname as "whiteNickname", w."firstName" as "whiteFirstName", w."photoUrl" as "whitePhotoUrl",
              b.id as "blackId", b.nickname as "blackNickname", b."firstName" as "blackFirstName", b."photoUrl" as "blackPhotoUrl"
       FROM game_history gh
       LEFT JOIN users w ON gh."whitePlayerId" = w.id
       LEFT JOIN users b ON gh."blackPlayerId" = b.id
       WHERE gh."whitePlayerId" = $1 OR gh."blackPlayerId" = $1
       ORDER BY gh."createdAt" DESC
       LIMIT $2`,
      [userId, limit]
    );

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
}
