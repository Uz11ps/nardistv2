import { SelectHTMLAttributes, forwardRef } from 'react';
import './Select.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', ...props }, ref) => {
    return (
      <div className="select-group">
        {label && (
          <label className="select-group__label">
            {label}
            {props.required && <span className="select-group__required">*</span>}
          </label>
        )}
        <select ref={ref} className={`select ${error ? 'select--error' : ''} ${className}`} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <div className="select-group__error">{error}</div>}
        {helperText && !error && <div className="select-group__helper">{helperText}</div>}
      </div>
    );
  },
);

Select.displayName = 'Select';

