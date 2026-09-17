import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relPath) => readFile(new URL(relPath, import.meta.url), 'utf8');

test('F: anonymous /pricing uses public shell (Header + Footer)', async () => {
  const shellSource = await readSource('../src/components/features/pricing/PricingPageShell.tsx');
  assert.match(shellSource, /<Header \/>/);
  assert.match(shellSource, /<Footer \/>/);
  assert.match(shellSource, /Header/);
});

test('G: authenticated /pricing uses authenticated shell (AuthenticatedHeader without public footer)', async () => {
  const shellSource = await readSource('../src/components/features/pricing/PricingPageShell.tsx');
  assert.match(shellSource, /if \(isAuthenticated\)/);
  assert.match(shellSource, /<AuthenticatedHeader \/>/);

  const authBranch = shellSource.slice(
    shellSource.indexOf('if (isAuthenticated)'),
    shellSource.indexOf('if (!authReady)')
  );
  assert.doesNotMatch(authBranch, /<Footer/);
  assert.doesNotMatch(authBranch, /<Header \/>/);
});

test('G2: unresolved authReady renders loading skeleton and blocks rendering interactive children', async () => {
  const shellSource = await readSource('../src/components/features/pricing/PricingPageShell.tsx');
  assert.match(shellSource, /if \(!authReady\)/);

  const unreadyBranch = shellSource.slice(
    shellSource.indexOf('if (!authReady)'),
    shellSource.indexOf('// Anonymous user once auth is ready')
  );
  assert.doesNotMatch(unreadyBranch, /\{children\}/);
  assert.match(unreadyBranch, /animate-spin/);
  assert.doesNotMatch(unreadyBranch, /<Header \/>/);
  assert.doesNotMatch(unreadyBranch, /<Footer \/>/);
});

test('H: authenticated pricing stays in product shell and avoids public landing CTA', async () => {
  const [shellSource, headerSource] = await Promise.all([
    readSource('../src/components/features/pricing/PricingPageShell.tsx'),
    readSource('../src/components/header/AuthenticatedHeader.tsx'),
  ]);

  assert.match(shellSource, /<AuthenticatedHeader \/>/);
  assert.doesNotMatch(headerSource, /Vào Dashboard/);
  assert.match(headerSource, /item\.href === '\/pricing'/);
});

test('I: Pricing current-plan badge still uses real entitlement from user billing', async () => {
  const pricingCardsSource = await readSource('../src/components/features/pricing/PricingCards.tsx');
  assert.match(pricingCardsSource, /currentPlanCode\s*=\s*user\?\.billing\?\.entitlement\?\.planCode\?\.toLowerCase\(\)/);
  assert.match(pricingCardsSource, /isCurrentPlan\s*=\s*currentPlanCode === plan\.code\.toLowerCase\(\)/);
  assert.match(pricingCardsSource, /Gói hiện tại/);
});

test('J: Selecting paid price while authenticated routes to canonical billing with selectedPriceId and safe returnTo', async () => {
  const pricingCardsSource = await readSource('../src/components/features/pricing/PricingCards.tsx');
  assert.match(pricingCardsSource, /\/billing\?selectedPriceId=\$\{encodeURIComponent\(price\.id\)\}/);
  assert.match(pricingCardsSource, /&returnTo=\$\{encodeURIComponent\(safeReturnTo\)\}/);
  assert.match(pricingCardsSource, /price\.amountMinor === 0/);
});
