import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import { MarketingLanding } from '@/components/features/landing/MarketingLanding';

export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-surface overflow-hidden pt-16">
        <MarketingLanding />
      </main>
      <Footer />
    </>
  );
}
