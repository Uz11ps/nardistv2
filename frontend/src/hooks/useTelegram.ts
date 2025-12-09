import { useEffect, useState } from 'react';
import { initDataRaw, WebApp } from '@twa-dev/sdk';

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [initData, setInitData] = useState<string | null>(null);

  useEffect(() => {
    // Инициализация Telegram Web App SDK
    if (typeof window !== 'undefined') {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        setWebApp(tg);
        setInitData(initDataRaw || '');
      }
    }
  }, []);

  return {
    webApp,
    initData,
    user: webApp?.initDataUnsafe?.user,
  };
};

