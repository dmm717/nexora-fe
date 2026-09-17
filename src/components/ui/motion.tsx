import React from 'react';

export const motionTokens = {
  duration: {
    instant: 0.05,
    fast: 0.18,
    normal: 0.32,
    slow: 0.55,
    reveal: 0.75,
    count: 1.1,
  },
  ease: {
    standard: [0.2, 0, 0, 1] as const,
    emphasized: [0.05, 0.7, 0.1, 1] as const,
    decelerate: [0.0, 0.0, 0.2, 1] as const,
    accelerate: [0.4, 0.0, 1, 1] as const,
  },
  stagger: {
    fast: 0.04,
    normal: 0.07,
    slow: 0.12,
  },
  distance: {
    small: 8,
    medium: 16,
    large: 28,
  },
};

export interface MotionWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const MotionPage: React.FC<MotionWrapperProps> = ({ children, className = '', ...props }) => {
  return (
    <div data-product-intro className={`animate-fade-in ${className}`} {...props}>
      {children}
    </div>
  );
};

export const MotionFade: React.FC<MotionWrapperProps> = ({ children, className = '', ...props }) => {
  return (
    <div data-product-reveal className={`transition-opacity duration-300 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const MotionStagger: React.FC<MotionWrapperProps> = ({ children, className = '', ...props }) => {
  return (
    <div data-product-intro className={`flex flex-col gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default MotionPage;
