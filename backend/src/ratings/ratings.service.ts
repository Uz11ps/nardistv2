import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatingsService {
  private readonly INITIAL_RATING = 1500;
  private readonly K_FACTOR = 32;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Расчет нового рейтинга по системе Elo
   */
  calculateEloRating(
    currentRating: number,
    opponentRating: number,
    result: number, // 1 = победа, 0.5 = ничья, 0 = поражение
  ): number {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    const newRating = currentRating + this.K_FACTOR * (result - expectedScore);
    return Math.round(newRating);
  }

  /**
   * Обновление рейтинга после игры
   */
  async updateRating(
    userId: number,
    opponentId: number,
    mode: string,
    result: 'win' | 'loss' | 'draw',
  ) {
    const userRating = await this.getOrCreateRating(userId, mode);
    const opponentRating = await this.getOrCreateRating(opponentId, mode);

    const resultValue = result === 'win' ? 1 : result === 'loss' ? 0 : 0.5;
    const opponentResultValue = result === 'win' ? 0 : result === 'loss' ? 1 : 0.5;

    const newUserRating = this.calculateEloRating(
      userRating.rating,
      opponentRating.rating,
      resultValue,
    );

    const newOpponentRating = this.calculateEloRating(
      opponentRating.rating,
      userRating.rating,
      opponentResultValue,
    );

    // Обновляем рейтинги
    await this.prisma.rating.update({
      where: { id: userRating.id },
      data: {
        rating: newUserRating,
        wins: result === 'win' ? userRating.wins + 1 : userRating.wins,
        losses: result === 'loss' ? userRating.losses + 1 : userRating.losses,
        draws: result === 'draw' ? userRating.draws + 1 : userRating.draws,
      },
    });

    await this.prisma.rating.update({
      where: { id: opponentRating.id },
      data: {
        rating: newOpponentRating,
        wins: opponentResultValue === 1 ? opponentRating.wins + 1 : opponentRating.wins,
        losses: opponentResultValue === 0 ? opponentRating.losses + 1 : opponentRating.losses,
        draws: opponentResultValue === 0.5 ? opponentRating.draws + 1 : opponentRating.draws,
      },
    });

    return {
      newRating: newUserRating,
      opponentNewRating: newOpponentRating,
    };
  }

  async getOrCreateRating(userId: number, mode: string) {
    let rating = await this.prisma.rating.findUnique({
      where: {
        userId_mode: {
          userId,
          mode,
        },
      },
    });

    if (!rating) {
      rating = await this.prisma.rating.create({
        data: {
          userId,
          mode,
          rating: this.INITIAL_RATING,
        },
      });
    }

    return rating;
  }

  async getLeaderboard(mode: string, limit: number = 100) {
    return this.prisma.rating.findMany({
      where: { mode },
      orderBy: { rating: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            avatar: true,
          },
        },
      },
    });
  }
}

