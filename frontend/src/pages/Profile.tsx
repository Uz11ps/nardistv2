import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Tabs } from '../components/ui';
import { RepairModal } from '../components/inventory';
import { mockUser, mockRatings, mockGameHistory, mockInventory, mockResources } from '../mock';
import type { InventoryItem } from '../types';
import './Profile.css';

export const Profile = () => {
  const tabs = [
    {
      id: 'info',
      label: 'Информация',
      content: <ProfileInfo />,
    },
    {
      id: 'stats',
      label: 'Статистика',
      content: <ProfileStats />,
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

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <div className="profile-page__avatar">
          <img src={mockUser.avatar || mockUser.photoUrl || 'https://via.placeholder.com/100'} alt="Avatar" />
        </div>
        <div className="profile-page__info">
          <h1 className="profile-page__name">{mockUser.nickname || mockUser.firstName}</h1>
          <p className="profile-page__level">Уровень {mockUser.level}</p>
          <div className="profile-page__xp">
            <div className="profile-page__xp-bar">
              <div className="profile-page__xp-fill" style={{ width: '65%' }} />
            </div>
            <span>{mockUser.xp} XP</span>
          </div>
        </div>
      </div>
      <Tabs tabs={tabs} />
    </div>
  );
};

const ProfileInfo = () => {
  return (
    <div className="profile-info">
      <Card>
        <div className="profile-info__item">
          <span className="profile-info__label">Имя:</span>
          <span className="profile-info__value">{mockUser.firstName} {mockUser.lastName}</span>
        </div>
        <div className="profile-info__item">
          <span className="profile-info__label">Никнейм:</span>
          <span className="profile-info__value">{mockUser.nickname || 'Не установлен'}</span>
        </div>
        <div className="profile-info__item">
          <span className="profile-info__label">Страна:</span>
          <span className="profile-info__value">{mockUser.country || 'Не указана'}</span>
        </div>
        <div className="profile-info__item">
          <span className="profile-info__label">Реферальный код:</span>
          <span className="profile-info__value">{mockUser.referralCode}</span>
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

const ProfileStats = () => {
  const shortRating = mockRatings.find((r) => r.mode === 'SHORT');
  const longRating = mockRatings.find((r) => r.mode === 'LONG');

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
          <div>💰 {mockUser.narCoin} NAR-coin</div>
          <div>⚡ {mockUser.energy}/{mockUser.energyMax} Энергия</div>
          <div>❤️ {mockUser.lives}/{mockUser.livesMax} Жизни</div>
          <div>💪 {mockUser.power}/{mockUser.powerMax} Сила</div>
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
                  className={`profile-stats__dev-point ${i < mockUser.stats.economy ? 'profile-stats__dev-point--active' : ''}`}
                />
              ))}
            </div>
            <span className="profile-stats__dev-value">{mockUser.stats.economy}/10</span>
          </div>
          <div className="profile-stats__dev-branch">
            <span className="profile-stats__dev-label">⚡ Энергия:</span>
            <div className="profile-stats__dev-level">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`profile-stats__dev-point ${i < mockUser.stats.energy ? 'profile-stats__dev-point--active' : ''}`}
                />
              ))}
            </div>
            <span className="profile-stats__dev-value">{mockUser.stats.energy}/10</span>
          </div>
          <div className="profile-stats__dev-branch">
            <span className="profile-stats__dev-label">❤️ Жизни:</span>
            <div className="profile-stats__dev-level">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`profile-stats__dev-point ${i < mockUser.stats.lives ? 'profile-stats__dev-point--active' : ''}`}
                />
              ))}
            </div>
            <span className="profile-stats__dev-value">{mockUser.stats.lives}/10</span>
          </div>
          <div className="profile-stats__dev-branch">
            <span className="profile-stats__dev-label">💪 Сила:</span>
            <div className="profile-stats__dev-level">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`profile-stats__dev-point ${i < mockUser.stats.power ? 'profile-stats__dev-point--active' : ''}`}
                />
              ))}
            </div>
            <span className="profile-stats__dev-value">{mockUser.stats.power}/10</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

const ProfileInventory = () => {
  const [repairItem, setRepairItem] = useState<InventoryItem | null>(null);

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

  return (
    <div className="profile-inventory">
      <div className="profile-inventory__section">
        <h3 className="profile-inventory__title">Предметы</h3>
        <div className="profile-inventory__items">
          {mockInventory.map((item) => (
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
          {mockResources.map((resource) => (
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
  return (
    <div className="profile-history">
      {mockGameHistory.map((game) => (
        <Card key={game.id} className="profile-history__item">
          <div className="profile-history__header">
            <span>{game.mode === 'SHORT' ? 'Короткие' : 'Длинные'} нарды</span>
            <span className={game.winnerId === mockUser.id ? 'profile-history__win' : 'profile-history__loss'}>
              {game.winnerId === mockUser.id ? 'Победа' : 'Поражение'}
            </span>
          </div>
          <div className="profile-history__opponent">
            Против: {game.whitePlayerId === mockUser.id ? game.blackPlayer?.nickname : game.whitePlayer?.nickname}
          </div>
          <div className="profile-history__meta">
            <span>⏱️ {Math.floor(game.duration! / 60)}:{(game.duration! % 60).toString().padStart(2, '0')}</span>
            <span>{new Date(game.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>
        </Card>
      ))}
    </div>
  );
};
