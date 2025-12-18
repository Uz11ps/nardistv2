import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class QuestsService {
  constructor(private readonly db: DatabaseService) {}

  async getActiveQuests(userId: number) {
    const now = new Date();
    
    const quests = await this.db.query(
      `SELECT * FROM quests 
       WHERE "isActive" = true 
       AND (
         ("startDate" IS NULL AND "endDate" IS NULL)
         OR ("startDate" <= $1 AND "endDate" IS NULL)
         OR ("startDate" <= $1 AND "endDate" >= $1)
         OR "isInfinite" = true
       )
       ORDER BY "createdAt" DESC`,
      [now]
    );

    const questsWithProgress = await Promise.all(
      quests.rows.map(async (quest) => {
        const progress = await this.db.query(
          'SELECT * FROM quest_progress WHERE "questId" = $1 AND "userId" = $2 LIMIT 1',
          [quest.id, userId]
        ).then(r => r.rows[0]);

        return {
          ...quest,
          progress: progress || {
            progress: 0,
            completed: false,
          },
        };
      })
    );

    return questsWithProgress;
  }

  async updateQuestProgress(
    userId: number,
    questId: number,
    progress: number,
  ) {
    const quest = await this.db.findOne('quests', { id: questId });

    if (!quest) {
      throw new Error('Quest not found');
    }

    const finalProgress = Math.min(progress, quest.target);
    const completed = finalProgress >= quest.target;

    const existing = await this.db.query(
      'SELECT * FROM quest_progress WHERE "questId" = $1 AND "userId" = $2 LIMIT 1',
      [questId, userId]
    ).then(r => r.rows[0]);

    let questProgress;
    if (existing) {
      questProgress = await this.db.update('quest_progress',
        { questId, userId },
        {
          progress: finalProgress,
          completed,
          completedAt: completed ? new Date() : null,
          updatedAt: new Date(),
        }
      );
    } else {
      questProgress = await this.db.create('quest_progress', {
        questId,
        userId,
        progress: finalProgress,
        completed,
        completedAt: completed ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (completed && questProgress.completedAt) {
      await this.db.transaction(async (client) => {
        await client.query(
          'UPDATE users SET "narCoin" = "narCoin" + $1, xp = xp + $2 WHERE id = $3',
          [quest.rewardCoin || 0, quest.rewardXp || 0, userId]
        );
      });
    }

    return questProgress;
  }
}
