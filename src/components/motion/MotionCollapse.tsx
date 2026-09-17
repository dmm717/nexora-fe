'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface MotionCollapseProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export const MotionCollapse: React.FC<MotionCollapseProps> = ({
  isOpen,
  children,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={shouldReduceMotion ? { opacity: 0, height: 'auto' } : { opacity: 0, height: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0.01 : 0.28,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={`overflow-hidden ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
