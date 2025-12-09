import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { QuestsService } from './quests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('quests')
@UseGuards(JwtAuthGuard)
export class QuestsController {
  constructor(private readonly questsService: QuestsService) {}

  @Get()
  async getQuests(@CurrentUser() user: any) {
    return this.questsService.getActiveQuests(user.id);
  }

  @Post('progress')
  async updateProgress(
    @CurrentUser() user: any,
    @Body('questId') questId: number,
    @Body('progress') progress: number,
  ) {
    return this.questsService.updateQuestProgress(user.id, questId, progress);
  }
}

