import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 секунд таймаут
});

// Для тестового входа не добавляем токен
const testLoginApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавление токена к запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem('token');
    const isMockMode = token === 'mock_token_for_local_dev';
    
    // В мок-режиме не логируем ошибки подключения как критичные
    if (!isMockMode) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        timeout: error.code === 'ECONNABORTED',
      });
    }
    
    // В мок-режиме не перезагружаем страницу при 401
    if (error.response?.status === 401 && !isMockMode) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    
    // Не перезагружаем страницу при таймауте, просто показываем ошибку
    if (error.code === 'ECONNABORTED' && !isMockMode) {
      console.error('Request timeout - backend may be slow or not responding');
    }
    
    return Promise.reject(error);
  },
);

