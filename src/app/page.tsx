'use client';

import Header from '@/components/layouts/Header';
import HeroSection from '@/components/features/home/HeroSection';
import FeaturesBento from '@/components/features/home/FeaturesBento';
import HowItWorks from '@/components/features/home/HowItWorks';
import FinalCTA from '@/components/features/home/FinalCTA';
import Footer from '@/components/layouts/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-white overflow-hidden">
        <HeroSection />
        <FeaturesBento />
        <HowItWorks />
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
