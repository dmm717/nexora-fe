import React from 'react';
import Header from '@/components/layouts/Header';

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Bảng giá</h1>
          <p className="text-gray-600">Tính năng này đang được phát triển.</p>
        </div>
      </main>
    </>
  );
}
