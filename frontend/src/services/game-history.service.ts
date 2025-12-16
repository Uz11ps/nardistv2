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
  async getMyHistory(params?: { limit?: number; mode?: 'SHORT' | 'LONG'; result?: 'win' | 'loss' | 'draw' }): Promise<GameHistory[]> {
    const limit = params?.limit || 50;
    const queryParams = new URLSearchParams({ limit: limit.toString() });
    if (params?.mode) queryParams.append('mode', params.mode);
    if (params?.result) queryParams.append('result', params.result);
    const response = await api.get<GameHistory[]>(`/game-history?${queryParams.toString()}`);
    return response.data;
  },

  async getReplay(gameId: number): Promise<GameHistory> {
    const response = await api.get<GameHistory>(`/game-history/${gameId}`);
    return response.data;
  },
};

