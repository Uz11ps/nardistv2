import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ReferralsService {
  constructor(private readonly db: DatabaseService) {}

  async generateReferralCode(userId: number): Promise<string> {
    const code = randomBytes(4).toString('hex').toUpperCase();
    
    await this.db.update('users', { id: userId }, { referralCode: code });

    return code;
  }

  async useReferralCode(userId: number, code: string) {
    const referrer = await this.db.findOne('users', { referralCode: code });

    if (!referrer) {
      throw new Error('Invalid referral code');
    }

    if (referrer.id === userId) {
      throw new Error('Cannot use your own referral code');
    }

    // Используем транзакцию для атомарности
    await this.db.transaction(async (client) => {
      // Обновляем пользователя
      await client.query(
        'UPDATE users SET "referredBy" = $1 WHERE id = $2',
        [referrer.id, userId]
      );

      // Награждаем реферера
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" + $1, xp = xp + $2 WHERE id = $3',
        [50, 10, referrer.id]
      );
    });

    return { success: true, referrerId: referrer.id };
  }

  async getReferralStats(userId: number) {
    const referrals = await this.db.count('users', { referredBy: userId });
    const user = await this.db.findOne('users', { id: userId });

    const referralCode = user?.referralCode || '';
    const referralLink = this.generateReferralLink(referralCode);

    return {
      totalReferrals: referrals,
      referralCode: user?.referralCode,
      referralLink: user?.referralCode ? this.generateReferralLink(user.referralCode) : null,
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
    const user = await this.db.findOne('users', { id: userId });

    if (!user || !user.referralCode) {
      throw new Error('Referral code not found');
    }

    return this.generateReferralLink(user.referralCode);
  }
}

