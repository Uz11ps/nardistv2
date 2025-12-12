import { api } from './api';

export interface Siege {
  id: number;
  districtId: number;
  attackingClanId: number;
  defendingClanId?: number;
  status: 'ACTIVE' | 'FINISHED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  attackingWins: number;
  defendingWins: number;
  requiredWins: number;
  winnerClanId?: number;
  district?: any;
  attackingClan?: any;
  defendingClan?: any;
  siegeGames?: any[];
}

export const siegeService = {
  async getActiveSieges(): Promise<Siege[]> {
    const response = await api.get<Siege[]>('/sieges/active');
    return response.data;
  },

  async getClanSieges(clanId: number): Promise<Siege[]> {
    const response = await api.get<Siege[]>(`/sieges/clan/${clanId}`);
    return response.data;
  },

  async getSiegeById(siegeId: number): Promise<Siege> {
    const response = await api.get<Siege>(`/sieges/${siegeId}`);
    return response.data;
  },

  async createSiege(districtId: number): Promise<Siege> {
    const response = await api.post<Siege>('/sieges/create', { districtId });
    return response.data;
  },
};

