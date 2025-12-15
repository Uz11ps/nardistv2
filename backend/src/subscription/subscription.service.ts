import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubscription(
    userId: number,
    plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
  ) {
    const durations = {
      MONTHLY: 30,
      QUARTERLY: 90,
      YEARLY: 365,
    };

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durations[plan]);

    return this.prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        startDate,
        endDate,
        isActive: true,
      },
      create: {
        userId,
        plan,
        startDate,
        endDate,
        isActive: true,
      },
    });
  }

  async checkSubscription(userId: number): Promise<boolean> {
    return this.hasActiveSubscription(userId);
  }

  async hasActiveSubscription(userId: number): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.isActive) {
      return false;
    }

    if (new Date() > subscription.endDate) {
      // Подписка истекла
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { isActive: false },
      });
      return false;
    }

    return true;
  }

  async getSubscription(userId: number) {
    return this.prisma.subscription.findUnique({
      where: { userId },
    });
  }
}

