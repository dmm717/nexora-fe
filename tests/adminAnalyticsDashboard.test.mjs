import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

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
  assert.match(screen, /Intl\.NumberFormat\('vi-VN'/);
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
  assert.match(screen, /Intl\.NumberFormat\('vi-VN'/);
  assert.match(screen, /Intl\.DateTimeFormat\('vi-VN'/);
});

test('existing admin user, plan, and scenario screens remain reachable after the move', () => {
  for (const path of [
    'src/app/(admin)/admin/users/page.tsx',
    'src/app/(admin)/admin/plans/page.tsx',
    'src/app/(admin)/admin/scenarios/page.tsx',
  ]) assert.ok(existsSync(new URL(`../${path}`, import.meta.url)));
});
