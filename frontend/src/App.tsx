import { useEffect, useState, useRef } from 'react';
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
import { DistrictDetail } from './pages/DistrictDetail';
import { Subscription } from './pages/Subscription';
import { Academy } from './pages/Academy';
import { Skins } from './pages/Skins';
import { Market } from './pages/Market';
import { Clans } from './pages/Clans';
import { ClanDetail } from './pages/ClanDetail';
import { AdminDashboard } from './admin/pages/AdminDashboard';
import { AdminGames } from './admin/pages/AdminGames';
import { AdminTournaments } from './admin/pages/AdminTournaments';
import { AdminQuests } from './admin/pages/AdminQuests';
import { AdminCity } from './admin/pages/AdminCity';
import { AdminUsers } from './admin/pages/AdminUsers';
import { AdminSettings } from './admin/pages/AdminSettings';
import './App.css';
import './styles/global.css';

function App() {
  const { initData, webApp } = useTelegram();
  const { login, isAuthenticated, token, testLogin } = useAuthStore();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loginAttemptedRef = useRef(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;
    
    console.log('App useEffect triggered', { isAuthenticated, hasToken: !!token, loginAttempted: loginAttemptedRef.current });
    
    // Защита от множественных вызовов
    if (loginAttemptedRef.current) {
      console.log('Login already attempted, skipping...');
      return;
    }
    
    // Для локальной разработки всегда используем тестовый вход
    if (!isAuthenticated || !token) {
      loginAttemptedRef.current = true;
      setIsLoading(true);
      setAuthError(null);
      
      // Таймаут на 10 секунд
      timeoutId = setTimeout(() => {
        if (isMounted) {
          const currentAuth = useAuthStore.getState().isAuthenticated;
          if (!currentAuth) {
            setAuthError('Превышено время ожидания. Проверьте, что backend запущен на http://localhost:3000');
            setIsLoading(false);
          }
        }
      }, 10000);
      
      // Проверяем, что мы на localhost
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalhost || !initData || initData.includes('mock_init_data')) {
        // Тестовый вход для локальной разработки
        console.log('Using test login for localhost');
        const { testLogin } = useAuthStore.getState();
        testLogin()
          .then(() => {
            console.log('Test login promise resolved');
            if (isMounted) {
              setIsLoading(false);
              clearTimeout(timeoutId);
            }
          })
          .catch((error) => {
            console.error('Test login failed:', error);
            if (isMounted) {
              setAuthError(`Ошибка авторизации: ${error.message || 'Не удалось подключиться к серверу'}. Проверьте, что backend запущен на http://localhost:3000`);
              setIsLoading(false);
              clearTimeout(timeoutId);
            }
          });
      } else {
        // Реальная авторизация через Telegram
        login(initData)
          .then(() => {
            if (isMounted) {
              setIsLoading(false);
              clearTimeout(timeoutId);
            }
          })
          .catch((error) => {
            console.error('Telegram login failed:', error);
            // Fallback to test login
            const { testLogin } = useAuthStore.getState();
            testLogin()
              .then(() => {
                if (isMounted) {
                  setIsLoading(false);
                  clearTimeout(timeoutId);
                }
              })
              .catch((err) => {
                if (isMounted) {
                  setAuthError(`Ошибка авторизации: ${err.message || 'Не удалось подключиться к серверу'}`);
                  setIsLoading(false);
                  clearTimeout(timeoutId);
                }
              });
          });
      }
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initData, isAuthenticated, login]);

  useEffect(() => {
    // Подключаем WebSocket только после успешной авторизации
    if (token && isAuthenticated) {
      console.log('Connecting WebSocket with token');
      try {
        wsService.connect(token);
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    }

    return () => {
      if (token && isAuthenticated) {
        wsService.disconnect();
      }
    };
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (webApp) {
      webApp.setHeaderColor('#1976d2');
      webApp.setBackgroundColor('#ffffff');
    }
  }, [webApp]);

  if (!isAuthenticated) {
    return (
      <div className="app" style={{ padding: '20px', textAlign: 'center' }}>
        {isLoading ? (
          <div>Загрузка...</div>
        ) : authError ? (
          <div>
            <div style={{ color: 'red', marginBottom: '20px' }}>{authError}</div>
            <button onClick={() => window.location.reload()}>Повторить</button>
          </div>
        ) : (
          <div>Загрузка...</div>
        )}
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="games" element={<AdminGames />} />
          <Route path="tournaments" element={<AdminTournaments />} />
          <Route path="quests" element={<AdminQuests />} />
          <Route path="city" element={<AdminCity />} />
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
          <Route path="city/district/:id" element={<DistrictDetail />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="academy" element={<Academy />} />
          <Route path="skins" element={<Skins />} />
          <Route path="market" element={<Market />} />
          <Route path="clans" element={<Clans />} />
          <Route path="clans/:id" element={<ClanDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

