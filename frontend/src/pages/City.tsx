import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Icon } from '../components/ui';
import { districtService, businessService, onboardingService } from '../services';
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
      districtService.getAll().catch(() => []),
      businessService.getMyBusinesses().catch(() => []),
    ])
      .then(([dists, bus]) => {
        // Гарантируем что это массивы
        setDistricts(Array.isArray(dists) ? dists : []);
        setBusinesses(Array.isArray(bus) ? bus : []);
      })
      .catch((error) => {
        console.warn('Failed to load city data:', error);
        // Устанавливаем пустые массивы при ошибке
        setDistricts([]);
        setBusinesses([]);
      })
      .finally(() => setLoading(false));

    // Отмечаем просмотр города для онбординга
    onboardingService.markCityViewed().catch(err => {
      console.warn('Failed to mark city viewed:', err);
    });
  }, []);


  if (loading) {
    return <div className="city-page">Загрузка...</div>;
  }

  return (
    <div className="city-page">
      <div className="city-page__header">
        <h1 className="city-page__title">
          <Icon name="city" size={28} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Город Нард
        </h1>
      </div>

      <div className="city-districts">
        <h2 className="city-section__title">Районы города</h2>
        <div className="city-districts__grid">
          {Array.isArray(districts) ? districts.map((district) => {
            const userDistrictBusinesses = Array.isArray(businesses) ? businesses.filter((b) => b.districtId === district.id) : [];
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
          }) : (
            <div className="city-districts__empty">Нет доступных районов</div>
          )}
        </div>
      </div>

    </div>
  );
};

