import { Link } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { mockDistricts, mockBusinesses, mockCityBuildings, mockUser } from '../mock';
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
  const calculateIncome = (building: typeof mockCityBuildings[0]) => {
    if (!building.lastCollected) return 0;
    const hours = (Date.now() - new Date(building.lastCollected).getTime()) / (1000 * 60 * 60);
    return Math.min(Math.floor(hours * building.incomePerHour), building.incomePerHour * 24);
  };

  const userBusinesses = mockBusinesses.filter((b) => b.userId === mockUser.id);
  const totalIncome = userBusinesses.reduce((sum, b) => {
    const hours = b.lastCollected
      ? (Date.now() - new Date(b.lastCollected).getTime()) / (1000 * 60 * 60)
      : 0;
    return sum + Math.min(Math.floor(hours * b.incomePerHour), b.incomePerHour * 24);
  }, 0);

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
          {mockDistricts.map((district) => {
            const districtBusinesses = mockBusinesses.filter((b) => b.districtId === district.id);
            const userDistrictBusinesses = districtBusinesses.filter((b) => b.userId === mockUser.id);
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
        {userBusinesses.length > 0 ? (
          <div className="city-buildings__list">
            {userBusinesses.map((business) => {
              const district = mockDistricts.find((d) => d.id === business.districtId);
              const income = business.lastCollected
                ? Math.min(
                    Math.floor(
                      ((Date.now() - new Date(business.lastCollected).getTime()) / (1000 * 60 * 60)) *
                        business.incomePerHour,
                    ),
                    business.incomePerHour * 24,
                  )
                : 0;
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
                      <Button variant="primary" size="sm">
                        Собрать
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
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

