import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { districtService, businessService } from '../services';
import { useAuthStore } from '../store/auth.store';
import './City.css';

const buildingNames: Record<string, string> = {
  CLUB: 'Клуб',
  WORKSHOP: 'Мастерская',
  FACTORY: 'Фабрика',
  SCHOOL: 'Школа',
};

const buildingIcons: Record<string, string> = {
  CLUB: '🎪',
  WORKSHOP: '🔨',
  FACTORY: '🏭',
  SCHOOL: '🏫',
};

export const City = () => {
  const [districts, setDistricts] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    Promise.all([
      districtService.getAll(),
      businessService.getMyBusinesses(),
    ])
      .then(([dists, bus]) => {
        setDistricts(dists);
        setBusinesses(bus);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const calculateIncome = (business: any) => {
    if (!business.lastCollected) return 0;
    const hours = (Date.now() - new Date(business.lastCollected).getTime()) / (1000 * 60 * 60);
    return Math.min(Math.floor(hours * business.incomePerHour), business.incomePerHour * 24);
  };

  const totalIncome = businesses.reduce((sum, b) => sum + calculateIncome(b), 0);

  if (loading) {
    return <div className="city-page">Загрузка...</div>;
  }

  return (
    <div className="city-page">
      <div className="city-page__header">
        <h1 className="city-page__title">🏙️ Город Нард</h1>
        {totalIncome > 0 && (
          <div className="city-page__total-income">
            💰 Доступно к сбору: {totalIncome} NAR
          </div>
        )}
      </div>

      <div className="city-districts">
        <h2 className="city-section__title">Районы города</h2>
        <div className="city-districts__grid">
          {districts.map((district) => {
            const userDistrictBusinesses = businesses.filter((b) => b.districtId === district.id);
            return (
              <Link key={district.id} to={`/city/district/${district.id}`}>
                <Card className="city-district">
                  <div className="city-district__icon">{district.icon}</div>
                  <div className="city-district__info">
                    <h3 className="city-district__name">{district.name}</h3>
                    <p className="city-district__description">{district.description}</p>
                    {district.clanId && (
                      <div className="city-district__clan">
                        👑 Контролируется кланом
                      </div>
                    )}
                    {userDistrictBusinesses.length > 0 && (
                      <div className="city-district__businesses">
                        🏢 Ваших предприятий: {userDistrictBusinesses.length}
                      </div>
                    )}
                  </div>
                  <div className="city-district__arrow">→</div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="city-buildings">
        <h2 className="city-section__title">Ваши предприятия</h2>
        {businesses.length > 0 ? (
          <div className="city-buildings__list">
            {businesses.map((business) => {
              const district = districts.find((d) => d.id === business.districtId);
              const income = calculateIncome(business);
              return (
                <Card key={business.id} className="city-building">
                  <div className="city-building__icon">
                    {district?.icon || '🏢'}
                  </div>
                  <div className="city-building__info">
                    <h3 className="city-building__name">
                      {district?.name || 'Предприятие'}
                    </h3>
                    <div className="city-building__level">Уровень {business.level}</div>
                    <div className="city-building__income">
                      💰 {business.incomePerHour} NAR/час
                    </div>
                    {income > 0 && (
                      <div className="city-building__available">
                        Доступно: {income} NAR
                      </div>
                    )}
                  </div>
                  <div className="city-building__actions">
                    {income > 0 && (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={async () => {
                          try {
                            await businessService.collectIncome(business.id);
                            const updated = await businessService.getMyBusinesses();
                            setBusinesses(updated);
                          } catch (error) {
                            console.error('Error collecting income:', error);
                          }
                        }}
                      >
                        Собрать
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          await businessService.upgrade(business.id);
                          const updated = await businessService.getMyBusinesses();
                          setBusinesses(updated);
                        } catch (error) {
                          console.error('Error upgrading:', error);
                        }
                      }}
                    >
                      Улучшить
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="city-buildings__empty">
            <p>У вас пока нет предприятий</p>
            <p className="city-buildings__empty-hint">
              Откройте район, чтобы начать бизнес
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

