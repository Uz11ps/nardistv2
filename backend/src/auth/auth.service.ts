import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramAuthService } from './telegram-auth.service';
import { JwtService } from './jwt.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramAuth: TelegramAuthService,
    private readonly jwtService: JwtService,
  ) {}

  async authenticate(initData: string) {
    // Верифицируем данные от Telegram
    const telegramUser = this.telegramAuth.verifyInitData(initData);

    // Находим или создаем пользователя
    let user = await this.prisma.user.findUnique({
      where: { telegramId: telegramUser.id.toString() },
    });

    if (!user) {
      // Генерируем реферальный код
      const referralCode = this.generateReferralCode();
      
      // Создаем нового пользователя
      user = await this.prisma.user.create({
        data: {
          telegramId: telegramUser.id.toString(),
          firstName: telegramUser.firstName,
          lastName: telegramUser.lastName || null,
          username: telegramUser.username || null,
          languageCode: telegramUser.languageCode || 'ru',
          isPremium: telegramUser.isPremium || false,
          photoUrl: telegramUser.photoUrl || null,
          referralCode,
          onboardingCompleted: false,
          onboardingBotGameCompleted: false,
          onboardingQuickGameCompleted: false,
          onboardingCityViewed: false,
        },
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
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: telegramUser.firstName,
          lastName: telegramUser.lastName || null,
          username: telegramUser.username || null,
          languageCode: telegramUser.languageCode || user.languageCode,
          isPremium: telegramUser.isPremium || false,
          photoUrl: telegramUser.photoUrl || null,
        },
      });
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async testLogin(telegramId?: string) {
    // Тестовый вход для разработки - создает/находит пользователя и возвращает токен
    const tgId = telegramId || '123456789';
    
    let user = await this.prisma.user.findUnique({
      where: { telegramId: tgId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramId: tgId,
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
          languageCode: 'ru',
          referralCode: this.generateReferralCode(),
        },
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
   * Выдать стартовый набор новому пользователю
   */
  private async giveStarterPackAsync(userId: number) {
    try {
      // Находим все дефолтные скины
      const defaultSkins = await this.prisma.skin.findMany({
        where: {
          isDefault: true,
          isActive: true,
        },
      });

      // Создаем предметы в инвентаре для каждого дефолтного скина
      for (const skin of defaultSkins) {
        await this.prisma.inventoryItem.create({
          data: {
            userId,
            skinId: skin.id,
            rarity: skin.rarity,
            durability: skin.durabilityMax,
            durabilityMax: skin.durabilityMax,
            weight: skin.weight,
            isEquipped: false,
          },
        });
      }

      console.log(`Starter pack given to user ${userId}: ${defaultSkins.length} items`);
    } catch (error) {
      console.error('Error giving starter pack:', error);
      // Не пробрасываем ошибку, чтобы не блокировать регистрацию
    }
  }
}

