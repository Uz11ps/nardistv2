import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, ConfirmModal, NotificationModal } from '../components/ui';
import { BusinessUpgradeModal } from '../components/business';
import { districtService, businessService, clanService, userService } from '../services';
import { useAuthStore } from '../store/auth.store';
import './DistrictDetail.css';

export const DistrictDetail = () => {
  const { id } = useParams<{ id: string }>();
  const districtId = parseInt(id || '0');
  const { user } = useAuthStore();
  const [district, setDistrict] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [clan, setClan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeBusiness, setUpgradeBusiness] = useState<any | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [confirmCreate, setConfirmCreate] = useState<{ type: string; cost: number } | null>(null);
  const [confirmUpgrade, setConfirmUpgrade] = useState<{ business: any; cost: number } | null>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (districtId) {
      Promise.all([
        districtService.getById(districtId),
        businessService.getDistrictBusinesses(districtId),
        userService.getProfile(),
      ])
        .then(([districtData, businessesData, userData]) => {
          setDistrict(districtData);
          setBusinesses(businessesData);
          setUserBalance(userData.narCoin || 0);
          
          if (districtData.clanId) {
            clanService.getById(districtData.clanId)
              .then(setClan)
              .catch(console.error);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [districtId]);

  if (loading) {
    return <div className="district-detail">Загрузка...</div>;
  }

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

  const userBusinesses = businesses.filter((b) => b.userId === user?.id);
  
  const businessTypeNames: Record<string, string> = {
    COURT_TABLE: 'Дворовый стол',
    BOARD_WORKSHOP: 'Мастерская досок',
    DICE_FACTORY: 'Фабрика зариков',
    CUPS_WORKSHOP: 'Цех стаканов',
    CLUB: 'Клуб Нардиста',
    SCHOOL: 'Школа Нардиста',
    ARENA: 'Турнирная Арена',
  };

  const calculateIncome = (business: any) => {
    if (!business.lastCollected) return 0;
    const hours = (Date.now() - new Date(business.lastCollected).getTime()) / (1000 * 60 * 60);
    return Math.min(Math.floor(hours * business.incomePerHour), business.incomePerHour * 24);
  };

  return (
    <div className="district-detail">
      <div className="district-detail__header">
        <Link to="/city" className="district-detail__back">
          ← Назад к городу
        </Link>
        <div className="district-detail__title-section">
          <div className="district-detail__icon">{district.icon || '🏛️'}</div>
          <div>
            <h1 className="district-detail__title">{district.name}</h1>
            <p className="district-detail__description">{district.description || ''}</p>
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
              <span>💰 Казна: {(clan.treasury || 0).toLocaleString()} NAR</span>
              <span>👥 Участников: {clan.members?.length || 0}</span>
            </div>
          </div>
        </Card>
      )}

      <Card className="district-detail__info">
        <h3 className="district-detail__section-title">Информация о районе</h3>
        <div className="district-detail__info-grid">
          <div className="district-detail__info-item">
            <span className="district-detail__info-label">Комиссия с игр:</span>
            <span className="district-detail__info-value">{district.commissionRate || 5}%</span>
          </div>
          <div className="district-detail__info-item">
            <span className="district-detail__info-label">Всего предприятий:</span>
            <span className="district-detail__info-value">{businesses.length}</span>
          </div>
          <div className="district-detail__info-item">
            <span className="district-detail__info-label">Ваших предприятий:</span>
            <span className="district-detail__info-value">{userBusinesses.length}</span>
          </div>
        </div>
      </Card>

      <div className="district-detail__businesses">
        <h3 className="district-detail__section-title">Предприятия в районе</h3>
        {businesses.length > 0 ? (
          <div className="district-detail__businesses-list">
            {businesses.map((business) => {
              const isOwner = business.userId === user?.id;
              const income = isOwner ? calculateIncome(business) : 0;
              return (
                <Card key={business.id} className="district-detail__business">
                  <div className="district-detail__business-header">
                    <div className="district-detail__business-info">
                      <h4 className="district-detail__business-name">
                        {businessTypeNames[business.type] || 'Предприятие'}
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
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={async () => {
                            try {
                              const result = await businessService.collectIncome(business.id);
                              setNotification({
                                title: 'Успех',
                                message: `Собрано ${result.income} NAR`,
                                type: 'success',
                              });
                              const [districtData, businessesData, userData] = await Promise.all([
                                districtService.getById(districtId),
                                businessService.getDistrictBusinesses(districtId),
                                userService.getProfile(),
                              ]);
                              setDistrict(districtData);
                              setBusinesses(businessesData);
                              setUserBalance(userData.narCoin || 0);
                            } catch (error: any) {
                              setNotification({
                                title: 'Ошибка',
                                message: error.response?.data?.message || 'Ошибка при сборе дохода',
                                type: 'error',
                              });
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
                        onClick={() => {
                          // Расчет стоимости улучшения по формуле backend: baseCost * level * 2
                          const businessCreationCosts: Record<string, number> = {
                            COURT_TABLE: 50,
                            BOARD_WORKSHOP: 200,
                            DICE_FACTORY: 300,
                            CUPS_WORKSHOP: 250,
                            CLUB: 500,
                            SCHOOL: 400,
                            ARENA: 1000,
                          };
                          const baseCost = businessCreationCosts[business.type] || 100;
                          const upgradeCost = baseCost * business.level * 2;
                          setConfirmUpgrade({ business, cost: upgradeCost });
                        }}
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

      <Card className="district-detail__create-business">
        <h3 className="district-detail__section-title">Создать предприятие</h3>
        <p className="district-detail__create-hint">
          Начните свой бизнес в этом районе и получайте пассивный доход
        </p>
        
        <div className="district-detail__business-types">
          {[
            { type: 'COURT_TABLE', name: 'Дворовый стол', cost: 50, icon: '🏠' },
            { type: 'BOARD_WORKSHOP', name: 'Мастерская досок', cost: 200, icon: '🔨' },
            { type: 'DICE_FACTORY', name: 'Фабрика зариков', cost: 300, icon: '🎲' },
            { type: 'CUPS_WORKSHOP', name: 'Цех стаканов', cost: 250, icon: '🥤' },
            { type: 'CLUB', name: 'Клуб Нардиста', cost: 500, icon: '🎪' },
            { type: 'SCHOOL', name: 'Школа Нардиста', cost: 400, icon: '🏫' },
            { type: 'ARENA', name: 'Турнирная Арена', cost: 1000, icon: '🏟️' },
          ].map((businessType) => {
            const canAfford = userBalance >= businessType.cost;
            const alreadyExists = userBusinesses.some((b) => b.type === businessType.type);
            return (
              <Card
                key={businessType.type}
                className={`district-detail__business-type ${
                  !canAfford ? 'district-detail__business-type--disabled' : ''
                } ${alreadyExists ? 'district-detail__business-type--exists' : ''}`}
              >
                <div className="district-detail__business-type-icon">
                  {businessType.icon}
                </div>
                <div className="district-detail__business-type-info">
                  <div className="district-detail__business-type-name">
                    {businessType.name}
                    {alreadyExists && <span className="district-detail__business-type-badge">✓ Уже создано</span>}
                  </div>
                  <div className="district-detail__business-type-cost">
                    💰 {businessType.cost.toLocaleString()} NAR
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!canAfford || alreadyExists}
                  onClick={() => {
                    setConfirmCreate({ type: businessType.type, cost: businessType.cost });
                  }}
                >
                  {alreadyExists ? 'Уже создано' : 'Создать'}
                </Button>
              </Card>
            );
          })}
        </div>
      </Card>

      {upgradeBusiness && (
        <BusinessUpgradeModal
          isOpen={!!upgradeBusiness}
          onClose={() => setUpgradeBusiness(null)}
          business={upgradeBusiness}
          onUpgrade={async (businessId) => {
            try {
              await businessService.upgrade(businessId);
              setUpgradeBusiness(null);
              setNotification({
                title: 'Успех',
                message: 'Предприятие успешно улучшено!',
                type: 'success',
              });
              const [districtData, businessesData, userData] = await Promise.all([
                districtService.getById(districtId),
                businessService.getDistrictBusinesses(districtId),
                userService.getProfile(),
              ]);
              setDistrict(districtData);
              setBusinesses(businessesData);
              setUserBalance(userData.narCoin || 0);
            } catch (error: any) {
              setNotification({
                title: 'Ошибка',
                message: error.response?.data?.message || 'Ошибка при улучшении',
                type: 'error',
              });
              console.error('Error upgrading business:', error);
            }
          }}
        />
      )}

      {confirmCreate && (
        <ConfirmModal
          isOpen={!!confirmCreate}
          onClose={() => setConfirmCreate(null)}
          onConfirm={async () => {
            if (!confirmCreate) return;
            try {
              await businessService.create({ districtId, type: confirmCreate.type });
              setConfirmCreate(null);
              setNotification({
                title: 'Успех',
                message: 'Предприятие успешно создано!',
                type: 'success',
              });
              const [districtData, businessesData, userData] = await Promise.all([
                districtService.getById(districtId),
                businessService.getDistrictBusinesses(districtId),
                userService.getProfile(),
              ]);
              setDistrict(districtData);
              setBusinesses(businessesData);
              setUserBalance(userData.narCoin || 0);
            } catch (error: any) {
              setNotification({
                title: 'Ошибка',
                message: error.response?.data?.message || 'Ошибка при создании предприятия',
                type: 'error',
              });
              console.error('Error creating business:', error);
            }
          }}
          title="Создание предприятия"
          message={`Вы уверены, что хотите создать предприятие "${businessTypeNames[confirmCreate.type] || confirmCreate.type}"?`}
          confirmText="Создать"
          cancelText="Отмена"
          cost={confirmCreate.cost}
          balance={userBalance}
        />
      )}

      {confirmUpgrade && (
        <ConfirmModal
          isOpen={!!confirmUpgrade}
          onClose={() => setConfirmUpgrade(null)}
          onConfirm={async () => {
            if (!confirmUpgrade) return;
            try {
              await businessService.upgrade(confirmUpgrade.business.id);
              setConfirmUpgrade(null);
              setNotification({
                title: 'Успех',
                message: 'Предприятие успешно улучшено!',
                type: 'success',
              });
              const [districtData, businessesData, userData] = await Promise.all([
                districtService.getById(districtId),
                businessService.getDistrictBusinesses(districtId),
                userService.getProfile(),
              ]);
              setDistrict(districtData);
              setBusinesses(businessesData);
              setUserBalance(userData.narCoin || 0);
            } catch (error: any) {
              setNotification({
                title: 'Ошибка',
                message: error.response?.data?.message || 'Ошибка при улучшении',
                type: 'error',
              });
              console.error('Error upgrading business:', error);
            }
          }}
          title="Улучшение предприятия"
          message={`Вы уверены, что хотите улучшить предприятие до уровня ${confirmUpgrade.business.level + 1}?`}
          confirmText="Улучшить"
          cancelText="Отмена"
          cost={confirmUpgrade.cost}
          balance={userBalance}
        />
      )}

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
