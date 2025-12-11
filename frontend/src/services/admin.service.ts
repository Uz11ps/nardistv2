import { api } from './api';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  gamesToday: number;
  totalTournaments: number;
  activeTournaments: number;
  totalRevenue: number;
  revenueToday: number;
}

export interface AdminUser {
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
  referralCode: string;
  isPremium: boolean;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const response = await api.get<AdminStats>('/admin/stats');
    return response.data;
  },

  async getUsers(page: number = 1, limit: number = 50): Promise<AdminUsersResponse> {
    const response = await api.get<AdminUsersResponse>('/admin/users', {
      params: { page, limit },
    });
    return response.data;
  },

  async banUser(userId: number): Promise<{ success: boolean }> {
    const response = await api.put(`/admin/users/${userId}/ban`);
    return response.data;
  },

  async unbanUser(userId: number): Promise<{ success: boolean }> {
    const response = await api.put(`/admin/users/${userId}/unban`);
    return response.data;
  },

  async addCoins(userId: number, amount: number): Promise<{ success: boolean }> {
    const response = await api.post(`/admin/users/${userId}/coins`, { amount });
    return response.data;
  },

  async getGames(page: number = 1, limit: number = 50): Promise<any> {
    const response = await api.get('/admin/games', {
      params: { page, limit },
    });
    return response.data;
  },

  async getTournaments(): Promise<any[]> {
    const response = await api.get('/admin/tournaments');
    return response.data;
  },

  async createTournament(data: any): Promise<any> {
    const response = await api.post('/admin/tournaments', data);
    return response.data;
  },

  async startTournament(tournamentId: number): Promise<{ success: boolean }> {
    const response = await api.put(`/admin/tournaments/${tournamentId}/start`);
    return response.data;
  },

  async finishTournament(tournamentId: number): Promise<{ success: boolean }> {
    const response = await api.put(`/admin/tournaments/${tournamentId}/finish`);
    return response.data;
  },

  async getSettings(): Promise<any> {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  async updateSettings(settings: any): Promise<any> {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  },

  async getQuests(): Promise<any[]> {
    const response = await api.get('/admin/quests');
    return response.data;
  },

  async getQuestById(id: number): Promise<any> {
    const response = await api.get(`/admin/quests/${id}`);
    return response.data;
  },

  async createQuest(data: {
    type: string;
    title: string;
    description: string;
    target: number;
    rewardCoin?: number;
    rewardXp?: number;
    rewardSkin?: number;
    startDate?: string;
    endDate?: string;
    durationType?: string;
    isHoliday?: boolean;
    isInfinite?: boolean;
    holidayName?: string;
  }): Promise<any> {
    const response = await api.post('/admin/quests', data);
    return response.data;
  },

  async updateQuest(id: number, data: {
    type?: string;
    title?: string;
    description?: string;
    target?: number;
    rewardCoin?: number;
    rewardXp?: number;
    rewardSkin?: number;
    startDate?: string | null;
    endDate?: string | null;
    durationType?: string;
    isHoliday?: boolean;
    isInfinite?: boolean;
    holidayName?: string;
    isActive?: boolean;
  }): Promise<any> {
    const response = await api.put(`/admin/quests/${id}`, data);
    return response.data;
  },

  async deleteQuest(id: number): Promise<{ success: boolean }> {
    const response = await api.delete(`/admin/quests/${id}`);
    return response.data;
  },

  // Управление конфигурацией предприятий
  async getBusinessConfigs(): Promise<any[]> {
    const response = await api.get('/admin/business-configs');
    return response.data;
  },

  async updateBusinessConfig(type: string, config: any): Promise<any> {
    const response = await api.put(`/admin/business-configs/${type}`, config);
    return response.data;
  },

  // Управление районами
  async getAllDistricts(): Promise<any[]> {
    const response = await api.get('/admin/districts');
    return response.data;
  },

  async updateDistrict(id: number, data: any): Promise<any> {
    const response = await api.put(`/admin/districts/${id}`, data);
    return response.data;
  },

  // Управление конфигурацией предприятий для конкретного района
  async getBusinessConfigsForDistrict(districtId: number): Promise<any[]> {
    const response = await api.get(`/admin/districts/${districtId}/business-configs`);
    return response.data;
  },

  async updateBusinessConfigForDistrict(districtId: number, businessType: string, config: any): Promise<any> {
    const response = await api.put(`/admin/districts/${districtId}/business-configs/${businessType}`, config);
    return response.data;
  },

  // Последние игры для дашборда
  async getRecentGames(limit: number = 10): Promise<any[]> {
    const response = await api.get(`/admin/recent-games?limit=${limit}`);
    return response.data;
  },
};

