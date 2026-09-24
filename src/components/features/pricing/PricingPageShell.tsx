'use client';

import React from 'react';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import { AuthenticatedHeader } from '@/components/header/AuthenticatedHeader';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { Skeleton } from '@/components/ui/Skeleton';

export interface PricingPageShellProps {
  children: React.ReactNode;
}

export function PricingPageShell({ children }: PricingPageShellProps) {
  const { authReady, isAuthenticated } = useAuth();

  // If user is authenticated, keep them in the authenticated product shell
  if (authReady && isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface flex flex-col product-app-shell">
        <AuthenticatedHeader />
        <main className="flex-1 pt-16 bg-surface product-main-surface">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  // Prevent flash of landing header or interactive anonymous checkout while initial session restoration is resolving
  if (!authReady) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <header
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 w-full z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/40 h-16"
        >
          <div className="max-w-7xl h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <Skeleton className="h-9 w-36 rounded-xl" />
            <div className="flex items-center gap-3">
              <Skeleton className="hidden sm:block h-8 w-24 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        </header>
        <main className="flex-1 pt-16 bg-surface" aria-busy="true">
          <span role="status" className="sr-only">Đang tải bảng giá...</span>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
            <section aria-hidden="true" className="space-y-4 max-w-3xl">
              <Skeleton className="h-8 sm:h-10 w-4/5 max-w-2xl" />
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-5/6 max-w-xl" />
            </section>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="min-h-[360px] rounded-2xl border border-outline-variant/50 bg-white p-6 space-y-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-9 w-1/2" />
                  <div className="space-y-3 pt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
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
