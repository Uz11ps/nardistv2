import { create } from 'zustand';
import { mockUser } from '../mock';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (initData: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: mockUser,
  token: 'mock_token',
  isAuthenticated: true,
  
  login: async (initData: string) => {
    // Для локальной разработки используем мок-данные
    set({
      user: mockUser,
      token: 'mock_token',
      isAuthenticated: true,
    });
  },
  
  logout: () => {
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

