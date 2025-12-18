import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
  count?: number;
  animation?: 'pulse' | 'wave' | 'none';
  style?: React.CSSProperties;
}

export const Skeleton = ({
  width,
  height,
  variant = 'rectangular',
  className = '',
  count = 1,
  animation = 'wave',
  style: externalStyle,
}: SkeletonProps) => {
  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? height : '100%'),
    height: height || (variant === 'text' ? '1em' : '1rem'),
    ...externalStyle,
  };

  const classes = [
    'skeleton',
    `skeleton--${variant}`,
    `skeleton--${animation}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton
            key={index}
            width={width}
            height={height}
            variant={variant}
            className={className}
            animation={animation}
          />
        ))}
      </>
    );
  }

  return <div className={classes} style={style} />;
};

