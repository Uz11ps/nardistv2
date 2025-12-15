import { Controller, Get, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { GameHistoryService } from './game-history.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';

@Controller('game-history')
@UseGuards(JwtAuthGuard)
export class GameHistoryController {
  constructor(
    private readonly gameHistoryService: GameHistoryService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Get()
  async getHistory(
    @CurrentUser() user: UserDto,
    @Query('limit') limit: string = '50',
    @Query('mode') mode?: string,
    @Query('result') result?: string, // 'win' | 'loss' | 'draw'
    @Query('opponentId') opponentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const hasActiveSubscription = await this.subscriptionService.checkSubscription(user.id);
    
    // Для не-подписчиков ограничиваем количество игр и убираем фильтры
    const effectiveLimit = hasActiveSubscription 
      ? parseInt(limit, 10) 
      : Math.min(parseInt(limit, 10), 10); // Максимум 10 игр для не-подписчиков
    
    // Для не-подписчиков убираем фильтры по дате и сопернику
    const filters = hasActiveSubscription ? {
      limit: effectiveLimit,
      mode: mode as 'SHORT' | 'LONG' | undefined,
      result: result as 'win' | 'loss' | 'draw' | undefined,
      opponentId: opponentId ? parseInt(opponentId, 10) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    } : {
      limit: effectiveLimit,
      mode: mode as 'SHORT' | 'LONG' | undefined,
      result: result as 'win' | 'loss' | 'draw' | undefined,
    };
    
    return this.gameHistoryService.getUserHistory(user.id, filters);
  }

  @Get(':id')
  async getReplay(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ) {
    // Проверяем подписку для доступа к реплеям
    const hasActiveSubscription = await this.subscriptionService.checkSubscription(user.id);
    
    if (!hasActiveSubscription) {
      throw new ForbiddenException('Replays are available only for subscribers');
    }
    
    const replay = await this.gameHistoryService.getGameReplay(parseInt(id, 10));
    
    // Проверяем, что пользователь участвовал в этой игре
    if (replay && replay.whitePlayerId !== user.id && replay.blackPlayerId !== user.id) {
      throw new ForbiddenException('You can only view replays of your own games');
    }
    
    return replay;
  }
}

