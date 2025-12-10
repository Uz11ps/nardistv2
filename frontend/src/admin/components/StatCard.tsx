import { ReactNode } from 'react';
import './StatCard.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

export const StatCard = ({ title, value, icon, trend, subtitle }: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <span className="stat-card__title">{title}</span>
        {icon && <span className="stat-card__icon">{icon}</span>}
      </div>
      <div className="stat-card__value">{value}</div>
      {subtitle && <div className="stat-card__subtitle">{subtitle}</div>}
      {trend && (
        <div className={`stat-card__trend stat-card__trend--${trend.isPositive ? 'positive' : 'negative'}`}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  );
};

