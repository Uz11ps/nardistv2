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

    return {
      totalReferrals: referrals,
      referralCode: user?.referralCode,
    };
  }
}

