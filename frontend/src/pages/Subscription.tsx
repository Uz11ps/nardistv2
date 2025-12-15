import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Icon } from '../components/ui';
import { subscriptionService } from '../services';
import './Subscription.css';

const plans = [
  {
    id: 'MONTHLY',
    name: 'Месячная',
    price: '299',
    duration: '30 дней',
    features: ['Полная история игр', 'Автоанализ партий', 'Тренажер позиций', 'Премиум-значок'],
  },
  {
    id: 'QUARTERLY',
    name: 'Квартальная',
    price: '799',
    duration: '90 дней',
    features: ['Все из месячной', 'Приоритет в матчмейкинге', 'Эксклюзивные квесты'],
    popular: true,
  },
  {
    id: 'YEARLY',
    name: 'Годовая',
    price: '2499',
    duration: '365 дней',
    features: ['Все из квартальной', 'Максимальная скидка', 'VIP поддержка'],
  },
];

export const Subscription = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionService.get()
      .then(setSubscription)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="subscription-page">Загрузка...</div>;
  }

  const hasActiveSubscription = subscription !== null && subscription.isActive;

  return (
    <div className="subscription-page">
      <Link to="/" className="subscription-page__back">←</Link>
      <h1 className="subscription-page__title">
        <Icon name="star" size={28} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Подписка
      </h1>
      {hasActiveSubscription ? (
        <Card className="subscription-active">
          <h2>У вас активная подписка!</h2>
          <p>Действует до: {new Date(subscription.endDate).toLocaleDateString('ru-RU')}</p>
        </Card>
      ) : (
        <>
          <p className="subscription-page__description">
            Получите доступ к расширенным функциям и улучшите свой игровой опыт
          </p>
          <div className="subscription-plans">
            {plans.map((plan) => (
              <Card key={plan.id} className={`subscription-plan ${plan.popular ? 'subscription-plan--popular' : ''}`}>
                {plan.popular && <div className="subscription-plan__badge">Популярно</div>}
                <h3 className="subscription-plan__name">{plan.name}</h3>
                <div className="subscription-plan__price">
                  <span className="subscription-plan__amount">{plan.price}</span>
                  <span className="subscription-plan__currency">₽</span>
                </div>
                <div className="subscription-plan__duration">{plan.duration}</div>
                <ul className="subscription-plan__features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  fullWidth
                  onClick={async () => {
                    try {
                      await subscriptionService.create(plan.id as 'MONTHLY' | 'QUARTERLY' | 'YEARLY');
                      alert('Подписка успешно оформлена!');
                      window.location.reload();
                    } catch (error: any) {
                      alert(error.response?.data?.message || 'Ошибка при оформлении подписки');
                    }
                  }}
                >
                  Оформить
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

