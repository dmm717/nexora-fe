'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { motionTokens } from './tokens';

interface MotionCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className = '',
  onClick,
  interactive = false,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (!interactive && !onClick) {
    return (
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: motionTokens.distance.small }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{ duration: motionTokens.duration.normal, ease: motionTokens.ease.standard }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: motionTokens.distance.small }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      whileHover={shouldReduceMotion ? undefined : { y: -3, transition: { duration: motionTokens.duration.fast, ease: motionTokens.ease.standard } }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: motionTokens.duration.normal, ease: motionTokens.ease.standard }}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  );
};
