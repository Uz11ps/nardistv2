import { useState, useEffect } from 'react';
import { Modal, Button, Card } from '../ui';
import type { InventoryItem } from '../../types';
import { businessService } from '../../services';
import './RepairModal.css';

interface RepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  onRepair: (itemId: number, cost: number, businessId?: number) => void;
}

export const RepairModal = ({ isOpen, onClose, item, onRepair }: RepairModalProps) => {
  const [repairType, setRepairType] = useState<'PARTIAL' | 'FULL'>('PARTIAL');
  const [repairMode, setRepairMode] = useState<'DIRECT' | 'BUSINESS'>('DIRECT');
  const [repairBusinesses, setRepairBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  const durabilityLost = item.durabilityMax - item.durability;
  const repairCostPartial = Math.floor((durabilityLost / item.durabilityMax) * item.skin?.priceCoin! * 0.3);
  const repairCostFull = Math.floor(item.skin?.priceCoin! * 0.5);
  const repairCost = repairType === 'FULL' ? repairCostFull : repairCostPartial;
  const durabilityRestored = repairType === 'FULL' ? durabilityLost : Math.floor(durabilityLost * 0.5);

  useEffect(() => {
    if (isOpen && repairMode === 'BUSINESS' && item.skin?.type) {
      setLoadingBusinesses(true);
      businessService
        .getRepairBusinesses(item.skin.type)
        .then(setRepairBusinesses)
        .catch(console.error)
        .finally(() => setLoadingBusinesses(false));
    }
  }, [isOpen, repairMode, item.skin?.type]);

  const handleRepair = async () => {
    if (repairMode === 'BUSINESS' && !selectedBusiness) {
      return;
    }
    setLoading(true);
    onRepair(item.id, repairCost, repairMode === 'BUSINESS' ? selectedBusiness || undefined : undefined);
    setLoading(false);
    onClose();
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

        <div className="repair-modal__mode-selector">
          <Button
            variant={repairMode === 'DIRECT' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setRepairMode('DIRECT');
              setSelectedBusiness(null);
            }}
          >
            Прямой ремонт
          </Button>
          <Button
            variant={repairMode === 'BUSINESS' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setRepairMode('BUSINESS')}
          >
            Ремонт в мастерской
          </Button>
        </div>

        {repairMode === 'BUSINESS' && (
          <div className="repair-modal__businesses">
            {loadingBusinesses ? (
              <p>Загрузка мастерских...</p>
            ) : repairBusinesses.length === 0 ? (
              <p style={{ color: '#999' }}>Нет доступных мастерских для ремонта этого предмета</p>
            ) : (
              <>
                <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Выберите мастерскую (60% оплаты пойдет владельцу, 40% сгорит):
                </p>
                {Array.isArray(repairBusinesses) ? repairBusinesses.map((business) => {
                  const businessTypeNames: Record<string, string> = {
                    BOARD_WORKSHOP: 'Мастерская досок',
                    DICE_FACTORY: 'Фабрика зариков',
                    CUPS_WORKSHOP: 'Цех стаканов',
                  };
                  return (
                    <Card
                      key={business.id}
                      className={`repair-modal__business-option ${
                        selectedBusiness === business.id ? 'repair-modal__business-option--active' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBusiness(business.id);
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {businessTypeNames[business.type] || business.type}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#999' }}>
                          Владелец: {business.user?.nickname || business.user?.firstName || 'Неизвестно'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#999' }}>
                          Район: {business.district?.name || 'Неизвестно'} | Уровень: {business.level}
                        </div>
                      </div>
                    </Card>
                  );
                }) : null}
              </>
            )}
          </div>
        )}

        <div className="repair-modal__options">
          <Card
            className={`repair-modal__option ${repairType === 'PARTIAL' ? 'repair-modal__option--active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setRepairType('PARTIAL');
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              setRepairType('FULL');
            }}
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
          {repairMode === 'BUSINESS' && selectedBusiness && (
            <>
              <div className="repair-modal__summary-item">
                <span>Владельцу мастерской:</span>
                <span className="repair-modal__summary-value">
                  💰 {Math.floor(repairCost * 0.6).toLocaleString()} NAR
                </span>
              </div>
              <div className="repair-modal__summary-item">
                <span>Сгорит (sink):</span>
                <span className="repair-modal__summary-value" style={{ color: '#f44336' }}>
                  💰 {Math.floor(repairCost * 0.4).toLocaleString()} NAR
                </span>
              </div>
            </>
          )}
        </div>

        <div className="repair-modal__actions">
          <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleRepair}
            loading={loading}
            disabled={repairMode === 'BUSINESS' && !selectedBusiness}
          >
            Отремонтировать
          </Button>
        </div>
      </div>
    </Modal>
  );
};

