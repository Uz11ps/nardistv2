import { api } from './api';

export interface Subscription {
  id: number;
  userId: number;
  plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export const subscriptionService = {
  async get(): Promise<Subscription | null> {
    try {
      const response = await api.get<Subscription>('/subscription');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async create(plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'): Promise<Subscription> {
    const response = await api.post<Subscription>('/subscription', { plan });
    return response.data;
  },
};

