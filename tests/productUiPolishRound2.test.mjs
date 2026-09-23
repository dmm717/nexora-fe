import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  getLocalizedRecommendationReason,
  getLocalizedCompetencyLabel,
  normalizeNextPracticeRecommendationResponse,
  KNOWN_COMPETENCY_LABELS,
} from '../src/services/recommendationContract.ts';

const readSource = (relPath) => readFile(new URL(relPath, import.meta.url), 'utf8');

test('Billing pricing marker uses SVG Sparkles and never a raw Material Symbols ligature', async () => {
  const source = await readSource('../src/app/(dashboard)/billing/page.tsx');
  assert.match(source, /import\s*\{\s*Sparkles\s*\}\s*from\s*['"]lucide-react['"]/);
  assert.match(source, /<Sparkles\s+size=\{13\}[^>]*aria-hidden="true"/);
  assert.doesNotMatch(source, /material-symbols-outlined[^\n]*>sparkles<\/span>/);
});

test('Pricing contexts use four columns only at xl and a deliberate 2x2 fallback', async () => {
  const [landingShell, pricingCards, billing] = await Promise.all([
    readSource('../src/components/features/pricing/PricingPageShell.tsx'),
    readSource('../src/components/features/pricing/PricingCards.tsx'),
    readSource('../src/app/(dashboard)/billing/page.tsx'),
  ]);

  for (const source of [landingShell, pricingCards, billing]) {
    assert.match(source, /grid-cols-1 md:grid-cols-2 xl:grid-cols-4/);
    assert.doesNotMatch(source, /md:grid-cols-2 lg:grid-cols-3/);
  }
});

test('Current plan and popular plan remain separate ownership concepts', async () => {
  const [pricingCards, billing] = await Promise.all([
    readSource('../src/components/features/pricing/PricingCards.tsx'),
    readSource('../src/app/(dashboard)/billing/page.tsx'),
  ]);

  assert.match(pricingCards, /data-current=\{isCurrentPlan\}/);
  assert.match(billing, /data-current=\{isCurrentPlan\}/);
  assert.match(pricingCards, /Gói hiện tại/);
  assert.match(billing, /Gói hiện tại/);
  assert.match(pricingCards, /Phổ biến nhất/);
  assert.match(billing, /Phổ biến nhất/);
});

test('1. Normalization accepts optional rationale.competencyCode while maintaining backward compatibility', () => {
  // New backend with competencyCode
  const withCode = normalizeNextPracticeRecommendationResponse({
    activityType: 'interview',
    reason: 'Practice Structure next because it is a priority 1 gap.',
    priority: 1,
    estimatedMinutes: 15,
    rationale: {
      competencyCode: 'interview.structure',
      competencyName: 'Structure',
      evidenceCount: 3,
      hasMoreRecentlyPracticedPeer: false,
    },
  });
  assert.equal(withCode?.rationale?.competencyCode, 'interview.structure');
  assert.equal(withCode?.rationale?.competencyName, 'Structure');
  assert.equal(withCode?.rationale?.evidenceCount, 3);
  assert.equal(withCode?.rationale?.hasMoreRecentlyPracticedPeer, false);

  // Old backend without competencyCode (rollout safety)
  const withoutCode = normalizeNextPracticeRecommendationResponse({
    activityType: 'interview',
    reason: 'Practice Structure next because it is a priority 1 gap.',
    priority: 1,
    estimatedMinutes: 15,
    rationale: {
      competencyName: 'Structure',
      evidenceCount: 3,
      hasMoreRecentlyPracticedPeer: true,
    },
  });
  assert.equal(withoutCode?.rationale?.competencyCode, undefined);
  assert.equal(withoutCode?.rationale?.competencyName, 'Structure');
  assert.equal(withoutCode?.rationale?.hasMoreRecentlyPracticedPeer, true);

  // Null or empty rationale
  const nullRationale = normalizeNextPracticeRecommendationResponse({
    activityType: 'interview',
    reason: 'Practice next.',
    priority: 1,
    estimatedMinutes: 15,
    rationale: null,
  });
  assert.equal(nullRationale?.rationale, null);
});

test('2. Known competency codes produce natural candidate-facing Vietnamese labels', () => {
  assert.equal(getLocalizedCompetencyLabel('interview.structure'), 'cấu trúc câu trả lời');
  assert.equal(getLocalizedCompetencyLabel('resume.impact_evidence'), 'minh chứng về tác động trong CV');
  assert.equal(getLocalizedCompetencyLabel('behavioral.action'), 'hành động');
  assert.equal(getLocalizedCompetencyLabel('behavioral.situation'), 'bối cảnh');
  assert.equal(getLocalizedCompetencyLabel('scenario.customer_service'), 'dịch vụ khách hàng');
  assert.equal(getLocalizedCompetencyLabel('scenario.problem_solving'), 'khả năng giải quyết vấn đề');

  // Bare identity lookup with activity context
  assert.equal(getLocalizedCompetencyLabel('structure', 'interview'), 'cấu trúc câu trả lời');
  assert.equal(getLocalizedCompetencyLabel('action', 'star_drill'), 'hành động');

  // Verify taxonomy categories
  const keys = Object.keys(KNOWN_COMPETENCY_LABELS);
  assert.ok(keys.some((k) => k.startsWith('behavioral.')));
  assert.ok(keys.some((k) => k.startsWith('interview.')));
  assert.ok(keys.some((k) => k.startsWith('resume.')));
  assert.ok(keys.some((k) => k.startsWith('scenario.')));
});

test('3. English backend display name such as "Impact Evidence" is NOT rendered verbatim when known code is available', () => {
  const copy = getLocalizedRecommendationReason({
    activityType: 'resume_improvement',
    priority: 1,
    estimatedMinutes: 20,
    rationale: {
      competencyCode: 'resume.impact_evidence',
      competencyName: 'Impact Evidence',
      evidenceCount: 4,
      hasMoreRecentlyPracticedPeer: false,
    },
  });

  assert.doesNotMatch(copy, /Impact Evidence/);
  assert.match(copy, /minh chứng về tác động trong CV/);
  assert.match(copy, /4 bằng chứng đã ghi nhận/);
});

test('4. Unknown or missing competencyCode falls back to safe Vietnamese activity label, not raw English competencyName', () => {
  // Missing competencyCode with English competencyName
  const missingCodeCopy = getLocalizedRecommendationReason({
    activityType: 'interview',
    priority: 1,
    estimatedMinutes: 15,
    rationale: {
      competencyName: 'Impact Evidence',
      evidenceCount: 2,
      hasMoreRecentlyPracticedPeer: false,
    },
  });
  assert.doesNotMatch(missingCodeCopy, /Impact Evidence/);
  assert.match(missingCodeCopy, /kỹ năng phỏng vấn cần ưu tiên/);

  // Unknown competencyCode with English competencyName
  const unknownCodeCopy = getLocalizedRecommendationReason({
    activityType: 'scenario',
    priority: 2,
    estimatedMinutes: 10,
    rationale: {
      competencyCode: 'custom.unrecognized_code',
      competencyName: 'Problem Solving',
      evidenceCount: 3,
      hasMoreRecentlyPracticedPeer: false,
    },
  });
  assert.doesNotMatch(unknownCodeCopy, /Problem Solving/);
  assert.match(unknownCodeCopy, /kỹ năng xử lý tình huống cần ưu tiên/);
});

test('5. Structured evidenceCount remains present in localized reason', () => {
  const copy = getLocalizedRecommendationReason({
    activityType: 'scenario',
    priority: 1,
    estimatedMinutes: 20,
    rationale: {
      competencyCode: 'scenario.prioritization',
      competencyName: 'Prioritization',
      evidenceCount: 8,
      hasMoreRecentlyPracticedPeer: false,
    },
  });
  assert.match(copy, /8 bằng chứng đã ghi nhận/);
});

test('6. Recency signal remains represented when true and omitted when false', () => {
  const withRecency = getLocalizedRecommendationReason({
    activityType: 'scenario',
    priority: 1,
    estimatedMinutes: 20,
    rationale: {
      competencyCode: 'interview.structure',
      competencyName: 'Structure',
      evidenceCount: 5,
      hasMoreRecentlyPracticedPeer: true,
    },
  });
  assert.match(withRecency, /lâu chưa được luyện/);

  const withoutRecency = getLocalizedRecommendationReason({
    activityType: 'scenario',
    priority: 1,
    estimatedMinutes: 20,
    rationale: {
      competencyCode: 'interview.structure',
      competencyName: 'Structure',
      evidenceCount: 5,
      hasMoreRecentlyPracticedPeer: false,
    },
  });
  assert.doesNotMatch(withoutRecency, /lâu chưa được luyện/);
});

test('7. Recommendation reason no longer renders legacy backend reason', async () => {
  const [contract, action, component] = await Promise.all([
    readSource('../src/services/recommendationContract.ts'),
    readSource('../src/services/nextBestAction.ts'),
    readSource('../src/components/features/recommendations/NextPracticeRecommendationContent.tsx'),
  ]);

  assert.match(contract, /getLocalizedRecommendationReason/);
  assert.match(action, /getLocalizedRecommendationReason\(recommendation\)/);
  assert.match(component, /getLocalizedRecommendationReason\(recommendation\)/);
  assert.doesNotMatch(component, /\{recommendation\.reason\}/);
  assert.doesNotMatch(component, /Practice Impact Evidence next because/);

  const copy = getLocalizedRecommendationReason({
    activityType: 'scenario',
    priority: 1,
    estimatedMinutes: 20,
    reason: 'Practice Impact Evidence next because it is a priority 1 gap supported by 3 evidence items.',
    rationale: {
      competencyCode: 'interview.structure',
      competencyName: 'Structure',
      evidenceCount: 6,
      hasMoreRecentlyPracticedPeer: true,
    },
  });
  assert.doesNotMatch(copy, /Practice Impact Evidence next because/);
  assert.match(copy, /cấu trúc câu trả lời/);
});

test('8. Duration is not duplicated between localized reason and dedicated metadata UI', async () => {
  const [analytics, overview, practiceHub, recommendationContent] = await Promise.all([
    readSource('../src/app/(dashboard)/analytics/page.tsx'),
    readSource('../src/app/(dashboard)/overview/page.tsx'),
    readSource('../src/components/features/practice/PracticeHub.tsx'),
    readSource('../src/components/features/recommendations/NextPracticeRecommendationContent.tsx'),
  ]);

  // Consumers own separate metadata UI for duration
  assert.match(analytics, /Ước tính:\s*\{progress\.nextRecommendedPractice\.estimatedMinutes\}\s*phút/);
  assert.match(overview, /Ước tính\s*\{nextAction\.estimatedMinutes\}\s*phút/);
  assert.match(practiceHub, /\{nextAction\.estimatedMinutes\}\s*phút/);
  assert.match(recommendationContent, /⏱\s*~\{recommendation\.estimatedMinutes\}\s*phút/);

  // Localized reason by default does NOT append duplicate duration
  const defaultReason = getLocalizedRecommendationReason({
    activityType: 'interview',
    priority: 1,
    estimatedMinutes: 25,
    rationale: {
      competencyCode: 'interview.structure',
      competencyName: 'Structure',
      evidenceCount: 3,
      hasMoreRecentlyPracticedPeer: false,
    },
  });
  assert.doesNotMatch(defaultReason, /25 phút/);

  // Explicit option appends duration when requested
  const withDuration = getLocalizedRecommendationReason(
    {
      activityType: 'interview',
      priority: 1,
      estimatedMinutes: 25,
      rationale: {
        competencyCode: 'interview.structure',
        competencyName: 'Structure',
        evidenceCount: 3,
        hasMoreRecentlyPracticedPeer: false,
      },
    },
    { includeDuration: true }
  );
  assert.match(withDuration, /25 phút/);
});

test('9 & 10. Social Proof uses reliable Lucide/SVG components and no raw Material Symbols ligatures', async () => {
  const source = await readSource('../src/components/features/landing/LandingTestimonials.tsx');

  // No fragile icon font ligatures
  assert.doesNotMatch(source, /<span[^>]*material-symbols-outlined[^>]*>\s*verified\s*<\/span>/);
  assert.doesNotMatch(source, /<span[^>]*material-symbols-outlined[^>]*>\s*check_circle\s*<\/span>/);

  // Reliable Lucide SVG components with aria-hidden
  assert.match(source, /import\s*\{[^}]*BadgeCheck[^}]*\}\s*from\s*['"]lucide-react['"]/);
  assert.match(source, /import\s*\{[^}]*CheckCircle2[^}]*\}\s*from\s*['"]lucide-react['"]/);
  assert.match(source, /<BadgeCheck\s+size=\{15\}[^>]*aria-hidden="true"/);
  assert.match(source, /<CheckCircle2\s+size=\{17\}[^>]*aria-hidden="true"/);
});

test('Landing practice/product surfaces have explicit boundaries and preserve sharp mascot sources', async () => {
  const [landingCss, landingSource, assets] = await Promise.all([
    readSource('../src/components/features/landing/landing.module.css'),
    readSource('../src/components/features/landing/MarketingLanding.tsx'),
    readSource('../src/config/brandAssets.ts'),
  ]);

  assert.match(landingCss, /\.scenarioPanel,\s*\.starPanel\s*\{[^}]*border:\s*2px solid/);
  assert.match(landingCss, /\.previewStage\s*\{[^}]*border:\s*2px solid/);
  assert.match(landingCss, /\.productWindow\s*\{[^}]*border:\s*1px solid/);
  assert.match(landingSource, /sizes="\(max-width: 760px\) 116px, \(max-width: 1100px\) 140px, 172px"/);
  assert.match(landingSource, /sizes="\(max-width: 760px\) 118px, \(max-width: 1100px\) 146px, 180px"/);
  assert.match(assets, /mascot-cv-analysis\.png/);
  assert.match(assets, /mascot-ai-coach\.png/);
});

test('Pricing motion has pointer-only lift and a reduced-motion final state', async () => {
  const [styles, pricingCards] = await Promise.all([
    readSource('../src/styles/product-visual.css'),
    readSource('../src/components/features/pricing/PricingCards.tsx'),
  ]);
  assert.match(styles, /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/);
  assert.match(styles, /\.pricing-choice:not\(\[data-current='true'\]\):hover/);
  assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(styles, /\.pricing-choice\s*\{\s*transition:\s*none;/);
  assert.match(pricingCards, /useLayoutEffect/);
  assert.match(pricingCards, /pricedPlans\.length === 0/);
  assert.match(pricingCards, /hasAnimatedPricingRef/);
  assert.match(pricingCards, /prefers-reduced-motion: reduce/);
  assert.match(pricingCards, /data-pricing-card/);
  assert.doesNotMatch(pricingCards, /opacity:\s*0[^}]*className/);
});

test('Social proof is one compound framed module and one review uses the available pane', async () => {
  const [styles, component] = await Promise.all([
    readSource('../src/components/features/landing/LandingTestimonials.module.css'),
    readSource('../src/components/features/landing/LandingTestimonials.tsx'),
  ]);
  assert.match(styles, /\.shell\s*\{[^}]*gap:\s*0;[^}]*border:\s*2px solid var\(--frame-showcase\)/s);
  assert.match(styles, /\.statsPanel\s*\{[^}]*border-left:\s*1px solid var\(--frame-showcase\)/s);
  assert.match(styles, /\.testimonialList\[data-count='1'\]\s*\{[^}]*minmax\(0, 1fr\)/s);
  assert.match(component, /data-count=\{items\.length\}/);
  assert.doesNotMatch(component, /items\.concat|Array\.from\([^)]*items/);
});

test('Billing uses customer-facing interview quota copy', async () => {
  const source = await readSource('../src/app/(dashboard)/billing/page.tsx');
  assert.match(source, /Hạn mức phỏng vấn:/);
  assert.doesNotMatch(source, /Hạn mức giá:/);
});
