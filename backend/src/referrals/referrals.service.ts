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

    return {
      totalReferrals: referrals,
      referralCode: (await this.prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      }))?.referralCode,
    };
  }
}

