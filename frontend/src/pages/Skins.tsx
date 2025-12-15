import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Tabs, Icon } from '../components/ui';
import { inventoryService } from '../services';
import { placeholders } from '../utils/placeholders';
import './Skins.css';

export const Skins = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryService.getMyInventory()
      .then(setInventory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Группируем по типам скинов
  const boardSkins = inventory.filter((item) => item.skin?.type === 'BOARD');
  const diceSkins = inventory.filter((item) => item.skin?.type === 'DICE');

  const tabs = [
    {
      id: 'board',
      label: 'Доски',
      content: <SkinsGrid skins={boardSkins} loading={loading} />,
    },
    {
      id: 'dice',
      label: 'Кубики',
      content: <SkinsGrid skins={diceSkins} loading={loading} />,
    },
  ];

  return (
    <div className="skins-page">
      <Link to="/" className="skins-page__back">←</Link>
      <h1 className="skins-page__title">
        <Icon name="skins" size={28} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Скины
      </h1>
      <Tabs tabs={tabs} />
    </div>
  );
};

const SkinsGrid = ({ skins, loading }: { skins: any[]; loading: boolean }) => {
  const [selectedSkin, setSelectedSkin] = useState<number | null>(null);

  if (loading) {
    return <div className="skins-grid">Загрузка...</div>;
  }

  if (skins.length === 0) {
    return <div className="skins-grid">Нет доступных скинов</div>;
  }

  return (
    <div className="skins-grid">
      {skins.map((item) => (
        <Card key={item.id} className="skin-card">
          <div className="skin-card__preview">
            <img src={item.skin?.previewUrl || placeholders.itemMedium} alt={item.skin?.name} />
          </div>
          <div className="skin-card__info">
            <h3 className="skin-card__name">{item.skin?.name || 'Скин'}</h3>
            {item.isEquipped && <span className="skin-card__badge">Экипирован</span>}
            <div className="skin-card__durability">
              Прочность: {item.durability}/{item.durabilityMax}
            </div>
          </div>
          <Button
            variant={item.isEquipped ? 'secondary' : 'outline'}
            fullWidth
            onClick={async () => {
              try {
                await inventoryService.toggleEquip(item.id);
                setSelectedSkin(item.id);
                window.location.reload();
              } catch (error: any) {
                alert(error.response?.data?.message || 'Ошибка при экипировке');
              }
            }}
          >
            {item.isEquipped ? 'Снять' : 'Экипировать'}
          </Button>
        </Card>
      ))}
    </div>
  );
};

