'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

interface AnimatedProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showValue?: boolean;
  colorClass?: string;
  trackClass?: string;
  className?: string;
  heightClass?: string;
  delay?: number;
  duration?: number;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  value,
  label,
  showValue = true,
  colorClass = 'bg-primary',
  trackClass = 'bg-surface-container-low',
  className = '',
  heightClass = 'h-2',
  delay = 0,
  duration = 0.9,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-semibold">
          {label && <span className="text-on-surface truncate">{label}</span>}
          {showValue && (
            <span className="text-on-surface font-bold ml-auto pl-2">
              <AnimatedNumber value={clampedValue} suffix="%" />
            </span>
          )}
        </div>
      )}

      <div className={`w-full ${heightClass} rounded-full ${trackClass} overflow-hidden relative`}>
        <motion.div
          initial={shouldReduceMotion ? { width: `${clampedValue}%` } : { width: '0%' }}
          whileInView={{ width: `${clampedValue}%` }}
          viewport={{ once: true }}
          transition={{
            duration: shouldReduceMotion ? 0.01 : duration,
            delay: shouldReduceMotion ? 0 : delay,
            ease: [0.16, 1, 0.3, 1], // fluid spring-like ease-out
          }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </div>
  );
};
