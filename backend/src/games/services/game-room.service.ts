import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { GameState, GameMode, GameStatus, PlayerColor } from '../types/game.types';
import { GameLogicService } from './game-logic.service';

@Injectable()
export class GameRoomService {
  constructor(
    private readonly redis: RedisService,
    private readonly gameLogic: GameLogicService,
  ) {}

  /**
   * Создание новой игровой комнаты
   */
  async createRoom(
    mode: GameMode,
    whitePlayerId: number,
    blackPlayerId: number,
  ): Promise<string> {
    const roomId = `game:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const gameState = this.gameLogic.initializeGame(mode, whitePlayerId, blackPlayerId);
    gameState.status = GameStatus.IN_PROGRESS;

    await this.redis.set(
      `room:${roomId}`,
      JSON.stringify(gameState),
      3600, // TTL 1 час
    );

    // Сохраняем связь пользователей с комнатой
    await this.redis.set(`user:${whitePlayerId}:room`, roomId, 3600);
    await this.redis.set(`user:${blackPlayerId}:room`, roomId, 3600);

    return roomId;
  }

  /**
   * Получение состояния игры
   */
  async getGameState(roomId: string): Promise<GameState | null> {
    const data = await this.redis.get(`room:${roomId}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Сохранение состояния игры
   */
  async saveGameState(roomId: string, state: GameState): Promise<void> {
    await this.redis.set(`room:${roomId}`, JSON.stringify(state), 3600);
  }

  /**
   * Получение комнаты пользователя
   */
  async getUserRoom(userId: number): Promise<string | null> {
    return await this.redis.get(`user:${userId}:room`);
  }

  /**
   * Удаление комнаты
   */
  async deleteRoom(roomId: string): Promise<void> {
    const state = await this.getGameState(roomId);
    if (state) {
      if (state.players.white) {
        await this.redis.del(`user:${state.players.white}:room`);
      }
      if (state.players.black) {
        await this.redis.del(`user:${state.players.black}:room`);
      }
    }
    await this.redis.del(`room:${roomId}`);
  }
}

