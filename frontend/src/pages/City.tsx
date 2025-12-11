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


  if (loading) {
    return <div className="city-page">Загрузка...</div>;
  }

  return (
    <div className="city-page">
      <div className="city-page__header">
        <h1 className="city-page__title">🏙️ Город Нард</h1>
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

    </div>
  );
};

