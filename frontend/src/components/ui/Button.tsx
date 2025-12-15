import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, IconName } from './Icon';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'rounded' | 'pill' | 'flat' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}: ButtonProps) => {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full-width',
    loading && 'btn--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Извлекаем onClick из props, чтобы не дублировать
  const { onClick, ...restProps } = props;
  const isProcessingRef = React.useRef(false);

  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Блокируем повторные клики
    if (disabled || loading || isProcessingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Предотвращаем всплытие события
    e.stopPropagation();
    
    // Вызываем оригинальный обработчик, если есть
    if (onClick) {
      try {
        isProcessingRef.current = true;
        onClick(e);
        
        // Сбрасываем флаг через небольшую задержку
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 300);
      } catch (error) {
        console.error('Button onClick error:', error);
        isProcessingRef.current = false;
      }
    }
  }, [onClick, disabled, loading]);

  const iconElement = icon && !loading ? (
    <Icon name={icon} size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
  ) : null;

  return (
    <button 
      className={classes} 
      disabled={disabled || loading} 
      {...restProps}
      onClick={handleClick}
      style={{ ...restProps.style, pointerEvents: disabled || loading ? 'none' : 'auto' }}
    >
      {loading && <span className="btn__spinner" />}
      <span className={loading ? 'btn__content--hidden' : 'btn__content'}>
        {iconPosition === 'left' && iconElement}
        {children}
        {iconPosition === 'right' && iconElement}
      </span>
    </button>
  );
};

