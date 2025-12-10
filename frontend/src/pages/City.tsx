import { Card, Button } from '../components/ui';
import { mockCityBuildings } from '../mock';
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

  return (
    <div className="city-page">
      <h1 className="city-page__title">🏙️ Город</h1>
      <div className="city-buildings">
        {mockCityBuildings.map((building) => {
          const income = calculateIncome(building);
          return (
            <Card key={building.id} className="city-building">
              <div className="city-building__icon">{buildingIcons[building.buildingType] || '🏢'}</div>
              <div className="city-building__info">
                <h3 className="city-building__name">{buildingNames[building.buildingType] || building.buildingType}</h3>
                <div className="city-building__level">Уровень {building.level}</div>
                <div className="city-building__income">
                  💰 {building.incomePerHour} NAR/час
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
    </div>
  );
};

