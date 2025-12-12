import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { subscriptionService } from '../services';
import './Trainer.css';

export const Trainer = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    subscriptionService.get()
      .then(setSubscription)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="trainer-page">Загрузка...</div>;
  }

  const hasActiveSubscription = subscription && subscription.isActive && new Date(subscription.endDate) > new Date();

  if (!hasActiveSubscription) {
    return (
      <div className="trainer-page">
        <Card className="trainer-locked">
          <h2>🔒 Премиум-функция</h2>
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
      <h1 className="trainer-page__title">🎯 Тренажер позиций</h1>
      
      <Card className="trainer-info">
        <h3>Тренировка позиций</h3>
        <p>Тренажер позиций поможет вам улучшить навыки игры в нарды, изучая различные позиции и правильные ходы.</p>
        <p style={{ marginTop: '1rem', color: '#999' }}>
          Функционал тренажера будет доступен в следующих обновлениях.
        </p>
      </Card>

      <Card className="trainer-features">
        <h3>Планируемые функции:</h3>
        <ul>
          <li>✓ Тренировка позиций для коротких нард</li>
          <li>✓ Тренировка позиций для длинных нард</li>
          <li>✓ Анализ правильных ходов</li>
          <li>✓ Статистика тренировок</li>
          <li>✓ Рейтинг по тренировкам</li>
        </ul>
      </Card>
    </div>
  );
};

