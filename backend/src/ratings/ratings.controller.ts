import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get('leaderboard')
  async getLeaderboard(
    @Query('mode') mode: string = 'SHORT',
    @Query('limit') limit: string = '100',
  ) {
    return this.ratingsService.getLeaderboard(mode, parseInt(limit, 10));
  }
}

