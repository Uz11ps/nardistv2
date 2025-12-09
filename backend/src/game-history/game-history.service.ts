import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GameHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async saveGame(data: {
    roomId: string;
    mode: string;
    whitePlayerId: number;
    blackPlayerId: number;
    winnerId?: number;
    gameState: any;
    moves: any[];
    duration?: number;
  }) {
    return this.prisma.gameHistory.create({
      data,
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

