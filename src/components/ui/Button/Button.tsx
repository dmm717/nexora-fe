import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'tonal';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  isLoading?: boolean; // legacy compatibility
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const isBusy = loading || isLoading;

  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99] cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[40px]',
    lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[48px]',
  };

  const variantClasses = {
    primary:
      'bg-primary-container hover:bg-primary text-white shadow-sm hover:shadow focus:ring-primary-container',
    secondary:
      'bg-surface-container-high hover:bg-surface-container text-primary focus:ring-primary-fixed',
    tonal:
      'bg-surface-container-high hover:bg-surface-container text-primary focus:ring-primary-fixed',
    outline:
      'bg-white border border-outline-variant hover:bg-surface-container-low text-on-surface hover:border-outline focus:ring-primary-container shadow-sm',
    ghost:
      'bg-transparent hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface focus:ring-primary-fixed',
    danger:
      'bg-error hover:bg-error/90 text-white focus:ring-error shadow-sm',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      className={`${baseClasses} ${widthClass} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isBusy}
      aria-busy={isBusy ? 'true' : undefined}
      {...props}
    >
      {isBusy ? (
        <>
          <span
            aria-hidden="true"
            className="functional-spinner inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full flex-shrink-0"
          />
          <span className="sr-only">Đang xử lý</span>
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span aria-hidden="true" className="flex-shrink-0">
              {icon}
            </span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <span aria-hidden="true" className="flex-shrink-0">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default Button;
