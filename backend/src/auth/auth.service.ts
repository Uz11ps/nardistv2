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
        },
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
}

