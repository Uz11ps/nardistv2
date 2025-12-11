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

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      // Разрешаем localhost на любом порту для разработки
      const allowedOrigins = process.env.FRONTEND_URL 
        ? [process.env.FRONTEND_URL]
        : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
      
      if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
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

    // Пересылаем действие другим участникам комнаты
    client.to(data.roomId).emit('game-action', {
      userId,
      action: data.action,
      payload: data.payload,
      timestamp: Date.now(),
    });

    return { success: true };
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
}

