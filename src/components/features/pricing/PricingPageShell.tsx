'use client';

import React from 'react';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import { AuthenticatedHeader } from '@/components/header/AuthenticatedHeader';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export interface PricingPageShellProps {
  children: React.ReactNode;
}

export function PricingPageShell({ children }: PricingPageShellProps) {
  const { authReady, isAuthenticated } = useAuth();

  // If user is authenticated, keep them in the authenticated product shell
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface flex flex-col product-app-shell">
        <AuthenticatedHeader />
        <main className="flex-1 pt-16 bg-surface product-main-surface">
          {children}
        </main>
      </div>
    );
  }

  // Prevent flash of landing header or interactive anonymous checkout while initial session restoration is resolving
  if (!authReady) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <header
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-outline-variant/40 h-16 shadow-[0_1px_8px_rgba(15,23,42,0.03)]"
        />
        <main className="flex-1 pt-16 bg-surface flex items-center justify-center">
          <div className="text-center py-24 text-on-surface-variant">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Đang tải thông tin bảng giá...</p>
          </div>
        </main>
      </div>
    );
  }

  // Anonymous user once auth is ready: public marketing header and footer
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <main className="flex-1 pt-16 bg-surface">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default PricingPageShell;
