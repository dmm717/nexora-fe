'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthenticatedHeader } from '@/components/header/AuthenticatedHeader';
import {
  FocusedPracticeShellProvider,
} from '@/components/layouts/FocusedPracticeShellContext';
import { isFocusedPracticeRoute } from '@/services/focusedPracticeRoutes';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const focused = isFocusedPracticeRoute(pathname);

  return (
    <>
      {!focused && <AuthenticatedHeader />}
      <FocusedPracticeShellProvider>
        <div className={focused ? '' : 'pt-16'}>{children}</div>
      </FocusedPracticeShellProvider>
    </>
  );
}
