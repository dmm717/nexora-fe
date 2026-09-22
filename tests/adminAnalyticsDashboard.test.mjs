import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { formatMoneyMinor } from '../src/utils/formatters.ts';
import {
  advanceAdminTransactionCursor,
  canRetreatAdminTransactionCursor,
  resetAdminTransactionCursor,
  retreatAdminTransactionCursor,
} from '../src/services/adminTransactionPagination.ts';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('admin routes use a dedicated route group and no candidate dashboard layout', () => {
  assert.ok(existsSync(new URL('../src/app/(admin)/layout.tsx', import.meta.url)));
  assert.ok(!existsSync(new URL('../src/app/(dashboard)/admin', import.meta.url)));
  const layout = read('src/app/(admin)/layout.tsx');
  assert.match(layout, /RequireAuth/);
  assert.match(layout, /RequireAdmin/);
  assert.match(layout, /AdminLayout/);
  assert.doesNotMatch(layout, /DashboardLayout|AuthenticatedHeader/);
});

test('/admin renders the live dashboard instead of redirecting', () => {
  const page = read('src/app/(admin)/admin/page.tsx');
  const screen = read('src/components/features/admin/dashboard/AdminDashboardScreen.tsx');
  assert.doesNotMatch(page, /redirect\(/);
  assert.match(page, /AdminDashboardScreen/);
  assert.match(screen, /useAdminDashboard/);
  assert.match(screen, /AreaChart/);
  assert.match(screen, /ComposedChart/);
  assert.match(screen, /PieChart/);
  assert.doesNotMatch(screen, /Math\.random|mockData|fakeData/i);
});

test('admin API and query hooks keep all dashboard and transaction filters in query keys', () => {
  const api = read('src/services/adminApi.ts');
  const hooks = read('src/hooks/queries/useAdminDashboard.ts');
  assert.match(api, /\/admin\/dashboard/);
  assert.match(api, /\/admin\/transactions/);
  assert.match(api, /AdminTransactionView/);
  assert.match(hooks, /\['adminDashboard', filters\]/);
  assert.match(hooks, /\['adminTransactions', filters\]/);
});

test('admin navigation exposes all required operational sections', () => {
  const layout = read('src/components/layouts/AdminLayout.tsx');
  for (const route of ['/admin', '/admin/users', '/admin/transactions', '/admin/plans', '/admin/scenarios', '/overview']) {
    assert.match(layout, new RegExp(route.replaceAll('/', '\\/')));
  }
});

test('admin guard waits for user hydration and denies non-admin content', () => {
  const guard = read('src/components/providers/RequireAdmin.tsx');
  assert.match(guard, /userQuery\.isLoading/);
  assert.match(guard, /userQuery\.data\?\.roles\.some/);
  assert.match(guard, /userQuery\.isError \|\| !isAdmin/);
  assert.match(guard, /Không có quyền truy cập/);
});

test('dashboard controls, server series, errors, and empty states are explicit', () => {
  const screen = read('src/components/features/admin/dashboard/AdminDashboardScreen.tsx');
  for (const value of ['day', 'month', 'year']) assert.match(screen, new RegExp(`value="${value}"`));
  for (const field of ['revenueSeries', 'userGrowthSeries', 'planDistribution', 'transactionStatusDistribution', 'revenueByPlan']) {
    assert.match(screen, new RegExp(field));
  }
  assert.match(screen, /dashboard\.refetch/);
  assert.match(screen, /Chưa có doanh thu thành công/);
  assert.match(screen, /formatMoneyMinor/);
  assert.match(screen, /Asia\/Ho_Chi_Minh/);
  assert.doesNotMatch(screen, /Math\.random|mockData|fakeData/i);
});

test('transaction report exposes canonical filters, safe reference, and cursor paging', () => {
  const screen = read('src/components/features/admin/transactions/AdminTransactionsScreen.tsx');
  for (const field of ['search', 'status', 'planCode', 'currency', 'from', 'to', 'cursor']) {
    assert.match(screen, new RegExp(field));
  }
  for (const status of ['processing', 'pending', 'fulfilled', 'failed']) assert.match(screen, new RegExp(status));
  assert.match(screen, /providerTransactionId/);
  assert.match(screen, /nextCursor/);
  assert.match(screen, /formatMoneyMinor/);
  assert.match(screen, /Intl\.DateTimeFormat\('vi-VN'/);
  assert.match(screen, /advanceAdminTransactionCursor/);
  assert.match(screen, /retreatAdminTransactionCursor/);
  assert.match(screen, /resetAdminTransactionCursor/);
  assert.doesNotMatch(screen, /history\.back/);
});

test('admin money formatting converts generic minor units before display', () => {
  const normalizeSpaces = (value) => value.replace(/\u00a0/g, ' ');

  assert.equal(normalizeSpaces(formatMoneyMinor(49000, 'VND')), '49.000 ₫');
  assert.equal(formatMoneyMinor(4900, 'USD', 'en-US'), '$49.00');
  assert.equal(formatMoneyMinor(50, 'USD', 'en-US'), '$0.50');
  assert.equal(formatMoneyMinor(0, 'USD', 'en-US'), '$0.00');

  for (const path of [
    'src/components/features/admin/dashboard/AdminDashboardScreen.tsx',
    'src/components/features/admin/transactions/AdminTransactionsScreen.tsx',
  ]) {
    const source = read(path);
    assert.match(source, /formatMoneyMinor/);
    assert.doesNotMatch(source, /\.format\((?:row\.)?amountMinor\)/);
  }
});

test('transaction cursor state owns next, previous, filter reset, and direct-link safety', () => {
  const firstPage = resetAdminTransactionCursor();
  assert.deepEqual(firstPage, { cursor: undefined, previousCursors: [] });
  assert.equal(canRetreatAdminTransactionCursor(firstPage), false);
  assert.strictEqual(advanceAdminTransactionCursor(firstPage, undefined), firstPage);

  const secondPage = advanceAdminTransactionCursor(firstPage, 'cursor-2');
  assert.deepEqual(secondPage, { cursor: 'cursor-2', previousCursors: [undefined] });
  assert.equal(canRetreatAdminTransactionCursor(secondPage), true);

  const thirdPage = advanceAdminTransactionCursor(secondPage, 'cursor-3');
  assert.deepEqual(thirdPage, {
    cursor: 'cursor-3',
    previousCursors: [undefined, 'cursor-2'],
  });
  assert.deepEqual(retreatAdminTransactionCursor(thirdPage), secondPage);
  assert.deepEqual(retreatAdminTransactionCursor(secondPage), firstPage);

  const directCursor = { cursor: 'deep-link-cursor', previousCursors: [] };
  assert.equal(canRetreatAdminTransactionCursor(directCursor), false);
  assert.strictEqual(retreatAdminTransactionCursor(directCursor), directCursor);
  assert.deepEqual(resetAdminTransactionCursor(), firstPage);
});

test('existing admin user, plan, and scenario screens remain reachable after the move', () => {
  for (const path of [
    'src/app/(admin)/admin/users/page.tsx',
    'src/app/(admin)/admin/plans/page.tsx',
    'src/app/(admin)/admin/scenarios/page.tsx',
  ]) assert.ok(existsSync(new URL(`../${path}`, import.meta.url)));
});
