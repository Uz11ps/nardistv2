import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveQuests(userId: number) {
    const now = new Date();
    
    const quests = await this.prisma.quest.findMany({
      where: {
        isActive: true,
        // Фильтруем по датам: квест должен быть активен сейчас
        OR: [
          // Квесты без дат (всегда активны)
          {
            startDate: null,
            endDate: null,
          },
          // Квесты с датой начала в прошлом или сейчас, и без даты окончания
          {
            startDate: { lte: now },
            endDate: null,
          },
          // Квесты в диапазоне дат
          {
            startDate: { lte: now },
            endDate: { gte: now },
          },
          // Бесконечные квесты
          {
            isInfinite: true,
          },
        ],
      },
      include: {
        progress: {
          where: { userId },
        },
      },
    });

    return quests.map((quest) => {
      const questProgress = quest.progress && quest.progress.length > 0 
        ? quest.progress[0] 
        : {
            progress: 0,
            completed: false,
          };
      
      return {
        ...quest,
        progress: questProgress,
      };
    });
  }

  async updateQuestProgress(
    userId: number,
    questId: number,
    progress: number,
  ) {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      throw new Error('Quest not found');
    }

    const questProgress = await this.prisma.questProgress.upsert({
      where: {
        questId_userId: {
          questId,
          userId,
        },
      },
      update: {
        progress: Math.min(progress, quest.target),
        completed: progress >= quest.target,
        completedAt: progress >= quest.target ? new Date() : null,
      },
      create: {
        questId,
        userId,
        progress: Math.min(progress, quest.target),
        completed: progress >= quest.target,
        completedAt: progress >= quest.target ? new Date() : null,
      },
    });

    // Если квест выполнен, награждаем пользователя
    if (questProgress.completed && !questProgress.completedAt) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          narCoin: { increment: quest.rewardCoin },
          xp: { increment: quest.rewardXp },
        },
      });
    }

    return questProgress;
  }
}

