'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { motionTokens } from './tokens';

interface MotionPageProps {
  children: React.ReactNode;
  className?: string;
}

export const MotionPage: React.FC<MotionPageProps> = ({ children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: motionTokens.distance.medium }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -motionTokens.distance.small }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : motionTokens.duration.normal,
        ease: motionTokens.ease.emphasized,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
