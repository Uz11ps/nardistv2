import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SubscriptionService {
  constructor(private readonly db: DatabaseService) {}

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

    // Проверяем существует ли подписка
    const existing = await this.db.findOne('subscriptions', { userId });

    if (existing) {
      return await this.db.update('subscriptions', 
        { userId },
        {
          plan,
          startDate,
          endDate,
          isActive: true,
        }
      );
    } else {
      return await this.db.create('subscriptions', {
        userId,
        plan,
        startDate,
        endDate,
        isActive: true,
      });
    }
  }

  async checkSubscription(userId: number): Promise<boolean> {
    const subscription = await this.db.findOne('subscriptions', { userId });

    if (!subscription || !subscription.isActive) {
      return false;
    }

    if (new Date() > new Date(subscription.endDate)) {
      // Подписка истекла
      await this.db.update('subscriptions', 
        { id: subscription.id },
        { isActive: false }
      );
      return false;
    }

    return true;
  }

  async getSubscription(userId: number) {
    return await this.db.findOne('subscriptions', { userId });
  }

  async hasActiveSubscription(userId: number): Promise<boolean> {
    return this.checkSubscription(userId);
  }
}

