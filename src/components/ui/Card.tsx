import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'subtle' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  className = '',
  ...props
}) => {
  const variantClasses = {
    elevated: 'bg-white border border-outline-variant/60 shadow-subtle transition-shadow',
    flat: 'bg-white border border-outline-variant/60',
    subtle: 'bg-surface-container-low border border-outline-variant/30',
    interactive: 'bg-white border border-outline-variant/60 shadow-subtle hover:shadow-card hover:border-primary/50 transition-all cursor-pointer',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`rounded-xl ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
