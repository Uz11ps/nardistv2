import { api } from './api';

export interface User {
  id: number;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  nickname?: string;
  level: number;
  xp: number;
  narCoin: number;
  energy: number;
  energyMax: number;
  lives: number;
  livesMax: number;
  power: number;
  powerMax: number;
  statsEconomy: number;
  statsEnergy: number;
  statsLives: number;
  statsPower: number;
  avatar?: string;
  photoUrl?: string;
}

export interface UserStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  ratings: Array<{
    mode: string;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
  }>;
}

export const userService = {
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/users/profile', data);
    return response.data;
  },

  async getStats(): Promise<UserStats> {
    const response = await api.get<UserStats>('/users/stats');
    return response.data;
  },

  async upgradeStat(statType: 'ECONOMY' | 'ENERGY' | 'LIVES' | 'POWER'): Promise<User> {
    const response = await api.post<User>('/users/upgrade-stat', { statType });
    return response.data;
  },

  async restoreEnergy(amount?: number): Promise<{ success: boolean; energy: number; energyMax: number; restored: number; cost: number }> {
    const response = await api.post('/users/restore-energy', { amount });
    return response.data;
  },

  async restoreLives(amount?: number): Promise<{ success: boolean; lives: number; livesMax: number; restored: number; cost: number }> {
    const response = await api.post('/users/restore-lives', { amount });
    return response.data;
  },
};

