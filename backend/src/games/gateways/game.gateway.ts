import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '../../auth/jwt.service';
import { AuthService } from '../../auth/auth.service';
import { GameRoomService } from '../services/game-room.service';
import { GameLogicService } from '../services/game-logic.service';
import { MatchmakingService } from '../services/matchmaking.service';
import { BotService } from '../services/bot.service';
import { GameHistoryService } from '../../game-history/game-history.service';
import { GameMode, GameStatus, PlayerColor } from '../types/game.types';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      // Разрешаем указанные домены
      const allowedOrigins = process.env.FRONTEND_URL 
        ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
        : process.env.NODE_ENV === 'production'
          ? ['https://nardist.online', 'https://www.nardist.online']
          : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
      
      // В production разрешаем только указанные домены
      if (process.env.NODE_ENV === 'production') {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        // В development разрешаем localhost и указанные домены
        if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
  },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, Socket>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly gameRoom: GameRoomService,
    private readonly gameLogic: GameLogicService,
    private readonly matchmaking: MatchmakingService,
    private readonly botService: BotService,
    private readonly gameHistory: GameHistoryService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.authService.validateUser(payload.userId);

      // Сохраняем информацию о пользователе в сокете
      client.data.userId = user.id;
      client.data.telegramId = user.telegramId;

      this.connectedUsers.set(user.id.toString(), client);

      console.log(`User ${user.id} connected to game gateway`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.connectedUsers.delete(client.data.userId.toString());
      console.log(`User ${client.data.userId} disconnected from game gateway`);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    client.join(data.roomId);
    console.log(`User ${userId} joined room ${data.roomId}`);

    // Уведомляем других участников комнаты
    client.to(data.roomId).emit('user-joined', {
      userId,
      roomId: data.roomId,
    });

    return { success: true, roomId: data.roomId };
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    client.leave(data.roomId);
    console.log(`User ${userId} left room ${data.roomId}`);

    client.to(data.roomId).emit('user-left', {
      userId,
      roomId: data.roomId,
    });

    return { success: true };
  }

  @SubscribeMessage('game-action')
  async handleGameAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; action: string; payload: any },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const state = await this.gameRoom.getGameState(data.roomId);
    if (!state) {
      return { error: 'Room not found' };
    }

    // Проверяем, что это ход игрока
    const isWhite = state.players.white === userId;
    const isBlack = state.players.black === userId;
    const isCurrentPlayer = (isWhite && state.currentPlayer === PlayerColor.WHITE) ||
                           (isBlack && state.currentPlayer === PlayerColor.BLACK);

    if (!isCurrentPlayer && !isBlack && !isWhite) {
      return { error: 'Not your turn or not in game' };
    }

    switch (data.action) {
      case 'roll-dice':
        return await this.handleRollDice(client, data.roomId, state, userId);
      
      case 'make-move':
        return await this.handleMakeMove(client, data.roomId, state, userId, data.payload);
      
      case 'end-turn':
        return await this.handleEndTurn(client, data.roomId, state, userId);
      
      default:
        return { error: 'Unknown action' };
    }
  }

  /**
   * Обработка броска кубиков
   */
  private async handleRollDice(
    client: Socket,
    roomId: string,
    state: any,
    userId: number,
  ) {
    if (state.dice) {
      return { error: 'Dice already rolled' };
    }

    const dice = this.gameLogic.rollDice();
    // Обновляем счетчик бросков
    const diceRollsCount = state.diceRollsCount || { white: 0, black: 0 };
    if (state.currentPlayer === PlayerColor.WHITE) {
      diceRollsCount.white = (diceRollsCount.white || 0) + 1;
    } else {
      diceRollsCount.black = (diceRollsCount.black || 0) + 1;
    }
    const newState = { ...state, dice, diceRollsCount };

    await this.gameRoom.saveGameState(roomId, newState);

    // Отправляем всем в комнате
    this.server.to(roomId).emit('dice-rolled', {
      dice,
      currentPlayer: state.currentPlayer,
    });

    // Если это бот, делаем ход автоматически
    const isWhite = state.players.white === userId;
    const isBlack = state.players.black === userId;
    const opponentId = isWhite ? state.players.black : state.players.white;
    
    // Проверяем, является ли соперник ботом (ID < 0 или специальный ID)
    if (opponentId && opponentId < 0) {
      setTimeout(async () => {
        await this.processBotTurn(roomId, newState);
      }, 1000);
    }

    return { success: true, dice };
  }

  /**
   * Обработка хода
   */
  private async handleMakeMove(
    client: Socket,
    roomId: string,
    state: any,
    userId: number,
    payload: { from: number; to: number; dieValue: number },
  ) {
    const { from, to, dieValue } = payload;

    // Валидация хода
    const isValid = state.mode === GameMode.SHORT
      ? this.gameLogic.isValidMoveShort(state, from, to, dieValue)
      : this.gameLogic.isValidMoveLong(state, from, to, dieValue);

    if (!isValid) {
      return { error: 'Invalid move' };
    }

    // Выполняем ход
    let newState = this.gameLogic.makeMoveWithHomeUpdate(state, from, to, dieValue);

    // Проверяем окончание игры
    const gameEnd = this.gameLogic.checkGameEnd(newState);
    if (gameEnd.finished) {
      newState.status = GameStatus.FINISHED;
      
      // Сохраняем игру в историю
      await this.gameHistory.saveGame({
        roomId,
        mode: state.mode,
        whitePlayerId: state.players.white!,
        blackPlayerId: state.players.black!,
        winnerId: gameEnd.winner === PlayerColor.WHITE ? state.players.white! : state.players.black!,
        gameState: newState,
        moves: newState.moves,
        duration: Math.floor((Date.now() - state.turnStartTime) / 1000),
      });

      this.server.to(roomId).emit('game-ended', {
        winner: gameEnd.winner,
        state: newState,
      });
    }

    await this.gameRoom.saveGameState(roomId, newState);

    // Отправляем обновление состояния
    this.server.to(roomId).emit('game-state-updated', {
      state: newState,
      move: { from, to, dieValue },
    });

    return { success: true, state: newState };
  }

  /**
   * Обработка окончания хода
   */
  private async handleEndTurn(
    client: Socket,
    roomId: string,
    state: any,
    userId: number,
  ) {
    const newState = this.gameLogic.switchTurn(state);
    await this.gameRoom.saveGameState(roomId, newState);

    this.server.to(roomId).emit('turn-switched', {
      currentPlayer: newState.currentPlayer,
      state: newState,
    });

    // Если следующий игрок - бот, делаем ход
    const nextPlayerId = newState.currentPlayer === PlayerColor.WHITE
      ? newState.players.white
      : newState.players.black;
    
    if (nextPlayerId && nextPlayerId < 0) {
      setTimeout(async () => {
        await this.processBotTurn(roomId, newState);
      }, 1000);
    }

    return { success: true };
  }

  /**
   * Обработка хода бота
   */
  private async processBotTurn(roomId: string, state: any) {
      // Бросаем кубики за бота
      const dice = this.gameLogic.rollDice();
      // Обновляем счетчик бросков
      const diceRollsCount = state.diceRollsCount || { white: 0, black: 0 };
      if (state.currentPlayer === PlayerColor.WHITE) {
        diceRollsCount.white = (diceRollsCount.white || 0) + 1;
      } else {
        diceRollsCount.black = (diceRollsCount.black || 0) + 1;
      }
      let newState = { ...state, dice, diceRollsCount };
      await this.gameRoom.saveGameState(roomId, newState);

    this.server.to(roomId).emit('dice-rolled', {
      dice,
      currentPlayer: state.currentPlayer,
    });

    // Получаем ход бота
    const botMove = await this.botService.makeBotMove(newState);
    
    if (botMove) {
      // Выполняем ход бота
      newState = this.gameLogic.makeMoveWithHomeUpdate(newState, botMove.from, botMove.to, botMove.dieValue);

      // Проверяем окончание игры
      const gameEnd = this.gameLogic.checkGameEnd(newState);
      if (gameEnd.finished) {
        newState.status = GameStatus.FINISHED;
        
        await this.gameHistory.saveGame({
          roomId,
          mode: state.mode,
          whitePlayerId: state.players.white!,
          blackPlayerId: state.players.black!,
          winnerId: gameEnd.winner === PlayerColor.WHITE ? state.players.white! : state.players.black!,
          gameState: newState,
          moves: newState.moves,
          duration: Math.floor((Date.now() - state.turnStartTime) / 1000),
        });

        this.server.to(roomId).emit('game-ended', {
          winner: gameEnd.winner,
          state: newState,
        });
      } else {
        // Переключаем ход
        newState = this.gameLogic.switchTurn(newState);
      }

      await this.gameRoom.saveGameState(roomId, newState);

      this.server.to(roomId).emit('game-state-updated', {
        state: newState,
        move: botMove,
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { pong: Date.now() };
  }

  private extractToken(client: Socket): string | null {
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
    return token || null;
  }

  // Метод для отправки сообщения конкретному пользователю
  sendToUser(userId: number, event: string, data: any) {
    const socket = this.connectedUsers.get(userId.toString());
    if (socket) {
      socket.emit(event, data);
    }
  }

  // Метод для отправки сообщения в комнату
  sendToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  /**
   * Начать игру с ботом
   */
  @SubscribeMessage('start-bot-game')
  async handleStartBotGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { mode: GameMode; betAmount?: number },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    // Создаем комнату с ботом (ID бота = -1)
    const roomId = await this.gameRoom.createRoom(data.mode, userId, -1);
    const state = await this.gameRoom.getGameState(roomId);
    
    client.join(roomId);
    
    // Если первый ход бота, делаем его автоматически
    if (state && state.currentPlayer === PlayerColor.BLACK && state.players.black === -1) {
      setTimeout(async () => {
        await this.processBotTurn(roomId, state);
      }, 1000);
    }

    return { success: true, roomId, state };
  }

  /**
   * Начать быструю игру
   */
  @SubscribeMessage('start-quick-game')
  async handleStartQuickGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { mode: GameMode; betAmount?: number },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    // Добавляем в очередь
    await this.matchmaking.joinQueue(userId, data.mode, data.betAmount);

    // Ищем соперника
    const opponent = await this.matchmaking.findOpponent(userId, data.mode, data.betAmount);

    if (opponent) {
      // Нашли соперника, создаем комнату
      const roomId = await this.gameRoom.createRoom(
        data.mode,
        userId,
        opponent.userId,
      );

      const state = await this.gameRoom.getGameState(roomId);
      
      client.join(roomId);
      
      // Уведомляем соперника
      this.sendToUser(opponent.userId, 'game-found', {
        roomId,
        state,
        opponent: { id: userId },
      });

      return { success: true, roomId, state };
    }

    return { success: true, searching: true };
  }

  /**
   * Покинуть очередь поиска
   */
  @SubscribeMessage('leave-queue')
  async handleLeaveQueue(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    await this.matchmaking.leaveQueue(userId);
    return { success: true };
  }
}

