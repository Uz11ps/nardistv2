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
  const { login, isAuthenticated, token, testLogin, mockLogin } = useAuthStore();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loginAttemptedRef = useRef(false);

  useEffect(() => {
    let quickTimeout: NodeJS.Timeout;
    let isMounted = true;
    
    console.log('App useEffect triggered', { isAuthenticated, hasToken: !!token, loginAttempted: loginAttemptedRef.current });
    
    // Если уже авторизован, просто выходим
    if (isAuthenticated && token) {
      setIsLoading(false);
      return;
    }
    
    // Проверяем наличие мок-токена
    const storedToken = localStorage.getItem('token');
    if (storedToken === 'mock_token_for_local_dev' && !isAuthenticated) {
      console.log('Found mock token, using mock data');
      mockLogin();
      setIsLoading(false);
      return;
    }
    
    // Защита от множественных вызовов
    if (loginAttemptedRef.current) {
      console.log('Login already attempted');
      // Если уже пытались, но не авторизованы - используем мок-данные
      if (!isAuthenticated) {
        console.log('Using mock data as fallback');
        mockLogin();
        setIsLoading(false);
      }
      return;
    }
    
    loginAttemptedRef.current = true;
    setIsLoading(true);
    setAuthError(null);
    
    // Проверяем, что мы на localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const useMockOnly = import.meta.env.VITE_USE_MOCK_ONLY === 'true';
    
    if (isLocalhost || !initData || initData.includes('mock_init_data')) {
      // Если включен режим только мок-данных, используем их сразу
      if (useMockOnly) {
        console.log('🎭 Using mock data only (VITE_USE_MOCK_ONLY=true)');
        mockLogin();
        setIsLoading(false);
        return;
      }
      
      // Для локальной разработки сначала используем мок-данные для мгновенного старта
      // Затем в фоне пытаемся подключиться к бекенду
      console.log('🎭 Using mock data for instant start...');
      mockLogin();
      setIsLoading(false);
      
      // В фоне пытаемся подключиться к бекенду (неблокирующе)
      const { testLogin } = useAuthStore.getState();
      testLogin()
        .then(() => {
          console.log('✅ Backend connection successful - switching to real data');
          // Обновляем данные с бекенда, но не показываем загрузку
          setIsLoading(false);
        })
        .catch((error: any) => {
          console.log('ℹ️ Backend not available, continuing with mock data:', error.message || 'Connection failed');
          // Продолжаем работать с мок-данными
        });
    } else {
      // Реальная авторизация через Telegram
      login(initData)
        .then(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        })
        .catch((error) => {
          console.error('Telegram login failed:', error);
          // Fallback to test login, затем к мок-данным
          const { testLogin } = useAuthStore.getState();
          testLogin()
            .then(() => {
              if (isMounted) {
                setIsLoading(false);
              }
            })
            .catch((err) => {
              console.warn('⚠️ Backend not available, using mock data');
              if (isMounted) {
                mockLogin();
                setIsLoading(false);
              }
            });
        });
    }

    return () => {
      isMounted = false;
      if (quickTimeout) clearTimeout(quickTimeout);
    };
  }, [initData, isAuthenticated, login, mockLogin, token]);

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

  // Показываем загрузку только если действительно загружаемся и не авторизованы
  if (!isAuthenticated && isLoading) {
    return (
      <div className="app" style={{ padding: '20px', textAlign: 'center' }}>
        <div>Подключение к серверу...</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Если бекенд недоступен, будет использован режим разработки
        </div>
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

