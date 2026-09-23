import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relPath) => readFile(new URL(relPath, import.meta.url), 'utf8');

test('Pricing GSAP Animation: Master Timeline coordinates header, cards, features, and badge', async () => {
  const source = await readSource('../src/components/features/pricing/PricingCards.tsx');

  // Uses containerRef for scoping
  assert.match(source, /containerRef\s*=\s*useRef<HTMLDivElement>\(null\)/);
  assert.match(source, /<div\s+ref=\{containerRef\}\s+className="max-w-7xl/);

  // Guards against running prematurely or repeatedly
  assert.match(source, /useLayoutEffect/);
  assert.match(source, /!container\s*\|\|\s*!hasPlansData\s*\|\|\s*pricedPlans\.length === 0\s*\|\|\s*hasAnimatedPricingRef\.current/);
  assert.match(source, /prefers-reduced-motion:\s*reduce/);

  // Scoped with gsap.context and reverts on unmount
  assert.match(source, /gsap\.context\(/);
  assert.match(source, /ctx\.revert\(\)/);

  // Queries all required elements within container
  assert.match(source, /container\.querySelector\('\.product-page-hero h1'\)/);
  assert.match(source, /container\.querySelector\('\.product-page-hero p'\)/);
  assert.match(source, /container\.querySelectorAll<HTMLElement>\('\[data-pricing-card\]'\)/);
  assert.match(source, /container\.querySelectorAll<HTMLElement>\('\[data-feature-item\]'\)/);
  assert.match(source, /container\.querySelectorAll<HTMLElement>\('\[data-popular-badge\]'\)/);

  // Master timeline orchestration
  assert.match(source, /gsap\.timeline\(\{/);
  assert.match(source, /y:\s*35/); // h1 y distance
  assert.match(source, /y:\s*18/); // p y distance
  assert.match(source, /y:\s*50,\s*scale:\s*0\.96/); // cards entrance
  assert.match(source, /stagger:\s*0\.12/); // cards stagger
  assert.match(source, /y:\s*10/); // feature items y
  assert.match(source, /stagger:\s*0\.03/); // features stagger
  assert.match(source, /back\.out\(1\.8\)/); // popular badge bounce ease

  // DOM attributes
  assert.match(source, /data-popular-badge/);
  assert.match(source, /data-feature-item/);
  assert.match(source, /data-pricing-card/);
});
