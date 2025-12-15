import React, { useCallback } from 'react';
import { Modal, Button } from './';
import './NotificationModal.css';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export const NotificationModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
}: NotificationModalProps) => {
  const handleClose = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="notification-modal">
        <p className={`notification-modal__message notification-modal__message--${type}`}>
          {message}
        </p>
        <div className="notification-modal__actions">
          <Button variant="primary" fullWidth onClick={handleClose}>
            ОК
          </Button>
        </div>
      </div>
    </Modal>
  );
};

