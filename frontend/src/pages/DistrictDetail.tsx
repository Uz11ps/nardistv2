import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { BusinessUpgradeModal } from '../components/business';
import { mockDistricts, mockBusinesses, mockClans, mockUser } from '../mock';
import './DistrictDetail.css';

export const DistrictDetail = () => {
  const { id } = useParams<{ id: string }>();
  const districtId = parseInt(id || '0');
  const district = mockDistricts.find((d) => d.id === districtId);
  const districtBusinesses = mockBusinesses.filter((b) => b.districtId === districtId);
  const userBusinesses = districtBusinesses.filter((b) => b.userId === mockUser.id);
  const clan = district?.clanId ? mockClans.find((c) => c.id === district.clanId) : null;
  const [upgradeBusiness, setUpgradeBusiness] = useState<typeof mockBusinesses[0] | null>(null);

  if (!district) {
    return (
      <div className="district-detail">
        <Card>
          <p>Район не найден</p>
          <Link to="/city">
            <Button variant="outline">Вернуться в город</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="district-detail">
      <div className="district-detail__header">
        <Link to="/city" className="district-detail__back">
          ← Назад к городу
        </Link>
        <div className="district-detail__title-section">
          <div className="district-detail__icon">{district.icon}</div>
          <div>
            <h1 className="district-detail__title">{district.name}</h1>
            <p className="district-detail__description">{district.description}</p>
          </div>
        </div>
      </div>

      {clan && (
        <Card className="district-detail__clan-info">
          <h3 className="district-detail__section-title">Контролирующий клан</h3>
          <div className="district-detail__clan-details">
            <div className="district-detail__clan-name">👑 {clan.name}</div>
            {clan.description && <p className="district-detail__clan-description">{clan.description}</p>}
            <div className="district-detail__clan-stats">
              <span>💰 Казна: {clan.treasury.toLocaleString()} NAR</span>
              <span>👥 Участников: {clan.members.length}</span>
            </div>
          </div>
        </Card>
      )}

      <Card className="district-detail__info">
        <h3 className="district-detail__section-title">Информация о районе</h3>
        <div className="district-detail__info-grid">
          <div className="district-detail__info-item">
            <span className="district-detail__info-label">Комиссия с игр:</span>
            <span className="district-detail__info-value">{district.commissionRate}%</span>
          </div>
          <div className="district-detail__info-item">
            <span className="district-detail__info-label">Всего предприятий:</span>
            <span className="district-detail__info-value">{districtBusinesses.length}</span>
          </div>
          <div className="district-detail__info-item">
            <span className="district-detail__info-label">Ваших предприятий:</span>
            <span className="district-detail__info-value">{userBusinesses.length}</span>
          </div>
        </div>
      </Card>

      <div className="district-detail__businesses">
        <h3 className="district-detail__section-title">Предприятия в районе</h3>
        {districtBusinesses.length > 0 ? (
          <div className="district-detail__businesses-list">
            {districtBusinesses.map((business) => {
              const isOwner = business.userId === mockUser.id;
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
                <Card key={business.id} className="district-detail__business">
                  <div className="district-detail__business-header">
                    <div className="district-detail__business-info">
                      <h4 className="district-detail__business-name">
                        {business.type === 'COURT_TABLE'
                          ? 'Дворовый стол'
                          : business.type === 'BOARD_WORKSHOP'
                          ? 'Мастерская досок'
                          : business.type === 'DICE_FACTORY'
                          ? 'Фабрика зариков'
                          : business.type === 'CUPS_WORKSHOP'
                          ? 'Цех стаканов'
                          : business.type === 'CLUB'
                          ? 'Клуб Нардиста'
                          : business.type === 'SCHOOL'
                          ? 'Школа Нардиста'
                          : business.type === 'ARENA'
                          ? 'Турнирная Арена'
                          : 'Предприятие'}
                        {isOwner && <span className="district-detail__business-owner">Ваше</span>}
                      </h4>
                      <div className="district-detail__business-level">Уровень {business.level}</div>
                    </div>
                    <div className="district-detail__business-income">
                      💰 {business.incomePerHour} NAR/час
                    </div>
                  </div>
                  {isOwner && income > 0 && (
                    <div className="district-detail__business-available">
                      Доступно к сбору: {income} NAR
                    </div>
                  )}
                  {isOwner && (
                    <div className="district-detail__business-actions">
                      {income > 0 && (
                        <Button variant="primary" size="sm">
                          Собрать
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUpgradeBusiness(business)}
                      >
                        Улучшить
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="district-detail__businesses-empty">
            <p>В этом районе пока нет предприятий</p>
          </Card>
        )}
      </div>

      {userBusinesses.length === 0 && (
        <Card className="district-detail__create-business">
          <h3 className="district-detail__section-title">Создать предприятие</h3>
          <p className="district-detail__create-hint">
            Начните свой бизнес в этом районе и получайте пассивный доход
          </p>
          <Button variant="primary" fullWidth>
            🏢 Создать предприятие
          </Button>
        </Card>
      )}

      {upgradeBusiness && (
        <BusinessUpgradeModal
          isOpen={!!upgradeBusiness}
          onClose={() => setUpgradeBusiness(null)}
          business={upgradeBusiness}
          onUpgrade={(businessId) => {
            console.log('Upgrading business:', businessId);
            setUpgradeBusiness(null);
          }}
        />
      )}
    </div>
  );
};

