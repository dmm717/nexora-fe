import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relPath) => readFile(new URL(relPath, import.meta.url), 'utf8');

test('Query Client freshness defaults and principal cache isolation', async () => {
  const sessionClientSource = await readSource('../src/services/sessionQueryClient.ts');

  // Global QueryClient defaults must preserve pre-PR freshness semantics
  assert.match(sessionClientSource, /staleTime:\s*0/);
  assert.match(sessionClientSource, /refetchOnWindowFocus:\s*true/);

  // Account/principal cache isolation remains intact on epoch increment
  assert.match(sessionClientSource, /SessionQueryClientManager/);
  assert.match(sessionClientSource, /this\.client\.clear\(\)/);
  assert.match(sessionClientSource, /this\.client\s*=\s*createSessionQueryClient\(\)/);
  assert.match(sessionClientSource, /this\.epoch\s*=\s*nextEpoch/);
});

test('Resource-targeted query tuning for bootstrap and cache deduplication', async () => {
  const careerProfileQuery = await readSource('../src/hooks/queries/useCareerProfile.ts');
  const billingQuery = await readSource('../src/hooks/queries/useBilling.ts');
  const progressQuery = await readSource('../src/hooks/queries/useProgressDashboard.ts');
  const nextRecQuery = await readSource('../src/hooks/queries/useNextRecommendation.ts');

  // useCareerProfile and useResumes must be guarded by auth state
  assert.match(careerProfileQuery, /useAuth/);
  assert.match(careerProfileQuery, /enabled:\s*authReady\s*&&\s*isAuthenticated/);
  assert.match(careerProfileQuery, /staleTime:\s*5\s*\*\s*60\s*\*\s*1000/);
  assert.match(careerProfileQuery, /refetchOnWindowFocus:\s*false/);

  // usePlans and useBillingPlans must share canonical queryKey to eliminate duplicate fetches
  assert.match(billingQuery, /billingPlanKeys\.all/);
  assert.match(billingQuery, /queryKey:\s*billingPlanKeys\.all/);
  assert.match(billingQuery, /staleTime:\s*5\s*\*\s*60\s*\*\s*1000/);

  // Dashboard & recommendations retain targeted resource cache windows
  assert.match(progressQuery, /staleTime:\s*60\s*\*\s*1000/);
  assert.match(progressQuery, /refetchOnWindowFocus:\s*false/);
  assert.match(nextRecQuery, /staleTime:\s*60\s*\*\s*1000/);
  assert.match(nextRecQuery, /refetchOnWindowFocus:\s*false/);
});

test('Loading architecture: Initial auth boot overlay vs contained route loading', async () => {
  const bootLoaderSource = await readSource('../src/components/brand/NexoraBootLoader.tsx');
  const requireAuthSource = await readSource('../src/components/providers/RequireAuth.tsx');
  const rootLoadingSource = await readSource('../src/app/loading.tsx');

  // Initial auth boot: full-screen NexoraBootLoader overlay with logo and brand tokens
  assert.match(bootLoaderSource, /fixed inset-0 z-50/);
  assert.match(bootLoaderSource, /NexoraLogo/);
  assert.match(requireAuthSource, /<NexoraBootLoader/);

  // Normal route loading: contained layout UI that preserves application shell/navigation
  assert.match(rootLoadingSource, /functional-spinner/);
  assert.doesNotMatch(rootLoadingSource, /fixed inset-0/);
  assert.doesNotMatch(rootLoadingSource, /z-50/);
  assert.doesNotMatch(rootLoadingSource, /NexoraBootLoader/);
  assert.doesNotMatch(rootLoadingSource, /animate-spin/);
  assert.match(rootLoadingSource, /role="status"/);
  assert.match(rootLoadingSource, /aria-live="polite"/);
});

test('Pricing progressive disclosure, authoritative data rendering, and GSAP timeline', async () => {
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

  // Level 2: Detailed comparison table derived solely from backend plan/price features
  assert.match(pricingCards, /id="feature-comparison"/);
  assert.match(pricingCards, /So sánh chi tiết quyền lợi các gói/);
  assert.match(pricingCards, /overflow-x-auto/);
  assert.match(pricingCards, /<table/);
  assert.match(pricingCards, /<thead/);
  assert.match(pricingCards, /<tbody/);
  assert.match(pricingCards, /<tfoot/);

  // No unbacked or invented universal claims
  assert.doesNotMatch(pricingCards, /Mọi gói đều hỗ trợ bảo mật dữ liệu/);

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
