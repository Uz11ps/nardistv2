import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Tabs, ConfirmModal, NotificationModal, Modal, Input, Skeleton, Icon, type IconName } from '../components/ui';
import { RepairModal } from '../components/inventory';
import { userService, gameHistoryService, inventoryService, resourceService, businessService, referralsService } from '../services';
import { useAuthStore } from '../store/auth.store';
import type { InventoryItem } from '../types';
import { placeholders } from '../utils/placeholders';
import './Profile.css';

export const Profile = () => {
  const { user: authUser } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Используем данные из authStore как fallback
    if (authUser) {
      setUser(authUser);
    }
    
    userService.getProfile()
      .then(setUser)
      .catch((error) => {
        console.warn('Failed to load profile, using cached:', error);
        // Используем данные из authStore при ошибке
        if (authUser) {
          setUser(authUser);
        }
      })
      .finally(() => setLoading(false));
  }, [authUser]);

  if (loading || !user) {
    return (
      <div className="profile-page">
        <Skeleton width="100%" height={200} style={{ marginBottom: '16px', borderRadius: '8px' }} />
        <Skeleton width="100%" height={400} style={{ borderRadius: '8px' }} />
      </div>
    );
  }

  const refreshProfile = () => {
    userService.getProfile()
      .then(setUser)
      .catch(console.error);
  };

  const tabs = [
    {
      id: 'info',
      label: 'Информация',
      content: <ProfileInfo user={user} onUpdate={refreshProfile} />,
    },
    {
      id: 'stats',
      label: 'Статистика',
      content: <ProfileStats user={user} />,
    },
    {
      id: 'inventory',
      label: 'Инвентарь',
      content: <ProfileInventory />,
    },
    {
      id: 'history',
      label: 'История',
      content: <ProfileHistory />,
    },
  ];

  const xpPercent = user.xp ? Math.min((user.xp % 1000) / 10, 100) : 0;

  return (
    <div className="profile-page">
      <Link to="/" className="profile-page__back">←</Link>
      <div className="profile-page__header">
        <div className="profile-page__avatar">
          <img src={user.avatar || user.photoUrl || placeholders.avatar} alt="Avatar" />
        </div>
        <div className="profile-page__info">
          <h1 className="profile-page__name">{user.nickname || user.firstName}</h1>
          <p className="profile-page__level">Уровень {user.level}</p>
          <div className="profile-page__xp">
            <div className="profile-page__xp-bar">
              <div className="profile-page__xp-fill" style={{ width: `${xpPercent}%` }} />
            </div>
            <span>{user.xp} XP</span>
          </div>
        </div>
      </div>
      <Tabs tabs={tabs} />
    </div>
  );
};

const ProfileInfo = ({ user, onUpdate }: { user: any; onUpdate: () => void }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    nickname: user.nickname || '',
    country: user.country || '',
    avatar: user.avatar || '',
  });
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [referralLink, setReferralLink] = useState<{ telegram: string; web: string; code: string } | null>(null);
  const [referralStats, setReferralStats] = useState<{ totalReferrals: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Загружаем реферальную ссылку и статистику
    referralsService.getStats()
      .then((stats) => {
        setReferralStats({ totalReferrals: stats.totalReferrals });
        if (stats.referralLink) {
          setReferralLink(stats.referralLink);
        } else if (stats.referralCode) {
          // Если ссылка не пришла, получаем её отдельно
          referralsService.getLink()
            .then(setReferralLink)
            .catch(console.error);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    try {
      await userService.updateProfile(editData);
      setNotification({
        title: 'Успех',
        message: 'Профиль успешно обновлен',
        type: 'success',
      });
      setIsEditModalOpen(false);
      onUpdate();
    } catch (error: any) {
      setNotification({
        title: 'Ошибка',
        message: error.response?.data?.message || 'Ошибка при обновлении профиля',
        type: 'error',
      });
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="profile-info">
      <Card>
        <div className="profile-info__item">
          <span className="profile-info__label">Имя:</span>
          <span className="profile-info__value">{user.firstName} {user.lastName || ''}</span>
        </div>
        <div className="profile-info__item">
          <span className="profile-info__label">Никнейм:</span>
          <span className="profile-info__value">{user.nickname || 'Не установлен'}</span>
        </div>
        <div className="profile-info__item">
          <span className="profile-info__label">Страна:</span>
          <span className="profile-info__value">{user.country || 'Не указана'}</span>
        </div>
        <div className="profile-info__item">
          <span className="profile-info__label">Реферальный код:</span>
          <span className="profile-info__value">{user.referralCode || 'N/A'}</span>
        </div>
        {referralStats && (
          <div className="profile-info__item">
            <span className="profile-info__label">Приглашено друзей:</span>
            <span className="profile-info__value">{referralStats.totalReferrals}</span>
          </div>
        )}
        {referralLink && (
          <div className="profile-info__item profile-info__item--referral">
            <span className="profile-info__label">Реферальная ссылка:</span>
            <div className="profile-info__referral-link">
              <Input
                value={referralLink.telegram}
                readOnly
                className="profile-info__referral-input"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(referralLink.telegram);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch (err) {
                    console.error('Failed to copy:', err);
                  }
                }}
              >
                {copied ? <Icon name="check" size={16} /> : <Icon name="copy" size={16} />}
              </Button>
            </div>
            <div className="profile-info__referral-hint">
              Поделитесь этой ссылкой с друзьями и получайте награды за каждого приглашенного!
            </div>
          </div>
        )}
        <Button variant="outline" fullWidth onClick={() => setIsEditModalOpen(true)}>
          Редактировать профиль
        </Button>
      </Card>
      <div className="profile-info__links">
        <Link to="/city">
          <Button variant="ghost" fullWidth icon="city">Город</Button>
        </Link>
        <Link to="/quests">
          <Button variant="ghost" fullWidth icon="book">Квесты</Button>
        </Link>
        <Link to="/subscription">
          <Button variant="ghost" fullWidth icon="star">Подписка</Button>
        </Link>
        <Link to="/skins">
          <Button variant="ghost" fullWidth icon="skins">Скины</Button>
        </Link>
      </div>

      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Редактировать профиль"
          size="md"
        >
          <div className="profile-edit-form">
            <Input
              label="Никнейм"
              value={editData.nickname}
              onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
              placeholder="Введите никнейм"
              maxLength={30}
            />
            <Input
              label="Страна"
              value={editData.country}
              onChange={(e) => setEditData({ ...editData, country: e.target.value })}
              placeholder="Введите страну"
            />
            <Input
              label="URL аватара"
              value={editData.avatar}
              onChange={(e) => setEditData({ ...editData, avatar: e.target.value })}
              placeholder="https://..."
              type="url"
            />
            <div className="profile-edit-form__actions">
              <Button variant="outline" fullWidth onClick={() => setIsEditModalOpen(false)}>
                Отмена
              </Button>
              <Button variant="primary" fullWidth onClick={handleSave}>
                Сохранить
              </Button>
            </div>
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

const DevelopmentBranch = ({ 
  label, 
  currentLevel, 
  maxLevel, 
  onUpgrade, 
  upgradeCost, 
  userBalance 
}: { 
  label: string | React.ReactNode; 
  currentLevel: number; 
  maxLevel: number; 
  onUpgrade: () => void; 
  upgradeCost: number;
  userBalance: number;
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const canUpgrade = currentLevel < maxLevel && userBalance >= upgradeCost;

  return (
    <>
      <div className="profile-stats__dev-branch">
        <span className="profile-stats__dev-label">{label}:</span>
        <div className="profile-stats__dev-level">
          {Array.from({ length: maxLevel }).map((_, i) => (
            <span
              key={i}
              className={`profile-stats__dev-point ${i < currentLevel ? 'profile-stats__dev-point--active' : ''}`}
            />
          ))}
        </div>
        <span className="profile-stats__dev-value">{currentLevel}/{maxLevel}</span>
        {canUpgrade && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirm(true)}
          >
            Улучшить ({upgradeCost.toLocaleString()} NAR)
          </Button>
        )}
      </div>

      {showConfirm && (
        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={async () => {
            setShowConfirm(false);
            await onUpgrade();
          }}
          title="Улучшение ветки развития"
          message={`Улучшить ветку "${label}" до уровня ${currentLevel + 1}?`}
          confirmText="Улучшить"
          cancelText="Отмена"
          cost={upgradeCost}
          balance={userBalance}
        />
      )}
    </>
  );
};

const ProfileStats = ({ user }: { user: any }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [confirmRestoreEnergy, setConfirmRestoreEnergy] = useState<{ needed: number; cost: number } | null>(null);
  const [confirmRestoreLives, setConfirmRestoreLives] = useState<{ needed: number; cost: number } | null>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      userService.getStats(),
      import('../services').then(m => m.subscriptionService.get().catch(() => null)),
    ])
      .then(([statsData, subData]) => {
        setStats(statsData);
        setSubscription(subData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div>Загрузка статистики...</div>;
  }

  const shortRating = Array.isArray(stats.ratings) ? stats.ratings.find((r: any) => r.mode === 'SHORT') : undefined;
  const longRating = Array.isArray(stats.ratings) ? stats.ratings.find((r: any) => r.mode === 'LONG') : undefined;

  return (
    <div className="profile-stats">
      <Card>
        <h3>Короткие нарды</h3>
        <div className="profile-stats__rating">{shortRating?.rating || 1500}</div>
        <div className="profile-stats__record">
          Побед: {shortRating?.wins || 0} | Поражений: {shortRating?.losses || 0} | Ничьих: {shortRating?.draws || 0}
        </div>
        <div className="profile-stats__winrate">
          Винрейт: {shortRating ? Math.round((shortRating.wins / (shortRating.wins + shortRating.losses || 1)) * 100) : 0}%
        </div>
      </Card>
      <Card>
        <h3>Длинные нарды</h3>
        <div className="profile-stats__rating">{longRating?.rating || 1500}</div>
        <div className="profile-stats__record">
          Побед: {longRating?.wins || 0} | Поражений: {longRating?.losses || 0} | Ничьих: {longRating?.draws || 0}
        </div>
        <div className="profile-stats__winrate">
          Винрейт: {longRating ? Math.round((longRating.wins / (longRating.wins + longRating.losses || 1)) * 100) : 0}%
        </div>
      </Card>
      <Card>
        <h3>Общая статистика</h3>
        <div className="profile-stats__general">
          <div className="profile-stats__stat-item">
            <span className="profile-stats__stat-label">Всего игр:</span>
            <span className="profile-stats__stat-value">{stats.totalGames || 0}</span>
          </div>
          <div className="profile-stats__stat-item">
            <span className="profile-stats__stat-label">Выполнено квестов:</span>
            <span className="profile-stats__stat-value">{stats.completedQuests || 0}</span>
          </div>
        </div>
      </Card>
      <Card>
        <h3>Ресурсы</h3>
        <div className="profile-stats__resources">
          <div>
            <Icon name="coin" size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {user.narCoin} NAR-coin
          </div>
          <div className="profile-stats__resource-item">
            <span>
              <Icon name="energy" size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              {user.energy}/{user.energyMax} Энергия
            </span>
            {user.energy < user.energyMax && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const needed = user.energyMax - user.energy;
                  const cost = needed * 10;
                  setConfirmRestoreEnergy({ needed, cost });
                }}
              >
                Восстановить ({((user.energyMax - user.energy) * 10).toLocaleString()} NAR)
              </Button>
            )}
          </div>
          <div className="profile-stats__resource-item">
            <span>
              <Icon name="shield" size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              {user.lives}/{user.livesMax} Жизни
            </span>
            {user.lives < user.livesMax && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const needed = user.livesMax - user.lives;
                  const cost = needed * 50;
                  setConfirmRestoreLives({ needed, cost });
                }}
              >
                Восстановить ({((user.livesMax - user.lives) * 50).toLocaleString()} NAR)
              </Button>
            )}
          </div>
          <div>
            <Icon name="sword" size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {user.power}/{user.powerMax} Сила
          </div>
        </div>
      </Card>

      {/* Премиум функции */}
      {subscription && subscription.isActive && new Date(subscription.endDate) > new Date() ? (
        <Card style={{ marginTop: '1rem', backgroundColor: '#1a1a1a', border: '1px solid #ffd700' }}>
          <h3 style={{ color: '#ffd700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="star" size={20} color="#ffd700" />
            Премиум функции
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/analytics')}
              style={{ borderColor: '#ffd700', color: '#ffd700' }}
              icon="analytics"
            >
              Аналитика партий
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/trainer')}
              style={{ borderColor: '#ffd700', color: '#ffd700' }}
              icon="trainer"
            >
              Тренажер позиций
            </Button>
          </div>
        </Card>
      ) : (
        <Card style={{ marginTop: '1rem', backgroundColor: '#1a1a1a', border: '1px solid #666' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="shield" size={20} />
            Премиум функции
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#999', marginBottom: '1rem' }}>
            Получите доступ к расширенной аналитике и тренажеру позиций с подпиской
          </p>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/subscription')}
          >
            Оформить подписку
          </Button>
        </Card>
      )}

      <Card>
        <h3>Ветки развития</h3>
        <div className="profile-stats__development">
          <DevelopmentBranch
            label={
              <>
                <Icon name="coin" size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Экономика
              </>
            }
            currentLevel={user.statsEconomy || 0}
            maxLevel={10}
            onUpgrade={async () => {
              try {
                await userService.upgradeStat('ECONOMY');
                setNotification({
                  title: 'Успех',
                  message: 'Ветка "Экономика" улучшена!',
                  type: 'success',
                });
                window.location.reload();
              } catch (error: any) {
                setNotification({
                  title: 'Ошибка',
                  message: error.response?.data?.message || 'Ошибка при улучшении ветки',
                  type: 'error',
                });
              }
            }}
            upgradeCost={100 * ((user.statsEconomy || 0) + 1)}
            userBalance={user.narCoin}
          />
          <DevelopmentBranch
            label={
              <>
                <Icon name="energy" size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Энергия
              </>
            }
            currentLevel={user.statsEnergy || 0}
            maxLevel={10}
            onUpgrade={async () => {
              try {
                await userService.upgradeStat('ENERGY');
                setNotification({
                  title: 'Успех',
                  message: 'Ветка "Энергия" улучшена!',
                  type: 'success',
                });
                window.location.reload();
              } catch (error: any) {
                setNotification({
                  title: 'Ошибка',
                  message: error.response?.data?.message || 'Ошибка при улучшении ветки',
                  type: 'error',
                });
              }
            }}
            upgradeCost={100 * ((user.statsEnergy || 0) + 1)}
            userBalance={user.narCoin}
          />
          <DevelopmentBranch
            label={
              <>
                <Icon name="shield" size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Жизни
              </>
            }
            currentLevel={user.statsLives || 0}
            maxLevel={10}
            onUpgrade={async () => {
              try {
                await userService.upgradeStat('LIVES');
                setNotification({
                  title: 'Успех',
                  message: 'Ветка "Жизни" улучшена!',
                  type: 'success',
                });
                window.location.reload();
              } catch (error: any) {
                setNotification({
                  title: 'Ошибка',
                  message: error.response?.data?.message || 'Ошибка при улучшении ветки',
                  type: 'error',
                });
              }
            }}
            upgradeCost={100 * ((user.statsLives || 0) + 1)}
            userBalance={user.narCoin}
          />
          <DevelopmentBranch
            label={
              <>
                <Icon name="sword" size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Сила
              </>
            }
            currentLevel={user.statsPower || 0}
            maxLevel={10}
            onUpgrade={async () => {
              try {
                await userService.upgradeStat('POWER');
                setNotification({
                  title: 'Успех',
                  message: 'Ветка "Сила" улучшена!',
                  type: 'success',
                });
                window.location.reload();
              } catch (error: any) {
                setNotification({
                  title: 'Ошибка',
                  message: error.response?.data?.message || 'Ошибка при улучшении ветки',
                  type: 'error',
                });
              }
            }}
            upgradeCost={100 * ((user.statsPower || 0) + 1)}
            userBalance={user.narCoin}
          />
        </div>
      </Card>

      {confirmRestoreEnergy && (
        <ConfirmModal
          isOpen={!!confirmRestoreEnergy}
          onClose={() => setConfirmRestoreEnergy(null)}
          onConfirm={async () => {
            if (!confirmRestoreEnergy) return;
            try {
              const result = await userService.restoreEnergy();
              setConfirmRestoreEnergy(null);
              setNotification({
                title: 'Успех',
                message: `Восстановлено ${result.restored} энергии за ${result.cost} NAR`,
                type: 'success',
              });
              window.location.reload();
            } catch (error: any) {
              setNotification({
                title: 'Ошибка',
                message: error.response?.data?.message || 'Ошибка при восстановлении энергии',
                type: 'error',
              });
              console.error('Error restoring energy:', error);
            }
          }}
          title="Восстановление энергии"
          message={`Восстановить ${confirmRestoreEnergy.needed} энергии?`}
          confirmText="Восстановить"
          cancelText="Отмена"
          cost={confirmRestoreEnergy.cost}
          balance={user.narCoin}
        />
      )}

      {confirmRestoreLives && (
        <ConfirmModal
          isOpen={!!confirmRestoreLives}
          onClose={() => setConfirmRestoreLives(null)}
          onConfirm={async () => {
            if (!confirmRestoreLives) return;
            try {
              const result = await userService.restoreLives();
              setConfirmRestoreLives(null);
              setNotification({
                title: 'Успех',
                message: `Восстановлено ${result.restored} жизней за ${result.cost} NAR`,
                type: 'success',
              });
              window.location.reload();
            } catch (error: any) {
              setNotification({
                title: 'Ошибка',
                message: error.response?.data?.message || 'Ошибка при восстановлении жизней',
                type: 'error',
              });
              console.error('Error restoring lives:', error);
            }
          }}
          title="Восстановление жизней"
          message={`Восстановить ${confirmRestoreLives.needed} жизней?`}
          confirmText="Восстановить"
          cancelText="Отмена"
          cost={confirmRestoreLives.cost}
          balance={user.narCoin}
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

const ProfileInventory = () => {
  const [repairItem, setRepairItem] = useState<InventoryItem | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    Promise.all([
      inventoryService.getMyInventory(),
      resourceService.getMyResources(),
      userService.getProfile(),
    ])
      .then(([inv, res, userData]) => {
        setInventory(inv);
        setResources(res);
        setUser(userData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleEquip = async (itemId: number) => {
    try {
      await inventoryService.toggleEquip(itemId);
      const [inv, userData] = await Promise.all([
        inventoryService.getMyInventory(),
        userService.getProfile(),
      ]);
      setInventory(inv);
      setUser(userData);
      setNotification({
        title: 'Успех',
        message: 'Экипировка изменена',
        type: 'success',
      });
    } catch (error: any) {
      setNotification({
        title: 'Ошибка',
        message: error.response?.data?.message || 'Ошибка при изменении экипировки',
        type: 'error',
      });
      console.error('Error toggling equip:', error);
    }
  };

  const rarityColors: Record<string, string> = {
    COMMON: '#9e9e9e',
    RARE: '#2196f3',
    EPIC: '#9c27b0',
    LEGENDARY: '#ff9800',
    MYTHIC: '#f44336',
  };

  const rarityLabels: Record<string, string> = {
    COMMON: 'Обычный',
    RARE: 'Редкий',
    EPIC: 'Эпический',
    LEGENDARY: 'Легендарный',
    MYTHIC: 'Мифический',
  };

  const getVisualState = (durability: number, durabilityMax: number): 'NEW' | 'USED' | 'WORN' | 'BROKEN' => {
    const percentage = durability / durabilityMax;
    if (durability <= 0) return 'BROKEN';
    if (percentage > 0.7) return 'NEW';
    if (percentage > 0.3) return 'USED';
    return 'WORN';
  };

  const visualStateLabels: Record<string, string> = {
    NEW: '🟢 Новая',
    USED: '🟡 Поюзанная',
    WORN: '🟠 Изношенная',
    BROKEN: '🔴 Сломана',
  };

  const visualStateColors: Record<string, string> = {
    NEW: '#4caf50',
    USED: '#ffc107',
    WORN: '#ff9800',
    BROKEN: '#f44336',
  };

  const resourceIcons: Record<string, IconName> = {
    WOOD: 'wood',
    STONE: 'stone',
    MARBLE: 'marble',
    BONE: 'bone',
    PLASTIC: 'plastic',
    METAL: 'metal',
    LEATHER: 'leather',
    FABRIC: 'fabric',
  };

  if (loading) {
    return <div>Загрузка инвентаря...</div>;
  }

  const equippedItems = Array.isArray(inventory) ? inventory.filter(item => item.isEquipped) : [];
  const unequippedItems = Array.isArray(inventory) ? inventory.filter(item => !item.isEquipped) : [];

  return (
    <div className="profile-inventory">
      <div className="profile-inventory__section">
        <h3 className="profile-inventory__title">Экипированные предметы</h3>
        <div className="profile-inventory__items">
          {equippedItems.length > 0 ? (
            equippedItems.map((item) => (
              <Card key={item.id} className="profile-inventory__item">
                <div className="profile-inventory__item-header">
                  <div className="profile-inventory__item-info">
                    <span className="profile-inventory__item-name">{item.skin?.name || 'Предмет'}</span>
                    <span
                      className="profile-inventory__item-rarity"
                      style={{ color: rarityColors[item.rarity] }}
                    >
                      {rarityLabels[item.rarity]}
                    </span>
                    {(() => {
                      const visualState = getVisualState(item.durability, item.durabilityMax);
                      return (
                        <span
                          style={{
                            fontSize: '0.85rem',
                            color: visualStateColors[visualState],
                            marginLeft: '0.5rem',
                          }}
                        >
                          {visualStateLabels[visualState]}
                        </span>
                      );
                    })()}
                  </div>
                  <span className="profile-inventory__item-equipped">✓ Надето</span>
                </div>
                <div className="profile-inventory__item-durability">
                  <div className="profile-inventory__durability-bar">
                    <div
                      className="profile-inventory__durability-fill"
                      style={{
                        width: `${(item.durability / item.durabilityMax) * 100}%`,
                        backgroundColor:
                          item.durability / item.durabilityMax > 0.5
                            ? '#4caf50'
                            : item.durability / item.durabilityMax > 0.2
                            ? '#ff9800'
                            : '#f44336',
                      }}
                    />
                  </div>
                  <span className="profile-inventory__durability-text">
                    Прочность: {item.durability}/{item.durabilityMax}
                  </span>
                </div>
                <div className="profile-inventory__item-meta">
                  <span>Вес: {item.weight} / {user?.powerMax || 0}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleEquip(item.id)}
                  >
                    Снять
                  </Button>
                  {item.durability < item.durabilityMax && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRepairItem(item)}
                    >
                      <Icon name="repair" size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      Ремонт
                    </Button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card>Нет экипированных предметов</Card>
          )}
        </div>
      </div>

      <div className="profile-inventory__section">
        <h3 className="profile-inventory__title">Инвентарь</h3>
        <div className="profile-inventory__items">
          {unequippedItems.length > 0 ? (
            unequippedItems.map((item) => (
              <Card key={item.id} className="profile-inventory__item">
                <div className="profile-inventory__item-header">
                  <div className="profile-inventory__item-info">
                    <span className="profile-inventory__item-name">{item.skin?.name || 'Предмет'}</span>
                    <span
                      className="profile-inventory__item-rarity"
                      style={{ color: rarityColors[item.rarity] }}
                    >
                      {rarityLabels[item.rarity]}
                    </span>
                    {(() => {
                      const visualState = getVisualState(item.durability, item.durabilityMax);
                      return (
                        <span
                          style={{
                            fontSize: '0.85rem',
                            color: visualStateColors[visualState],
                            marginLeft: '0.5rem',
                          }}
                        >
                          {visualStateLabels[visualState]}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="profile-inventory__item-durability">
                  <div className="profile-inventory__durability-bar">
                    <div
                      className="profile-inventory__durability-fill"
                      style={{
                        width: `${(item.durability / item.durabilityMax) * 100}%`,
                        backgroundColor:
                          item.durability / item.durabilityMax > 0.5
                            ? '#4caf50'
                            : item.durability / item.durabilityMax > 0.2
                            ? '#ff9800'
                            : '#f44336',
                      }}
                    />
                  </div>
                  <span className="profile-inventory__durability-text">
                    Прочность: {item.durability}/{item.durabilityMax}
                  </span>
                </div>
                <div className="profile-inventory__item-meta">
                  <span>Вес: {item.weight} / {user?.powerMax || 0}</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleToggleEquip(item.id)}
                    disabled={!user || item.weight > (user.powerMax - (user.power || 0))}
                  >
                    Экипировать
                  </Button>
                  {item.durability < item.durabilityMax && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRepairItem(item)}
                    >
                      <Icon name="repair" size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      Ремонт
                    </Button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card>Инвентарь пуст</Card>
          )}
        </div>
      </div>

      <div className="profile-inventory__section">
        <h3 className="profile-inventory__title">Ресурсы</h3>
        <div className="profile-inventory__resources">
          {Array.isArray(resources) ? resources.map((resource) => (
            <Card key={resource.id} className="profile-inventory__resource">
              <div className="profile-inventory__resource-icon">
                <Icon name={resourceIcons[resource.type] || 'gift'} size={20} />
              </div>
              <div className="profile-inventory__resource-info">
                <span className="profile-inventory__resource-name">
                  {resource.type === 'WOOD'
                    ? 'Древесина'
                    : resource.type === 'STONE'
                    ? 'Камень'
                    : resource.type === 'METAL'
                    ? 'Металл'
                    : resource.type === 'LEATHER'
                    ? 'Кожа'
                    : resource.type}
                </span>
                <span className="profile-inventory__resource-amount">{resource.amount}</span>
              </div>
            </Card>
          )) : (
            <div>Нет ресурсов</div>
          )}
        </div>
      </div>

      {repairItem && (
        <RepairModal
          isOpen={!!repairItem}
          onClose={() => setRepairItem(null)}
          item={repairItem}
          onRepair={async (itemId, cost, businessId) => {
            try {
              if (businessId) {
                // Ремонт через предприятие
                const result = await businessService.repairItemAtBusiness(businessId, itemId, 'FULL');
                setNotification({
                  title: 'Успех',
                  message: `Предмет отремонтирован за ${cost} NAR (${result.ownerShare} владельцу, ${result.burnedAmount} сожжено)`,
                  type: 'success',
                });
              } else {
                // Прямой ремонт
                await inventoryService.repair(itemId, 'FULL');
                setNotification({
                  title: 'Успех',
                  message: `Предмет отремонтирован за ${cost} NAR`,
                  type: 'success',
                });
              }
              setRepairItem(null);
              const inv = await inventoryService.getMyInventory();
              setInventory(inv);
              const userData = await userService.getProfile();
              setUser(userData);
            } catch (error: any) {
              setNotification({
                title: 'Ошибка',
                message: error.response?.data?.message || 'Ошибка при ремонте',
                type: 'error',
              });
              console.error('Error repairing item:', error);
            }
          }}
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

const ProfileHistory = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    mode: '' as 'SHORT' | 'LONG' | '',
    result: '' as 'win' | 'loss' | 'draw' | '',
    limit: 50,
  });

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await gameHistoryService.getMyHistory({
          limit: filters.limit,
          mode: filters.mode || undefined,
          result: filters.result || undefined,
        });
        setHistory(data);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [filters]);

  if (loading) {
    return <div>Загрузка истории...</div>;
  }

  if (history.length === 0) {
    return <div className="profile-history"><Card>История игр пуста</Card></div>;
  }

  return (
    <div className="profile-history">
      {Array.isArray(history) ? history.map((game) => {
        const isWinner = game.winnerId === user?.id;
        const opponent = game.whitePlayerId === user?.id ? game.blackPlayer : game.whitePlayer;
        return (
          <Card key={game.id} className="profile-history__item">
            <div className="profile-history__header">
              <span>{game.mode === 'SHORT' ? 'Короткие' : 'Длинные'} нарды</span>
              <span className={isWinner ? 'profile-history__win' : 'profile-history__loss'}>
                {isWinner ? 'Победа' : 'Поражение'}
              </span>
            </div>
            <div className="profile-history__opponent">
              Против: {opponent?.firstName || opponent?.username || 'Игрок'}
            </div>
            <div className="profile-history__meta">
              {game.duration && (
                <span>
                  <Icon name="settings" size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {Math.floor(game.duration / 60)}:{(game.duration % 60).toString().padStart(2, '0')}
                </span>
              )}
              {game.betAmount && game.betAmount > 0 && (
                <span>
                  <Icon name="coin" size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Ставка: {game.betAmount} NAR
                </span>
              )}
              {game.commission && game.commission > 0 && (
                <span>
                  <Icon name="analytics" size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Комиссия: {game.commission} NAR
                </span>
              )}
              {game.districtId && (
                <span>
                  <Icon name="city" size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Район: {game.districtId}
                </span>
              )}
              <span>{new Date(game.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
          </Card>
        );
      }) : (
        <div>Нет истории игр</div>
      )}
    </div>
  );
};
