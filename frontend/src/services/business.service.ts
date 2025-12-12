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

  async getCraftRecipes(businessId: number): Promise<Array<{ skin: any; recipe: Record<string, number> | null }>> {
    const response = await api.get(`/businesses/${businessId}/craft-recipes`);
    return response.data;
  },

  async craftSkin(businessId: number, skinId: number): Promise<{ success: boolean; item: any }> {
    const response = await api.post(`/businesses/${businessId}/craft`, { skinId });
    return response.data;
  },

  async getRepairBusinesses(itemType: string, districtId?: number): Promise<Business[]> {
    const response = await api.get(`/businesses/repair/${itemType}`, {
      params: districtId ? { districtId } : undefined,
    });
    return response.data;
  },

  async repairItemAtBusiness(
    businessId: number,
    itemId: number,
    repairType: 'PARTIAL' | 'FULL',
  ): Promise<{ item: any; cost: number; ownerShare: number; burnedAmount: number }> {
    const response = await api.post(`/businesses/${businessId}/repair`, {
      itemId,
      repairType,
    });
    return response.data;
  },

  async getAvailableJobs(districtId?: number): Promise<Array<Business & { hourlySalary: number }>> {
    const response = await api.get('/businesses/jobs', {
      params: districtId ? { districtId } : undefined,
    });
    return response.data;
  },

  async workAtBusiness(businessId: number, hours: number = 1): Promise<{ success: boolean; energySpent: number; salary: number; hours: number }> {
    const response = await api.post(`/businesses/${businessId}/work`, { hours });
    return response.data;
  },

  async createJobPosting(businessId: number, data: {
    title: string;
    description?: string;
    salaryPerHour: number;
    energyPerHour?: number;
    maxWorkers?: number;
  }): Promise<any> {
    const response = await api.post(`/businesses/${businessId}/job-postings`, data);
    return response.data;
  },

  async getBusinessJobPostings(businessId: number): Promise<any[]> {
    const response = await api.get(`/businesses/${businessId}/job-postings`);
    return response.data;
  },

  async getDistrictJobPostings(districtId: number): Promise<any[]> {
    const response = await api.get(`/businesses/district/${districtId}/job-postings`);
    return response.data;
  },

  async applyForJob(jobPostingId: number): Promise<{ success: boolean }> {
    const response = await api.post(`/businesses/job-postings/${jobPostingId}/apply`);
    return response.data;
  },

  async workAtJob(jobPostingId: number, hours: number = 1): Promise<{ salary: number; energyCost: number; hoursWorked: number; totalEarned: number }> {
    const response = await api.post(`/businesses/job-postings/${jobPostingId}/work`, { hours });
    return response.data;
  },

  async deleteJobPosting(jobPostingId: number): Promise<{ success: boolean }> {
    const response = await api.post(`/businesses/job-postings/${jobPostingId}/delete`);
    return response.data;
  },
};

