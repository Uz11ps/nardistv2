import { useState } from 'react';
import { Card, Button, Tabs } from '../components/ui';
import { mockSkins } from '../mock';
import './Skins.css';

export const Skins = () => {
  const boardSkins = mockSkins.filter((s) => s.type === 'BOARD');
  const diceSkins = mockSkins.filter((s) => s.type === 'DICE');

  const tabs = [
    {
      id: 'board',
      label: 'Доски',
      content: <SkinsGrid skins={boardSkins} />,
    },
    {
      id: 'dice',
      label: 'Кубики',
      content: <SkinsGrid skins={diceSkins} />,
    },
  ];

  return (
    <div className="skins-page">
      <h1 className="skins-page__title">🎨 Скины</h1>
      <Tabs tabs={tabs} />
    </div>
  );
};

const SkinsGrid = ({ skins }: { skins: typeof mockSkins }) => {
  const [selectedSkin, setSelectedSkin] = useState<number | null>(null);

  return (
    <div className="skins-grid">
      {skins.map((skin) => (
        <Card key={skin.id} className="skin-card">
          <div className="skin-card__preview">
            <img src={skin.previewUrl} alt={skin.name} />
          </div>
          <div className="skin-card__info">
            <h3 className="skin-card__name">{skin.name}</h3>
            {skin.isDefault ? (
              <span className="skin-card__badge">По умолчанию</span>
            ) : (
              <div className="skin-card__price">💰 {skin.priceCoin} NAR</div>
            )}
          </div>
          <Button
            variant={selectedSkin === skin.id ? 'secondary' : 'outline'}
            fullWidth
            onClick={() => setSelectedSkin(skin.id)}
          >
            {selectedSkin === skin.id ? 'Выбрано' : skin.isDefault ? 'Использовать' : 'Купить'}
          </Button>
        </Card>
      ))}
    </div>
  );
};

