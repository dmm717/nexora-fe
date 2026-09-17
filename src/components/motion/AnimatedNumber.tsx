'use client';

import React, { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  durationMs?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  durationMs = 900,
  className = '',
  suffix = '',
  prefix = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    // Animate from current displayValue (or 0) to target value
    const controls = animate(0, value, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [value, durationMs, shouldReduceMotion]);

  return (
    <span className={className}>
      {prefix}
      {shouldReduceMotion ? value : displayValue}
      {suffix}
    </span>
  );
};
