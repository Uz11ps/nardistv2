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
};

