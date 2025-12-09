import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import { useAuthStore } from './store/auth.store';
import { wsService } from './services/websocket.service';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Game } from './pages/Game';
import { Profile } from './pages/Profile';
import './App.css';

function App() {
  const { initData, webApp } = useTelegram();
  const { login, isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (initData && !isAuthenticated) {
      login(initData).catch(console.error);
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
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

