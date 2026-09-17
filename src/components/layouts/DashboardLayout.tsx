'use client';

import React from 'react';
import { AuthenticatedHeader } from '@/components/header/AuthenticatedHeader';
import { ProductMotionBoundary } from '@/components/product-motion/ProductMotionBoundary';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface antialiased product-app-shell">
      {/* Top persistent prototype header */}
      <AuthenticatedHeader />

      {/* Main Content Area */}
      <main className="flex-1 pt-16 w-full pb-16 product-main-surface">
        <ProductMotionBoundary>
          <div className="product-page-content">{children}</div>
        </ProductMotionBoundary>
      </main>
    </div>
  );
}
