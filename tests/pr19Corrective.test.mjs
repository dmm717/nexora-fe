import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildInterviewPreflightPayload,
  isReadyResumeSelection,
} from '../src/services/interviewContract.ts';
import {
  getActivityDeepLink,
  getActiveLearningPathProgress,
  getLearningPathActivityDisposition,
} from '../src/services/learningPathContract.ts';
import {
  getRecommendationDeepLink,
  RecommendationActivityValues,
} from '../src/services/recommendationContract.ts';
import { resolveNextBestAction } from '../src/services/nextBestAction.ts';
import {
  formatFeatureAvailability,
  formatInterviewQuestionLimit,
  getExactEntitlementFeature,
} from '../src/services/billingPresentation.ts';
import { isFocusedPracticeRoute } from '../src/services/focusedPracticeRoutes.ts';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('A-G: preflight keeps all production types and preserves targeted payload rules', async () => {
  const source = await readSource('../src/app/(dashboard)/interviews/new/page.tsx');
  for (const type of [
    'technical',
    'behavioral',
    'scenario',
    'cv_targeted',
    'jd_targeted',
    'motivation_role_fit',
    'self_introduction',
  ]) {
    assert.match(source, new RegExp(`type: '${type}'`));
  }
  assert.match(source, /title: newJdTitle\.trim\(\)/);
  assert.match(source, /content: newJdContent\.trim\(\)/);
  assert.doesNotMatch(source, /JD - \$\{/);

  const jd = buildInterviewPreflightPayload({
    mode: 'manual',
    manualRole: 'Backend Engineer',
    manualSeniority: 'Senior',
    interviewType: 'jd_targeted',
    difficulty: 'hard',
    jobDescriptionId: 'jd-real',
  });
  assert.equal(jd.jobDescriptionId, 'jd-real');

  const unrelated = buildInterviewPreflightPayload({
    mode: 'manual',
    manualRole: 'Backend Engineer',
    manualSeniority: 'Senior',
    interviewType: 'technical',
    difficulty: 'hard',
    jobDescriptionId: 'must-not-leak',
    cvTargetedResumeId: 'must-not-leak',
  });
  assert.equal('jobDescriptionId' in unrelated, false);
  assert.equal('resumeId' in unrelated, false);

  const cv = buildInterviewPreflightPayload({
    mode: 'manual',
    manualRole: 'Backend Engineer',
    manualSeniority: 'Senior',
    interviewType: 'cv_targeted',
    difficulty: 'hard',
    cvTargetedResumeId: 'resume-ready',
  });
  assert.equal(cv.resumeId, 'resume-ready');
  assert.equal(isReadyResumeSelection('resume-ready', ['resume-ready']), true);
  assert.equal(isReadyResumeSelection('resume-stale', ['resume-ready']), false);

  const goal = buildInterviewPreflightPayload({
    mode: 'career_goal',
    careerGoalId: 'goal-1',
    manualRole: 'stale role',
    manualSeniority: 'stale seniority',
    interviewType: 'behavioral',
    difficulty: 'medium',
  });
  assert.equal(goal.careerGoalId, 'goal-1');
  assert.equal('role' in goal, false);
  assert.equal('seniority' in goal, false);
});

test('H-N: learning path statuses fail closed and obsolete is excluded', () => {
  assert.equal(getLearningPathActivityDisposition('pending'), 'pending');
  assert.equal(getLearningPathActivityDisposition('completed'), 'completed');
  assert.equal(getLearningPathActivityDisposition('obsolete'), 'obsolete');
  assert.equal(getLearningPathActivityDisposition('new_server_value'), 'unknown');

  const noLink = getActivityDeepLink({
    id: 'a', type: 'unknown', title: '', description: '', competencyCode: null,
    resourceId: null, externalUrl: null, priority: 1, status: 'pending', order: 1, completedAt: null,
  });
  assert.equal(noLink, null);

  const progress = getActiveLearningPathProgress([{ id: 'm', code: 'm', title: 'M', order: 1, status: 'pending', activities: [
    { id: 'p', type: 'interview', title: '', description: '', competencyCode: null, resourceId: null, externalUrl: null, priority: 1, status: 'pending', order: 1, completedAt: null },
    { id: 'c', type: 'interview', title: '', description: '', competencyCode: null, resourceId: null, externalUrl: null, priority: 1, status: 'completed', order: 2, completedAt: 'now' },
    { id: 'o', type: 'interview', title: '', description: '', competencyCode: null, resourceId: null, externalUrl: null, priority: 1, status: 'obsolete', order: 3, completedAt: null },
    { id: 'u', type: 'interview', title: '', description: '', competencyCode: null, resourceId: null, externalUrl: null, priority: 1, status: 'future', order: 4, completedAt: null },
  ] }]);
  assert.deepEqual(progress, { completedActivityCount: 1, totalActivityCount: 2, percentage: 50 });
});

test('O-T: recommendation routing uses only the canonical contract', () => {
  const make = (activityType, resourceId = null) => ({ reason: 'server', activityType, resourceId, estimatedMinutes: 0, priority: 1, action: null });
  assert.equal(getRecommendationDeepLink(make(RecommendationActivityValues.Scenario, 's-1')), '/practice/scenarios/s-1');
  assert.equal(getRecommendationDeepLink(make(RecommendationActivityValues.StarDrill)), '/practice/star');
  assert.equal(getRecommendationDeepLink(make(RecommendationActivityValues.Interview)), '/interviews/new');
  assert.equal(getRecommendationDeepLink(make(RecommendationActivityValues.ResumeImprovement)), '/resume-analyses');
  assert.equal(getRecommendationDeepLink(make(RecommendationActivityValues.ExternalLearning)), null);
  assert.equal(getRecommendationDeepLink(make('star')), null);
  assert.equal(resolveNextBestAction({ recommendation: make('star'), targetRole: 'BE', needsFirstEvidence: false }).destination, null);
});

test('U-Z: billing uses exact feature codes and server-owned limits', () => {
  const features = [
    { code: 'interview', name: 'Interview', enabled: true, limit: 4, consumed: 1, available: 3, unlimited: false },
    { code: 'interview_question_limit', name: 'Question limit', enabled: true, limit: 8, consumed: 0, available: 8, unlimited: false },
    { code: 'cv_analysis', name: 'CV', enabled: true, limit: null, consumed: 0, available: null, unlimited: true },
  ];
  assert.equal(getExactEntitlementFeature(features, 'interview')?.code, 'interview');
  assert.equal(getExactEntitlementFeature(features, 'interview_question_limit')?.limit, 8);
  assert.equal(formatFeatureAvailability(getExactEntitlementFeature(features, 'interview'), 'phiên'), '3 phiên');
  assert.equal(formatInterviewQuestionLimit(getExactEntitlementFeature(features, 'interview_question_limit')), '8 câu / phiên');
  assert.equal(formatFeatureAvailability(getExactEntitlementFeature(features, 'cv_analysis'), 'lần'), 'Không giới hạn');
  assert.equal(formatInterviewQuestionLimit(null), 'Chưa khả dụng');
});

test('AA-AE: null scores and history state stay truthful in source', async () => {
  const [analytics, skills, practice] = await Promise.all([
    readSource('../src/app/(dashboard)/analytics/page.tsx'),
    readSource('../src/components/features/skill-profile/SkillProfile.tsx'),
    readSource('../src/components/features/practice/PracticeHub.tsx'),
  ]);
  assert.match(analytics, /score === null \? 'Chưa chấm'/);
  assert.match(analytics, /score !== null && <AnimatedProgressBar/);
  assert.doesNotMatch(analytics, /\/ 6/);
  assert.match(skills, /Chưa đủ dữ liệu để xác định điểm cần cải thiện/);
  assert.match(practice, /historyLoading/);
  assert.match(practice, /historyError/);
  assert.ok(practice.indexOf('historyLoading ?') < practice.indexOf('Chưa có lịch sử luyện tập'));
});

test('AF-AI: focused routes remove global shell and use non-fabricated context', async () => {
  assert.equal(isFocusedPracticeRoute('/overview'), false);
  assert.equal(isFocusedPracticeRoute('/interviews/abc'), true);
  assert.equal(isFocusedPracticeRoute('/interviews/abc/report'), false);
  assert.equal(isFocusedPracticeRoute('/practice/star'), true);
  assert.equal(isFocusedPracticeRoute('/practice/scenarios/system-outage'), true);
  assert.equal(isFocusedPracticeRoute('/practice/scenarios'), false);

  const [layout, header, room, report] = await Promise.all([
    readSource('../src/components/layouts/DashboardLayout.tsx'),
    readSource('../src/components/header/FocusedPracticeHeader.tsx'),
    readSource('../src/app/(dashboard)/interviews/[id]/page.tsx'),
    readSource('../src/app/(dashboard)/interviews/[id]/report/page.tsx'),
  ]);
  assert.match(layout, /!focused && <AuthenticatedHeader/);
  assert.doesNotMatch(header, /Backend Engineer · Middle|Câu 1\/3/);
  assert.match(room, /const headerQuestionLabel = `Câu \$\{currentSequence\}`/);
  assert.match(room, /exitTo: '\/interviews'/);
  assert.doesNotMatch(report, /issuedQuestions \?\? 3/);
  assert.match(report, /totalCount == null/);
});

test('AJ-AR: remaining derived product semantics are removed', async () => {
  const [analytics, overview, skills] = await Promise.all([
    readSource('../src/app/(dashboard)/analytics/page.tsx'),
    readSource('../src/app/(dashboard)/overview/page.tsx'),
    readSource('../src/components/features/skill-profile/SkillProfile.tsx'),
  ]);

  assert.match(analytics, /getRecommendationDeepLink/);
  assert.match(analytics, /recommendationDestination && router\.push\(recommendationDestination\)/);
  assert.doesNotMatch(analytics, /nextRecommendedPractice[\s\S]{0,1200}router\.push\('\/interviews\/new'\)/);
  assert.doesNotMatch(analytics, /readiness\.score!?\s*>=\s*75/);
  assert.doesNotMatch(overview, /readiness\.score\s*>=\s*75/);
  assert.match(analytics, /evidenceCount === 0[\s\S]{0,160}Chưa đủ dữ liệu để xác định điểm cần cải thiện/);
  assert.match(skills, /normalizedScore !== null && \([\s\S]{0,240}<AnimatedProgressBar[\s\S]{0,160}value=\{normalizedScore\}/);
  assert.doesNotMatch(skills, /value=\{normalizedScore \?\? 0\}/);
  assert.match(skills, /normalizedScore != null \? `\$\{normalizedScore\}\/100` : 'Chưa chấm'/);
  assert.doesNotMatch(skills, /normalizedScore[^\n]*>=\s*(?:80|70)|\(normalizedScore \?\? 0\)\s*>=/);
  assert.doesNotMatch(overview, /new Date\(\)\.toISOString\(\)/);
});
