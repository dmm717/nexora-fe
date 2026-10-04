import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { applyLandingFinalState } from '../src/components/features/landing/useLandingMotion.ts';

const source = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('1. default landing markup provides visible, accessible content without script animation', async () => {
  const landing = await source('src/components/features/landing/MarketingLanding.tsx');
  const hero = await source('src/components/features/landing/CinematicHero.tsx');
  assert.match(landing, /<CinematicHero/);
  for (const selector of ['data-reveal','data-loop-node','data-loop-track','data-story-panel']) assert.ok(landing.includes(selector));
  assert.match(hero, /Luyện tập hôm nay/);
  assert.match(landing, /Bắt đầu luyện tập/);
  assert.doesNotMatch(landing, /data-cv-count|data-cv-meter|data-count=|data-radial/);
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

  // Entrance and loop reveals stay inside the normal-motion context.
  assert.match(landingMotion, /intro\.to\(bridge/);
  assert.doesNotMatch(landingMotion, /repeat:\s*-1/);
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

test('7. hero is an explicitly labeled presentation, with no competing float ownership', async () => {
  const hero = await source('src/components/features/landing/CinematicHero.tsx');
  const scene = await source('src/components/features/landing/NexoraBrandScene.tsx');
  assert.match(hero, /Minh họa/);
  assert.match(scene, /camera.position/);
  assert.match(scene, /observeBrandMotion/);
  assert.match(await source('src/components/features/landing/useLandingMotion.ts'), /publishBrandMotion/);
  assert.doesNotMatch(scene, /pin:|setAnimationLoop/);
});

test('8. hero entrance clears props and scroll motion is cleaned up', async () => {
  const landingMotion = await source('src/components/features/landing/useLandingMotion.ts');

  // Hero entrance clears transform and opacity upon completion
  assert.match(landingMotion, /from\('\[data-hero-support\]'[^;]*clearProps:\s*'transform,opacity'/);

  assert.match(landingMotion, /ctx\.revert\(\)/);
  assert.match(landingMotion, /media\.revert\(\)/);
});

test('9. runtime mode diagnostics and dynamic CV demo have explicit motion ownership', async () => {
  const motion = await source('src/components/features/landing/useLandingMotion.ts');
  for (const mode of ['normal','reduced','fallback']) assert.ok(motion.includes(`dataset.motionMode = '${mode}'`));
  assert.match(motion, /dataset\.motionTriggerCount/);
  const landing = await source('src/components/features/landing/MarketingLanding.tsx');
  assert.match(landing, /documentArtifact/);
  assert.match(landing, /documentInsights/);
  assert.doesNotMatch(landing, /data-cv-count|data-cv-meter|data-cv-radial/);
});
