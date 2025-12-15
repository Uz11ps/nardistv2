import { io, Socket } from 'socket.io-client';

// В production используем текущий домен, в development - localhost
const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // Если на production домене, используем его (wss для HTTPS)
  if (window.location.hostname === 'nardist.online' || window.location.hostname === 'www.nardist.online') {
    // Используем wss:// для HTTPS или ws:// для HTTP
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.hostname}`;
  }
  
  // Иначе localhost для development
  return 'http://localhost:3000';
};

const WS_URL = getWsUrl();

class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    if (!token) {
      console.error('Cannot connect WebSocket: no token provided');
      return null;
    }

    // Отключаем предыдущее соединение, если есть
    if (this.socket) {
      this.disconnect();
    }

    this.token = token;
    
    // Формируем правильный URL для WebSocket
    // WS_URL уже содержит правильный протокол (wss:// или ws://)
    const gameUrl = `${WS_URL}/game`;
    console.log('Connecting WebSocket to', gameUrl);
    
    this.socket = io(gameUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'], // Добавляем polling как fallback
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('join-room', { roomId });
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('leave-room', { roomId });
    }
  }

  sendGameAction(roomId: string, action: string, payload: any) {
    if (this.socket) {
      this.socket.emit('game-action', { roomId, action, payload });
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const wsService = new WebSocketService();

