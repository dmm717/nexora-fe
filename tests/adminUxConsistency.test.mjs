import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const queryPresentationSource = await source('src/utils/queryPresentation.ts');
const queryPresentationJs = ts.transpileModule(queryPresentationSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { getQueryPresentation } = await import(
  `data:text/javascript;base64,${Buffer.from(queryPresentationJs).toString('base64')}`
);
const userStatusTransitionSource = await source('src/utils/userStatusTransition.ts');
const userStatusTransitionJs = ts.transpileModule(userStatusTransitionSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { getUserStatusTransition } = await import(
  `data:text/javascript;base64,${Buffer.from(userStatusTransitionJs).toString('base64')}`
);

test('admin query presentation distinguishes unavailable data, cached refresh, errors, and loaded empty collections', () => {
  assert.deepEqual(
    getQueryPresentation({ hasData: false, isLoading: true, isError: false, isFetching: true }),
    { showInitialLoading: true, showBlockingError: false, showBackgroundError: false, showRefreshing: false },
  );
  assert.deepEqual(
    getQueryPresentation({ hasData: false, isLoading: false, isError: true, isFetching: false }),
    { showInitialLoading: false, showBlockingError: true, showBackgroundError: false, showRefreshing: false },
  );
  assert.deepEqual(
    getQueryPresentation({ hasData: true, isLoading: false, isError: false, isFetching: true }),
    { showInitialLoading: false, showBlockingError: false, showBackgroundError: false, showRefreshing: true },
  );
  assert.deepEqual(
    getQueryPresentation({ hasData: true, isLoading: false, isError: true, isFetching: false }),
    { showInitialLoading: false, showBlockingError: false, showBackgroundError: true, showRefreshing: false },
  );
  const retryAfterBackgroundError = getQueryPresentation({
    hasData: true,
    isLoading: false,
    isError: true,
    isFetching: true,
  });
  assert.deepEqual(retryAfterBackgroundError, {
    showInitialLoading: false,
    showBlockingError: false,
    showBackgroundError: true,
    showRefreshing: true,
  });
  // A successful [] is authoritative because the caller reports hasData=true.
  assert.equal(
    getQueryPresentation({ hasData: true, isLoading: false, isError: false, isFetching: false }).showBlockingError,
    false,
  );
});

test('admin page shell leaves the main landmark to the shared dashboard layout', async () => {
  const shell = await source('src/components/features/admin/AdminPageShell.tsx');
  const dashboardShell = await source('src/components/layouts/FocusedPracticeShellContext.tsx');

  assert.doesNotMatch(shell, /<main\b/i);
  assert.match(dashboardShell, /<main\b/i);
  assert.match(shell, /return\s*\(\s*<div\b/);
  assert.match(shell, /<h1\b/);
  assert.match(shell, /<nav\s+aria-label=/);
});

test('scenario retry after a background error shows the error notice without a contradictory refreshing notice', async () => {
  const retryState = getQueryPresentation({
    hasData: true,
    isLoading: false,
    isError: true,
    isFetching: true,
  });
  const consumers = [
    ['src/app/(dashboard)/admin/scenarios/page.tsx', 'presentation'],
    ['src/components/features/admin/scenarios/CategoryListModal.tsx', 'presentation'],
    ['src/components/features/admin/scenarios/ScenarioModal.tsx', 'categoryPresentation'],
  ];

  for (const [path, stateName] of consumers) {
    const component = await source(path);
    assert.match(
      component,
      new RegExp(`${stateName}\\.showRefreshing\\s*&&\\s*!${stateName}\\.showBackgroundError\\s*&&\\s*\\(`),
      `${path} should suppress refreshing while its cached query is in background-error state`,
    );
    assert.match(
      component,
      new RegExp(`${stateName}\\.showBackgroundError\\s*&&\\s*\\([\\s\\S]*?<AdminAsyncNotice kind="error"`),
      `${path} should retain the retryable background error notice`,
    );
  }

  const visibleNotices = {
    refreshing: retryState.showRefreshing && !retryState.showBackgroundError,
    error: retryState.showBackgroundError,
  };
  assert.deepEqual(visibleNotices, { refreshing: false, error: true });
});

test('user status modal only submits a real lock or unlock transition', async () => {
  const modal = await source('src/components/features/admin/users/UserStatusModal.tsx');

  assert.equal(getUserStatusTransition(true, true), null);
  assert.equal(getUserStatusTransition(true, false), 'lock');
  assert.equal(getUserStatusTransition(false, false), null);
  assert.equal(getUserStatusTransition(false, true), 'unlock');
  assert.match(modal, /disabled=\{!transition\s*\|\|\s*isPending\}/);
  assert.match(modal, /if\s*\(isPending\s*\|\|\s*!transition\)\s*return/);
  assert.match(modal, /variant=\{transition === 'lock' \? 'danger' : 'primary'\}/);
  assert.match(modal, /transition === 'lock'[\s\S]*?'Xác nhận khóa tài khoản'[\s\S]*?transition === 'unlock'[\s\S]*?'Xác nhận mở khóa'/);
  assert.match(modal, /reason:\s*z\.string\(\)\.min\(5/);
  assert.match(modal, /data:\s*\{\s*active:\s*formValues\.active,\s*reason:\s*formValues\.reason\s*\}/);
});

test('admin collection surfaces do not collapse missing/error data into empty arrays', async () => {
  const users = await source('src/app/(dashboard)/admin/users/page.tsx');
  const scenarios = await source('src/app/(dashboard)/admin/scenarios/page.tsx');
  const plans = await source('src/app/(dashboard)/admin/plans/page.tsx');
  const categories = await source('src/components/features/admin/scenarios/CategoryListModal.tsx');

  for (const page of [users, scenarios, plans, categories]) {
    assert.doesNotMatch(page, /data\s*:\s*(?:users|plans|scenarios|categories)\s*=\s*\[\]/);
    assert.match(page, /showInitialLoading/);
    assert.match(page, /showBlockingError/);
  }
  assert.match(users, /data\s*!==\s*undefined/);
  assert.match(scenarios, /hasData:\s*scenarios\s*!==\s*undefined/);
  assert.match(plans, /hasData:\s*plans\s*!==\s*undefined/);
  assert.match(categories, /hasData:\s*categories\s*!==\s*undefined/);
  assert.match(plans, /plans\s*!==\s*undefined\s*&&\s*plans\.length\s*===\s*0/);
  assert.match(scenarios, /scenarios\s*!==\s*undefined\s*&&\s*scenarios\.length\s*===\s*0/);
  assert.match(categories, /categories\s*!==\s*undefined\s*&&\s*categories\.length\s*===\s*0/);
});

test('users retain rows during refresh and keep pagination available after an empty or failed cursor page', async () => {
  const page = await source('src/app/(dashboard)/admin/users/page.tsx');
  const hook = await source('src/hooks/queries/useAdminUsers.ts');

  assert.match(hook, /placeholderData:\s*keepPreviousData/);
  assert.match(page, /isPlaceholderData/);
  assert.match(page, /data\s*!==\s*undefined\s*&&\s*!isPlaceholderData/);
  assert.match(page, /showBackgroundError/);
  assert.match(page, /showRefreshing/);
  assert.match(page, /cursorStack\.length\s*>\s*0/);
  assert.match(page, /cursorActionLock\.current/);
  assert.match(page, /refetch\(\)/);
  assert.doesNotMatch(page, /absolute\s+inset-0[\s\S]{0,180}isFetching/);
});

test('cursor transitions do not treat placeholder rows as the requested page or permit repeated navigation', async () => {
  const page = await source('src/app/(dashboard)/admin/users/page.tsx');

  assert.match(page, /hasCurrentPageData\s*=\s*data\s*!==\s*undefined\s*&&\s*!isPlaceholderData/);
  assert.match(page, /if\s*\(cursorActionLock\.current\s*\|\|\s*isFetching\s*\|\|\s*isPlaceholderData\s*\|\|\s*!data\?\.lastId\)/);
  assert.match(page, /disabled=\{!hasNextPage\s*\|\|\s*isFetching\s*\|\|\s*isPlaceholderData\}/);
  assert.match(page, /setCursorStack\(\(stack\)\s*=>\s*stack\.slice\(0,\s*-1\)\)/);
  assert.match(page, /onClick=\{retry\}/);
  assert.match(page, /Kết quả đang hiển thị tạm thời thuộc trang trước/);
});

test('scenario mutations are scoped to their target row and archive uses an accessible confirmation', async () => {
  const page = await source('src/app/(dashboard)/admin/scenarios/page.tsx');

  assert.match(page, /useMutationState/);
  assert.match(page, /mutation\.state\.variables/);
  assert.match(page, /pendingPublishIds\.some\(\(id\)\s*=>\s*id\s*===\s*scenario\.id\)/);
  assert.match(page, /pendingArchiveIds\.some\(\(id\)\s*=>\s*id\s*===\s*scenario\.id\)/);
  assert.doesNotMatch(page, /disabled=\{(?:publish|archive)Mutation\.isPending\}/);
  assert.match(page, /<Modal[\s\S]*?isOpen=\{archiveTarget !== null\}/);
  assert.match(page, /title=\{archiveTarget \? `Lưu trữ “\$\{archiveTarget\.title\}”\?/);
  assert.match(page, /onClick=\{\(\)\s*=>\s*setArchiveTarget\(null\)\}[\s\S]*?Hủy/);
  assert.doesNotMatch(page, /window\.confirm\s*\(/);
});

test('scenario category selectors distinguish unknown, failed, and authoritative empty categories', async () => {
  const modal = await source('src/components/features/admin/scenarios/ScenarioModal.tsx');
  const list = await source('src/components/features/admin/scenarios/CategoryListModal.tsx');

  for (const component of [modal, list]) {
    assert.match(component, /showInitialLoading/);
    assert.match(component, /showBlockingError/);
    assert.match(component, /showBackgroundError/);
  }
  assert.match(modal, /categories !== undefined && categories\.length === 0/);
  assert.match(list, /categories !== undefined && categories\.length === 0/);
  assert.match(modal, /categories === undefined \|\| categories\.length === 0/);
});

test('feature matrix shows loading/error/empty states from query authority and retains its local form across refreshes', async () => {
  const featureMatrix = await source('src/components/features/admin/plans/FeatureMatrixModal.tsx');

  assert.match(featureMatrix, /hasData:\s*featureDefs\s*!==\s*undefined/);
  assert.match(featureMatrix, /showInitialLoading/);
  assert.match(featureMatrix, /showBlockingError/);
  assert.match(featureMatrix, /showBackgroundError/);
  assert.match(featureMatrix, /featureDefs !== undefined && featureDefs\.length === 0/);
  assert.match(featureMatrix, /key=\{`\$\{price\.id\}:\$\{featureDefs\.map/);
  assert.doesNotMatch(featureMatrix, /data\s*:\s*featureDefs\s*=\s*\[\]/);
});

test('user details are identity-gated so switching users cannot show prior-user data', async () => {
  const detail = await source('src/components/features/admin/users/UserDetailModal.tsx');

  assert.match(detail, /detailsQuery\.data\?\.id\s*===\s*userId\s*\?\s*detailsQuery\.data\s*:\s*undefined/);
  assert.match(detail, /showInitialLoading/);
  assert.match(detail, /showBlockingError/);
  assert.match(detail, /showBackgroundError/);
});

test('admin tables remain semantic and route motion stays owned by the shared dashboard boundary', async () => {
  const tableShell = await source('src/components/features/admin/AdminTableShell.tsx');
  const skeleton = await source('src/components/features/admin/AdminTableSkeleton.tsx');
  const pages = await Promise.all([
    source('src/app/(dashboard)/admin/users/page.tsx'),
    source('src/app/(dashboard)/admin/scenarios/page.tsx'),
    source('src/app/(dashboard)/admin/plans/page.tsx'),
  ]);

  assert.match(tableShell, /<table\b/);
  assert.match(skeleton, /<thead/);
  assert.match(skeleton, /<tbody/);
  assert.match(skeleton, /role="status"/);
  assert.match(skeleton, /aria-label=\{statusLabel\}/);
  for (const page of pages) {
    assert.match(page, /scope="col"/);
    assert.doesNotMatch(page, /<MotionPage\b/);
  }
});
