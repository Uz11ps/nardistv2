import { api } from './api';

export interface Business {
  id: number;
  userId: number;
  districtId: number;
  type: string;
  level: number;
  incomePerHour: number;
  productionPerHour?: number;
  storageLimit?: number;
  storageCurrent: number;
  maintenanceCost: number;
  lastCollected?: string;
  lastProduced?: string;
  district?: {
    id: number;
    name: string;
    type: string;
  };
}

export const businessService = {
  async getMyBusinesses(): Promise<Business[]> {
    const response = await api.get<Business[]>('/businesses/my');
    return response.data;
  },

  async getDistrictBusinesses(districtId: number): Promise<Business[]> {
    const response = await api.get<Business[]>(`/businesses/district/${districtId}`);
    return response.data;
  },

  async create(data: { districtId: number; type: string }): Promise<Business> {
    const response = await api.post<Business>('/businesses/create', data);
    return response.data;
  },

  async getById(businessId: number): Promise<Business> {
    const response = await api.get<Business>(`/businesses/${businessId}`);
    return response.data;
  },

  async collectIncome(businessId: number): Promise<{ income: number; collectedAt: string }> {
    const response = await api.post(`/businesses/${businessId}/collect`);
    return response.data;
  },

  async upgrade(businessId: number): Promise<Business> {
    const response = await api.post<Business>(`/businesses/${businessId}/upgrade`);
    return response.data;
  },

  async produceResources(businessId: number): Promise<{ produced: number; resourceType?: string }> {
    const response = await api.post(`/businesses/${businessId}/produce`);
    return response.data;
  },

  async collectResources(businessId: number, amount: number): Promise<{ collected: number }> {
    const response = await api.post(`/businesses/${businessId}/collect-resources`, { amount });
    return response.data;
  },
};

