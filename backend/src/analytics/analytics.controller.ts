import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('game/:id')
  async getGameAnalytics(
    @Param('id') id: string,
    @CurrentUser() user: UserDto,
  ) {
    return this.analyticsService.getGameAnalytics(user.id, parseInt(id, 10));
  }

  @Get('stats')
  async getPlayerStats(@CurrentUser() user: UserDto) {
    return this.analyticsService.getPlayerStats(user.id);
  }
}

