import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TelegramAuthService } from './telegram-auth.service';
import { JwtService } from './jwt.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly telegramAuth: TelegramAuthService,
    private readonly jwtService: JwtService,
  ) {}

  async authenticate(initData: string) {
    // Верифицируем данные от Telegram
    const telegramUser = this.telegramAuth.verifyInitData(initData);

    // Находим или создаем пользователя
    let user = await this.db.findOne('users', { telegramId: telegramUser.id.toString() });

    if (!user) {
      // Генерируем реферальный код
      const referralCode = this.generateReferralCode();
      
      // Создаем нового пользователя
      user = await this.db.create('users', {
        telegramId: telegramUser.id.toString(),
        firstName: telegramUser.firstName,
        lastName: telegramUser.lastName || null,
        username: telegramUser.username || null,
        languageCode: telegramUser.languageCode || 'ru',
        isPremium: telegramUser.isPremium || false,
        photoUrl: telegramUser.photoUrl || null,
        referralCode,
        level: 1,
        xp: 0,
        narCoin: 100,
        energy: 100,
        energyMax: 100,
        lives: 3,
        livesMax: 3,
        power: 10,
        powerMax: 10,
        statsEconomy: 0,
        statsEnergy: 0,
        statsLives: 0,
        statsPower: 0,
        onboardingCompleted: false,
        onboardingBotGameCompleted: false,
        onboardingQuickGameCompleted: false,
        onboardingCityViewed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Выдаем стартовый набор скинов асинхронно (не блокируем ответ)
      this.giveStarterPackAsync(user.id).catch(err => {
        console.error('Error giving starter pack:', err);
      });

      // Инициализируем онбординг асинхронно (не блокируем ответ)
      this.initializeOnboardingAsync(user.id).catch(err => {
        console.error('Error initializing onboarding:', err);
      });
    } else {
      // Обновляем данные пользователя
      user = await this.db.update('users', 
        { id: user.id },
        {
          firstName: telegramUser.firstName,
          lastName: telegramUser.lastName || null,
          username: telegramUser.username || null,
          languageCode: telegramUser.languageCode || user.languageCode,
          isPremium: telegramUser.isPremium || false,
          photoUrl: telegramUser.photoUrl || null,
          updatedAt: new Date(),
        }
      );
    }

    // Генерируем JWT токен
    const token = this.jwtService.sign({
      userId: user.id,
      telegramId: telegramUser.id,
    });

    return {
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        languageCode: user.languageCode,
        isPremium: user.isPremium,
        photoUrl: user.photoUrl,
      },
    };
  }

  async validateUser(userId: number) {
    const user = await this.db.findOne('users', { id: userId });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async testLogin(telegramId?: string) {
    // Тестовый вход для разработки - создает/находит пользователя и возвращает токен
    const tgId = telegramId || '123456789';
    
    let user = await this.db.findOne('users', { telegramId: tgId });

    if (!user) {
      user = await this.db.create('users', {
        telegramId: tgId,
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        languageCode: 'ru',
        referralCode: this.generateReferralCode(),
        level: 1,
        xp: 0,
        narCoin: 100,
        energy: 100,
        energyMax: 100,
        lives: 3,
        livesMax: 3,
        power: 10,
        powerMax: 10,
        statsEconomy: 0,
        statsEnergy: 0,
        statsLives: 0,
        statsPower: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const token = this.jwtService.sign({
      userId: user.id,
      telegramId: parseInt(tgId),
    });

    return {
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        nickname: user.nickname,
        level: user.level,
        xp: user.xp,
        narCoin: user.narCoin,
        energy: user.energy,
        energyMax: user.energyMax,
        lives: user.lives,
        livesMax: user.livesMax,
        power: user.power,
        powerMax: user.powerMax,
      },
    };
  }

  private generateReferralCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Асинхронная инициализация онбординга (избегаем циклических зависимостей)
   */
  private async initializeOnboardingAsync(userId: number) {
    // Создаем онбординг-квесты, если их еще нет
    const onboardingQuests = [
      {
        type: 'ONBOARDING',
        title: 'Тренировка с ботом',
        description: 'Сыграйте одну партию с ботом, чтобы освоиться с игрой',
        target: 1,
        rewardCoin: 50,
        rewardXp: 25,
      },
      {
        type: 'ONBOARDING',
        title: 'Первая онлайн-партия',
        description: 'Сыграйте одну быструю партию с другим игроком',
        target: 1,
        rewardCoin: 100,
        rewardXp: 50,
      },
      {
        type: 'ONBOARDING',
        title: 'Знакомство с Городом',
        description: 'Посетите экран Города и посмотрите все 7 районов',
        target: 1,
        rewardCoin: 50,
        rewardXp: 25,
      },
    ];

    for (const questData of onboardingQuests) {
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
   * Выдать стартовый набор новому пользователю
   */
  private async giveStarterPackAsync(userId: number) {
    try {
      // Находим все дефолтные скины
      const defaultSkins = await this.db.findMany('skins', {
        isDefault: true,
        isActive: true,
      });

      // Создаем предметы в инвентаре для каждого дефолтного скина
      for (const skin of defaultSkins) {
        await this.db.create('inventory_items', {
          userId,
          skinId: skin.id,
          rarity: skin.rarity,
          durability: skin.durabilityMax,
          durabilityMax: skin.durabilityMax,
          weight: skin.weight,
          isEquipped: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      console.log(`Starter pack given to user ${userId}: ${defaultSkins.length} items`);
    } catch (error) {
      console.error('Error giving starter pack:', error);
      // Не пробрасываем ошибку, чтобы не блокировать регистрацию
    }
  }
}

