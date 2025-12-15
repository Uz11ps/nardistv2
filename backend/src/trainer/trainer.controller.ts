import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TrainerService } from './trainer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';

@Controller('trainer')
@UseGuards(JwtAuthGuard)
export class TrainerController {
  constructor(private readonly trainerService: TrainerService) {}

  @Get('positions')
  async getTrainingPositions(
    @CurrentUser() user: UserDto,
    @Query('mode') mode?: 'SHORT' | 'LONG',
  ) {
    return this.trainerService.getTrainingPositions(user.id, mode || 'SHORT');
  }

  @Get('positions/:id')
  async getTrainingPosition(
    @Param('id') id: string,
    @CurrentUser() user: UserDto,
  ) {
    return this.trainerService.getTrainingPosition(user.id, id);
  }

  @Post('positions/:id/validate')
  async validateMove(
    @Param('id') id: string,
    @CurrentUser() user: UserDto,
    @Body() move: { from: number; to: number; dieValue: number },
  ) {
    return this.trainerService.validateMove(user.id, id, move);
  }

  @Get('stats')
  async getTrainingStats(@CurrentUser() user: UserDto) {
    return this.trainerService.getTrainingStats(user.id);
  }
}

