import { create } from 'zustand';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (initData: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  testLogin: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null, // Не загружаем токен сразу, проверим его валидность
  isAuthenticated: false, // Начинаем с false, чтобы всегда проверять авторизацию
  
  login: async (initData: string) => {
    try {
      const response = await api.post('/auth/telegram', { initData });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({
        user,
        token,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Login error:', error);
      // Fallback to test login
      await get().testLogin();
    }
  },

  testLogin: async () => {
    try {
      console.log('Attempting test login...');
      // Используем axios напрямую без токена для тестового входа
      const axios = (await import('axios')).default;
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const url = `${API_URL}/auth/test-login`;
      console.log('POST request to:', url);
      
      let response;
      try {
        response = await axios.post(url, {}, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 секунд таймаут (увеличил для медленных соединений)
        });
        console.log('Axios request successful, status:', response.status);
      } catch (error: any) {
        console.error('Axios error details:');
        console.error('- Error message:', error.message);
        console.error('- Error code:', error.code);
        console.error('- Error response status:', error.response?.status);
        console.error('- Error response data:', error.response?.data);
        console.error('- Error request URL:', error.config?.url);
        console.error('- Full error:', error);
        throw error;
      }
      
      console.log('Test login response received:', response.status, response.data);
      const { token, user } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', token);
      set({
        user: {
          ...user,
          nickname: user.nickname || user.firstName,
          level: user.level || 1,
          xp: user.xp || 0,
          narCoin: user.narCoin || 100,
          energy: user.energy || 100,
          energyMax: user.energyMax || 100,
          lives: user.lives || 3,
          livesMax: user.livesMax || 3,
          power: user.power || 10,
          powerMax: user.powerMax || 10,
        } as User,
        token,
        isAuthenticated: true,
      });
      
      console.log('Test login successful');
    } catch (error: any) {
      console.error('Test login error:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error; // Пробрасываем ошибку дальше
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
  
  setUser: (user: User) => {
    set({ user });
  },
}));

