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
  assert.match(shellSource, /if \(authReady && isAuthenticated\)/);
  assert.match(shellSource, /<AuthenticatedHeader \/>/);

  const authBranch = shellSource.slice(
    shellSource.indexOf('if (authReady && isAuthenticated)'),
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
  assert.match(unreadyBranch, /<Skeleton/);
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
  assert.match(
    pricingCardsSource,
    /currentPlanCode\s*=\s*isAuthenticated\s*&&\s*hasUserData[\s\S]*user\.billing\?\.entitlement\?\.planCode\?\.toLowerCase\(\)/
  );
  assert.match(pricingCardsSource, /isCurrentPlan\s*=\s*currentPlanCode === plan\.code\.toLowerCase\(\)/);
  assert.match(pricingCardsSource, /Gói hiện tại/);
});

test('J: Selecting paid price while authenticated starts direct PayOS checkout from Pricing', async () => {
  const pricingCardsSource = await readSource('../src/components/features/pricing/PricingCards.tsx');
  assert.match(pricingCardsSource, /startPayOSCheckout\(/);
  assert.match(pricingCardsSource, /billingApi\.createCheckoutSession/);
  assert.doesNotMatch(pricingCardsSource, /router\.push\(checkoutUrl\)/);
  assert.doesNotMatch(pricingCardsSource, /\/billing\?selectedPriceId=/);
  assert.match(pricingCardsSource, /price\.amountMinor <= 0/);
});

test('K: pricing and checkout use the database price id without package-name or client-price hardcoding', async () => {
  const [pricingCardsSource, billingPageSource, billingApiSource, billingQuerySource] = await Promise.all([
    readSource('../src/components/features/pricing/PricingCards.tsx'),
    readSource('../src/app/(dashboard)/billing/page.tsx'),
    readSource('../src/services/billingApi.ts'),
    readSource('../src/hooks/queries/useBilling.ts'),
  ]);

  for (const sourceText of [pricingCardsSource, billingPageSource, billingApiSource]) {
    assert.doesNotMatch(sourceText, /NEXORA\s+(BASIC|PLUS|PRO)/i);
  }
  assert.match(pricingCardsSource, /selectedPriceId=\$\{encodeURIComponent\(price\.id\)\}/);
  assert.match(billingPageSource, /matchedPrice\.id/);
  assert.match(billingPageSource, /createCheckoutMutation\.mutate\(matchedPrice\.id\)/);
  assert.match(billingPageSource, /mutationFn:\s*\(planPriceId: string\) => billingApi\.createCheckoutSession\(planPriceId\)/);
  assert.match(billingApiSource, /createCheckoutSession:\s*async \(planPriceId: string\)/);
  assert.match(billingApiSource, /createCheckoutSession:\s*async \(planPriceId: string\)[\s\S]*?\{ planPriceId \}/);
  const checkoutMethod = billingApiSource.slice(billingApiSource.indexOf('createCheckoutSession'));
  assert.doesNotMatch(checkoutMethod, /amountMinor/);
  assert.doesNotMatch(billingQuerySource, /queryKey:\s*\['billingPlans'\][\s\S]*staleTime:\s*Infinity/);
});
