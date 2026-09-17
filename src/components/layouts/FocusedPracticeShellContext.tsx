'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FocusedPracticeHeader } from '@/components/header/FocusedPracticeHeader';
import { ProductMotionBoundary } from '@/components/product-motion/ProductMotionBoundary';
import { isFocusedPracticeRoute } from '@/services/focusedPracticeRoutes';

export interface FocusedPracticeShellConfig {
  title: string;
  subtitle?: string;
  stepInfo?: string;
  statusLabel?: string;
  exitTo: string;
}

interface FocusedPracticeShellContextValue {
  setConfig: (config: FocusedPracticeShellConfig | null) => void;
}

const FocusedPracticeShellContext = createContext<FocusedPracticeShellContextValue | null>(null);

export function FocusedPracticeShellProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [config, setConfig] = useState<FocusedPracticeShellConfig | null>(null);
  const focused = isFocusedPracticeRoute(pathname);
  const contextValue = useMemo(() => ({ setConfig }), []);

  const defaultExit = pathname.startsWith('/interviews') ? '/interviews' : '/practice';
  const exitDestination = config?.exitTo || defaultExit;

  const handleExit = () => {
    router.push(exitDestination);
  };

  return (
    <FocusedPracticeShellContext.Provider value={contextValue}>
      <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface antialiased product-app-shell">
        {focused ? (
          <FocusedPracticeHeader
            title={config?.title || 'Chế độ luyện tập tập trung'}
            subtitle={config?.subtitle}
            stepInfo={config?.stepInfo}
            statusLabel={config?.statusLabel}
            exitTo={exitDestination}
            onExit={handleExit}
          />
        ) : null}

        <main className={`flex-1 w-full pb-16 product-main-surface ${focused ? 'pt-16' : ''}`}>
          <ProductMotionBoundary>
            <div className="product-page-content">{children}</div>
          </ProductMotionBoundary>
        </main>
      </div>
    </FocusedPracticeShellContext.Provider>
  );
}

export function useFocusedPracticeShell(config: FocusedPracticeShellConfig) {
  const context = useContext(FocusedPracticeShellContext);
  const { title, subtitle, stepInfo, statusLabel, exitTo } = config;

  // Keep live practice header config synchronized with active session state
  useEffect(() => {
    context?.setConfig({ title, subtitle, stepInfo, statusLabel, exitTo });
  }, [
    context,
    title,
    subtitle,
    stepInfo,
    statusLabel,
    exitTo,
  ]);

  // Clean up shell configuration only when leaving/unmounting the focused practice room
  useEffect(() => {
    return () => {
      context?.setConfig(null);
    };
  }, [context]);
}
