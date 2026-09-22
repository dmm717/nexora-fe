import React from 'react';

export interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'neutral' | 'outline' | 'warning' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  icon,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 leading-tight',
    md: 'text-xs px-2.5 py-1 gap-1.5 leading-normal',
    lg: 'text-xs px-3 py-1.5 gap-2 font-bold leading-normal',
  };

  const variantClasses = {
    primary: 'bg-primary-fixed text-primary font-semibold',
    secondary: 'bg-secondary-container text-on-secondary-container font-semibold',
    tertiary: 'bg-tertiary-container text-on-tertiary-container font-semibold',
    error: 'bg-error-container text-error font-semibold',
    neutral: 'bg-surface-container text-on-surface-variant font-medium',
    outline: 'bg-white border border-outline-variant text-on-surface font-medium',
    warning: 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold',
    info: 'bg-blue-100 text-blue-800 border border-blue-300 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
