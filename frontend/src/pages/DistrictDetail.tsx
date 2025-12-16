import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, ConfirmModal, NotificationModal, Modal, Input } from '../components/ui';
import { BusinessUpgradeModal } from '../components/business';
import { districtService, businessService, clanService, userService, resourceService, siegeService } from '../services';
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
  const [userResources, setUserResources] = useState<any[]>([]);
  const [craftModal, setCraftModal] = useState<{ business: any; recipes: any[] } | null>(null);
  const [collectAmount, setCollectAmount] = useState<{ business: any; amount: number } | null>(null);
  const [userClan, setUserClan] = useState<any>(null);
  const [activeSiege, setActiveSiege] = useState<any>(null);
  const [createJobModal, setCreateJobModal] = useState<{ business: any } | null>(null);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    salaryPerHour: '',
    energyPerHour: '10',
    maxWorkers: '1',
  });

  useEffect(() => {
    if (districtId) {
      Promise.all([
        districtService.getById(districtId),
        businessService.getDistrictBusinesses(districtId),
        userService.getProfile(),
        resourceService.getMyResources(),
        clanService.getMyClan().catch(() => null),
        siegeService.getActiveSieges().catch(() => []),
      ])
        .then(([districtData, businessesData, userData, resourcesData, userClanData, activeSieges]) => {
          setDistrict(districtData);
          setBusinesses(Array.isArray(businessesData) ? businessesData : []);
          setUserBalance(userData.narCoin || 0);
          setUserResources(Array.isArray(resourcesData) ? resourcesData : []);
          setUserClan(userClanData);
          
          const safeActiveSieges = Array.isArray(activeSieges) ? activeSieges : [];
          const siege = safeActiveSieges.find((s: any) => s.districtId === districtId);
          setActiveSiege(siege || null);
          
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

  const userBusinesses = Array.isArray(businesses) ? businesses.filter((b) => b.userId === user?.id) : [];
  
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

  const calculateProduced = (business: any) => {
    if (!business.productionPerHour || !business.lastProduced) return 0;
    const hours = (Date.now() - new Date(business.lastProduced).getTime()) / (1000 * 60 * 60);
    const produced = Math.floor(hours * business.productionPerHour);
    const availableSpace = (business.storageLimit || 0) - business.storageCurrent;
    return Math.min(produced, availableSpace);
  };

  const getResourceName = (type: string) => {
    const names: Record<string, string> = {
      WOOD: 'Древесина',
      STONE: 'Камень',
      MARBLE: 'Мрамор',
      BONE: 'Кость',
      PLASTIC: 'Пластик',
      METAL: 'Металл',
      LEATHER: 'Кожа',
      FABRIC: 'Ткань',
    };
    return names[type] || type;
  };

  const getResourceIcon = (type: string) => {
    const icons: Record<string, string> = {
      WOOD: '🪵',
      STONE: '🪨',
      MARBLE: '🗿',
      BONE: '🦴',
      PLASTIC: '🧱',
      METAL: '⚙️',
      LEATHER: '🧶',
      FABRIC: '🧵',
    };
    return icons[type] || '📦';
  };

  return (
    <div className="district-detail">
      <Link to="/city" className="district-detail__back">←</Link>
      <div className="district-detail__header">
        <div className="district-detail__title-section">
          <div className="district-detail__icon">{district.icon || '🏛️'}</div>
          <div>
            <h1 className="district-detail__title">{district.name}</h1>
            <p className="district-detail__description">{district.description || ''}</p>
          </div>
        </div>
      </div>

      {activeSiege && (
        <Card className="district-detail__siege-info" style={{ backgroundColor: '#2a1a1a', border: '2px solid #f44336' }}>
          <h3 className="district-detail__section-title">⚔️ Активная осада</h3>
          <div className="district-detail__siege-details">
            <div style={{ marginBottom: '1rem' }}>
              <div><strong>Атакующий клан:</strong> {activeSiege.attackingClan?.name || 'Неизвестно'}</div>
              {activeSiege.defendingClan && (
                <div><strong>Защищающий клан:</strong> {activeSiege.defendingClan.name}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#999' }}>Победы атакующих</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4caf50' }}>
                  {activeSiege.attackingWins} / {activeSiege.requiredWins}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#999' }}>Победы защищающих</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff9800' }}>
                  {activeSiege.defendingWins || 0} / {activeSiege.requiredWins}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#999' }}>
              Играйте в этом районе, чтобы помочь своему клану! Первый клан, набравший {activeSiege.requiredWins} побед, получит контроль над районом.
            </p>
          </div>
        </Card>
      )}

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

      {userClan && userClan.leaderId === user?.id && (!clan || clan.id !== userClan.id) && !activeSiege && (
        <Card className="district-detail__siege-action">
          <h3 className="district-detail__section-title">⚔️ Захват района</h3>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#999' }}>
            Начните осаду этого района. Ваш клан должен выиграть 5 матчей в этом районе, чтобы получить контроль.
          </p>
          <Button
            variant="danger"
            fullWidth
            onClick={async () => {
              try {
                await siegeService.createSiege(districtId);
                setNotification({
                  title: 'Успех',
                  message: 'Осада начата! Играйте в этом районе, чтобы помочь своему клану.',
                  type: 'success',
                });
                const activeSieges = await siegeService.getActiveSieges();
                const safeActiveSieges = Array.isArray(activeSieges) ? activeSieges : [];
                const siege = safeActiveSieges.find((s: any) => s.districtId === districtId);
                setActiveSiege(siege || null);
              } catch (error: any) {
                setNotification({
                  title: 'Ошибка',
                  message: error.response?.data?.message || 'Ошибка при создании осады',
                  type: 'error',
                });
              }
            }}
          >
            Начать осаду
          </Button>
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
        {Array.isArray(businesses) && businesses.length > 0 ? (
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
                  {isOwner && business.productionPerHour && (
                    <div className="district-detail__business-production">
                      <div className="district-detail__business-production-info">
                        <div className="district-detail__production-stats">
                          <span>⚙️ Производство: {business.productionPerHour} {getResourceName(business.type === 'BOARD_WORKSHOP' ? 'WOOD' : business.type === 'DICE_FACTORY' ? 'BONE' : 'METAL')}/час</span>
                          {business.storageCurrent !== undefined && (
                            <span>📦 На складе: {business.storageCurrent}</span>
                          )}
                          {business.storageLimit && (
                            <span> / {business.storageLimit}</span>
                          )}
                        </div>
                      </div>
                      {business.storageCurrent > 0 && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setCollectAmount({ business, amount: business.storageCurrent });
                          }}
                        >
                          Собрать ресурсы ({business.storageCurrent})
                        </Button>
                      )}
                    </div>
                  )}
                  {isOwner && business.productionPerHour && calculateProduced(business) > 0 && (
                    <div className="district-detail__business-production">
                      <div className="district-detail__business-production-info">
                        Произведено: {calculateProduced(business)} {getResourceName(business.type === 'BOARD_WORKSHOP' ? 'WOOD' : business.type === 'DICE_FACTORY' ? 'BONE' : 'METAL')}
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          try {
                            await businessService.produceResources(business.id);
                            const businessesData = await businessService.getDistrictBusinesses(districtId);
                            setBusinesses(businessesData);
                          } catch (error: any) {
                            setNotification({
                              title: 'Ошибка',
                              message: error.response?.data?.message || 'Ошибка при производстве',
                              type: 'error',
                            });
                          }
                        }}
                      >
                        Произвести
                      </Button>
                    </div>
                  )}
                  {isOwner && (business.type === 'BOARD_WORKSHOP' || business.type === 'DICE_FACTORY' || business.type === 'CUPS_WORKSHOP') && (
                    <div className="district-detail__business-craft">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const recipes = await businessService.getCraftRecipes(business.id);
                            setCraftModal({ business, recipes });
                          } catch (error: any) {
                            setNotification({
                              title: 'Ошибка',
                              message: error.response?.data?.message || 'Ошибка при загрузке рецептов',
                              type: 'error',
                            });
                          }
                        }}
                      >
                        🛠️ Крафт скинов
                      </Button>
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
            const alreadyExists = Array.isArray(userBusinesses) ? userBusinesses.some((b) => b.type === businessType.type) : false;
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

      {collectAmount && (
        <Modal
          isOpen={!!collectAmount}
          onClose={() => setCollectAmount(null)}
          title="Собрать ресурсы"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p>Сколько ресурсов собрать? (максимум: {collectAmount.business.storageCurrent})</p>
            <Input
              type="number"
              min={1}
              max={collectAmount.business.storageCurrent}
              defaultValue={collectAmount.business.storageCurrent}
              onChange={(e) => setCollectAmount({ ...collectAmount, amount: parseInt(e.target.value) || 0 })}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setCollectAmount(null)}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={async () => {
                  if (!collectAmount) return;
                  try {
                    await businessService.collectResources(collectAmount.business.id, collectAmount.amount);
                    setNotification({
                      title: 'Успех',
                      message: `Собрано ${collectAmount.amount} ресурсов`,
                      type: 'success',
                    });
                    const [businessesData, resourcesData] = await Promise.all([
                      businessService.getDistrictBusinesses(districtId),
                      resourceService.getMyResources(),
                    ]);
                    setBusinesses(businessesData);
                    setUserResources(resourcesData);
                    setCollectAmount(null);
                  } catch (error: any) {
                    setNotification({
                      title: 'Ошибка',
                      message: error.response?.data?.message || 'Ошибка при сборе ресурсов',
                      type: 'error',
                    });
                  }
                }}
              >
                Собрать
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {craftModal && (
        <Modal
          isOpen={!!craftModal}
          onClose={() => setCraftModal(null)}
          title={`Крафт скинов - ${businessTypeNames[craftModal.business.type]}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {craftModal.recipes.length === 0 ? (
              <p>Нет доступных рецептов для этого предприятия</p>
            ) : (
              Array.isArray(craftModal.recipes) ? craftModal.recipes.map((recipe: any) => {
                if (!recipe.recipe) return null;
                const safeUserResources = Array.isArray(userResources) ? userResources : [];
                const hasResources = Object.entries(recipe.recipe).every(([type, amount]: [string, any]) => {
                  const resource = safeUserResources.find((r) => r.type === type);
                  return resource && resource.amount >= amount;
                });
                return (
                  <Card key={recipe.skin.id} style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4>{recipe.skin.name}</h4>
                        <p style={{ fontSize: '0.9rem', color: '#999' }}>Тип: {recipe.skin.type}</p>
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {Object.entries(recipe.recipe).map(([type, amount]: [string, any]) => {
                            const safeUserResources = Array.isArray(userResources) ? userResources : [];
                            const resource = safeUserResources.find((r) => r.type === type);
                            const hasEnough = resource && resource.amount >= amount;
                            return (
                              <span
                                key={type}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  backgroundColor: hasEnough ? '#4caf50' : '#f44336',
                                  color: 'white',
                                  fontSize: '0.85rem',
                                }}
                              >
                                {getResourceIcon(type)} {getResourceName(type)}: {amount} / {resource?.amount || 0}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        disabled={!hasResources}
                        onClick={async () => {
                          try {
                            await businessService.craftSkin(craftModal.business.id, recipe.skin.id);
                            setNotification({
                              title: 'Успех',
                              message: `Скин "${recipe.skin.name}" успешно создан!`,
                              type: 'success',
                            });
                            const [businessesData, resourcesData] = await Promise.all([
                              businessService.getDistrictBusinesses(districtId),
                              resourceService.getMyResources(),
                            ]);
                            setBusinesses(Array.isArray(businessesData) ? businessesData : []);
                            setUserResources(Array.isArray(resourcesData) ? resourcesData : []);
                            setCraftModal(null);
                          } catch (error: any) {
                            setNotification({
                              title: 'Ошибка',
                              message: error.response?.data?.message || 'Ошибка при крафте',
                              type: 'error',
                            });
                          }
                        }}
                      >
                        Создать
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </Modal>
      )}

      {createJobModal && (
        <Modal
          isOpen={!!createJobModal}
          onClose={() => {
            setCreateJobModal(null);
            setJobFormData({
              title: '',
              description: '',
              salaryPerHour: '',
              energyPerHour: '10',
              maxWorkers: '1',
            });
          }}
          title="Создать вакансию"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Название вакансии"
              value={jobFormData.title}
              onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
              required
            />
            <Input
              label="Описание"
              value={jobFormData.description}
              onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
              type="textarea"
            />
            <Input
              label="Зарплата в NAR/час"
              type="number"
              value={jobFormData.salaryPerHour}
              onChange={(e) => setJobFormData({ ...jobFormData, salaryPerHour: e.target.value })}
              required
            />
            <Input
              label="Энергия за час работы"
              type="number"
              value={jobFormData.energyPerHour}
              onChange={(e) => setJobFormData({ ...jobFormData, energyPerHour: e.target.value })}
            />
            <Input
              label="Максимум работников"
              type="number"
              value={jobFormData.maxWorkers}
              onChange={(e) => setJobFormData({ ...jobFormData, maxWorkers: e.target.value })}
            />
            <Button
              variant="primary"
              fullWidth
              onClick={async () => {
                try {
                  await businessService.createJobPosting(createJobModal.business.id, {
                    title: jobFormData.title,
                    description: jobFormData.description || undefined,
                    salaryPerHour: parseInt(jobFormData.salaryPerHour),
                    energyPerHour: parseInt(jobFormData.energyPerHour) || 10,
                    maxWorkers: parseInt(jobFormData.maxWorkers) || 1,
                  });
                  setNotification({
                    title: 'Успех',
                    message: 'Вакансия успешно создана!',
                    type: 'success',
                  });
                  setCreateJobModal(null);
                  setJobFormData({
                    title: '',
                    description: '',
                    salaryPerHour: '',
                    energyPerHour: '10',
                    maxWorkers: '1',
                  });
                } catch (error: any) {
                  setNotification({
                    title: 'Ошибка',
                    message: error.response?.data?.message || 'Ошибка при создании вакансии',
                    type: 'error',
                  });
                }
              }}
            >
              Создать
            </Button>
          </div>
        </Modal>
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
