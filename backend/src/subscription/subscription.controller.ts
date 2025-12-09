import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async getSubscription(@CurrentUser() user: any) {
    return this.subscriptionService.checkSubscription(user.id);
  }

  @Post()
  async createSubscription(
    @CurrentUser() user: any,
    @Body('plan') plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
  ) {
    return this.subscriptionService.createSubscription(user.id, plan);
  }
}

