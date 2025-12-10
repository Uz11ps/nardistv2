import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import { useAuthStore } from './store/auth.store';
import { wsService } from './services/websocket.service';
import { Layout } from './components/Layout';
import { AdminLayout } from './admin/components/AdminLayout';
import { Home } from './pages/Home';
import { Game } from './pages/Game';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import { Tournaments } from './pages/Tournaments';
import { Quests } from './pages/Quests';
import { City } from './pages/City';
import { Subscription } from './pages/Subscription';
import { Academy } from './pages/Academy';
import { Skins } from './pages/Skins';
import { AdminDashboard } from './admin/pages/AdminDashboard';
import { AdminGames } from './admin/pages/AdminGames';
import { AdminTournaments } from './admin/pages/AdminTournaments';
import { AdminUsers } from './admin/pages/AdminUsers';
import { AdminSettings } from './admin/pages/AdminSettings';
import './App.css';
import './styles/global.css';

function App() {
  const { initData, webApp } = useTelegram();
  const { login, isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    // Для локальной разработки используем мок данные
    if (initData && !isAuthenticated) {
      if (initData.includes('mock_init_data')) {
        // Мок авторизация для локальной разработки
        useAuthStore.setState({
          user: {
            id: 1,
            telegramId: '123456789',
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser',
            nickname: 'TestUser',
            level: 5,
            xp: 1250,
            narCoin: 500,
          },
          token: 'mock_token',
          isAuthenticated: true,
        });
      } else {
        login(initData).catch(console.error);
      }
    }
  }, [initData, isAuthenticated, login]);

  useEffect(() => {
    if (token && isAuthenticated) {
      wsService.connect(token);
    }

    return () => {
      wsService.disconnect();
    };
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (webApp) {
      webApp.setHeaderColor('#1976d2');
      webApp.setBackgroundColor('#ffffff');
    }
  }, [webApp]);

  if (!isAuthenticated) {
    return <div className="app">Загрузка...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="games" element={<AdminGames />} />
          <Route path="tournaments" element={<AdminTournaments />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="game" element={<Game />} />
          <Route path="profile" element={<Profile />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="quests" element={<Quests />} />
          <Route path="city" element={<City />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="academy" element={<Academy />} />
          <Route path="skins" element={<Skins />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

