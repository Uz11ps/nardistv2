import { useState } from 'react';
import { Modal, Button, Card } from '../ui';
import type { InventoryItem } from '../../types';
import './RepairModal.css';

interface RepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  onRepair: (itemId: number, cost: number) => void;
}

export const RepairModal = ({ isOpen, onClose, item, onRepair }: RepairModalProps) => {
  const [repairType, setRepairType] = useState<'PARTIAL' | 'FULL'>('PARTIAL');
  const [loading, setLoading] = useState(false);

  const durabilityLost = item.durabilityMax - item.durability;
  const repairCostPartial = Math.floor((durabilityLost / item.durabilityMax) * item.skin?.priceCoin! * 0.3);
  const repairCostFull = Math.floor(item.skin?.priceCoin! * 0.5);
  const repairCost = repairType === 'FULL' ? repairCostFull : repairCostPartial;
  const durabilityRestored = repairType === 'FULL' ? durabilityLost : Math.floor(durabilityLost * 0.5);

  const handleRepair = async () => {
    setLoading(true);
    // Здесь будет вызов API
    setTimeout(() => {
      onRepair(item.id, repairCost);
      setLoading(false);
      onClose();
    }, 500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ремонт предмета" size="md">
      <div className="repair-modal">
        <Card className="repair-modal__item-info">
          <div className="repair-modal__item-name">{item.skin?.name || 'Предмет'}</div>
          <div className="repair-modal__durability">
            <div className="repair-modal__durability-current">
              Текущая прочность: {item.durability}/{item.durabilityMax}
            </div>
            <div className="repair-modal__durability-bar">
              <div
                className="repair-modal__durability-fill"
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
        </Card>

        <div className="repair-modal__options">
          <Card
            className={`repair-modal__option ${repairType === 'PARTIAL' ? 'repair-modal__option--active' : ''}`}
            onClick={() => setRepairType('PARTIAL')}
          >
            <div className="repair-modal__option-header">
              <h4 className="repair-modal__option-title">Частичный ремонт</h4>
              <div className="repair-modal__option-cost">💰 {repairCostPartial.toLocaleString()} NAR</div>
            </div>
            <p className="repair-modal__option-description">
              Восстановит {Math.floor(durabilityLost * 0.5)} прочности
            </p>
          </Card>

          <Card
            className={`repair-modal__option ${repairType === 'FULL' ? 'repair-modal__option--active' : ''}`}
            onClick={() => setRepairType('FULL')}
          >
            <div className="repair-modal__option-header">
              <h4 className="repair-modal__option-title">Полный ремонт</h4>
              <div className="repair-modal__option-cost">💰 {repairCostFull.toLocaleString()} NAR</div>
            </div>
            <p className="repair-modal__option-description">
              Восстановит всю прочность ({durabilityLost} единиц)
            </p>
          </Card>
        </div>

        <div className="repair-modal__summary">
          <div className="repair-modal__summary-item">
            <span>Восстановится прочности:</span>
            <span className="repair-modal__summary-value">{durabilityRestored}</span>
          </div>
          <div className="repair-modal__summary-item">
            <span>Стоимость:</span>
            <span className="repair-modal__summary-value repair-modal__summary-value--cost">
              💰 {repairCost.toLocaleString()} NAR
            </span>
          </div>
        </div>

        <div className="repair-modal__actions">
          <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button variant="primary" fullWidth onClick={handleRepair} loading={loading}>
            Отремонтировать
          </Button>
        </div>
      </div>
    </Modal>
  );
};

