import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Tabs } from '../components/ui';
import { RepairModal } from '../components/inventory';
import { userService, gameHistoryService, inventoryService, resourceService } from '../services';
import { useAuthStore } from '../store/auth.store';
import type { InventoryItem } from '../types';
import './Profile.css';

export const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getProfile()
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !user) {
    return <div className="profile-page">Загрузка...</div>;
  }

  const tabs = [
    {
      id: 'info',
      label: 'Информация',
      content: <ProfileInfo user={user} />,
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

const ProfileInfo = ({ user }: { user: any }) => {
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
        <Button variant="outline" fullWidth>
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
    </div>
  );
};

const ProfileStats = ({ user }: { user: any }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          Побед: {shortRating?.wins || 0} | Поражений: {shortRating?.losses || 0}
        </div>
      </Card>
      <Card>
        <h3>Длинные нарды</h3>
        <div className="profile-stats__rating">{longRating?.rating || 1500}</div>
        <div className="profile-stats__record">
          Побед: {longRating?.wins || 0} | Поражений: {longRating?.losses || 0}
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
                onClick={async () => {
                  try {
                    const needed = user.energyMax - user.energy;
                    const cost = needed * 10;
                    if (window.confirm(`Восстановить ${needed} энергии за ${cost} NAR?`)) {
                      const result = await userService.restoreEnergy();
                      alert(`Восстановлено ${result.restored} энергии за ${result.cost} NAR`);
                      window.location.reload();
                    }
                  } catch (error: any) {
                    alert(error.response?.data?.message || 'Ошибка при восстановлении энергии');
                  }
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
                onClick={async () => {
                  try {
                    const needed = user.livesMax - user.lives;
                    const cost = needed * 50;
                    if (window.confirm(`Восстановить ${needed} жизней за ${cost} NAR?`)) {
                      const result = await userService.restoreLives();
                      alert(`Восстановлено ${result.restored} жизней за ${result.cost} NAR`);
                      window.location.reload();
                    }
                  } catch (error: any) {
                    alert(error.response?.data?.message || 'Ошибка при восстановлении жизней');
                  }
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
          <div className="profile-stats__dev-branch">
            <span className="profile-stats__dev-label">💰 Экономика:</span>
            <div className="profile-stats__dev-level">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`profile-stats__dev-point ${i < (user.statsEconomy || 0) ? 'profile-stats__dev-point--active' : ''}`}
                />
              ))}
            </div>
            <span className="profile-stats__dev-value">{user.statsEconomy || 0}/10</span>
          </div>
          <div className="profile-stats__dev-branch">
            <span className="profile-stats__dev-label">⚡ Энергия:</span>
            <div className="profile-stats__dev-level">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`profile-stats__dev-point ${i < (user.statsEnergy || 0) ? 'profile-stats__dev-point--active' : ''}`}
                />
              ))}
            </div>
            <span className="profile-stats__dev-value">{user.statsEnergy || 0}/10</span>
          </div>
          <div className="profile-stats__dev-branch">
            <span className="profile-stats__dev-label">❤️ Жизни:</span>
            <div className="profile-stats__dev-level">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`profile-stats__dev-point ${i < (user.statsLives || 0) ? 'profile-stats__dev-point--active' : ''}`}
                />
              ))}
            </div>
            <span className="profile-stats__dev-value">{user.statsLives || 0}/10</span>
          </div>
          <div className="profile-stats__dev-branch">
            <span className="profile-stats__dev-label">💪 Сила:</span>
            <div className="profile-stats__dev-level">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`profile-stats__dev-point ${i < (user.statsPower || 0) ? 'profile-stats__dev-point--active' : ''}`}
                />
              ))}
            </div>
            <span className="profile-stats__dev-value">{user.statsPower || 0}/10</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

const ProfileInventory = () => {
  const [repairItem, setRepairItem] = useState<InventoryItem | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      inventoryService.getMyInventory(),
      resourceService.getMyResources(),
    ])
      .then(([inv, res]) => {
        setInventory(inv);
        setResources(res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="profile-inventory">
      <div className="profile-inventory__section">
        <h3 className="profile-inventory__title">Предметы</h3>
        <div className="profile-inventory__items">
          {inventory.map((item) => (
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
                {item.isEquipped && <span className="profile-inventory__item-equipped">✓ Надето</span>}
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
                <span>Вес: {item.weight}</span>
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
          ))}
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
          onRepair={(itemId, cost) => {
            console.log('Repairing item:', itemId, 'cost:', cost);
            setRepairItem(null);
          }}
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
              <span>{new Date(game.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
