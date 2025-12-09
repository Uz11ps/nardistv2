import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return this.referralsService.getReferralStats(user.id);
  }

  @Post('use')
  async useCode(
    @CurrentUser() user: any,
    @Body('code') code: string,
  ) {
    return this.referralsService.useReferralCode(user.id, code);
  }
}

