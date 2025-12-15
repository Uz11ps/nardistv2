import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Icon, Spinner, NotificationModal } from '../components/ui';
import { subscriptionService, trainerService } from '../services';
import './Trainer.css';

export const Trainer = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trainingStats, setTrainingStats] = useState<any>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      subscriptionService.get(),
      trainerService.getTrainingStats().catch(() => null), // Игнорируем ошибки если API недоступен
    ])
      .then(([subData, stats]) => {
        setSubscription(subData);
        setTrainingStats(stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="trainer-page">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasActiveSubscription = subscription && subscription.isActive && new Date(subscription.endDate) > new Date();

  if (!hasActiveSubscription) {
    return (
      <div className="trainer-page">
        <Card className="trainer-locked">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="shield" size={20} />
            Премиум-функция
          </h2>
          <p>Тренажер позиций доступен только для пользователей с активной подпиской</p>
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
    <div className="trainer-page">
      <Link to="/" className="trainer-page__back">←</Link>
      <h1 className="trainer-page__title">
        <Icon name="trainer" size={28} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Тренажер позиций
      </h1>
      
      <Card className="trainer-info">
        <h3>Тренировка позиций</h3>
        <p>Тренажер позиций поможет вам улучшить навыки игры в нарды, изучая различные позиции и правильные ходы.</p>
      </Card>

      {trainingStats && (
        <Card className="trainer-stats">
          <h3>Ваша статистика тренировок</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <div style={{ color: '#999', fontSize: '0.9rem' }}>Позиций пройдено</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {trainingStats.completedPositions} / {trainingStats.totalPositions}
              </div>
            </div>
            <div>
              <div style={{ color: '#999', fontSize: '0.9rem' }}>Точность</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4caf50' }}>
                {trainingStats.accuracy.toFixed(1)}%
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="trainer-features">
        <h3>Доступные функции:</h3>
        <ul>
          <li>✓ Тренировка позиций для коротких нард</li>
          <li>✓ Тренировка позиций для длинных нард</li>
          <li>✓ Анализ правильных ходов</li>
          <li>✓ Статистика тренировок</li>
          <li>✓ Валидация ваших ходов</li>
        </ul>
        <Button
          variant="primary"
          fullWidth
          style={{ marginTop: '1rem' }}
          onClick={() => {
            // TODO: Реализовать открытие списка позиций
            setNotification({ title: 'Информация', message: 'Выбор позиций для тренировки будет доступен в следующем обновлении', type: 'info' });
          }}
        >
          Начать тренировку
        </Button>
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

