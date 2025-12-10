import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => {
  return <div className={`spinner spinner--${size} ${className}`} />;
};

