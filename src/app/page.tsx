import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import { MarketingLanding } from '@/components/features/landing/MarketingLanding';

export default function Home() {
  return (
    <>
      {/* Without JS, reveal the already server-rendered public page in the streaming boundary. */}
      <noscript><span hidden data-nexora-nojs /></noscript>
      <a href="#landing-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-primary">Đến nội dung chính</a>
      <Header />
      <main id="landing-content" className="bg-surface overflow-hidden pt-16">
        <MarketingLanding />
      </main>
      <Footer />
    </>
  );
}
