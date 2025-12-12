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

    // Сохраняем игру
    const gameHistory = await this.prisma.gameHistory.create({
      data: {
        roomId: data.roomId,
        mode: data.mode,
        whitePlayerId,
        blackPlayerId,
        winnerId,
        gameState: data.gameState,
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

  async getUserHistory(userId: number, limit: number = 50) {
    return this.prisma.gameHistory.findMany({
      where: {
        OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
      },
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
}

