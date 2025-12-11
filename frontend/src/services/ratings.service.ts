import { api } from './api';

export interface LeaderboardEntry {
  id: number;
  userId: number;
  mode: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  user: {
    id: number;
    nickname?: string;
    firstName: string;
    lastName?: string;
    photoUrl?: string;
    avatar?: string;
  };
}

export const ratingsService = {
  async getLeaderboard(mode: 'SHORT' | 'LONG' = 'SHORT', limit: number = 100): Promise<LeaderboardEntry[]> {
    const response = await api.get<LeaderboardEntry[]>('/ratings/leaderboard', {
      params: { mode, limit },
    });
    return response.data;
  },
};

