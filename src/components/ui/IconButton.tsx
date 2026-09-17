import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon: React.ReactNode;
  'aria-label': string;
  loading?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  'aria-label': ariaLabel,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.96] cursor-pointer';

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const variantClasses = {
    primary:
      'bg-primary-container hover:bg-primary text-white shadow-sm hover:shadow focus:ring-primary-container',
    secondary:
      'bg-surface-container-high hover:bg-surface-container text-primary focus:ring-primary-fixed',
    outline:
      'bg-white border border-outline-variant hover:bg-surface-container-low text-on-surface hover:border-outline focus:ring-primary-container shadow-sm',
    ghost:
      'bg-transparent hover:bg-surface-container text-on-surface-variant hover:text-on-surface focus:ring-primary-fixed',
    danger:
      'bg-error hover:bg-error/90 text-white focus:ring-error shadow-sm',
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      ) : (
        icon
      )}
    </button>
  );
};

export default IconButton;
