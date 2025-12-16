import { api } from './api';

export interface Quest {
  id: number;
  title: string;
  description: string;
  type: string;
  target: number;
  rewardCoin: number;
  rewardXp: number;
  rewardSkin?: number;
  isActive: boolean;
  progress?: {
    progress: number;
    completed: boolean;
    completedAt?: string;
  };
}

export const questsService = {
  async getActive(): Promise<Quest[]> {
    const response = await api.get<Quest[]>('/quests');
    // Гарантируем что возвращается массив
    return Array.isArray(response.data) ? response.data : [];
  },

  async updateProgress(questId: number, progress: number): Promise<Quest> {
    const response = await api.post<Quest>('/quests/progress', { questId, progress });
    return response.data;
  },
};

