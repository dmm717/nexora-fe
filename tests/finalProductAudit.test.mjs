import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isValidInternalPath,
  resolveSafeReturnUrl,
  isInterviewRoute,
} from '../src/utils/authIntent.ts';

import {
  getRecommendationDeepLink,
  RecommendationActivityValues,
  normalizeNextPracticeRecommendationResponse,
} from '../src/services/recommendationContract.ts';

import {
  getActivityDeepLink,
  LearningPathValues,
  normalizeLearningPathActivity,
} from '../src/services/learningPathContract.ts';

import {
  getProgressActivityPresentation,
  normalizeProgressDashboardReadiness,
  normalizeProgressHistoricalStats,
} from '../src/services/progressDashboardContract.ts';

import {
  normalizeSkillProfileCompetency,
} from '../src/services/skillProfileContract.ts';

test('Recommendation deep links route to canonical destinations', () => {
  assert.equal(
    getRecommendationDeepLink({ activityType: RecommendationActivityValues.Scenario, resourceId: 'arch-101' }),
    '/practice/scenarios/arch-101'
  );
  assert.equal(
    getRecommendationDeepLink({ activityType: RecommendationActivityValues.Scenario, resourceId: null }),
    '/practice/scenarios'
  );
  assert.equal(
    getRecommendationDeepLink({ activityType: RecommendationActivityValues.StarDrill, resourceId: null }),
    '/practice/star'
  );
  assert.equal(
    getRecommendationDeepLink({ activityType: RecommendationActivityValues.Interview, resourceId: null }),
    '/interviews/new'
  );
  assert.equal(
    getRecommendationDeepLink({ activityType: RecommendationActivityValues.ResumeImprovement, resourceId: null }),
    '/resume-analyses'
  );
  assert.equal(
    getRecommendationDeepLink({ activityType: RecommendationActivityValues.ExternalLearning, resourceId: null }),
    null
  );
  assert.equal(
    getRecommendationDeepLink({ activityType: 'unknown_practice_type', resourceId: 'foo' }),
    null
  );
  assert.equal(getRecommendationDeepLink(null), null);
});

test('Learning Path activity deep links route correctly and fail closed', () => {
  assert.equal(
    getActivityDeepLink({
      type: LearningPathValues.Scenario,
      resourceId: 'scen-99',
      externalUrl: null,
    }),
    '/practice/scenarios/scen-99'
  );
  assert.equal(
    getActivityDeepLink({
      type: LearningPathValues.Scenario,
      resourceId: null,
      externalUrl: null,
    }),
    '/practice/scenarios'
  );
  assert.equal(
    getActivityDeepLink({
      type: LearningPathValues.StarDrill,
      resourceId: null,
      externalUrl: null,
    }),
    '/practice/star'
  );
  assert.equal(
    getActivityDeepLink({
      type: LearningPathValues.Interview,
      resourceId: null,
      externalUrl: null,
    }),
    '/interviews/new'
  );
  assert.equal(
    getActivityDeepLink({
      type: LearningPathValues.ResumeImprovement,
      resourceId: null,
      externalUrl: null,
    }),
    '/resumes'
  );
  assert.equal(
    getActivityDeepLink({
      type: LearningPathValues.ExternalLearning,
      resourceId: null,
      externalUrl: 'https://developer.mozilla.org',
    }),
    'https://developer.mozilla.org'
  );
  assert.equal(
    getActivityDeepLink({
      type: LearningPathValues.ExternalLearning,
      resourceId: null,
      externalUrl: null,
    }),
    null
  );
  assert.equal(
    getActivityDeepLink({
      type: 'custom_hack',
      resourceId: 'foo',
      externalUrl: null,
    }),
    null
  );
});

test('Progress recent activity deep links map exact backend IDs safely', () => {
  const interviewAct = getProgressActivityPresentation('interview', 'int-123');
  assert.equal(interviewAct.label, 'Phỏng vấn thử');
  assert.equal(interviewAct.deepLink, '/interviews/int-123');

  const scenarioAct = getProgressActivityPresentation('scenario', 'att-456');
  assert.equal(scenarioAct.label, 'Bài tập tình huống');
  assert.equal(scenarioAct.deepLink, '/practice/scenarios');

  const starAct = getProgressActivityPresentation('star', 'star-789');
  assert.equal(starAct.label, 'Luyện tập STAR');
  assert.equal(starAct.deepLink, '/practice/star?attempt=star-789');

  const unknownAct = getProgressActivityPresentation('arbitrary_kind', '123');
  assert.equal(unknownAct.deepLink, null);
});

test('isValidInternalPath prevents open-redirect and protocol smuggling', () => {
  assert.equal(isValidInternalPath('/'), true);
  assert.equal(isValidInternalPath('/overview'), true);
  assert.equal(isValidInternalPath('/interviews/new'), true);
  assert.equal(isValidInternalPath('/practice/star'), true);
  assert.equal(isValidInternalPath('/account'), true);
  assert.equal(isValidInternalPath('/billing'), true);
  assert.equal(isValidInternalPath('/resume-analyses?mode=field_benchmark'), true);

  assert.equal(isValidInternalPath('https://malicious.com'), false);
  assert.equal(isValidInternalPath('//malicious.com'), false);
  assert.equal(isValidInternalPath('/\\malicious.com'), false);
  assert.equal(isValidInternalPath('javascript:alert(1)'), false);
  assert.equal(isValidInternalPath('data:text/html,hack'), false);
  assert.equal(isValidInternalPath('/unknown-route-outside-whitelist'), false);
  assert.equal(isValidInternalPath('/api/auth/logout'), false);
  assert.equal(isValidInternalPath(null), false);
  assert.equal(isValidInternalPath(''), false);
});

test('resolveSafeReturnUrl falls back safely when candidate is invalid', () => {
  assert.equal(resolveSafeReturnUrl('https://evil.com/phish', '/overview'), '/overview');
  assert.equal(resolveSafeReturnUrl('/account', '/overview'), '/account');
  assert.equal(resolveSafeReturnUrl('//evil.com', '/overview'), '/overview');
});

test('isInterviewRoute identifies canonical interview destinations', () => {
  assert.equal(isInterviewRoute('/interviews/new'), true);
  assert.equal(isInterviewRoute('/interviews/session-123'), true);
  assert.equal(isInterviewRoute('/practice/scenarios'), false);
  assert.equal(isInterviewRoute('/overview'), false);
});

test('Competency: preserves null / 0 score distinction', () => {
  const zeroComp = normalizeSkillProfileCompetency({
    code: 'react',
    name: 'React',
    category: 'Frontend',
    score: 0,
    evidenceCount: 1,
  });
  assert.equal(zeroComp.score, 0);

  const nullComp = normalizeSkillProfileCompetency({
    code: 'system_design',
    name: 'System Design',
    category: 'Architecture',
    score: null,
    evidenceCount: 0,
  });
  assert.equal(nullComp.score, null);
});

test('Progress Readiness: preserves null score when unassessed', () => {
  const readiness = normalizeProgressDashboardReadiness({
    score: null,
    assessedCompetencies: 0,
    evidenceCount: 0,
  });
  assert.equal(readiness.score, null);

  const genuineZeroReadiness = normalizeProgressDashboardReadiness({
    score: 0,
    assessedCompetencies: 1,
    evidenceCount: 1,
  });
  assert.equal(genuineZeroReadiness.score, 0);
});

test('Progress Historical Stats: preserves null averages without collapsing to zero', () => {
  const stats = normalizeProgressHistoricalStats({
    completedInterviews: 0,
    averageInterviewScore: null,
    completedScenarios: 0,
    averageScenarioScore: null,
    starAverages: null,
  });
  assert.equal(stats.averageInterviewScore, null);
  assert.equal(stats.averageScenarioScore, null);
  assert.equal(stats.starAverages, null);

  const zeroStats = normalizeProgressHistoricalStats({
    completedInterviews: 1,
    averageInterviewScore: 0,
    completedScenarios: 1,
    averageScenarioScore: 0,
  });
  assert.equal(zeroStats.averageInterviewScore, 0);
  assert.equal(zeroStats.averageScenarioScore, 0);
});

test('Learning path activity status normalizes and preserves obsolete', () => {
  const activity = normalizeLearningPathActivity({
    id: 'act-1',
    type: 'scenario',
    title: 'Design Auth',
    description: 'Security drill',
    status: 'obsolete',
    priority: 1,
    order: 0,
  });
  assert.equal(activity.status, 'obsolete');
});

test('Recommendation normalizes correctly with priority and estimatedMinutes', () => {
  const rec = normalizeNextPracticeRecommendationResponse({
    reason: 'Cần nâng cao kỹ năng xử lý tình huống',
    activityType: 'scenario',
    resourceId: 'scen-101',
    estimatedMinutes: 15,
    priority: 1,
    action: {
      type: 'retry_scenario',
      reason: 'Điểm bài trước thấp',
    },
  });
  assert.equal(rec.activityType, 'scenario');
  assert.equal(rec.estimatedMinutes, 15);
  assert.equal(rec.action.type, 'retry_scenario');
});
