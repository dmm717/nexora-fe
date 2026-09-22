import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getLocalizedRecommendationReason } from '../src/services/recommendationContract.ts';

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

test('Recommendation customer copy is structured Vietnamese, not backend free-form reason', async () => {
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
  });
  assert.match(copy, /Luyện tình huống thực tế/);
  assert.match(copy, /20 phút/);
  assert.doesNotMatch(copy, /Practice Impact Evidence next because/);
});

test('Landing practice/product surfaces have explicit boundaries and preserve sharp mascot sources', async () => {
  const [landingCss, landingSource, assets] = await Promise.all([
    readSource('../src/components/features/landing/landing.module.css'),
    readSource('../src/components/features/landing/MarketingLanding.tsx'),
    readSource('../src/config/brandAssets.ts'),
  ]);

  assert.match(landingCss, /\.scenarioPanel,\s*\.starPanel\s*\{[^}]*border:\s*1px solid/);
  assert.match(landingCss, /\.previewStage\s*\{[^}]*border:\s*1px solid/);
  assert.match(landingCss, /\.productWindow\s*\{[^}]*border:\s*1px solid/);
  assert.match(landingSource, /sizes="\(max-width: 760px\) 116px, \(max-width: 1100px\) 140px, 172px"/);
  assert.match(landingSource, /sizes="\(max-width: 760px\) 118px, \(max-width: 1100px\) 146px, 180px"/);
  assert.match(assets, /mascot-cv-analysis\.png/);
  assert.match(assets, /mascot-ai-coach\.png/);
});

test('Pricing motion has pointer-only lift and a reduced-motion final state', async () => {
  const source = await readSource('../src/styles/product-visual.css');
  assert.match(source, /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/);
  assert.match(source, /\.pricing-choice:not\(\[data-current='true'\]\):hover/);
  assert.match(source, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(source, /\.pricing-choice\s*\{\s*transition:\s*none;/);
});
