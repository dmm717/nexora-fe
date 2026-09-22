import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = async (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const queryPresentationSource = await source('src/utils/queryPresentation.ts');
const queryPresentationJs = ts.transpileModule(queryPresentationSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const queryPresentationModule = await import(
  `data:text/javascript;base64,${Buffer.from(queryPresentationJs).toString('base64')}`
);
const getQueryPresentation = queryPresentationModule.getQueryPresentation;
const getLearningPathPresentation = queryPresentationModule.getLearningPathPresentation;
const getProgressDashboardPresentation = queryPresentationModule.getProgressDashboardPresentation;
const isProgressDashboardFeatureLocked = queryPresentationModule.isProgressDashboardFeatureLocked;

test('query presentation distinguishes initial loading from loaded empty data', () => {
  assert.deepEqual(
    getQueryPresentation({ hasData: false, isLoading: true, isError: false, isFetching: true }),
    {
      showInitialLoading: true,
      showBlockingError: false,
      showBackgroundError: false,
      showRefreshing: false,
    },
  );

  // The caller reports hasData=true for a successfully loaded [] collection.
  assert.deepEqual(
    getQueryPresentation({ hasData: true, isLoading: false, isError: false, isFetching: false }),
    {
      showInitialLoading: false,
      showBlockingError: false,
      showBackgroundError: false,
      showRefreshing: false,
    },
  );
});

test('query presentation blocks only errors with no usable cached data', () => {
  assert.deepEqual(
    getQueryPresentation({ hasData: false, isLoading: false, isError: true, isFetching: false }),
    {
      showInitialLoading: false,
      showBlockingError: true,
      showBackgroundError: false,
      showRefreshing: false,
    },
  );

  assert.deepEqual(
    getQueryPresentation({ hasData: true, isLoading: false, isError: true, isFetching: false }),
    {
      showInitialLoading: false,
      showBlockingError: false,
      showBackgroundError: true,
      showRefreshing: false,
    },
  );
});

test('query presentation keeps cached content visible during a background fetch', () => {
  assert.deepEqual(
    getQueryPresentation({ hasData: true, isLoading: false, isError: false, isFetching: true }),
    {
      showInitialLoading: false,
      showBlockingError: false,
      showBackgroundError: false,
      showRefreshing: true,
    },
  );
});

test('career profile and resume sections preserve cached data on refetch errors', async () => {
  const careerProfile = await source('src/components/features/career-profile/CareerProfileScreen.tsx');
  const resumes = await source('src/components/features/career-profile/ResumeManagementSection.tsx');

  assert.doesNotMatch(careerProfile, /if\s*\(\s*isError\s*\|\|\s*!profileData\s*\)/);
  assert.match(careerProfile, /showBackgroundError/);
  assert.match(resumes, /showBackgroundError/);
  assert.match(resumes, /resumes\s*!==\s*undefined/);
});

test('history errors cannot fall through to confirmed-empty presentation', async () => {
  const interviews = await source('src/app/(dashboard)/interviews/page.tsx');
  const jobDescriptions = await source('src/app/(dashboard)/job-descriptions/page.tsx');

  assert.match(interviews, /error/);
  assert.match(interviews, /refetch/);
  assert.match(interviews, /showBlockingError/);
  assert.match(interviews, /showBackgroundError/);
  assert.match(jobDescriptions, /error/);
  assert.match(jobDescriptions, /refetch/);
  assert.match(jobDescriptions, /showBlockingError/);
  assert.match(jobDescriptions, /showBackgroundError/);
});

test('learning path deterministic responses override cached data while transient errors preserve it', async () => {
  const cachedPath = { id: 'cached-path' };
  const noGoal = getLearningPathPresentation({
    data: cachedPath,
    errorCode: 'ACTIVE_CAREER_GOAL_REQUIRED',
    errorStatus: 404,
    isLoading: false,
    isError: true,
    isFetching: false,
  });
  assert.equal(noGoal.domainState, 'no_goal');
  assert.equal(noGoal.data, undefined);
  assert.equal(noGoal.showBackgroundError, false);
  assert.equal(noGoal.showBlockingError, false);

  const notCreated = getLearningPathPresentation({
    data: cachedPath,
    errorCode: 'LEARNING_PATH_NOT_FOUND',
    isLoading: false,
    isError: true,
    isFetching: false,
  });
  assert.equal(notCreated.domainState, 'not_created');
  assert.equal(notCreated.data, undefined);

  const notCreatedByStatus = getLearningPathPresentation({
    data: cachedPath,
    errorStatus: 404,
    isLoading: false,
    isError: true,
    isFetching: false,
  });
  assert.equal(notCreatedByStatus.domainState, 'not_created');
  assert.equal(notCreatedByStatus.data, undefined);

  const transientWithCache = getLearningPathPresentation({
    data: cachedPath,
    errorStatus: 503,
    isLoading: false,
    isError: true,
    isFetching: false,
  });
  assert.equal(transientWithCache.domainState, 'normal');
  assert.equal(transientWithCache.data, cachedPath);
  assert.equal(transientWithCache.showBackgroundError, true);
  assert.equal(transientWithCache.showBlockingError, false);

  const transientWithoutCache = getLearningPathPresentation({
    data: undefined,
    errorStatus: 503,
    isLoading: false,
    isError: true,
    isFetching: false,
  });
  assert.equal(transientWithoutCache.showBlockingError, true);
  assert.equal(transientWithoutCache.showBackgroundError, false);

  const learningPath = await source('src/components/features/learning-path/LearningPathView.tsx');
  const overview = await source('src/app/(dashboard)/overview/page.tsx');
  const practiceHub = await source('src/components/features/practice/PracticeHub.tsx');

  assert.match(learningPath, /getLearningPathPresentation/);
  assert.match(overview, /getLearningPathPresentation/);
  assert.match(overview, /learningPathDataForDisplay/);
  assert.match(overview, /hasAvailableLearningPath\(\s*learningPathDataForDisplay/);
  assert.doesNotMatch(overview, /hasAvailableLearningPath\(\s*learningPathData,/);
  assert.match(practiceHub, /getLearningPathPresentation/);
  assert.match(practiceHub, /const learningPath = learningPathPresentation\.data/);
});

test('Progress Dashboard distinguishes unavailable, cached background errors, and feature locks', async () => {
  const unavailable = getProgressDashboardPresentation({
    hasData: false,
    isLoading: false,
    isError: true,
    isFetching: false,
    featureLocked: false,
  });
  assert.equal(unavailable.showBlockingError, true);
  assert.equal(unavailable.showBackgroundError, false);

  const cachedFailure = getProgressDashboardPresentation({
    hasData: true,
    isLoading: false,
    isError: true,
    isFetching: false,
    featureLocked: false,
  });
  assert.equal(cachedFailure.hasData, true);
  assert.equal(cachedFailure.showBackgroundError, true);
  assert.equal(cachedFailure.showBlockingError, false);

  const lockedCachedProgress = getProgressDashboardPresentation({
    hasData: true,
    isLoading: false,
    isError: true,
    isFetching: false,
    featureLocked: isProgressDashboardFeatureLocked({ code: 'FEATURE_NOT_AVAILABLE', status: 403 }),
  });
  assert.equal(lockedCachedProgress.hasData, false);
  assert.equal(lockedCachedProgress.showBackgroundError, false);
  assert.equal(lockedCachedProgress.showBlockingError, false);
  assert.equal(isProgressDashboardFeatureLocked({ status: 403 }), true);
  assert.equal(isProgressDashboardFeatureLocked({ code: 'FEATURE_NOT_AVAILABLE' }), true);
  assert.equal(isProgressDashboardFeatureLocked({ status: 503 }), false);

  const analytics = await source('src/app/(dashboard)/analytics/page.tsx');
  assert.match(analytics, /getProgressDashboardPresentation/);
  assert.match(analytics, /isProgressDashboardFeatureLocked/);
  assert.match(analytics, /progressPresentation\.showBackgroundError/);
  assert.match(analytics, /Chưa thể cập nhật tiến độ lúc này\. Dữ liệu đã tải trước đó vẫn được giữ\./);
});

test('career goals only call the list empty when its authority is known', async () => {
  const careerGoals = await source('src/components/features/career-profile/CareerGoalsSection.tsx');

  assert.match(careerGoals, /goalsData\s*!==\s*undefined|hasLoadedGoals/);
  assert.doesNotMatch(careerGoals, /const hasNoGoals\s*=\s*!activeGoal\s*&&\s*otherGoals\.length\s*===\s*0\s*&&\s*!isGoalsLoading\s*;/);
});

test('scenario progress errors do not manufacture a new-user zero', async () => {
  const scenarios = await source('src/app/(dashboard)/scenarios/page.tsx');
  const scenarioHook = await source('src/hooks/queries/useScenarios.ts');

  assert.doesNotMatch(scenarios, /progressData\?\.completedAttempts\s*\?\?\s*0\)\s*===\s*0/);
  assert.match(scenarios, /progressError|progressQuery/);
  assert.match(scenarioHook, /placeholderData/);
  assert.match(scenarios, /StaggerContainer/);
  assert.match(scenarios, /Đang cập nhật kết quả/);
  assert.match(scenarios, /disabled=\{!pagination\.hasNextPage \|\| scenariosFetching\}/);
  assert.doesNotMatch(scenarios, /scenarios\.slice\(0,\s*8\)/);
});

test('billing keeps account and catalogue query failures separate', async () => {
  const billing = await source('src/app/(dashboard)/billing/page.tsx');

  assert.match(billing, /plansHaveError/);
  assert.match(billing, /userHasError/);
  assert.match(billing, /showBlockingError/);
  assert.match(billing, /showBackgroundError/);
  assert.doesNotMatch(billing, /const loading\s*=\s*loadingPlans\s*\|\|\s*loadingUser/);
});

test('target lists use shared motion and route surfaces avoid redundant MotionPage wrappers', async () => {
  const analytics = await source('src/app/(dashboard)/analytics/page.tsx');
  const interviews = await source('src/app/(dashboard)/interviews/page.tsx');
  const jobDescriptions = await source('src/app/(dashboard)/job-descriptions/page.tsx');
  const skillProfile = await source('src/components/features/skill-profile/SkillProfile.tsx');
  const learningPath = await source('src/components/features/learning-path/LearningPathView.tsx');
  const motionTokens = await source('src/components/motion/tokens.ts');

  assert.doesNotMatch(analytics, /<MotionPage\b/);
  assert.doesNotMatch(learningPath, /<MotionPage\b/);
  for (const screen of [interviews, jobDescriptions, skillProfile]) {
    assert.match(screen, /StaggerContainer/);
    assert.match(screen, /StaggerItem/);
  }
  assert.match(motionTokens, /normal:\s*0\.0[4-7]/);
});

test('async list and profile surfaces use the shared skeleton primitive', async () => {
  const screens = await Promise.all([
    source('src/app/(dashboard)/analytics/page.tsx'),
    source('src/app/(dashboard)/overview/page.tsx'),
    source('src/app/(dashboard)/interviews/page.tsx'),
    source('src/app/(dashboard)/job-descriptions/page.tsx'),
    source('src/app/(dashboard)/billing/page.tsx'),
    source('src/app/(dashboard)/scenarios/page.tsx'),
    source('src/components/features/learning-path/LearningPathView.tsx'),
    source('src/components/features/skill-profile/SkillProfile.tsx'),
  ]);

  for (const screen of screens) assert.match(screen, /Skeleton/);
});
