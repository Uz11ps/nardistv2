import { useEffect, useState } from 'react';

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<any | null>(null);
  const [initData, setInitData] = useState<string | null>(null);

  useEffect(() => {
    // Инициализация Telegram Web App SDK
    if (typeof window !== 'undefined') {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        setWebApp(tg);
        // Для локальной разработки используем мок данные
        setInitData(tg.initData || 'mock_init_data_for_local_dev');
      } else {
        // Мок для локальной разработки
        setInitData('mock_init_data_for_local_dev');
      }
    }
  }, []);

  return {
    webApp,
    initData,
    user: webApp?.initDataUnsafe?.user || {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
    },
  };
};

