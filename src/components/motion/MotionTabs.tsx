'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface MotionTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}

export const MotionTabs: React.FC<MotionTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  layoutId = 'active-tab-indicator',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`inline-flex items-center p-1.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-colors z-10 flex items-center gap-1.5 ${
              isActive ? 'text-white' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={shouldReduceMotion ? undefined : layoutId}
                className="absolute inset-0 bg-primary rounded-xl shadow-xs -z-10"
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 35,
                }}
              />
            )}
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
};
