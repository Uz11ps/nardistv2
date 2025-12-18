import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';
import { FreeTablesService } from './services/free-tables.service';
import { GameRoomService } from './services/game-room.service';
import { GameMode } from './types/game.types';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(
    private readonly freeTablesService: FreeTablesService,
    private readonly gameRoomService: GameRoomService,
  ) {}

  /**
   * Создать свободный стол
   */
  @Post('free-tables')
  async createTable(
    @CurrentUser() user: UserDto,
    @Body() data: {
      mode: GameMode;
      betAmount?: number;
      minRating?: number;
      maxRating?: number;
      turnTimeLimit?: number;
    },
  ) {
    return this.freeTablesService.createTable(
      user.id,
      data.mode,
      data.betAmount,
      data.minRating,
      data.maxRating,
      data.turnTimeLimit,
    );
  }

  /**
   * Получить список свободных столов
   */
  @Get('free-tables')
  async getTables(
    @CurrentUser() user: UserDto,
  ) {
    return this.freeTablesService.getTables();
  }

  /**
   * Присоединиться к столу
   */
  @Post('free-tables/:tableId/join')
  async joinTable(
    @CurrentUser() user: UserDto,
    @Param('tableId') tableId: string,
  ) {
    const table = await this.freeTablesService.joinTable(tableId, user.id);
    
    if (!table) {
      throw new Error('Table not found or already taken');
    }

    // Создаем игровую комнату
    const roomId = await this.gameRoomService.createRoom(
      table.mode,
      table.hostId,
      user.id,
    );

    // Устанавливаем таймер хода, если указан
    if (table.turnTimeLimit) {
      const state = await this.gameRoomService.getGameState(roomId);
      if (state) {
        (state as any).turnTimeLimit = table.turnTimeLimit;
        await this.gameRoomService.saveGameState(roomId, state);
      }
    }

    return {
      success: true,
      roomId,
      table,
    };
  }

  /**
   * Удалить свой стол
   */
  @Post('free-tables/:tableId/remove')
  async removeTable(
    @CurrentUser() user: UserDto,
    @Param('tableId') tableId: string,
  ) {
    const table = await this.freeTablesService.getTable(tableId);
    
    if (!table) {
      throw new Error('Table not found');
    }

    if (table.hostId !== user.id) {
      throw new Error('You can only remove your own table');
    }

    await this.freeTablesService.removeTable(tableId);
    return { success: true };
  }
}

