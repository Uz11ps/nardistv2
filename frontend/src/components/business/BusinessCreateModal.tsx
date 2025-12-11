import { useState } from 'react';
import { Modal, Button, Card } from '../ui';
import './BusinessCreateModal.css';

interface BusinessType {
  type: string;
  name: string;
  cost: number;
  icon: string;
  description: string;
}

const BUSINESS_TYPES: BusinessType[] = [
  {
    type: 'COURT_TABLE',
    name: 'Дворовый стол',
    cost: 50,
    icon: '🏠',
    description: 'Базовое предприятие, небольшой пассивный доход',
  },
  {
    type: 'BOARD_WORKSHOP',
    name: 'Мастерская досок',
    cost: 200,
    icon: '🔨',
    description: 'Производит доски и ресурсы',
  },
  {
    type: 'DICE_FACTORY',
    name: 'Фабрика зариков',
    cost: 300,
    icon: '🎲',
    description: 'Производит зарики и кость',
  },
  {
    type: 'CUPS_WORKSHOP',
    name: 'Цех стаканов',
    cost: 250,
    icon: '🥤',
    description: 'Производит стаканы и металл',
  },
  {
    type: 'CLUB',
    name: 'Клуб Нардиста',
    cost: 500,
    icon: '🎪',
    description: 'Премиум-клуб с высоким доходом',
  },
  {
    type: 'SCHOOL',
    name: 'Школа Нардиста',
    cost: 400,
    icon: '🏫',
    description: 'Образовательное учреждение',
  },
  {
    type: 'ARENA',
    name: 'Турнирная Арена',
    cost: 1000,
    icon: '🏟️',
    description: 'Элитное предприятие, максимальный доход',
  },
];

interface BusinessCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
  userBalance?: number;
}

export const BusinessCreateModal = ({
  isOpen,
  onClose,
  onSelect,
  userBalance = 0,
}: BusinessCreateModalProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedType) {
      onSelect(selectedType);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать предприятие" size="lg">
      <div className="business-create-modal">
        <p className="business-create-modal__hint">
          Выберите тип предприятия для создания
        </p>
        <div className="business-create-modal__balance">
          💰 Ваш баланс: {userBalance.toLocaleString()} NAR
        </div>
        <div className="business-create-modal__types">
          {BUSINESS_TYPES.map((business) => {
            const canAfford = userBalance >= business.cost;
            const isSelected = selectedType === business.type;
            
            return (
              <Card
                key={business.type}
                className={`business-create-modal__type ${
                  isSelected ? 'business-create-modal__type--selected' : ''
                } ${!canAfford ? 'business-create-modal__type--disabled' : ''}`}
                onClick={() => canAfford && setSelectedType(business.type)}
              >
                <div className="business-create-modal__type-icon">{business.icon}</div>
                <div className="business-create-modal__type-info">
                  <h3 className="business-create-modal__type-name">{business.name}</h3>
                  <p className="business-create-modal__type-description">{business.description}</p>
                  <div className="business-create-modal__type-cost">
                    💰 {business.cost.toLocaleString()} NAR
                  </div>
                </div>
                {isSelected && (
                  <div className="business-create-modal__type-check">✓</div>
                )}
              </Card>
            );
          })}
        </div>
        <div className="business-create-modal__actions">
          <Button variant="outline" onClick={onClose} fullWidth>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedType}
            fullWidth
          >
            Создать
          </Button>
        </div>
      </div>
    </Modal>
  );
};

