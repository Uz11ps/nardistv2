import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Tabs, Input, Skeleton, Icon } from '../components/ui';
import { marketService, inventoryService } from '../services';
import type { InventoryItem } from '../types';
import { placeholders } from '../utils/placeholders';
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

export const Market = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('ALL');
  const [listings, setListings] = useState<any[]>([]);
  const [myInventory, setMyInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      marketService.getListings().catch(() => []),
      inventoryService.getMyInventory().catch(() => []),
    ])
      .then(([list, inv]) => {
        setListings(list);
        setMyInventory(inv);
      })
      .catch((error) => {
        console.warn('Failed to load market data:', error);
        // Устанавливаем пустые массивы при ошибке
        setListings([]);
        setMyInventory([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = Array.isArray(listings) ? listings.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      (item.inventoryItem?.skin?.name || item.skin?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.user?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = filterRarity === 'ALL' || (item.inventoryItem?.rarity || item.skin?.rarity) === filterRarity;
    return matchesSearch && matchesRarity;
  }) : [];

  const tabs = [
    {
      id: 'buy',
      label: 'Купить',
      content: <MarketBuy items={filteredItems} loading={loading} />,
    },
    {
      id: 'sell',
      label: 'Продать',
      content: <MarketSell inventory={myInventory} loading={loading} />,
    },
  ];

  return (
    <div className="market-page">
      <Link to="/" className="market-page__back">←</Link>
      <h1 className="market-page__title">
        <Icon name="market" size={28} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Рынок скинов
      </h1>

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

const MarketBuy = ({ items, loading }: { items: any[]; loading: boolean }) => {
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const handleBuy = async (listing: any) => {
    if (buyingId === listing.id) return; // Уже покупаем
    
    setBuyingId(listing.id);
    try {
      await marketService.buy(listing.id);
      alert('Предмет успешно куплен!');
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при покупке');
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="market-buy">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={200} style={{ borderRadius: '6px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="market-buy">
      {items.length > 0 ? (
        <div className="market-buy__grid">
          {Array.isArray(items) ? items.map((listing) => {
            const item = listing.inventoryItem || listing;
            const skin = item.skin || listing.skin;
            const rarity = item.rarity || skin?.rarity || 'COMMON';
            const durability = item.durability || 0;
            const durabilityMax = item.durabilityMax || 100;
            const weight = item.weight || 0;
            
            return (
              <Card key={listing.id} className="market-item">
                <div className="market-item__preview">
                  <img src={skin?.previewUrl || placeholders.item} alt={skin?.name} />
                  <div
                    className="market-item__rarity-badge"
                    style={{ backgroundColor: rarityColors[rarity] }}
                  >
                    {rarityLabels[rarity]}
                  </div>
                </div>
                <div className="market-item__info">
                  <h3 className="market-item__name">{skin?.name || 'Предмет'}</h3>
                  <div className="market-item__seller">Продавец: {listing.user?.firstName || 'Игрок'}</div>
                  {durabilityMax > 0 && (
                    <div className="market-item__durability">
                      Прочность: {durability}/{durabilityMax}
                      <div className="market-item__durability-bar">
                        <div
                          className="market-item__durability-fill"
                          style={{
                            width: `${(durability / durabilityMax) * 100}%`,
                            backgroundColor:
                              durability / durabilityMax > 0.5
                                ? '#4caf50'
                                : durability / durabilityMax > 0.2
                                ? '#ff9800'
                                : '#f44336',
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {weight > 0 && <div className="market-item__weight">Вес: {weight}</div>}
                </div>
                <div className="market-item__price">
                  <Icon name="coin" size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {listing.price.toLocaleString()} NAR
                </div>
                <Button 
                  variant="primary" 
                  fullWidth 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuy(listing);
                  }}
                  loading={buyingId === listing.id}
                  disabled={buyingId !== null && buyingId !== listing.id}
                >
                  Купить
                </Button>
              </Card>
            );
          }) : (
            <div>Нет доступных предметов</div>
          )}
        </div>
      ) : (
        <Card className="market-buy__empty">
          <p>Предметы не найдены</p>
        </Card>
      )}
    </div>
  );
};

const MarketSell = ({ inventory, loading }: { inventory: InventoryItem[]; loading: boolean }) => {
  const userItems = Array.isArray(inventory) ? inventory.filter((item) => !item.isEquipped) : [];

  const handleSell = async (item: InventoryItem, price: number) => {
    if (!price || price <= 0) {
      alert('Укажите цену');
      return;
    }
    try {
      // TODO: добавить API для создания листинга
      alert('Функция продажи будет добавлена позже');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при выставлении на продажу');
    }
  };

  if (loading) {
    return (
      <div className="market-sell">
        <Skeleton width="100%" height={24} style={{ marginBottom: '16px', borderRadius: '6px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={200} style={{ borderRadius: '6px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="market-sell">
      <h3 className="market-sell__title">Ваши предметы для продажи</h3>
      {Array.isArray(userItems) && userItems.length > 0 ? (
        <div className="market-sell__list">
          {userItems.map((item) => (
            <Card key={item.id} className="market-sell-item">
              <div className="market-sell-item__preview">
                <img src={item.skin?.previewUrl || placeholders.itemSmall} alt={item.skin?.name} />
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

