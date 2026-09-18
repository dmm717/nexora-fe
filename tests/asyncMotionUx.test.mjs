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

test('learning path retains deterministic domain states without dropping cached content', async () => {
  const learningPath = await source('src/components/features/learning-path/LearningPathView.tsx');

  assert.doesNotMatch(learningPath, /if\s*\(\s*error\s*\|\|\s*!path\s*\)/);
  assert.match(learningPath, /ACTIVE_CAREER_GOAL_REQUIRED/);
  assert.match(learningPath, /LEARNING_PATH_NOT_FOUND/);
  assert.match(learningPath, /showBackgroundError/);
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
