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
        createdAt: new Date(),
        updatedAt: new Date(),
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
}
