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
