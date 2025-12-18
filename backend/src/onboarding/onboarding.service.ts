import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { QuestsService } from '../quests/quests.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly db: DatabaseService,
    private readonly questsService: QuestsService,
  ) {}

  /**
   * Инициализировать онбординг для нового пользователя
   */
  async initializeOnboarding(userId: number) {
    const user = await this.db.findOne('users', { id: userId });

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
      const existingQuest = await this.db.query(
        'SELECT * FROM quests WHERE type = $1 AND title = $2 LIMIT 1',
        ['ONBOARDING', questData.title]
      ).then(r => r.rows[0]);

      if (!existingQuest) {
        await this.db.create('quests', {
          type: questData.type,
          title: questData.title,
          description: questData.description,
          target: questData.target,
          rewardCoin: questData.rewardCoin,
          rewardXp: questData.rewardXp,
          isActive: true,
          durationType: 'EVER',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  /**
   * Отметить выполнение тренировки с ботом
   */
  async completeBotGame(userId: number) {
    const user = await this.db.findOne('users', { id: userId });

    if (!user || user.onboardingBotGameCompleted) {
      return;
    }

    await this.db.update('users',
      { id: userId },
      { onboardingBotGameCompleted: true }
    );

    // Обновляем прогресс квеста
    await this.updateOnboardingQuestProgress(userId, 'Тренировка с ботом', 1);
    
    // Проверяем, завершен ли весь онбординг
    await this.checkOnboardingCompletion(userId);
  }

  /**
   * Отметить выполнение быстрой игры
   */
  async completeQuickGame(userId: number) {
    const user = await this.db.findOne('users', { id: userId });

    if (!user || user.onboardingQuickGameCompleted) {
      return;
    }

    await this.db.update('users',
      { id: userId },
      { onboardingQuickGameCompleted: true }
    );

    // Обновляем прогресс квеста
    await this.updateOnboardingQuestProgress(userId, 'Первая онлайн-партия', 1);
    
    // Проверяем, завершен ли весь онбординг
    await this.checkOnboardingCompletion(userId);
  }

  /**
   * Отметить просмотр Города
   */
  async completeCityView(userId: number) {
    const user = await this.db.findOne('users', { id: userId });

    if (!user || user.onboardingCityViewed) {
      return;
    }

    await this.db.update('users',
      { id: userId },
      { onboardingCityViewed: true }
    );

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
      const quest = await this.db.query(
        'SELECT * FROM quests WHERE type = $1 AND title = $2 LIMIT 1',
        ['ONBOARDING', questTitle]
      ).then(r => r.rows[0]);

    if (quest) {
      await this.questsService.updateQuestProgress(userId, quest.id, progress);
    }
  }

  /**
   * Проверить, завершен ли весь онбординг
   */
  private async checkOnboardingCompletion(userId: number) {
    const user = await this.db.findOne('users', { id: userId });

    if (!user) {
      return;
    }

    const allCompleted =
      user.onboardingBotGameCompleted &&
      user.onboardingQuickGameCompleted &&
      user.onboardingCityViewed;

    if (allCompleted && !user.onboardingCompleted) {
      await this.db.update('users',
        { id: userId },
        { onboardingCompleted: true }
      );
    }
  }

  /**
   * Получить статус онбординга пользователя
   */
  async getOnboardingStatus(userId: number) {
    const user = await this.db.findOne('users', { id: userId });

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

