import { useState } from 'react';
import { Card, Button, Tabs, Input } from '../components/ui';
import { mockInventory, mockSkins } from '../mock';
import type { InventoryItem } from '../types';
import './Market.css';

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

// Мок-данные для предметов на рынке (от других игроков)
const mockMarketItems: (InventoryItem & { sellerName: string; price: number })[] = [
  {
    id: 10,
    skinId: 2,
    userId: 5,
    rarity: 'RARE',
    durability: 280,
    durabilityMax: 300,
    weight: 8,
    isEquipped: false,
    skin: mockSkins[1],
    sellerName: 'NardTrader',
    price: 350,
  },
  {
    id: 11,
    skinId: 3,
    userId: 6,
    rarity: 'EPIC',
    durability: 450,
    durabilityMax: 500,
    weight: 12,
    isEquipped: false,
    skin: mockSkins[2],
    sellerName: 'EliteSeller',
    price: 800,
  },
];

export const Market = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('ALL');

  const filteredItems = mockMarketItems.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.skin?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = filterRarity === 'ALL' || item.rarity === filterRarity;
    return matchesSearch && matchesRarity;
  });

  const tabs = [
    {
      id: 'buy',
      label: 'Купить',
      content: <MarketBuy items={filteredItems} />,
    },
    {
      id: 'sell',
      label: 'Продать',
      content: <MarketSell />,
    },
  ];

  return (
    <div className="market-page">
      <h1 className="market-page__title">🏪 Рынок скинов</h1>

      <div className="market-page__filters">
        <Input
          placeholder="Поиск по названию или продавцу..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="market-page__rarity-filters">
          <Button
            variant={filterRarity === 'ALL' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterRarity('ALL')}
          >
            Все
          </Button>
          <Button
            variant={filterRarity === 'RARE' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterRarity('RARE')}
          >
            Редкие
          </Button>
          <Button
            variant={filterRarity === 'EPIC' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterRarity('EPIC')}
          >
            Эпические
          </Button>
          <Button
            variant={filterRarity === 'LEGENDARY' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterRarity('LEGENDARY')}
          >
            Легендарные
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} />
    </div>
  );
};

const MarketBuy = ({ items }: { items: typeof mockMarketItems }) => {
  const handleBuy = (item: typeof mockMarketItems[0]) => {
    console.log('Buying item:', item.id);
    // Здесь будет логика покупки
  };

  return (
    <div className="market-buy">
      {items.length > 0 ? (
        <div className="market-buy__grid">
          {items.map((item) => (
            <Card key={item.id} className="market-item">
              <div className="market-item__preview">
                <img src={item.skin?.previewUrl || 'https://via.placeholder.com/200'} alt={item.skin?.name} />
                <div
                  className="market-item__rarity-badge"
                  style={{ backgroundColor: rarityColors[item.rarity] }}
                >
                  {rarityLabels[item.rarity]}
                </div>
              </div>
              <div className="market-item__info">
                <h3 className="market-item__name">{item.skin?.name || 'Предмет'}</h3>
                <div className="market-item__seller">Продавец: {item.sellerName}</div>
                <div className="market-item__durability">
                  Прочность: {item.durability}/{item.durabilityMax}
                  <div className="market-item__durability-bar">
                    <div
                      className="market-item__durability-fill"
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
                </div>
                <div className="market-item__weight">Вес: {item.weight}</div>
              </div>
              <div className="market-item__price">
                💰 {item.price.toLocaleString()} NAR
              </div>
              <Button variant="primary" fullWidth onClick={() => handleBuy(item)}>
                Купить
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="market-buy__empty">
          <p>Предметы не найдены</p>
        </Card>
      )}
    </div>
  );
};

const MarketSell = () => {
  const userItems = mockInventory.filter((item) => !item.isEquipped);

  const handleSell = (item: InventoryItem, price: number) => {
    console.log('Selling item:', item.id, 'for', price);
    // Здесь будет логика продажи
  };

  return (
    <div className="market-sell">
      <h3 className="market-sell__title">Ваши предметы для продажи</h3>
      {userItems.length > 0 ? (
        <div className="market-sell__list">
          {userItems.map((item) => (
            <Card key={item.id} className="market-sell-item">
              <div className="market-sell-item__preview">
                <img src={item.skin?.previewUrl || 'https://via.placeholder.com/100'} alt={item.skin?.name} />
              </div>
              <div className="market-sell-item__info">
                <h4 className="market-sell-item__name">{item.skin?.name || 'Предмет'}</h4>
                <div
                  className="market-sell-item__rarity"
                  style={{ color: rarityColors[item.rarity] }}
                >
                  {rarityLabels[item.rarity]}
                </div>
                <div className="market-sell-item__durability">
                  Прочность: {item.durability}/{item.durabilityMax}
                </div>
              </div>
              <div className="market-sell-item__actions">
                <Input
                  type="number"
                  placeholder="Цена"
                  style={{ maxWidth: '100px' }}
                  defaultValue={Math.floor((item.skin?.priceCoin || 0) * 0.8)}
                />
                <Button variant="primary" size="sm" onClick={() => handleSell(item, 0)}>
                  Выставить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="market-sell__empty">
          <p>У вас нет предметов для продажи</p>
          <p className="market-sell__empty-hint">Снимите предметы с экипировки, чтобы продать их</p>
        </Card>
      )}
    </div>
  );
};

