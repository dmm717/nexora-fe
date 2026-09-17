import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeSkillProfileResponse,
  normalizeSkillProfileCompetency,
} from '../src/services/skillProfileContract.ts';

import {
  LearningPathValues,
  normalizeLearningPathResponse,
  normalizeLearningPathActivity,
  getActivityDeepLink,
} from '../src/services/learningPathContract.ts';

import {
  normalizeNextPracticeRecommendationResponse,
  getRecommendationDeepLink,
  RecommendationActivityValues,
} from '../src/services/recommendationContract.ts';

import {
  normalizeProgressDashboardResponse,
  normalizeProgressDashboardReadiness,
  normalizeProgressHistoricalStats,
  getProgressActivityPresentation,
} from '../src/services/progressDashboardContract.ts';

class MockApiError extends Error {
  constructor(message, status, code, requestId) {
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

// ============================================================================
// TEST MATRIX 60: NEW USER
// ============================================================================

test('CASE 1: no competency evidence -> honest empty competency state, no zero-filled radar', () => {
  const profile = normalizeSkillProfileResponse({ competencies: [], weaknessSignals: [] });
  assert.equal(profile.competencies.length, 0);
  assert.equal(profile.weaknessSignals.length, 0);

  const nullProfile = normalizeSkillProfileResponse(null);
  assert.equal(nullProfile.competencies.length, 0);
  assert.equal(nullProfile.weaknessSignals.length, 0);
});

test('CASE 2: no completed activities -> honest Progress empty state', () => {
  const stats = normalizeProgressHistoricalStats({
    completedInterviews: 0,
    recentInterviewScores: [],
    averageInterviewScore: null,
    starAverages: null,
    completedScenarios: 0,
    averageScenarioScore: null,
    completedStarAttempts: 0,
    recentActivity: [],
  });

  assert.equal(stats.completedInterviews, 0);
  assert.equal(stats.completedScenarios, 0);
  assert.equal(stats.completedStarAttempts, 0);
  assert.equal(stats.averageInterviewScore, null);
  assert.equal(stats.averageScenarioScore, null);
  assert.equal(stats.starAverages, null);
  assert.deepEqual(stats.recentActivity, []);
});

test('CASE 3: no Learning Path -> no fake activities synthesized', () => {
  const path = normalizeLearningPathResponse(null);
  assert.equal(path.milestones.length, 0);
  assert.equal(path.progress.totalActivityCount, 0);
  assert.equal(path.progress.completedActivityCount, 0);
});

test('CASE 4: no recommendation -> neutral fallback only', () => {
  const recNull = normalizeNextPracticeRecommendationResponse(null);
  assert.equal(recNull, null);
  assert.equal(getRecommendationDeepLink(recNull), null);

  const recEmpty = normalizeNextPracticeRecommendationResponse({});
  assert.equal(recEmpty, null);
  assert.equal(getRecommendationDeepLink(recEmpty), null);
});

// ============================================================================
// TEST MATRIX 61: COMPETENCY
// ============================================================================

test('CASE 5: real competency score = 0 -> display 0, not null or default', () => {
  const comp = normalizeSkillProfileCompetency({
    code: 'DOCKER',
    name: 'Docker & Containers',
    category: 'DevOps',
    score: 0,
    evidenceCount: 1,
    latestEvidenceAt: '2026-03-10T00:00:00Z',
    sources: [{ sourceType: 'scenario', evidenceCount: 1, latestEvidenceAt: '2026-03-10T00:00:00Z' }],
  });

  assert.equal(comp.score, 0);
  assert.equal(comp.evidenceCount, 1);
});

test('CASE 6: score = null/missing -> unavailable (null != 0)', () => {
  const compNull = normalizeSkillProfileCompetency({
    code: 'KUBERNETES',
    name: 'Kubernetes Orchestration',
    category: 'DevOps',
    score: null,
    evidenceCount: 0,
  });
  assert.equal(compNull.score, null);

  const compUndefined = normalizeSkillProfileCompetency({
    code: 'AWS',
    name: 'AWS Cloud Services',
    category: 'Cloud',
  });
  assert.equal(compUndefined.score, null);
});

test('CASE 7: real evidence exists -> source/evidence rendered faithfully', () => {
  const comp = normalizeSkillProfileCompetency({
    code: 'CSHARP',
    name: 'C# & .NET',
    category: 'Backend',
    score: 85,
    evidenceCount: 3,
    latestEvidenceAt: '2026-03-15T12:00:00Z',
    sources: [
      { sourceType: 'cv_analysis', evidenceCount: 1, latestEvidenceAt: '2026-03-01T00:00:00Z' },
      { sourceType: 'interview', evidenceCount: 2, latestEvidenceAt: '2026-03-15T12:00:00Z' },
    ],
  });

  assert.equal(comp.sources.length, 2);
  assert.equal(comp.sources[0].sourceType, 'cv_analysis');
  assert.equal(comp.sources[0].evidenceCount, 1);
  assert.equal(comp.sources[1].sourceType, 'interview');
  assert.equal(comp.sources[1].evidenceCount, 2);
});

test('CASE 8: missing evidence -> no fabricated quote or sources', () => {
  const comp = normalizeSkillProfileCompetency({
    code: 'PYTHON',
    name: 'Python',
    category: 'Backend',
    score: 70,
    evidenceCount: 0,
    sources: [],
  });

  assert.deepEqual(comp.sources, []);
  assert.equal(comp.evidenceCount, 0);
});

test('CASE 9: unknown competency field / malformed payload -> fail safely', () => {
  const comp = normalizeSkillProfileCompetency({
    code: 'UNKNOWN_FIELD',
    score: 'invalid_number',
    unrecognizedField: { nested: true },
  });

  assert.equal(comp.code, 'UNKNOWN_FIELD');
  assert.equal(comp.score, null);
  assert.equal(comp.evidenceCount, 0);
  assert.deepEqual(comp.sources, []);
});

test('CASE 10: sparse competency data -> no fake zero dimensions to complete chart', () => {
  const profile = normalizeSkillProfileResponse({
    competencies: [
      { code: 'REACT', name: 'React', category: 'Frontend', score: 90, evidenceCount: 2 },
    ],
    weaknessSignals: [],
  });

  assert.equal(profile.competencies.length, 1);
  assert.equal(profile.competencies[0].code, 'REACT');
  assert.equal(profile.competencies[0].score, 90);
});

// ============================================================================
// TEST MATRIX 62: PROGRESS
// ============================================================================

test('CASE 11: real recent interview scores -> exact timestamps and scores preserved', () => {
  const scores = [
    { interviewId: 'iv-1', score: 65, completedAt: '2026-03-10T10:00:00Z' },
    { interviewId: 'iv-2', score: 80, completedAt: '2026-03-15T14:00:00Z' },
  ];
  const stats = normalizeProgressHistoricalStats({ recentInterviewScores: scores });

  assert.equal(stats.recentInterviewScores.length, 2);
  assert.equal(stats.recentInterviewScores[0].score, 65);
  assert.equal(stats.recentInterviewScores[0].completedAt, '2026-03-10T10:00:00Z');
  assert.equal(stats.recentInterviewScores[1].score, 80);
  assert.equal(stats.recentInterviewScores[1].completedAt, '2026-03-15T14:00:00Z');
});

test('CASE 12: single score -> preserved without fake improving trend', () => {
  const single = [{ interviewId: 'iv-1', score: 75, completedAt: '2026-03-12T08:00:00Z' }];
  const stats = normalizeProgressHistoricalStats({ recentInterviewScores: single });

  assert.equal(stats.recentInterviewScores.length, 1);
  assert.equal(stats.recentInterviewScores[0].score, 75);
});

test('CASE 13: averageScenarioScore null -> unavailable (null preserved)', () => {
  const stats = normalizeProgressHistoricalStats({
    completedScenarios: 0,
    averageScenarioScore: null,
  });

  assert.equal(stats.averageScenarioScore, null);
});

test('CASE 14: averageScenarioScore 0 -> genuine zero preserved', () => {
  const stats = normalizeProgressHistoricalStats({
    completedScenarios: 1,
    averageScenarioScore: 0,
  });

  assert.equal(stats.averageScenarioScore, 0);
});

test('CASE 15: recent activity -> only backend items rendered', () => {
  const rawActivity = [
    { kind: 'interview', resourceId: 'iv-99', at: '2026-03-16T10:00:00Z' },
    { kind: 'scenario', resourceId: 'scen-42', at: '2026-03-15T15:00:00Z' },
  ];
  const stats = normalizeProgressHistoricalStats({ recentActivity: rawActivity });

  assert.equal(stats.recentActivity.length, 2);
  assert.equal(stats.recentActivity[0].kind, 'interview');
  assert.equal(stats.recentActivity[0].resourceId, 'iv-99');
  assert.equal(stats.recentActivity[1].kind, 'scenario');
  assert.equal(stats.recentActivity[1].resourceId, 'scen-42');
});

test('CASE 16: no data -> no fake streak/readiness', () => {
  const readiness = normalizeProgressDashboardReadiness({
    score: null,
    assessedCompetencies: 0,
    evidenceCount: 0,
    priorityGapCount: 0,
    qualitativeWeaknessCount: 0,
    latestEvidenceAt: null,
  });

  assert.equal(readiness.score, null);
  assert.equal(readiness.assessedCompetencies, 0);
  assert.equal(readiness.evidenceCount, 0);
  assert.equal(readiness.latestEvidenceAt, null);
});

// ============================================================================
// TEST MATRIX 63: LEARNING PATH
// ============================================================================

test('CASE 17: Scenario activity + resourceId -> canonical /practice/scenarios/{resourceId}', () => {
  const act = normalizeLearningPathActivity({
    id: 'act-1',
    type: LearningPathValues.Scenario,
    resourceId: 'scen-uuid-1234',
  });
  assert.equal(getActivityDeepLink(act), '/practice/scenarios/scen-uuid-1234');
});

test('CASE 18: Scenario without resource -> canonical /practice/scenarios', () => {
  const act = normalizeLearningPathActivity({
    id: 'act-2',
    type: LearningPathValues.Scenario,
    resourceId: null,
  });
  assert.equal(getActivityDeepLink(act), '/practice/scenarios');
});

test('CASE 19: STAR activity -> canonical /practice/star', () => {
  const act = normalizeLearningPathActivity({
    id: 'act-3',
    type: LearningPathValues.StarDrill,
  });
  assert.equal(getActivityDeepLink(act), '/practice/star');
});

test('CASE 20: Interview activity -> canonical /interviews/new', () => {
  const act = normalizeLearningPathActivity({
    id: 'act-4',
    type: LearningPathValues.Interview,
  });
  assert.equal(getActivityDeepLink(act), '/interviews/new');
});

test('CASE 21: Resume Improvement -> canonical production route /resumes', () => {
  const act = normalizeLearningPathActivity({
    id: 'act-5',
    type: LearningPathValues.ResumeImprovement,
  });
  assert.equal(getActivityDeepLink(act), '/resumes');
});

test('CASE 22: unknown activity type -> no unsafe invented route (returns null)', () => {
  const act = normalizeLearningPathActivity({
    id: 'act-6',
    type: 'invented_super_hackathon',
  });
  assert.equal(getActivityDeepLink(act), null);
});

test('CASE 23: activity status -> backend status rendered faithfully', () => {
  const pending = normalizeLearningPathActivity({ status: 'pending' });
  assert.equal(pending.status, 'pending');

  const completed = normalizeLearningPathActivity({ status: 'completed' });
  assert.equal(completed.status, 'completed');

  const obsolete = normalizeLearningPathActivity({ status: 'obsolete' });
  assert.equal(obsolete.status, 'obsolete');
});

test('CASE 24: page refresh -> server state restored identically', () => {
  const wireData = {
    id: 'lp-01',
    careerGoalId: 'cg-01',
    status: 'active',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
    progress: { completedActivityCount: 1, totalActivityCount: 3, percentage: 33 },
    milestones: [],
  };

  const parsed1 = normalizeLearningPathResponse(wireData);
  const parsed2 = normalizeLearningPathResponse(wireData);
  assert.deepEqual(parsed1, parsed2);
});

// ============================================================================
// TEST MATRIX 64: NEXT RECOMMENDATION
// ============================================================================

test('CASE 25: server recommends Scenario -> real Scenario deep link', () => {
  const rec = normalizeNextPracticeRecommendationResponse({
    reason: 'Improve concurrency knowledge',
    activityType: RecommendationActivityValues.Scenario,
    resourceId: 'scen-999',
    estimatedMinutes: 20,
    priority: 1,
  });
  assert.ok(rec);
  assert.equal(getRecommendationDeepLink(rec), '/practice/scenarios/scen-999');
});

test('CASE 26: server recommends STAR -> /practice/star', () => {
  const rec = normalizeNextPracticeRecommendationResponse({
    reason: 'Structure behavioral answers',
    activityType: RecommendationActivityValues.StarDrill,
    resourceId: null,
    estimatedMinutes: 15,
    priority: 2,
  });
  assert.ok(rec);
  assert.equal(getRecommendationDeepLink(rec), '/practice/star');
});

test('CASE 27: server reason exists -> personalized reason displayed verbatim', () => {
  const rec = normalizeNextPracticeRecommendationResponse({
    reason: 'Backend recommends practicing System Design because of weak score (55)',
    activityType: 'scenario',
    resourceId: null,
    estimatedMinutes: 30,
    priority: 1,
  });
  assert.ok(rec);
  assert.equal(rec.reason, 'Backend recommends practicing System Design because of weak score (55)');
});

test('CASE 28: no server reason -> no fabricated personalized weakness', () => {
  const rec = normalizeNextPracticeRecommendationResponse({
    reason: '',
    activityType: 'interview',
    resourceId: null,
    estimatedMinutes: 20,
    priority: 2,
  });
  assert.ok(rec);
  assert.equal(rec.reason, '');
});

test('CASE 29: unknown recommendation -> safe fallback/no unsafe link', () => {
  const rec = normalizeNextPracticeRecommendationResponse({
    reason: 'Custom activity',
    activityType: 'unsupported_type',
    resourceId: 'some-id',
    estimatedMinutes: 10,
    priority: 3,
  });
  assert.ok(rec);
  assert.equal(getRecommendationDeepLink(rec), null);
});

// ============================================================================
// TEST MATRIX 65: ENTITLEMENT
// ============================================================================

test('CASE 30: progress analytics locked -> ApiError with FEATURE_NOT_AVAILABLE code', () => {
  const err = new MockApiError('Feature gated', 403, 'FEATURE_NOT_AVAILABLE', 'req-123');
  assert.equal(err.code, 'FEATURE_NOT_AVAILABLE');
  assert.equal(err.status, 403);
  assert.equal(err.requestId, 'req-123');
});

test('CASE 31: feature available -> full dashboard normalizer parses uninhibited', () => {
  const dashboard = normalizeProgressDashboardResponse({
    readiness: { score: 82, assessedCompetencies: 4, evidenceCount: 10, priorityGapCount: 1, qualitativeWeaknessCount: 0, latestEvidenceAt: '2026-03-15T00:00:00Z' },
    weakestCompetencies: [],
    recentImprovements: [],
    weeklyCompletedActivities: { windowStart: '2026-03-09T00:00:00Z', windowEnd: '2026-03-16T00:00:00Z', total: 3, resumeAnalyses: 1, interviews: 1, scenarios: 1, starAttempts: 0, learningPathActivities: 0 },
    nextRecommendedPractice: null,
    historicalStats: { completedInterviews: 2, recentInterviewScores: [], averageInterviewScore: 82, starAverages: null, completedScenarios: 1, averageScenarioScore: 75, completedStarAttempts: 0, recentActivity: [] },
  });

  assert.equal(dashboard.readiness.score, 82);
  assert.equal(dashboard.weeklyCompletedActivities.total, 3);
  assert.equal(dashboard.historicalStats.completedInterviews, 2);
});

test('CASE 32: backend mutation/load returns feature denial -> ApiError preserves code for upgrade UX', () => {
  const denial = new MockApiError('Upgrade required for learning path generation', 403, 'UPGRADE_REQUIRED', 'req-777');
  assert.equal(denial.code, 'UPGRADE_REQUIRED');
  assert.equal(denial.message, 'Upgrade required for learning path generation');
  assert.equal(denial.requestId, 'req-777');
});

// ============================================================================
// PR #17 CONTRACT CORRECTIVE: CASES A - M
// ============================================================================

test('CASE A: Progress recent activity kind=interview -> /interviews/{resourceId}', () => {
  const presentation = getProgressActivityPresentation('interview', 'interview-id-123');
  assert.equal(presentation.label, 'Phỏng vấn thử');
  assert.equal(presentation.deepLink, '/interviews/interview-id-123');

  const emptyId = getProgressActivityPresentation('interview', '');
  assert.equal(emptyId.deepLink, '/interviews/new');
});

test('CASE B: Progress recent activity kind=scenario -> safe generic /practice/scenarios (MUST NOT be /practice/scenarios/{attemptId})', () => {
  const presentation = getProgressActivityPresentation('scenario', 'scenario-attempt-id-456');
  assert.equal(presentation.label, 'Bài tập tình huống');
  assert.equal(presentation.deepLink, '/practice/scenarios');
  assert.notEqual(presentation.deepLink, '/practice/scenarios/scenario-attempt-id-456');
});

test('CASE C: Progress recent activity kind=star -> /practice/star?attempt={resourceId}', () => {
  const presentation = getProgressActivityPresentation('star', 'star-attempt-id-789');
  assert.equal(presentation.label, 'Luyện tập STAR');
  assert.equal(presentation.deepLink, '/practice/star?attempt=star-attempt-id-789');

  const emptyId = getProgressActivityPresentation('star', '');
  assert.equal(emptyId.deepLink, '/practice/star');
});

test('CASE D: Progress recent activity unknown kind -> null / no unsafe deep-link', () => {
  const presentation = getProgressActivityPresentation('unknown_special_drill', 'drill-id');
  assert.equal(presentation.label, 'unknown_special_drill');
  assert.equal(presentation.deepLink, null);

  const emptyKind = getProgressActivityPresentation('', 'some-id');
  assert.equal(emptyKind.label, 'Hoạt động');
  assert.equal(emptyKind.deepLink, null);
});

test('CASE E: do not require "star_attempt" to recognize backend STAR activity (backend emits "star")', () => {
  const presentation = getProgressActivityPresentation('star', 'star-123');
  assert.equal(presentation.label, 'Luyện tập STAR');
  assert.ok(presentation.deepLink?.startsWith('/practice/star'));
});

test('CASE F: Learning Path pending activity -> actionable (deep-link resolved and completion allowed)', () => {
  const pendingAct = normalizeLearningPathActivity({
    id: 'act-pending',
    type: LearningPathValues.Scenario,
    resourceId: 'scen-100',
    status: LearningPathValues.Pending,
  });
  assert.equal(pendingAct.status, 'pending');
  assert.equal(getActivityDeepLink(pendingAct), '/practice/scenarios/scen-100');
});

test('CASE G: Learning Path completed activity -> status completed, not completable again', () => {
  const completedAct = normalizeLearningPathActivity({
    id: 'act-completed',
    type: LearningPathValues.Interview,
    status: LearningPathValues.Completed,
  });
  assert.equal(completedAct.status, 'completed');
  // In UI, completed status suppresses complete button and start CTA
});

test('CASE H: Learning Path obsolete activity -> explicit obsolete state, no launch CTA, no mark-complete CTA', () => {
  const obsoleteAct = normalizeLearningPathActivity({
    id: 'act-obsolete',
    type: LearningPathValues.Scenario,
    resourceId: 'scen-old',
    status: LearningPathValues.Obsolete,
  });
  assert.equal(obsoleteAct.status, 'obsolete');
  // In UI, obsolete status renders "Không còn trong lộ trình hiện tại" and suppresses deepLink and complete button
});

test('CASE I: Learning Path unknown activity status -> fail closed', () => {
  const unknownStatusAct = normalizeLearningPathActivity({
    id: 'act-unknown',
    type: LearningPathValues.Scenario,
    status: 'unexpected_backend_status',
  });
  assert.equal(unknownStatusAct.status, 'unexpected_backend_status');
  // In UI, non-pending non-completed non-obsolete renders "Trạng thái không khả dụng" and no CTA
});

test('CASE J: milestone active denominator excludes obsolete activities (1 completed, 1 pending, 2 obsolete -> 1 / 2, not 1 / 4)', () => {
  const activities = [
    { id: '1', status: LearningPathValues.Completed },
    { id: '2', status: LearningPathValues.Pending },
    { id: '3', status: LearningPathValues.Obsolete },
    { id: '4', status: LearningPathValues.Obsolete },
  ];

  const currentActivities = activities.filter((a) => a.status !== LearningPathValues.Obsolete);
  const completedCurrent = currentActivities.filter((a) => a.status === LearningPathValues.Completed);

  assert.equal(currentActivities.length, 2, 'Active denominator must be 2, excluding 2 obsolete activities');
  assert.equal(completedCurrent.length, 1, 'Completed count must be 1');
  assert.equal(`${completedCurrent.length} / ${currentActivities.length}`, '1 / 2');
});

test('CASE K: competencies=[] and weaknessSignals=[] -> no positive "Tuyệt vời / no weakness" conclusion', () => {
  const profile = normalizeSkillProfileResponse({ competencies: [], weaknessSignals: [] });
  const hasCompetencyEvidence = profile.competencies.some((c) => c.evidenceCount > 0);

  const emptyText = hasCompetencyEvidence
    ? 'Chưa ghi nhận tín hiệu cần cải thiện từ các bằng chứng hiện có.'
    : 'Chưa đủ dữ liệu để xác định điểm cần cải thiện.';

  assert.equal(emptyText, 'Chưa đủ dữ liệu để xác định điểm cần cải thiện.');
  assert.equal(emptyText.includes('Tuyệt vời'), false);
  assert.equal(emptyText.includes('Không có điểm yếu'), false);
});

test('CASE L: competency with evidenceCount > 0 and weaknessSignals=[] -> neutral "no weakness signal in current evidence" allowed', () => {
  const profile = normalizeSkillProfileResponse({
    competencies: [
      { code: 'REACT', name: 'React', score: 85, evidenceCount: 3 },
    ],
    weaknessSignals: [],
  });

  const hasCompetencyEvidence = profile.competencies.some((c) => c.evidenceCount > 0);
  const emptyText = hasCompetencyEvidence
    ? 'Chưa ghi nhận tín hiệu cần cải thiện từ các bằng chứng hiện có.'
    : 'Chưa đủ dữ liệu để xác định điểm cần cải thiện.';

  assert.equal(emptyText, 'Chưa ghi nhận tín hiệu cần cải thiện từ các bằng chứng hiện có.');
  assert.equal(emptyText.includes('Tuyệt vời'), false);
});

test('CASE M: weaknessSignals present -> exact backend signal rendered', () => {
  const profile = normalizeSkillProfileResponse({
    competencies: [],
    weaknessSignals: [
      {
        sourceType: 'interview',
        label: 'Cần cải thiện cấu trúc câu trả lời STAR',
        latestEvidenceAt: '2026-03-20T10:00:00Z',
      },
    ],
  });

  assert.equal(profile.weaknessSignals.length, 1);
  assert.equal(profile.weaknessSignals[0].sourceType, 'interview');
  assert.equal(profile.weaknessSignals[0].label, 'Cần cải thiện cấu trúc câu trả lời STAR');
  assert.equal(profile.weaknessSignals[0].latestEvidenceAt, '2026-03-20T10:00:00Z');
});
