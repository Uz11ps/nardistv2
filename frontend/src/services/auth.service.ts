import { api } from './api';

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    telegramId: string;
    firstName: string;
    lastName?: string;
    username?: string;
    nickname?: string;
    level: number;
    xp: number;
    narCoin: number;
  };
}

export const authService = {
  async authenticate(initData: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/telegram', {
      initData,
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },
};

