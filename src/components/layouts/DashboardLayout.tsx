'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthenticatedHeader } from '@/components/header/AuthenticatedHeader';
import Footer from '@/components/layouts/Footer';
import {
  FocusedPracticeShellProvider,
} from '@/components/layouts/FocusedPracticeShellContext';
import { isFocusedPracticeRoute } from '@/services/focusedPracticeRoutes';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const focused = isFocusedPracticeRoute(pathname);

  return (
    <div className={focused ? 'min-h-screen' : 'nexora-ambient-shell product-app-shell flex min-h-screen flex-col'}>
      {!focused && <AuthenticatedHeader />}
      <FocusedPracticeShellProvider>
        <main className={focused ? '' : 'product-main-surface flex-1 pt-16'}>{children}</main>
      </FocusedPracticeShellProvider>
      {!focused && <Footer />}
    </div>
  );
}
