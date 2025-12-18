import React from 'react';
import { Modal, Button } from './';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
  cost?: number;
  balance?: number;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'primary',
  loading = false,
  cost,
  balance,
}: ConfirmModalProps) => {
  const canAfford = balance !== undefined && cost !== undefined ? balance >= cost : true;

  const handleConfirm = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!loading && canAfford) {
      onConfirm();
    }
  }, [onConfirm, loading, canAfford]);

  const handleCancel = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!loading) {
      onClose();
    }
  }, [onClose, loading]);

  const handleModalClose = React.useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [onClose, loading]);

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title={title} size="sm" closeOnOverlayClick={!loading}>
      <div className="confirm-modal">
        <p className="confirm-modal__message">{message}</p>
        
        {cost !== undefined && (
          <div className="confirm-modal__cost">
            <div className="confirm-modal__cost-item">
              <span className="confirm-modal__cost-label">Стоимость:</span>
              <span className="confirm-modal__cost-value">💰 {cost.toLocaleString()} NAR</span>
            </div>
            {balance !== undefined && (
              <div className="confirm-modal__cost-item">
                <span className="confirm-modal__cost-label">Ваш баланс:</span>
                <span className={`confirm-modal__cost-value ${!canAfford ? 'confirm-modal__cost-value--insufficient' : ''}`}>
                  💰 {balance.toLocaleString()} NAR
                </span>
              </div>
            )}
            {balance !== undefined && cost !== undefined && (
              <div className="confirm-modal__cost-item">
                <span className="confirm-modal__cost-label">Останется:</span>
                <span className={`confirm-modal__cost-value ${!canAfford ? 'confirm-modal__cost-value--insufficient' : ''}`}>
                  💰 {Math.max(0, balance - cost).toLocaleString()} NAR
                </span>
              </div>
            )}
          </div>
        )}

        <div className="confirm-modal__actions">
          <Button variant="outline" fullWidth onClick={handleCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            fullWidth
            onClick={handleConfirm}
            loading={loading}
            disabled={!canAfford}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

