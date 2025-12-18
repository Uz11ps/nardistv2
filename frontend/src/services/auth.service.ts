import axios from 'axios';
import { getTelegramInitData } from '../utils/telegram';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async authenticate() {
    const initData = getTelegramInitData();
    const response = await api.post('/auth/telegram', { initData });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
