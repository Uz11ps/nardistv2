import { api } from './api';

export interface GameAnalytics {
  game: {
    id: number;
    mode: string;
    winnerId: number | null;
    duration: number | null;
    createdAt: string;
  };
  analysis: {
    totalMoves: number;
    errors: Array<{
      moveIndex: number;
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    goodMoves: Array<{
      moveIndex: number;
      description: string;
    }>;
    errorRate: number;
  };
  recommendations: string[];
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: string;
  shortGames: {
    total: number;
    wins: number;
  };
  longGames: {
    total: number;
    wins: number;
  };
  averageDuration: number;
}

export const analyticsService = {
  async getGameAnalytics(gameId: number): Promise<GameAnalytics> {
    const response = await api.get<GameAnalytics>(`/analytics/game/${gameId}`);
    return response.data;
  },

  async getPlayerStats(): Promise<PlayerStats> {
    const response = await api.get<PlayerStats>('/analytics/stats');
    return response.data;
  },
};

