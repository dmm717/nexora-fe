import React from 'react';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import CvAnalysisHero from '@/components/features/cv-analysis/CvAnalysisHero';

export default function CvAnalysisPage() {
  return (
    <>
      <Header />
      <main className="nexora-ambient-shell min-h-screen">
        <CvAnalysisHero />
      </main>
      <Footer />
    </>
  );
}
