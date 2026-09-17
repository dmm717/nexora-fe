'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const MotionButton: React.FC<MotionButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm border border-transparent',
    secondary: 'bg-secondary text-white hover:bg-secondary-hover shadow-sm border border-transparent',
    outline: 'bg-white border border-outline text-on-surface hover:bg-surface-container-low',
    ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-xs font-semibold rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-sm font-bold rounded-2xl gap-2.5',
  };

  return (
    <motion.button
      whileHover={disabled || loading || shouldReduceMotion ? undefined : { y: -2, transition: { duration: 0.15 } }}
      whileTap={disabled || loading || shouldReduceMotion ? undefined : { scale: 0.98 }}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      className={`inline-flex items-center justify-center font-sans font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...(props as any)}
    >
      {loading ? (
        <>
          <span aria-hidden="true" className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="sr-only">Đang xử lý</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span aria-hidden="true">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <motion.span
              aria-hidden="true"
              whileHover={shouldReduceMotion ? undefined : { x: 3 }}
              transition={{ duration: 0.15 }}
            >
              {icon}
            </motion.span>
          )}
        </>
      )}
    </motion.button>
  );
};
