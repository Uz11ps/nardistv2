import React, { ReactNode, useCallback } from 'react';
import './Card.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  hover?: boolean;
  style?: React.CSSProperties;
}

export const Card = ({ children, className = '', onClick, hover = false, style }: CardProps) => {
  const classes = ['card', hover && 'card--hover', onClick && 'card--clickable', className]
    .filter(Boolean)
    .join(' ');

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      // Если onClick уже обрабатывает stopPropagation, не делаем это здесь
      // Но если это просто функция без параметров, добавляем stopPropagation
      if (onClick.length === 0) {
        e.stopPropagation();
        (onClick as () => void)();
      } else {
        onClick(e);
      }
    }
  }, [onClick]);

  return (
    <div className={classes} onClick={onClick ? handleClick : undefined} style={style}>
      {children}
    </div>
  );
};

