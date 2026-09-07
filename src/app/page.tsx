"use client";

import Header from '@/components/layouts/Header';
import Hero from '@/components/features/home/Hero';
import Services from '@/components/features/home/Services';
import About from '@/components/features/home/About';
import Pricing from '@/components/features/home/Pricing';
import TrustedBrands from '@/components/features/home/TrustedBrands';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustedBrands />
        <Services />
        <About />
        <Pricing />
      </main>
    </>
  );
}
