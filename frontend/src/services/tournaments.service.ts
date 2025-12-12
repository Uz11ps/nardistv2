import { api } from './api';

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  mode: string;
  format: string;
  status: string;
  startDate: string;
  maxParticipants?: number;
  participants?: Array<{
    id: number;
    userId: number;
    user: {
      id: number;
      nickname?: string;
      firstName: string;
    };
  }>;
}

export const tournamentsService = {
  async getAll(): Promise<Tournament[]> {
    const response = await api.get<Tournament[]>('/tournaments');
    return response.data;
  },

  async join(tournamentId: number): Promise<{ success: boolean }> {
    const response = await api.post(`/tournaments/${tournamentId}/join`);
    return response.data;
  },

  async getCurrentOlympiad(): Promise<Tournament | null> {
    try {
      const response = await api.get<Tournament>('/tournaments/olympiad/current');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async purchaseTournamentPass(tournamentId: number): Promise<{ success: boolean }> {
    const response = await api.post(`/tournaments/${tournamentId}/pass/purchase`);
    return response.data;
  },

  async getTournamentPass(tournamentId: number): Promise<any> {
    try {
      const response = await api.get(`/tournaments/${tournamentId}/pass`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getUserTournamentPasses(): Promise<any[]> {
    const response = await api.get('/tournaments/passes/my');
    return response.data;
  },

  async claimTournamentPassReward(tournamentId: number, rewardType: string): Promise<{ success: boolean }> {
    const response = await api.post(`/tournaments/${tournamentId}/pass/rewards/${rewardType}/claim`);
    return response.data;
  },
};

