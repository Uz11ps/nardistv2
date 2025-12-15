// Утилита для определения режима работы с мок-данными
export const isMockMode = (): boolean => {
  // Проверяем, есть ли токен мок-режима
  const token = localStorage.getItem('token');
  return token === 'mock_token_for_local_dev';
};

// Мок-данные для работы без бекенда
export const mockData = {
  user: {
    id: 1,
    telegramId: '123456789',
    firstName: 'Тестовый',
    lastName: 'Пользователь',
    username: 'testuser',
    nickname: 'TestUser',
    country: 'RU',
    avatar: '',
    photoUrl: '',
    level: 15,
    xp: 3250,
    narCoin: 1250,
    energy: 85,
    energyMax: 100,
    lives: 3,
    livesMax: 3,
    power: 45,
    powerMax: 50,
    referralCode: 'TEST2024',
    isPremium: false,
    statsEconomy: 3,
    statsEnergy: 2,
    statsLives: 1,
    statsPower: 2,
  },
};

