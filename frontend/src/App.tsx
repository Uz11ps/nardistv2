import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initTelegramWebApp } from './utils/telegram';
import { useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import Game from './pages/Game';
import Profile from './pages/Profile';
import Tournaments from './pages/Tournaments';

function App() {
  const [isReady, setIsReady] = useState(false);
  const { loading } = useAuth();

  useEffect(() => {
    initTelegramWebApp();
    setIsReady(true);
  }, []);

  if (!isReady || loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
