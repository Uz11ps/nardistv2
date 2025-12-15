import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReferralCode(userId: number): Promise<string> {
    const code = randomBytes(4).toString('hex').toUpperCase();
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });

    return code;
  }

  async useReferralCode(userId: number, code: string) {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!referrer) {
      throw new Error('Invalid referral code');
    }

    if (referrer.id === userId) {
      throw new Error('Cannot use your own referral code');
    }

    // Обновляем пользователя
    await this.prisma.user.update({
      where: { id: userId },
      data: { referredBy: referrer.id },
    });

    // Награждаем реферера
    await this.prisma.user.update({
      where: { id: referrer.id },
      data: {
        narCoin: { increment: 50 }, // Награда за реферала
        xp: { increment: 10 },
      },
    });

    return { success: true, referrerId: referrer.id };
  }

  async getReferralStats(userId: number) {
    const referrals = await this.prisma.user.count({
      where: { referredBy: userId },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    const referralCode = user?.referralCode || '';
    const referralLink = this.generateReferralLink(referralCode);

    return {
      totalReferrals: referrals,
      referralCode,
      referralLink,
    };
  }

  /**
   * Генерировать реферальную ссылку
   */
  private generateReferralLink(code: string): { telegram: string; web: string; code: string } {
    // Используем домен из переменной окружения или дефолтный
    const baseUrl = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',')[0].trim()
      : process.env.NODE_ENV === 'production'
        ? 'https://nardist.online'
        : 'http://localhost:5173';
    
    // Для Telegram Mini App используем формат: https://t.me/botname/app?startapp=REF_CODE
    // Или обычный веб-формат: https://domain.com?ref=CODE
    const telegramBotName = process.env.TELEGRAM_BOT_NAME || 'nardist_bot';
    
    // Telegram Mini App ссылка
    const telegramLink = `https://t.me/${telegramBotName}?startapp=${code}`;
    
    // Обычная веб-ссылка
    const webLink = `${baseUrl}?ref=${code}`;
    
    return {
      telegram: telegramLink,
      web: webLink,
      code,
    };
  }

  /**
   * Получить реферальную ссылку пользователя
   */
  async getReferralLink(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user || !user.referralCode) {
      throw new Error('Referral code not found');
    }

    return this.generateReferralLink(user.referralCode);
  }
}

