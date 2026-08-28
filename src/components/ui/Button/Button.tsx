import React, { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export function Button({ children, isLoading, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${className || ''}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <span className={styles.loader}></span>}
      {children}
    </button>
  );
}
