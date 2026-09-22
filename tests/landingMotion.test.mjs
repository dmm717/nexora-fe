import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { applyLandingFinalState } from '../src/components/features/landing/useLandingMotion.ts';

const source = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('1. default landing markup provides visible, accessible content without script animation', async () => {
  const landing = await source('src/components/features/landing/MarketingLanding.tsx');

  // Verify elements have final content and semantic attributes
  assert.match(landing, /data-hero-copy/);
  assert.match(landing, /data-hero-card/);
  assert.match(landing, /data-reveal/);
  assert.match(landing, /data-loop-node/);
  assert.match(landing, /data-loop-track/);
  assert.match(landing, /data-radial/);
  assert.match(landing, /data-meter/);
  assert.match(landing, /data-count=\{compact \? '78' : undefined\}/);

  // Content defaults are not blank
  assert.match(landing, />\s*78\s*<\/b>/);
  assert.match(landing, /Mục tiêu nghề nghiệp/);
  assert.match(landing, /Chuẩn bị đúng chỗ\./);
});

test('2. applyLandingFinalState establishes final styles on all landing motion targets including hero cards and float layers', () => {
  // Mock a mini DOM container with landing elements
  const container = {
    elements: {
      heroCopy: [{ style: { opacity: '0.8', transform: 'translateY(26px)' } }],
      heroCards: [{ style: { opacity: '0.8', transform: 'rotate(-3deg)' } }],
      floats: [{ style: { transform: 'translateY(9px)' } }],
      reveals: [{ style: { opacity: '0.7', transform: 'translateY(32px)' } }],
      loopNodes: [{ style: { opacity: '0.7', transform: 'translateY(24px)' } }],
      loopTrack: { style: { transform: 'scaleX(0)' } },
      radials: [{ style: { strokeDashoffset: '264' }, dataset: { radialFinal: '58' } }],
      meters: [{ style: { transform: 'scaleX(0)' } }],
      counts: [{ dataset: { count: '78' }, textContent: '0' }],
      parallax: [{ style: { transform: 'translateY(55px)' } }],
    },
    querySelectorAll(selector) {
      if (selector === '[data-hero-copy]') return this.elements.heroCopy;
      if (selector === '[data-hero-card]') return this.elements.heroCards;
      if (selector === '[data-float]') return this.elements.floats;
      if (selector === '[data-reveal]') return this.elements.reveals;
      if (selector === '[data-loop-node]') return this.elements.loopNodes;
      if (selector === '[data-radial]') return this.elements.radials;
      if (selector === '[data-meter]') return this.elements.meters;
      if (selector === '[data-count]') return this.elements.counts;
      if (selector === '[data-parallax]') return this.elements.parallax;
      return [];
    },
    querySelector(selector) {
      if (selector === '[data-loop-track]') return this.elements.loopTrack;
      return null;
    },
  };

  applyLandingFinalState(container);

  assert.equal(container.elements.heroCopy[0].style.opacity, '1');
  assert.equal(container.elements.heroCopy[0].style.transform, 'none');
  assert.equal(container.elements.heroCards[0].style.opacity, '1');
  assert.equal(container.elements.heroCards[0].style.transform, 'none');
  assert.equal(container.elements.floats[0].style.transform, 'none');
  assert.equal(container.elements.reveals[0].style.opacity, '1');
  assert.equal(container.elements.reveals[0].style.transform, 'none');
  assert.equal(container.elements.loopNodes[0].style.opacity, '1');
  assert.equal(container.elements.loopNodes[0].style.transform, 'none');
  assert.equal(container.elements.loopTrack.style.transform, 'none');
  assert.equal(container.elements.radials[0].style.strokeDashoffset, '58');
  assert.equal(container.elements.meters[0].style.transform, 'none');
  assert.equal(container.elements.counts[0].textContent, '78');
  assert.equal(container.elements.parallax[0].style.transform, 'none');
});

test('3. useLandingMotion distinguishes normalMotion and reducedMotion and avoids running spatial tweens in reduced mode', async () => {
  const landingMotion = await source('src/components/features/landing/useLandingMotion.ts');

  // Both matchMedia conditions are registered
  assert.match(landingMotion, /normalMotion:\s*['"]\(prefers-reduced-motion:\s*no-preference\)['"]/);
  assert.match(landingMotion, /reducedMotion:\s*['"]\(prefers-reduced-motion:\s*reduce\)['"]/);

  // Reduced motion invokes applyLandingFinalState and returns cleanup
  assert.match(landingMotion, /match\.conditions\?\.reducedMotion\s*\|\|\s*!match\.conditions\?\.normalMotion/);
  assert.match(landingMotion, /applyLandingFinalState\(container\)/);

  // Parallax, float, and loop animations are within normal motion context only
  assert.match(landingMotion, /gsap\.to\(['"]\[data-parallax\]['"]/);
  assert.match(landingMotion, /gsap\.to\(el,\s*\{[\s\S]*repeat:\s*-1/);
});

test('4. late dynamic import after disposal does not initialize motion', async () => {
  const landingMotion = await source('src/components/features/landing/useLandingMotion.ts');

  // Disposed flag is set on unmount and checked after import resolves
  assert.match(landingMotion, /let disposed = false;/);
  assert.match(landingMotion, /if\s*\(disposed\s*\|\|\s*!root\.current\)\s*return;/);
  assert.match(landingMotion, /disposed = true;/);
});

test('5. narrow and wide breakpoints handle preparation loop track scaling orientations', async () => {
  const landingMotion = await source('src/components/features/landing/useLandingMotion.ts');

  assert.match(landingMotion, /narrow:\s*['"]\(max-width:\s*760px\)['"]/);
  assert.match(landingMotion, /wide:\s*['"]\(min-width:\s*761px\)['"]/);
  assert.match(landingMotion, /scaleY:\s*0,\s*transformOrigin:\s*['"]top center['"]/);
  assert.match(landingMotion, /scaleX:\s*0,\s*transformOrigin:\s*['"]left center['"]/);
});

test('6. landing module CSS does not contain destructive blanket animation-kill rules', async () => {
  const landingCss = await source('src/components/features/landing/landing.module.css');

  assert.doesNotMatch(landingCss, /\.landing\s*\*\s*,/);
  assert.doesNotMatch(landingCss, /animation:\s*none\s*!important/);
  assert.doesNotMatch(landingCss, /transition:\s*none\s*!important/);
});

test('7. hero entrance and float tweens do not own transform on the same DOM element', async () => {
  const landing = await source('src/components/features/landing/MarketingLanding.tsx');
  const landingCss = await source('src/components/features/landing/landing.module.css');

  // No single HTML element possesses both data-hero-card and data-float attributes
  assert.doesNotMatch(landing, /<[^>]*data-hero-card[^>]*data-float/);
  assert.doesNotMatch(landing, /<[^>]*data-float[^>]*data-hero-card/);

  // All 3 hero cards have separate outer [data-hero-card] and inner [data-float] elements
  assert.match(landing, /<div\s+data-hero-card\s+className=\{styles\.heroCv\}>\s*<div\s+data-float\s+className=\{styles\.heroFloatLayer\}>/);
  assert.match(landing, /<div\s+data-hero-card\s+className=\{styles\.heroInterview\}>\s*<div\s+data-float\s+className=\{styles\.heroFloatLayer\}>/);
  assert.match(landing, /<div\s+data-hero-card\s+className=\{styles\.heroRecommendation\}>\s*<div\s+data-float\s+className=\{styles\.heroRecommendationCard\}>/);

  // CSS defines the float layer and recommendation card layout preserving original visual styles
  assert.match(landingCss, /\.heroFloatLayer\s*\{[\s\S]*?width:\s*100%/);
  assert.match(landingCss, /\.heroRecommendationCard\s*\{[\s\S]*?display:\s*flex;/);
  assert.match(landingCss, /\.heroRecommendation\s*\{[\s\S]*?position:\s*absolute;/);
});

test('8. hero entrance clears props and unlocks float tweens deterministically', async () => {
  const landingMotion = await source('src/components/features/landing/useLandingMotion.ts');

  // Hero entrance clears transform and opacity upon completion
  assert.match(landingMotion, /gsap\.from\(['"]\[data-hero-card\]['"],\s*\{[\s\S]*?clearProps:\s*['"]transform,opacity['"]/);

  // Hero entrance completion flag unlocks float triggers
  assert.match(landingMotion, /let heroEntranceComplete = false;/);
  assert.match(landingMotion, /onComplete:\s*\(\)\s*=>\s*\{[\s\S]*?heroEntranceComplete\s*=\s*true;/);

  // Float triggers start paused and check heroEntranceComplete on toggle
  assert.match(landingMotion, /paused:\s*true/);
  assert.match(landingMotion, /if\s*\(!heroEntranceComplete\)\s*return;/);
});

test('9. runtime mode diagnostics and dynamic CV demo have explicit motion ownership', async () => {
  const landingMotion = await source('src/components/features/landing/useLandingMotion.ts');
  const landing = await source('src/components/features/landing/MarketingLanding.tsx');

  assert.match(landingMotion, /dataset\.motionMode = 'normal'/);
  assert.match(landingMotion, /dataset\.motionMode = 'reduced'/);
  assert.match(landingMotion, /dataset\.motionMode = 'fallback'/);
  assert.match(landingMotion, /dataset\.motionTriggerCount/);
  assert.doesNotMatch(landingMotion, /gsap\.(?:from|to|fromTo)\(['"]\[data-(?:radial|meter|count)/);

  assert.match(landing, /data-cv-demo-result/);
  assert.match(landing, /data-cv-radial/);
  assert.match(landing, /data-cv-meter/);
  assert.match(landing, /data-cv-count/);
  assert.match(landing, /\[cv-demo-motion\] Initialization failed/);
});
