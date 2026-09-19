import { useId, type ComponentProps } from 'react';

interface AdminTextFieldProps extends ComponentProps<'input'> {
  label: string;
  error?: string;
}

export function AdminTextField({ label, error, className = '', ...inputProps }: AdminTextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-on-surface">
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : inputProps['aria-describedby']}
        className={`min-h-11 w-full rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-sm text-on-surface shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant ${className}`}
      />
      {error && (
        <p id={errorId} className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
