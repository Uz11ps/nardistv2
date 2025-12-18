import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RatingsService {
  private readonly INITIAL_RATING = 1500;
  private readonly K_FACTOR = 32;

  constructor(private readonly db: DatabaseService) {}

  calculateEloRating(
    currentRating: number,
    opponentRating: number,
    result: number,
  ): number {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    const newRating = currentRating + this.K_FACTOR * (result - expectedScore);
    return Math.round(newRating);
  }

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

    await this.db.query(
      `UPDATE ratings SET 
        rating = $1,
        wins = CASE WHEN $2 = 'win' THEN wins + 1 ELSE wins END,
        losses = CASE WHEN $2 = 'loss' THEN losses + 1 ELSE losses END,
        draws = CASE WHEN $2 = 'draw' THEN draws + 1 ELSE draws END,
        "updatedAt" = $3
       WHERE id = $4`,
      [newUserRating, result, new Date(), userRating.id]
    );

    await this.db.query(
      `UPDATE ratings SET 
        rating = $1,
        wins = CASE WHEN $2 = 1 THEN wins + 1 ELSE wins END,
        losses = CASE WHEN $2 = 0 THEN losses + 1 ELSE losses END,
        draws = CASE WHEN $2 = 0.5 THEN draws + 1 ELSE draws END,
        "updatedAt" = $3
       WHERE id = $4`,
      [newOpponentRating, opponentResultValue, new Date(), opponentRating.id]
    );

    return {
      newRating: newUserRating,
      opponentNewRating: newOpponentRating,
    };
  }

  async getOrCreateRating(userId: number, mode: string) {
    let rating = await this.db.query(
      'SELECT * FROM ratings WHERE "userId" = $1 AND mode = $2 LIMIT 1',
      [userId, mode]
    ).then(r => r.rows[0]);

    if (!rating) {
      rating = await this.db.create('ratings', {
        userId,
        mode,
        rating: this.INITIAL_RATING,
        wins: 0,
        losses: 0,
        draws: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return rating;
  }

  async getLeaderboard(mode: string, limit: number = 100) {
    const ratings = await this.db.query(
      `SELECT r.*, u.id as "userId", u.nickname, u."firstName", u."lastName", u."photoUrl", u.avatar
       FROM ratings r
       JOIN users u ON r."userId" = u.id
       WHERE r.mode = $1
       ORDER BY r.rating DESC
       LIMIT $2`,
      [mode, limit]
    );

    return ratings.rows.map(r => ({
      ...r,
      user: {
        id: r.userId,
        nickname: r.nickname,
        firstName: r.firstName,
        lastName: r.lastName,
        photoUrl: r.photoUrl,
        avatar: r.avatar,
      },
    }));
  }
}
