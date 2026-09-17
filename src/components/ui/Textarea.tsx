import React, { forwardRef, useId } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, fullWidth = true, className = '', id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-on-surface select-none">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full min-h-[100px] px-3.5 py-2.5 rounded-xl border text-sm text-on-surface bg-white placeholder:text-outline/70 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary disabled:opacity-50 disabled:bg-surface-container-low disabled:cursor-not-allowed ${
            error ? 'border-error focus:ring-error focus:border-error' : 'border-outline-variant/70 hover:border-outline'
          } ${className}`}
          {...props}
        />
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

Textarea.displayName = 'Textarea';
export default Textarea;
