import { useState, useEffect } from 'react';
import { Modal, Button, Card, ConfirmModal } from '../ui';
import { userService } from '../../services';
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    if (isOpen) {
      userService.getProfile().then((user) => {
        setUserBalance(user.narCoin || 0);
      });
    }
  }, [isOpen]);

  const currentLevel = business.level;
  const nextLevel = currentLevel + 1;
  
  // Расчет стоимости улучшения по формуле backend: baseCost * level * 2
  const businessCreationCosts: Record<string, number> = {
    COURT_TABLE: 50,
    BOARD_WORKSHOP: 200,
    DICE_FACTORY: 300,
    CUPS_WORKSHOP: 250,
    CLUB: 500,
    SCHOOL: 400,
    ARENA: 1000,
  };
  const baseCost = businessCreationCosts[business.type] || 100;
  const upgradeCost = baseCost * currentLevel * 2;
  
  const newIncomePerHour = Math.floor(business.incomePerHour * 1.5);
  const incomeIncrease = newIncomePerHour - business.incomePerHour;

  const handleUpgradeClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmUpgrade = async () => {
    setLoading(true);
    try {
      await onUpgrade(business.id);
      setShowConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error upgrading business:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen && !showConfirm} onClose={onClose} title="Улучшение предприятия" size="md">
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
            <div className="business-upgrade__balance">
              Ваш баланс: 💰 {userBalance.toLocaleString()} NAR
            </div>
          </div>

          <div className="business-upgrade__actions">
            <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
              Отмена
            </Button>
            <Button variant="primary" fullWidth onClick={handleUpgradeClick} loading={loading}>
              Улучшить
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmUpgrade}
        title="Подтверждение улучшения"
        message={`Вы уверены, что хотите улучшить предприятие до уровня ${nextLevel}?`}
        confirmText="Улучшить"
        cancelText="Отмена"
        cost={upgradeCost}
        balance={userBalance}
        loading={loading}
      />
    </>
  );
};

