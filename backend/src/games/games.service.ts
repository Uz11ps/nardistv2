import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { GameType, GameStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async createGame(userId: string, dto: CreateGameDto) {
    const seed = crypto.randomBytes(16).toString('hex');
    
    const game = await this.prisma.game.create({
      data: {
        type: dto.type,
        player1Id: userId,
        player2Id: dto.opponentId,
        botDifficulty: dto.botDifficulty,
        status: GameStatus.WAITING,
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
