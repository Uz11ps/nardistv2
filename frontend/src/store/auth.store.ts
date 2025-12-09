import { create } from 'zustand';
import { authService, AuthResponse } from '../services/auth.service';

interface AuthState {
  user: AuthResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (initData: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthResponse['user']) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: authService.getToken(),
  isAuthenticated: !!authService.getToken(),
  
  login: async (initData: string) => {
    try {
      const response = await authService.authenticate(initData);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  },
  
  logout: () => {
    authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
  
  setUser: (user: AuthResponse['user']) => {
    set({ user });
  },
}));

