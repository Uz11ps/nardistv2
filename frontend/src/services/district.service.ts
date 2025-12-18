import { api } from './api';

export interface District {
  id: number;
  name: string;
  description: string;
  type: string;
  icon: string;
  clanId?: number;
  commissionRate: number;
  clan?: {
    id: number;
    name: string;
  };
  fund?: {
    balance: number;
  };
  businessCount?: number;
}

export const districtService = {
  async getAll(): Promise<District[]> {
    const response = await api.get<District[]>('/districts');
    // Гарантируем что возвращается массив
    return Array.isArray(response.data) ? response.data : [];
  },

  async getById(id: number): Promise<District> {
    const response = await api.get<District>(`/districts/${id}`);
    return response.data;
  },

  async getByType(type: string): Promise<District> {
    const response = await api.get<District>(`/districts/type/${type}`);
    return response.data;
  },
};

