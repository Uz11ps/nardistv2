import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Tabs, ConfirmModal, NotificationModal, Modal, Input } from '../components/ui';
import { RepairModal } from '../components/inventory';
import { userService, gameHistoryService, inventoryService, resourceService } from '../services';
import { useAuthStore } from '../store/auth.store';
import type { InventoryItem } from '../types';
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
    return <div className="profile-page">Загрузка...</div>;
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
      <div className="profile-page__header">
        <div className="profile-page__avatar">
          <img src={user.avatar || user.photoUrl || 'https://via.placeholder.com/100'} alt="Avatar" />
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
        <Button variant="outline" fullWidth onClick={() => setIsEditModalOpen(true)}>
          Редактировать профиль
        </Button>
      </Card>
      <div className="profile-info__links">
        <Link to="/city">
          <Button variant="ghost" fullWidth>🏙️ Город</Button>
        </Link>
        <Link to="/quests">
          <Button variant="ghost" fullWidth>📋 Квесты</Button>
        </Link>
        <Link to="/subscription">
          <Button variant="ghost" fullWidth>⭐ Подписка</Button>
        </Link>
        <Link to="/skins">
          <Button variant="ghost" fullWidth>🎨 Скины</Button>
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
  label: string; 
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
  const [confirmRestoreEnergy, setConfirmRestoreEnergy] = useState<{ needed: number; cost: number } | null>(null);
  const [confirmRestoreLives, setConfirmRestoreLives] = useState<{ needed: number; cost: number } | null>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    userService.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div>Загрузка статистики...</div>;
  }

  const shortRating = stats.ratings?.find((r: any) => r.mode === 'SHORT');
  const longRating = stats.ratings?.find((r: any) => r.mode === 'LONG');

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
          <div>💰 {user.narCoin} NAR-coin</div>
          <div className="profile-stats__resource-item">
            <span>⚡ {user.energy}/{user.energyMax} Энергия</span>
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
            <span>❤️ {user.lives}/{user.livesMax} Жизни</span>
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
          <div>💪 {user.power}/{user.powerMax} Сила</div>
        </div>
      </Card>
      <Card>
        <h3>Ветки развития</h3>
        <div className="profile-stats__development">
          <DevelopmentBranch
            label="💰 Экономика"
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
            label="⚡ Энергия"
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
            label="❤️ Жизни"
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
            label="💪 Сила"
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

  const resourceIcons: Record<string, string> = {
    WOOD: '🪵',
    STONE: '🪨',
    MARBLE: '⚪',
    BONE: '🦴',
    PLASTIC: '🔵',
    METAL: '⚙️',
    LEATHER: '🧵',
    FABRIC: '🧶',
  };

  if (loading) {
    return <div>Загрузка инвентаря...</div>;
  }

  const equippedItems = inventory.filter(item => item.isEquipped);
  const unequippedItems = inventory.filter(item => !item.isEquipped);

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
                      🔧 Ремонт
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
                      🔧 Ремонт
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
          {resources.map((resource) => (
            <Card key={resource.id} className="profile-inventory__resource">
              <div className="profile-inventory__resource-icon">{resourceIcons[resource.type] || '📦'}</div>
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
          ))}
        </div>
      </div>

      {repairItem && (
        <RepairModal
          isOpen={!!repairItem}
          onClose={() => setRepairItem(null)}
          item={repairItem}
          onRepair={async (itemId, cost) => {
            try {
              await inventoryService.repair(itemId, 'FULL');
              setNotification({
                title: 'Успех',
                message: `Предмет отремонтирован за ${cost} NAR`,
                type: 'success',
              });
              setRepairItem(null);
              const inv = await inventoryService.getMyInventory();
              setInventory(inv);
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

  useEffect(() => {
    gameHistoryService.getMyHistory(50)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Загрузка истории...</div>;
  }

  if (history.length === 0) {
    return <div className="profile-history"><Card>История игр пуста</Card></div>;
  }

  return (
    <div className="profile-history">
      {history.map((game) => {
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
                <span>⏱️ {Math.floor(game.duration / 60)}:{(game.duration % 60).toString().padStart(2, '0')}</span>
              )}
              {game.betAmount && game.betAmount > 0 && (
                <span>💰 Ставка: {game.betAmount} NAR</span>
              )}
              {game.commission && game.commission > 0 && (
                <span>📊 Комиссия: {game.commission} NAR</span>
              )}
              {game.districtId && (
                <span>🏙️ Район: {game.districtId}</span>
              )}
              <span>{new Date(game.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
