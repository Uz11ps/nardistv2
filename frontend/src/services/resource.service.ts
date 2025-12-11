import { api } from './api';

export interface Resource {
  id: number;
  userId: number;
  type: string;
  amount: number;
}

export const resourceService = {
  async getMyResources(): Promise<Resource[]> {
    const response = await api.get<Resource[]>('/resources');
    return response.data;
  },
};

