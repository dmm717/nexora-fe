import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relPath) => readFile(new URL(relPath, import.meta.url), 'utf8');

test('Part A: Query deduplication and bootstrap request storm elimination', async () => {
  const careerProfileQuery = await readSource('../src/hooks/queries/useCareerProfile.ts');
  const billingQuery = await readSource('../src/hooks/queries/useBilling.ts');
  const sessionClient = await readSource('../src/services/sessionQueryClient.ts');
  const progressQuery = await readSource('../src/hooks/queries/useProgressDashboard.ts');
  const nextRecQuery = await readSource('../src/hooks/queries/useNextRecommendation.ts');

  // useCareerProfile and useResumes must be guarded by auth state to avoid unauthenticated 401 request waves
  assert.match(careerProfileQuery, /useAuth/);
  assert.match(careerProfileQuery, /enabled:\s*authReady\s*&&\s*isAuthenticated/);
  assert.match(careerProfileQuery, /staleTime:\s*5\s*\*\s*60\s*\*\s*1000/);
  assert.match(careerProfileQuery, /refetchOnWindowFocus:\s*false/);

  // usePlans and useBillingPlans must share canonical queryKey to eliminate duplicate fetches
  assert.match(billingQuery, /billingPlanKeys\.all/);
  assert.match(billingQuery, /queryKey:\s*billingPlanKeys\.all/);
  assert.match(billingQuery, /staleTime:\s*5\s*\*\s*60\s*\*\s*1000/);

  // sessionQueryClient defaultOptions must prevent aggressive window-focus storms
  assert.match(sessionClient, /refetchOnWindowFocus:\s*false/);
  assert.match(sessionClient, /staleTime:\s*60\s*\*\s*1000/);

  // Dashboard & recommendations must have sensible cache windows
  assert.match(progressQuery, /staleTime:\s*60\s*\*\s*1000/);
  assert.match(progressQuery, /refetchOnWindowFocus:\s*false/);
  assert.match(nextRecQuery, /staleTime:\s*60\s*\*\s*1000/);
  assert.match(nextRecQuery, /refetchOnWindowFocus:\s*false/);
});

test('Part B: Nexora-branded boot loader for root session boot & suspense', async () => {
  const bootLoaderSource = await readSource('../src/components/brand/NexoraBootLoader.tsx');
  const requireAuthSource = await readSource('../src/components/providers/RequireAuth.tsx');
  const rootLoadingSource = await readSource('../src/app/loading.tsx');

  // NexoraBootLoader contains brand logo, accessible status role, and branded progress bar
  assert.match(bootLoaderSource, /NexoraLogo/);
  assert.match(bootLoaderSource, /role="status"/);
  assert.match(bootLoaderSource, /aria-live="polite"/);
  assert.match(bootLoaderSource, /nexora-boot-loader-indicator/);

  // RequireAuth uses NexoraBootLoader during initial auth bootstrap
  assert.match(requireAuthSource, /NexoraBootLoader/);
  assert.doesNotMatch(requireAuthSource, /animate-spin.*rounded-full/);

  // Root loading.tsx uses NexoraBootLoader
  assert.match(rootLoadingSource, /NexoraBootLoader/);
});

test('Part C & D: Pricing 2-level progressive disclosure and GSAP Master Timeline preservation', async () => {
  const pricingCards = await readSource('../src/components/features/pricing/PricingCards.tsx');
  const productVisualCss = await readSource('../src/styles/product-visual.css');

  // Compact hero token & CSS
  assert.match(productVisualCss, /\.product-page-hero\.pricing-hero/);
  assert.match(pricingCards, /className="pricing-hero"/);
  assert.match(pricingCards, /py-6 sm:py-8 space-y-8/);

  // Level 1: Summary decision cards with above-the-fold CTA
  assert.match(pricingCards, /data-pricing-card/);
  assert.match(pricingCards, /data-popular-badge/);
  assert.match(pricingCards, /data-feature-item/);
  assert.match(pricingCards, /Tính năng nổi bật:/);
  assert.match(pricingCards, /Hạn mức phỏng vấn:/);
  assert.match(pricingCards, /Chọn gói này/);
  assert.match(pricingCards, /Bắt đầu miễn phí/);

  // Level 2: Detailed comparison table
  assert.match(pricingCards, /id="feature-comparison"/);
  assert.match(pricingCards, /So sánh chi tiết quyền lợi các gói/);
  assert.match(pricingCards, /overflow-x-auto/);
  assert.match(pricingCards, /<table/);
  assert.match(pricingCards, /<thead/);
  assert.match(pricingCards, /<tbody/);
  assert.match(pricingCards, /<tfoot/);

  // GSAP Master Timeline preservation
  assert.match(pricingCards, /useLayoutEffect/);
  assert.match(pricingCards, /container\.querySelector\('\.product-page-hero h1'\)/);
  assert.match(pricingCards, /container\.querySelector\('\.product-page-hero p'\)/);
  assert.match(pricingCards, /container\.querySelectorAll<HTMLElement>\('\[data-pricing-card\]'\)/);
  assert.match(pricingCards, /container\.querySelectorAll<HTMLElement>\('\[data-feature-item\]'\)/);
  assert.match(pricingCards, /container\.querySelectorAll<HTMLElement>\('\[data-popular-badge\]'\)/);
  assert.match(pricingCards, /y:\s*35/);
  assert.match(pricingCards, /y:\s*18/);
  assert.match(pricingCards, /y:\s*50,\s*scale:\s*0\.96/);
  assert.match(pricingCards, /stagger:\s*0\.12/);
  assert.match(pricingCards, /back\.out\(1\.8\)/);
});
