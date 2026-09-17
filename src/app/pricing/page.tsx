import React, { Suspense } from 'react';
import { PricingPageShell } from '@/components/features/pricing/PricingPageShell';
import PricingCards from '@/components/features/pricing/PricingCards';

export const metadata = {
  title: 'Bảng giá & Gói cước - Nexora AI',
  description: 'Khám phá các gói dịch vụ luyện phỏng vấn và phân tích CV chuyên sâu của Nexora AI.',
};

export default function PricingPage() {
  return (
    <PricingPageShell>
      <Suspense fallback={<div className="p-12 text-center text-on-surface-variant">Đang tải bảng giá...</div>}>
        <PricingCards />
      </Suspense>
    </PricingPageShell>
  );
}
