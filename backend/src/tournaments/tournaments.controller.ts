import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  async getTournaments() {
    return this.tournamentsService.getTournaments();
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinTournament(
    @Param('id') id: string,
    @CurrentUser() user: UserDto,
  ) {
    return this.tournamentsService.joinTournament(parseInt(id, 10), user.id);
  }

  @Get('olympiad/current')
  async getCurrentOlympiad() {
    return this.tournamentsService.getCurrentOlympiad();
  }

  @Post('olympiad/create')
  async createOlympiad() {
    return this.tournamentsService.createOlympiad();
  }

  @Post('olympiad/:id/finish')
  @UseGuards(JwtAuthGuard)
  async finishOlympiad(@Param('id') id: string) {
    return this.tournamentsService.finishOlympiad(parseInt(id, 10));
  }

  @Post(':id/pass/purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseTournamentPass(
    @Param('id') id: string,
    @CurrentUser() user: UserDto,
    @Body() data?: { paymentMethod?: 'NAR' | 'TON' | 'USDT' | 'RUBLES' | 'TELEGRAM_STARS' },
  ) {
    return this.tournamentsService.purchaseTournamentPass(
      user.id,
      parseInt(id, 10),
      data?.paymentMethod || 'NAR',
    );
  }

  @Get(':id/pass')
  @UseGuards(JwtAuthGuard)
  async getTournamentPass(
    @Param('id') id: string,
    @CurrentUser() user: UserDto,
  ) {
    return this.tournamentsService.getTournamentPass(user.id, parseInt(id, 10));
  }

  @Get('passes/my')
  @UseGuards(JwtAuthGuard)
  async getUserTournamentPasses(@CurrentUser() user: any) {
    return this.tournamentsService.getUserTournamentPasses(user.id);
  }

  @Post(':id/pass/rewards/:rewardType/claim')
  @UseGuards(JwtAuthGuard)
  async claimTournamentPassRewards(
    @Param('id') id: string,
    @Param('rewardType') rewardType: string,
    @CurrentUser() user: UserDto,
  ) {
    return this.tournamentsService.claimTournamentPassRewards(user.id, parseInt(id, 10), rewardType);
  }

  @Get(':id/pass/rewards/available')
  @UseGuards(JwtAuthGuard)
  async getAvailableTournamentPassRewards(
    @Param('id') id: string,
    @CurrentUser() user: UserDto,
  ) {
    return this.tournamentsService.getAvailableTournamentPassRewards(user.id, parseInt(id, 10));
  }
}

