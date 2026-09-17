'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { motionTokens } from './tokens';

interface MotionSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}

export const MotionSection: React.FC<MotionSectionProps> = ({
  children,
  className = '',
  delay = 0,
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: motionTokens.distance.medium }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : motionTokens.duration.slow,
        delay: shouldReduceMotion ? 0 : delay,
        ease: motionTokens.ease.emphasized,
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
};
