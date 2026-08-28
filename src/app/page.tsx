"use client";

import Header from '@/components/layouts/Header';
import Hero from '@/components/features/home/Hero';
import Stats from '@/components/features/home/Stats';
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
        <Stats />
        <Services />
        <About />
        <Pricing />
        <TrustedBrands />
      </main>
    </>
  );
}
