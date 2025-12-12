import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { subscriptionService, gameHistoryService } from '../services';
import { NotificationModal } from '../components/ui';
import { useAuthStore } from '../store/auth.store';
import './Analytics.css';

export const Analytics = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameStats, setGameStats] = useState<any>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    Promise.all([
      subscriptionService.get(),
      gameHistoryService.getMyHistory(100),
    ])
      .then(([subData, historyData]) => {
        setSubscription(subData);
        
        if (subData && subData.isActive && new Date(subData.endDate) > new Date() && user) {
          // Вычисляем статистику
          const wins = historyData.filter((g: any) => g.winnerId === user.id).length;
          const losses = historyData.filter((g: any) => 
            g.winnerId && g.winnerId !== user.id && (g.whitePlayerId === user.id || g.blackPlayerId === user.id)
          ).length;
          
          const stats = {
            totalGames: historyData.length,
            wins,
            losses,
            winRate: historyData.length > 0 
              ? ((wins / historyData.length) * 100).toFixed(1)
              : 0,
            averageDuration: historyData.length > 0
              ? Math.round(historyData.reduce((sum: number, g: any) => sum + (g.duration || 0), 0) / historyData.length)
              : 0,
          };
          setGameStats(stats);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="analytics-page">Загрузка...</div>;
  }

  const hasActiveSubscription = subscription && subscription.isActive && new Date(subscription.endDate) > new Date();

  if (!hasActiveSubscription) {
    return (
      <div className="analytics-page">
        <Card className="analytics-locked">
          <h2>🔒 Премиум-функция</h2>
          <p>Аналитика доступна только для пользователей с активной подпиской</p>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/subscription')}
          >
            Оформить подписку
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <Link to="/" className="analytics-page__back">←</Link>
      <h1 className="analytics-page__title">📊 Аналитика</h1>
      
      {gameStats && (
        <div className="analytics-stats">
          <Card className="analytics-stat-card">
            <div className="analytics-stat-label">Всего игр</div>
            <div className="analytics-stat-value">{gameStats.totalGames}</div>
          </Card>
          <Card className="analytics-stat-card">
            <div className="analytics-stat-label">Побед</div>
            <div className="analytics-stat-value" style={{ color: '#4caf50' }}>{gameStats.wins}</div>
          </Card>
          <Card className="analytics-stat-card">
            <div className="analytics-stat-label">Поражений</div>
            <div className="analytics-stat-value" style={{ color: '#f44336' }}>{gameStats.losses}</div>
          </Card>
          <Card className="analytics-stat-card">
            <div className="analytics-stat-label">Винрейт</div>
            <div className="analytics-stat-value">{gameStats.winRate}%</div>
          </Card>
          <Card className="analytics-stat-card">
            <div className="analytics-stat-label">Средняя длительность</div>
            <div className="analytics-stat-value">{gameStats.averageDuration} сек</div>
          </Card>
        </div>
      )}

      <Card className="analytics-info">
        <h3>Расширенная аналитика</h3>
        <p>Детальный анализ ваших партий, статистика по режимам игры и рекомендации по улучшению игры будут доступны в следующих обновлениях.</p>
      </Card>

      {notification && (
        <NotificationModal
          isOpen={!!notification}
          onClose={() => setNotification(null)}
          title={notification.title}
          message={notification.message}
          type={notification.type}
        />
      )}
    </div>
  );
};

