import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('canonical navigation keeps history in the account menu and points to real routes', async () => {
  const source = await readSource('../src/config/navigation.ts');
  for (const route of ['/resume-analyses', '/interviews/new', '/analytics', '/pricing', '/profile', '/settings', '/cv-analysis/history', '/interviews/history', '/payment-history']) {
    assert.ok(source.includes(route), `missing canonical route ${route}`);
  }
  assert.doesNotMatch(source, /href:\s*['"]\/skill-profile['"]/);
});

test('footer reads public settings and never turns an unset social link into a live link', async () => {
  const source = await readSource('../src/components/layouts/Footer.tsx');
  assert.match(source, /siteContentApi\.getSettings/);
  assert.match(source, /safeExternal\(data\?\.facebookUrl\)/);
  assert.match(source, /safeExternal\(data\?\.tiktokUrl\)/);
  assert.match(source, /url \? \(/);
  assert.match(source, /data\?\.supportAvailabilityEnabled && data\.supportLabel/);
});

test('legal pages use published public content and never render admin drafts as policy', async () => {
  const [publicPage, adminPage] = await Promise.all([
    readSource('../src/components/features/site/PublicLegalDocument.tsx'),
    readSource('../src/app/(admin)/admin/site-content/page.tsx'),
  ]);
  assert.match(publicPage, /siteContentApi\.getPublicPage\(pageKey\)/);
  assert.doesNotMatch(publicPage, /siteContentDrafts/);
  assert.match(publicPage, /Nội dung chính thức chưa được công bố/);
  assert.match(adminPage, /siteContentApi\.publishPage/);
});

test('payment history uses the full owner-scoped cursor endpoint', async () => {
  const [api, page] = await Promise.all([
    readSource('../src/services/billingApi.ts'),
    readSource('../src/app/(dashboard)/payment-history/page.tsx'),
  ]);
  assert.match(api, /\/me\/orders/);
  assert.match(page, /useInfiniteQuery/);
  assert.match(page, /last\.nextCursor/);
  assert.match(page, /billingApi\.getOrderHistory/);
});

test('legacy billing only preserves payment-return recovery and forwards ordinary checkout to pricing', async () => {
  const [billing, landing] = await Promise.all([
    readSource('../src/app/(dashboard)/billing/page.tsx'),
    readSource('../src/components/features/landing/MarketingLanding.tsx'),
  ]);
  assert.match(billing, /hasPendingOrder \|\| searchParams\.has\('error'\) \|\| searchParams\.has\('success'\)/);
  assert.match(billing, /params\.set\('checkoutPriceId', selectedPriceId\)/);
  assert.match(billing, /router\.replace\(params\.size \? `\/pricing\?\$\{params\}` : '\/pricing'\)/);
  assert.match(billing, /!legacyPaymentReturn \|\|\s*!selectedPriceId/);
  assert.match(landing, /resolveCheckoutDestination\(price\.id\)/);
});

test('retired status destination redirects home and is not an active route', async () => {
  const [config, routePolicy] = await Promise.all([
    readSource('../next.config.ts'),
    readSource('../src/services/authRoutePolicy.ts'),
  ]);
  assert.match(config, /source: '\/status', destination: '\/', permanent: false/);
  assert.doesNotMatch(routePolicy, /^\s*'\/status',?\s*$/m);
});

test('Corrective 1: /cv-analysis/history is located within protected (dashboard) group', async () => {
  const dashboardHistory = await readSource('../src/app/(dashboard)/cv-analysis/history/page.tsx');
  assert.ok(dashboardHistory.length > 0);
  assert.match(dashboardHistory, /export default function CvAnalysisHistoryPage/);

  // Verify it does not exist outside (dashboard)
  let outsideExists = false;
  try {
    await readSource('../src/app/cv-analysis/history/page.tsx');
    outsideExists = true;
  } catch {
    outsideExists = false;
  }
  assert.equal(outsideExists, false, 'cv-analysis/history must not exist outside (dashboard)');
});

test('Corrective 2: authIntent allows /profile, /settings, /payment-history, /about, /terms, /privacy and preserves payment-history returnTo', async () => {
  const source = await readSource('../src/utils/authIntent.ts');
  const expectedPrefixes = [
    '/profile',
    '/settings',
    '/payment-history',
    '/about',
    '/terms',
    '/privacy',
    '/career-profile',
    '/account',
    '/billing',
    '/skill-profile',
  ];
  for (const prefix of expectedPrefixes) {
    assert.match(source, new RegExp(`['"]${prefix}['"]`));
  }

  // Import directly to test runtime semantics
  const { isValidInternalPath, resolveCheckoutDestination, resolveSafeReturnUrl } = await import('../src/utils/authIntent.ts');
  assert.equal(isValidInternalPath('/profile'), true);
  assert.equal(isValidInternalPath('/settings'), true);
  assert.equal(isValidInternalPath('/payment-history'), true);
  assert.equal(isValidInternalPath('/cv-analysis/history'), true);
  assert.equal(isValidInternalPath('/about'), true);
  assert.equal(isValidInternalPath('/terms'), true);
  assert.equal(isValidInternalPath('/privacy'), true);

  // Security checks
  assert.equal(isValidInternalPath('//evil.com'), false);
  assert.equal(isValidInternalPath('/\\evil.com'), false);
  assert.equal(isValidInternalPath('https://evil.com'), false);
  assert.equal(isValidInternalPath('/overview\r\nevil'), false);

  // returnTo preservation for payment-history
  assert.equal(resolveSafeReturnUrl('/payment-history'), '/payment-history');
  const checkoutDest = resolveCheckoutDestination('price_123', '/payment-history');
  assert.equal(checkoutDest, '/pricing?checkoutPriceId=price_123&returnTo=%2Fpayment-history');
});

test('Corrective 3: publishPage passes concurrencyToken and PageForm handles 409 conflict', async () => {
  const [apiSource, pageSource] = await Promise.all([
    readSource('../src/services/siteContentApi.ts'),
    readSource('../src/app/(admin)/admin/site-content/page.tsx'),
  ]);
  assert.match(apiSource, /publishPage:\s*async\s*\(\s*key:\s*SitePageKey,\s*concurrencyToken:\s*string\s*\)\s*=>/);
  assert.match(apiSource, /post\(`\/admin\/site-pages\/\$\{key\}\/publish`,\s*\{\s*concurrencyToken\s*\}\)/);

  assert.match(pageSource, /siteContentApi\.publishPage\(pageKey,\s*value\.concurrencyToken\)/);
  assert.match(pageSource, /Nội dung đã được thay đổi ở nơi khác\. Hãy tải lại trước khi công bố\./);
  assert.match(pageSource, /invalidateQueries\(\{\s*queryKey:\s*\['admin-site-page',\s*pageKey\]\s*\}\)/);
});

test('Corrective 4: Draft vs Published badge distinguishes published with unpublished changes', async () => {
  const pageSource = await readSource('../src/app/(admin)/admin/site-content/page.tsx');
  assert.match(pageSource, /isDraftOnly\s*=\s*!value\.publishedAt/);
  assert.match(pageSource, /new Date\(value\.updatedAt\)\.getTime\(\)\s*>\s*new Date\(value\.publishedAt\)\.getTime\(\)/);
  assert.match(pageSource, /'Đã công bố · Có thay đổi chưa công bố'/);
  assert.match(pageSource, /'Đã công bố'/);
  assert.match(pageSource, /'Bản nháp'/);
});

test('Corrective 5: Footer uses dedicated TikTok SVG mark and does not import Music2', async () => {
  const footerSource = await readSource('../src/components/layouts/Footer.tsx');
  assert.doesNotMatch(footerSource, /import.*Music2.*from/);
  assert.doesNotMatch(footerSource, /icon:\s*Music2/);
  assert.match(footerSource, /TikTokMark/);
  assert.match(footerSource, /<svg[^>]*viewBox="0 0 24 24"/);
  assert.match(footerSource, /title=\{`\$\{label\}: Sắp cập nhật`\}/);
});
