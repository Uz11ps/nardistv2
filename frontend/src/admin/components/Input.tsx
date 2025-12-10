import { InputHTMLAttributes, forwardRef } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="input-group">
        {label && (
          <label className="input-group__label">
            {label}
            {props.required && <span className="input-group__required">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`input ${error ? 'input--error' : ''} ${className}`}
          {...props}
        />
        {error && <div className="input-group__error">{error}</div>}
        {helperText && !error && <div className="input-group__helper">{helperText}</div>}
      </div>
    );
  },
);

Input.displayName = 'Input';

