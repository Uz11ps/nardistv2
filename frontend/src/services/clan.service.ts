import { api } from './api';

export interface Clan {
  id: number;
  name: string;
  description?: string;
  leaderId: number;
  treasury: number;
  leader?: {
    id: number;
    firstName: string;
    username?: string;
  };
  members?: Array<{
    id: number;
    userId: number;
    role: string;
    user: {
      id: number;
      firstName: string;
      username?: string;
    };
  }>;
  districts?: Array<{
    id: number;
    name: string;
    type: string;
  }>;
}

export const clanService = {
  async getAll(): Promise<Clan[]> {
    const response = await api.get<Clan[]>('/clans');
    return response.data;
  },

  async getById(id: number): Promise<Clan> {
    const response = await api.get<Clan>(`/clans/${id}`);
    return response.data;
  },

  async getMyClan(): Promise<Clan | null> {
    const response = await api.get<Clan>('/clans/my');
    return response.data;
  },

  async create(data: { name: string; description?: string }): Promise<Clan> {
    const response = await api.post<Clan>('/clans/create', data);
    return response.data;
  },

  async join(clanId: number): Promise<{ success: boolean }> {
    const response = await api.post(`/clans/${clanId}/join`);
    return response.data;
  },

  async leave(clanId: number): Promise<{ success: boolean }> {
    const response = await api.post(`/clans/${clanId}/leave`);
    return response.data;
  },
};

