import React, { Suspense } from 'react';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import PricingCards from '@/components/features/pricing/PricingCards';

export const metadata = {
  title: 'Bảng giá & Gói cước - Nexora AI',
  description: 'Khám phá các gói dịch vụ luyện phỏng vấn và phân tích CV chuyên sâu của Nexora AI.',
};

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-16 bg-surface">
        <Suspense fallback={<div className="p-12 text-center text-on-surface-variant">Đang tải bảng giá...</div>}>
          <PricingCards />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
