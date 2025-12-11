import { api } from './api';

export interface GameHistory {
  id: number;
  roomId: string;
  mode: string;
  whitePlayerId: number;
  blackPlayerId: number;
  winnerId?: number;
  duration?: number;
  betAmount?: number;
  commission?: number;
  districtId?: number;
  createdAt: string;
  whitePlayer: {
    id: number;
    firstName: string;
    username?: string;
  };
  blackPlayer: {
    id: number;
    firstName: string;
    username?: string;
  };
}

export const gameHistoryService = {
  async getMyHistory(limit: number = 50): Promise<GameHistory[]> {
    const response = await api.get<GameHistory[]>(`/game-history?limit=${limit}`);
    return response.data;
  },

  async getReplay(gameId: number): Promise<GameHistory> {
    const response = await api.get<GameHistory>(`/game-history/${gameId}`);
    return response.data;
  },
};

