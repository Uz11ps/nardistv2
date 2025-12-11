import { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
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

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Вызываем оригинальный обработчик, если есть
    if (onClick) {
      try {
        onClick(e);
      } catch (error) {
        console.error('Button onClick error:', error);
      }
    }
  };

  return (
    <button 
      className={classes} 
      disabled={disabled || loading} 
      {...restProps}
      onClick={handleClick}
      style={{ ...restProps.style, pointerEvents: disabled || loading ? 'none' : 'auto' }}
    >
      {loading && <span className="btn__spinner" />}
      <span className={loading ? 'btn__content--hidden' : ''}>{children}</span>
    </button>
  );
};

