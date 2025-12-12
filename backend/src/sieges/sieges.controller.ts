import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SiegesService } from './sieges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('sieges')
@UseGuards(JwtAuthGuard)
export class SiegesController {
  constructor(private readonly siegesService: SiegesService) {}

  @Get('active')
  async getActiveSieges() {
    return this.siegesService.getActiveSieges();
  }

  @Get('clan/:clanId')
  async getClanSieges(@Param('clanId') clanId: string) {
    return this.siegesService.getClanSieges(parseInt(clanId));
  }

  @Get(':id')
  async getSiegeById(@Param('id') id: string) {
    return this.siegesService.getSiegeById(parseInt(id));
  }

  @Post('create')
  async createSiege(
    @CurrentUser() user: any,
    @Body() data: { districtId: number },
  ) {
    return this.siegesService.createSiege(user.id, data.districtId);
  }

  @Post(':id/record-game')
  async recordSiegeGame(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: {
      whitePlayerId: number;
      blackPlayerId: number;
      winnerId: number;
      gameHistoryId?: number;
    },
  ) {
    return this.siegesService.recordSiegeGame(
      parseInt(id),
      data.whitePlayerId,
      data.blackPlayerId,
      data.winnerId,
      data.gameHistoryId,
    );
  }
}

