import React from 'react';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import InterviewWizard from '@/components/features/interview/InterviewWizard';

export default function InterviewSetupPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8F5FE]">
        <InterviewWizard />
      </main>
      <Footer />
    </>
  );
}
