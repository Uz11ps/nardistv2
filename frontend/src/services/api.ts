import axios from 'axios';

// В production используем текущий домен, в development - localhost
const getApiUrl = () => {
  // Приоритет 1: переменная окружения
  if (import.meta.env.VITE_API_URL) {
    console.log('[API] Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Приоритет 2: определение по hostname (динамически)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Только для конкретных production доменов
    const isProduction = hostname === 'nardist.online' || 
                        hostname === 'www.nardist.online' || 
                        hostname.endsWith('.nardist.online');
    
    if (isProduction) {
      const url = window.location.origin;
      console.log('[API] Production detected, using:', url);
      return url;
    }
    
    console.log('[API] Development mode, hostname:', hostname);
  }
  
  // Приоритет 3: localhost для development
  const devUrl = 'http://localhost:3000';
  console.log('[API] Using development URL:', devUrl);
  return devUrl;
};

// Вычисляем URL динамически
const API_URL = getApiUrl();

// Экспортируем функцию для получения URL (на случай если нужно переопределить)
export const getApiBaseUrl = () => {
  // Пересчитываем каждый раз для надежности
  return getApiUrl();
};

// Создаем axios instance с динамическим baseURL
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 секунд таймаут
});

// Объединенный interceptor для запросов
api.interceptors.request.use((config) => {
  // Обновляем baseURL на случай если он изменился
  const currentUrl = getApiBaseUrl();
  if (config.baseURL !== currentUrl) {
    config.baseURL = currentUrl;
  }
  
  // Добавляем токен если есть
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Для тестового входа не добавляем токен
const testLoginApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

