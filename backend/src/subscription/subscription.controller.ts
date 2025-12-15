import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async getSubscription(@CurrentUser() user: UserDto) {
    const subscription = await this.subscriptionService.getSubscription(user.id);
    return subscription;
  }

  @Post()
  async createSubscription(
    @CurrentUser() user: UserDto,
    @Body('plan') plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
  ) {
    return this.subscriptionService.createSubscription(user.id, plan);
  }
}

