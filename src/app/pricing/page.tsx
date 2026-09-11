import React from 'react';
import Header from '@/components/layouts/Header';
import PricingCards from '@/components/features/pricing/PricingCards';

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <PricingCards />
      </main>
    </>
  );
}
