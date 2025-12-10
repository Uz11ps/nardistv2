import { useState } from 'react';
import { Modal, Button, Card } from '../ui';
import type { Business } from '../../types';
import './BusinessUpgradeModal.css';

interface BusinessUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  onUpgrade: (businessId: number) => void;
}

export const BusinessUpgradeModal = ({
  isOpen,
  onClose,
  business,
  onUpgrade,
}: BusinessUpgradeModalProps) => {
  const [loading, setLoading] = useState(false);

  const currentLevel = business.level;
  const nextLevel = currentLevel + 1;
  const upgradeCost = Math.floor(business.incomePerHour * 10 * nextLevel);
  const newIncomePerHour = Math.floor(business.incomePerHour * 1.5);
  const incomeIncrease = newIncomePerHour - business.incomePerHour;

  const handleUpgrade = async () => {
    setLoading(true);
    // Здесь будет вызов API
    setTimeout(() => {
      onUpgrade(business.id);
      setLoading(false);
      onClose();
    }, 500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Улучшение предприятия" size="md">
      <div className="business-upgrade">
        <div className="business-upgrade__current">
          <h4 className="business-upgrade__section-title">Текущий уровень</h4>
          <Card className="business-upgrade__level-card">
            <div className="business-upgrade__level">Уровень {currentLevel}</div>
            <div className="business-upgrade__income">
              💰 {business.incomePerHour} NAR/час
            </div>
            {business.productionPerHour && (
              <div className="business-upgrade__production">
                📦 {business.productionPerHour} ед./час
              </div>
            )}
          </Card>
        </div>

        <div className="business-upgrade__arrow">↓</div>

        <div className="business-upgrade__next">
          <h4 className="business-upgrade__section-title">После улучшения</h4>
          <Card className="business-upgrade__level-card business-upgrade__level-card--next">
            <div className="business-upgrade__level">Уровень {nextLevel}</div>
            <div className="business-upgrade__income">
              💰 {newIncomePerHour} NAR/час
              <span className="business-upgrade__income-increase">+{incomeIncrease}</span>
            </div>
            {business.productionPerHour && (
              <div className="business-upgrade__production">
                📦 {Math.floor(business.productionPerHour * 1.2)} ед./час
              </div>
            )}
          </Card>
        </div>

        <div className="business-upgrade__cost">
          <div className="business-upgrade__cost-label">Стоимость улучшения:</div>
          <div className="business-upgrade__cost-value">💰 {upgradeCost.toLocaleString()} NAR</div>
        </div>

        <div className="business-upgrade__actions">
          <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button variant="primary" fullWidth onClick={handleUpgrade} loading={loading}>
            Улучшить
          </Button>
        </div>
      </div>
    </Modal>
  );
};

