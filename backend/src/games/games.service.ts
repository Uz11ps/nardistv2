import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGameDto, GameType } from './dto/create-game.dto';
import * as crypto from 'node:crypto';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async createGame(userId: string, dto: CreateGameDto) {
    const seed = crypto.randomBytes(16).toString('hex');
    
    const game = await this.prisma.game.create({
      data: {
        type: dto.type as any,
        player1Id: userId,
        player2Id: dto.opponentId,
        botDifficulty: dto.botDifficulty,
        status: 'WAITING',
        seed,
        currentTurn: userId,
      },
    });

    return game;
  }

  async getGame(id: string) {
    return this.prisma.game.findUnique({
      where: { id },
      include: {
        player1: true,
        player2: true,
        moves: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  }

  async getUserGames(userId: string) {
    return this.prisma.game.findMany({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
      },
      include: {
        player1: true,
        player2: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
