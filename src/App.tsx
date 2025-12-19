import { useEffect, useState } from 'react';
import { init } from '@twa-dev/sdk';
import { apiClient } from './services/api';
import Lobby from './components/Lobby';
import Board from './components/Board';
import './App.css';

interface User {
  id: number;
  telegram_id: number;
  username: string;
  balance: number;
  rating: number;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
    authenticate();
  }, []);

  const authenticate = async () => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg?.initData) {
        console.error('Telegram WebApp not available');
        setLoading(false);
        return;
      }

      const response = await apiClient.post('/auth/login', {}, {
        headers: {
          'X-Telegram-Init-Data': tg.initData,
        },
      });

      setUser(response.data.user);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!user) {
    return <div className="error">Ошибка авторизации</div>;
  }

  if (currentGame) {
    return <Board game={currentGame} onExit={() => setCurrentGame(null)} currentUserId={user.id} />;
  }

  return <Lobby user={user} onGameStart={setCurrentGame} />;
}

export default App;

