import React, { forwardRef, useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, helperText, error, options, children, fullWidth = true, className = '', id, disabled, ...props },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-on-surface select-none">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full h-10 px-3.5 pr-9 rounded-xl border text-sm text-on-surface bg-white appearance-none transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary disabled:opacity-50 disabled:bg-surface-container-low disabled:cursor-not-allowed ${
              error ? 'border-error focus:ring-error focus:border-error' : 'border-outline-variant/70 hover:border-outline'
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs"
          >
            ▼
          </span>
        </div>
        {error && (
          <span id={errorId} role="alert" className="text-xs font-medium text-error">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={helperId} className="text-xs text-on-surface-variant">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
