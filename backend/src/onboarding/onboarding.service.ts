import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestsService } from '../quests/quests.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questsService: QuestsService,
  ) {}

  /**
   * Инициализировать онбординг для нового пользователя
   */
  async initializeOnboarding(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.onboardingCompleted) {
      return;
    }

    // Создаем онбординг-квесты, если их еще нет
    await this.createOnboardingQuests(userId);
  }

  /**
   * Создать онбординг-квесты для пользователя
   */
  private async createOnboardingQuests(userId: number) {
    const onboardingQuests = [
      {
        type: 'ONBOARDING',
        title: 'Тренировка с ботом',
        description: 'Сыграйте одну партию с ботом, чтобы освоиться с игрой',
        target: 1,
        rewardCoin: 50,
        rewardXp: 25,
        questKey: 'bot_game',
      },
      {
        type: 'ONBOARDING',
        title: 'Первая онлайн-партия',
        description: 'Сыграйте одну быструю партию с другим игроком',
        target: 1,
        rewardCoin: 100,
        rewardXp: 50,
        questKey: 'quick_game',
      },
      {
        type: 'ONBOARDING',
        title: 'Знакомство с Городом',
        description: 'Посетите экран Города и посмотрите все 7 районов',
        target: 1,
        rewardCoin: 50,
        rewardXp: 25,
        questKey: 'city_view',
      },
    ];

    for (const questData of onboardingQuests) {
      // Проверяем, существует ли уже такой квест
      const existingQuest = await this.prisma.quest.findFirst({
        where: {
          type: 'ONBOARDING',
          title: questData.title,
        },
      });

      if (!existingQuest) {
        await this.prisma.quest.create({
          data: {
            type: questData.type,
            title: questData.title,
            description: questData.description,
            target: questData.target,
            rewardCoin: questData.rewardCoin,
            rewardXp: questData.rewardXp,
            isActive: true,
            durationType: 'EVER',
          },
        });
      }
    }
  }

  /**
   * Отметить выполнение тренировки с ботом
   */
  async completeBotGame(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.onboardingBotGameCompleted) {
      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingBotGameCompleted: true },
    });

    // Обновляем прогресс квеста
    await this.updateOnboardingQuestProgress(userId, 'Тренировка с ботом', 1);
    
    // Проверяем, завершен ли весь онбординг
    await this.checkOnboardingCompletion(userId);
  }

  /**
   * Отметить выполнение быстрой игры
   */
  async completeQuickGame(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.onboardingQuickGameCompleted) {
      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingQuickGameCompleted: true },
    });

    // Обновляем прогресс квеста
    await this.updateOnboardingQuestProgress(userId, 'Первая онлайн-партия', 1);
    
    // Проверяем, завершен ли весь онбординг
    await this.checkOnboardingCompletion(userId);
  }

  /**
   * Отметить просмотр Города
   */
  async completeCityView(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.onboardingCityViewed) {
      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCityViewed: true },
    });

    // Обновляем прогресс квеста
    await this.updateOnboardingQuestProgress(userId, 'Знакомство с Городом', 1);
    
    // Проверяем, завершен ли весь онбординг
    await this.checkOnboardingCompletion(userId);
  }

  /**
   * Обновить прогресс онбординг-квеста
   */
  private async updateOnboardingQuestProgress(
    userId: number,
    questTitle: string,
    progress: number,
  ) {
    const quest = await this.prisma.quest.findFirst({
      where: {
        type: 'ONBOARDING',
        title: questTitle,
      },
    });

    if (quest) {
      await this.questsService.updateQuestProgress(userId, quest.id, progress);
    }
  }

  /**
   * Проверить, завершен ли весь онбординг
   */
  private async checkOnboardingCompletion(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return;
    }

    const allCompleted =
      user.onboardingBotGameCompleted &&
      user.onboardingQuickGameCompleted &&
      user.onboardingCityViewed;

    if (allCompleted && !user.onboardingCompleted) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      });
    }
  }

  /**
   * Получить статус онбординга пользователя
   */
  async getOnboardingStatus(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingCompleted: true,
        onboardingBotGameCompleted: true,
        onboardingQuickGameCompleted: true,
        onboardingCityViewed: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      completed: user.onboardingCompleted,
      botGame: user.onboardingBotGameCompleted,
      quickGame: user.onboardingQuickGameCompleted,
      cityView: user.onboardingCityViewed,
    };
  }
}

