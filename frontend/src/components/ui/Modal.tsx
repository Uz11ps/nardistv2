import { ReactNode, useEffect, useRef, useCallback } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
}

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  closeOnOverlayClick = true,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    onClose();
    // Сбрасываем флаг через небольшую задержку
    setTimeout(() => {
      isClosingRef.current = false;
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      isClosingRef.current = false;
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape, true);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [isOpen, handleClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnOverlayClick || isClosingRef.current) return;
    
    // Проверяем, что клик был именно по overlay, а не по дочерним элементам
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    }
  }, [closeOnOverlayClick, handleClose]);

  const handleModalClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }, []);

  const handleCloseClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleClose();
  }, [handleClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div 
        ref={modalRef}
        className={`modal modal--${size}`} 
        onClick={handleModalClick}
      >
        {title && (
          <div className="modal__header">
            <h2 className="modal__title" id="modal-title">{title}</h2>
            <button 
              className="modal__close" 
              onClick={handleCloseClick} 
              aria-label="Закрыть"
              type="button"
            >
              ×
            </button>
          </div>
        )}
        <div className="modal__content">{children}</div>
      </div>
    </div>
  );
};

