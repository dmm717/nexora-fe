import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { QueryClient } from '@tanstack/react-query';
import { SessionQueryClientManager } from '../src/services/sessionQueryClient.ts';
import {
  PRACTICE_AGGREGATE_QUERY_KEYS,
  getQueryKeysForEvent,
  invalidateInterviewTerminalCompletion,
  invalidateScenarioTerminalCompletion,
  invalidateStarTerminalCompletion,
} from '../src/services/practiceInvalidation.ts';

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
  const dashboardLoadingSource = await readSource('../src/app/(dashboard)/loading.tsx');

  // Initial auth boot: full-screen NexoraBootLoader overlay with logo and brand tokens
  assert.match(bootLoaderSource, /fixed inset-0 z-50/);
  assert.match(bootLoaderSource, /NexoraLogo/);
  assert.match(requireAuthSource, /<NexoraBootLoader/);

  // Dashboard route loading: contained within (dashboard) route boundary so DashboardLayout remains mounted
  assert.match(dashboardLoadingSource, /functional-spinner/);
  assert.doesNotMatch(dashboardLoadingSource, /fixed inset-0/);
  assert.doesNotMatch(dashboardLoadingSource, /z-50/);
  assert.doesNotMatch(dashboardLoadingSource, /animate-spin/);
  assert.match(dashboardLoadingSource, /role="status"/);
  assert.match(dashboardLoadingSource, /aria-live="polite"/);

  // Root route loading: non-dashboard fallback
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

test('Direct behavioral proof of SessionQueryClientManager epoch isolation', () => {
  const manager = new SessionQueryClientManager(0);
  const clientEpoch0 = manager.getQueryClient();
  assert.equal(manager.getEpoch(), 0);

  // Seed private user and progress queries into epoch 0 client
  clientEpoch0.setQueryData(['currentUser'], { id: 'user-0', email: 'user0@nexora.ai' });
  clientEpoch0.setQueryData(['progressDashboard'], { completedInterviews: 5 });

  // Syncing with same epoch returns same client and retains data
  const sameClient = manager.sync(0);
  assert.strictEqual(sameClient, clientEpoch0);
  assert.deepEqual(sameClient.getQueryData(['currentUser']), { id: 'user-0', email: 'user0@nexora.ai' });

  // Incrementing epoch triggers full client reset
  const clientEpoch1 = manager.sync(1);
  assert.notStrictEqual(clientEpoch1, clientEpoch0, 'New epoch must instantiate a distinct QueryClient');
  assert.equal(manager.getEpoch(), 1);

  // Old client had .clear() called on it
  assert.equal(clientEpoch0.getQueryData(['currentUser']), undefined);
  assert.equal(clientEpoch0.getQueryData(['progressDashboard']), undefined);

  // New client is clean and contains no residual private data
  assert.equal(clientEpoch1.getQueryData(['currentUser']), undefined);
  assert.equal(clientEpoch1.getQueryData(['progressDashboard']), undefined);
});

test('Authoritative query-key mapping for realtime events (terminal vs intermediate)', () => {
  // 1. Interview: completed status invalidates aggregate queries; in-progress does not
  const interviewCompletedKeys = getQueryKeysForEvent({
    eventId: 'e-1',
    resourceType: 'interview',
    resourceId: 'int-123',
    status: 'completed',
    occurredAt: '2026-09-24T00:00:00Z',
  });
  const serializedCompleted = interviewCompletedKeys.map((k) => JSON.stringify(k));
  assert.ok(serializedCompleted.includes(JSON.stringify(['interview', 'int-123'])));
  assert.ok(serializedCompleted.includes(JSON.stringify(['interviewReport', 'int-123'])));
  assert.ok(serializedCompleted.includes(JSON.stringify(['interviews'])));
  assert.ok(serializedCompleted.includes(JSON.stringify(['interviewsHistory'])));
  for (const aggKey of PRACTICE_AGGREGATE_QUERY_KEYS) {
    assert.ok(serializedCompleted.includes(JSON.stringify(aggKey)), `Completed interview must invalidate ${JSON.stringify(aggKey)}`);
  }

  const interviewStartedKeys = getQueryKeysForEvent({
    eventId: 'e-2',
    resourceType: 'interview',
    resourceId: 'int-123',
    status: 'started',
    occurredAt: '2026-09-24T00:00:00Z',
  });
  const serializedStarted = interviewStartedKeys.map((k) => JSON.stringify(k));
  assert.deepEqual(interviewStartedKeys, [['interview', 'int-123']]);
  for (const aggKey of PRACTICE_AGGREGATE_QUERY_KEYS) {
    assert.ok(!serializedStarted.includes(JSON.stringify(aggKey)), `Non-terminal event must NOT invalidate ${JSON.stringify(aggKey)}`);
  }

  // 2. Scenario Attempt: completed vs processing
  const scenarioCompletedKeys = getQueryKeysForEvent({
    eventId: 'e-3',
    resourceType: 'scenarioattempt',
    resourceId: 'sc-456',
    status: 'completed',
    occurredAt: '2026-09-24T00:00:00Z',
  });
  const serializedScenarioComp = scenarioCompletedKeys.map((k) => JSON.stringify(k));
  assert.ok(serializedScenarioComp.includes(JSON.stringify(['scenarioAttempt', 'sc-456'])));
  assert.ok(serializedScenarioComp.includes(JSON.stringify(['scenarioAttempts'])));
  assert.ok(serializedScenarioComp.includes(JSON.stringify(['scenarioHistory'])));
  assert.ok(serializedScenarioComp.includes(JSON.stringify(['scenarioProgress'])));
  for (const aggKey of PRACTICE_AGGREGATE_QUERY_KEYS) {
    assert.ok(serializedScenarioComp.includes(JSON.stringify(aggKey)));
  }

  const scenarioProcessingKeys = getQueryKeysForEvent({
    eventId: 'e-4',
    resourceType: 'scenarioattempt',
    resourceId: 'sc-456',
    status: 'processing',
    occurredAt: '2026-09-24T00:00:00Z',
  });
  assert.deepEqual(scenarioProcessingKeys, [['scenarioAttempt', 'sc-456']]);

  // 3. STAR Attempt: completed vs queued
  const starCompletedKeys = getQueryKeysForEvent({
    eventId: 'e-5',
    resourceType: 'starattempt',
    resourceId: 'star-789',
    status: 'completed',
    occurredAt: '2026-09-24T00:00:00Z',
  });
  const serializedStarComp = starCompletedKeys.map((k) => JSON.stringify(k));
  assert.ok(serializedStarComp.includes(JSON.stringify(['starAttempt', 'star-789'])));
  assert.ok(serializedStarComp.includes(JSON.stringify(['starAttempts'])));
  for (const aggKey of PRACTICE_AGGREGATE_QUERY_KEYS) {
    assert.ok(serializedStarComp.includes(JSON.stringify(aggKey)));
  }

  const starQueuedKeys = getQueryKeysForEvent({
    eventId: 'e-6',
    resourceType: 'starattempt',
    resourceId: 'star-789',
    status: 'queued',
    occurredAt: '2026-09-24T00:00:00Z',
  });
  assert.deepEqual(starQueuedKeys, [['starAttempt', 'star-789']]);

  // 4. User, Billing, Entitlement
  const userKeys = getQueryKeysForEvent({
    eventId: 'e-7',
    resourceType: 'user',
    resourceId: 'u-1',
    status: 'updated',
    occurredAt: '2026-09-24T00:00:00Z',
  });
  const serializedUser = userKeys.map((k) => JSON.stringify(k));
  assert.ok(serializedUser.includes(JSON.stringify(['currentUser'])));
  assert.ok(serializedUser.includes(JSON.stringify(['billingPlans'])));
});

test('Practice completion invalidates aggregate cache during 60s staleTime window', async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });

  // Seed warm practice-derived queries
  queryClient.setQueryData(['progressDashboard'], { completedCount: 3 });
  queryClient.setQueryData(['nextPracticeRecommendation'], { topic: 'system-design' });
  queryClient.setQueryData(['dashboardSummary'], { readinessScore: 78 });
  queryClient.setQueryData(['analytics'], { metrics: [1, 2, 3] });
  queryClient.setQueryData(['currentUser'], { id: 'u1', email: 'test@nexora.ai' });
  queryClient.setQueryData(['careerProfile'], { targetRole: 'Staff Engineer' }); // Unrelated query

  // Before terminal invalidation, all queries are fresh
  const queryCache = queryClient.getQueryCache();
  for (const aggKey of PRACTICE_AGGREGATE_QUERY_KEYS) {
    const q = queryCache.find({ queryKey: aggKey });
    assert.ok(q, `Query ${JSON.stringify(aggKey)} must exist in cache`);
    assert.equal(q.isStale(), false, `Query ${JSON.stringify(aggKey)} must initially be fresh`);
  }
  const careerQ = queryCache.find({ queryKey: ['careerProfile'] });
  assert.ok(careerQ);
  assert.equal(careerQ.isStale(), false);

  // Trigger interview terminal completion
  invalidateInterviewTerminalCompletion(queryClient, 'int-test-1');

  // Authoritative practice aggregates MUST now be marked stale
  for (const aggKey of PRACTICE_AGGREGATE_QUERY_KEYS) {
    const q = queryCache.find({ queryKey: aggKey });
    assert.equal(q.isStale(), true, `Query ${JSON.stringify(aggKey)} must be marked stale after interview completion`);
  }

  // Unrelated queries must remain untouched/fresh
  assert.equal(careerQ.isStale(), false, 'Unrelated careerProfile query must remain fresh');

  // Verify Scenario terminal completion behaves identically
  queryClient.setQueryData(['progressDashboard'], { completedCount: 4 });
  assert.equal(queryCache.find({ queryKey: ['progressDashboard'] }).isStale(), false);
  invalidateScenarioTerminalCompletion(queryClient, 'attempt-test-1');
  assert.equal(queryCache.find({ queryKey: ['progressDashboard'] }).isStale(), true);

  // Verify STAR terminal completion behaves identically
  queryClient.setQueryData(['progressDashboard'], { completedCount: 5 });
  assert.equal(queryCache.find({ queryKey: ['progressDashboard'] }).isStale(), false);
  invalidateStarTerminalCompletion(queryClient, 'star-test-1');
  assert.equal(queryCache.find({ queryKey: ['progressDashboard'] }).isStale(), true);
});
