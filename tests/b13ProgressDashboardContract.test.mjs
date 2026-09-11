import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeProgressDashboardReadiness,
  normalizeProgressDashboardCompetency,
  normalizeProgressDashboardImprovement,
  normalizeProgressDashboardWeeklyActivities,
  normalizeProgressHistoricalStats,
  normalizeProgressDashboardResponse,
  normalizeNextPracticeRecommendationResponse as progressExportedNormalizeRecommendation,
} from '../src/services/progressDashboardContract.ts';

import {
  normalizeNextPracticeRecommendationResponse as canonicalNormalizeRecommendation,
  getRecommendationDeepLink,
} from '../src/services/recommendationContract.ts';

// ---------------------------------------------------------------------------
// B13 Progress Dashboard Contract & Normalization Tests
// ---------------------------------------------------------------------------

test('1. readiness: null or undefined score remains null (insufficient data)', () => {
  const res1 = normalizeProgressDashboardReadiness({ score: null, assessedCompetencies: 0 });
  assert.equal(res1.score, null);

  const res2 = normalizeProgressDashboardReadiness({});
  assert.equal(res2.score, null);

  const res3 = normalizeProgressDashboardReadiness(null);
  assert.equal(res3.score, null);
});

test('2. readiness: valid integer score (0-100) is preserved', () => {
  const res = normalizeProgressDashboardReadiness({
    score: 78,
    assessedCompetencies: 5,
    evidenceCount: 14,
    priorityGapCount: 2,
    qualitativeWeaknessCount: 1,
    latestEvidenceAt: '2026-03-31T10:00:00Z',
  });
  assert.equal(res.score, 78);
  assert.equal(res.assessedCompetencies, 5);
  assert.equal(res.evidenceCount, 14);
  assert.equal(res.priorityGapCount, 2);
  assert.equal(res.qualitativeWeaknessCount, 1);
  assert.equal(res.latestEvidenceAt, '2026-03-31T10:00:00Z');
});

test('3. readiness: score = 0 is preserved as 0, not coerced to null or default', () => {
  const res = normalizeProgressDashboardReadiness({
    score: 0,
    assessedCompetencies: 3,
    evidenceCount: 3,
  });
  assert.equal(res.score, 0);
  assert.equal(res.assessedCompetencies, 3);
});

test('4. readiness: latestEvidenceAt handles null or whitespace safely', () => {
  const resNull = normalizeProgressDashboardReadiness({ latestEvidenceAt: null });
  assert.equal(resNull.latestEvidenceAt, null);

  const resEmpty = normalizeProgressDashboardReadiness({ latestEvidenceAt: '   ' });
  assert.equal(resEmpty.latestEvidenceAt, null);
});

test('5. weakestCompetencies: preserves exact backend ordering without client sorting', () => {
  const backendList = [
    { code: 'sys_design', name: 'System Design', category: 'Architecture', score: 45, evidenceCount: 3, latestEvidenceAt: '2026-03-30T00:00:00Z' },
    { code: 'concurrency', name: 'Concurrency', category: 'Backend', score: 50, evidenceCount: 2, latestEvidenceAt: '2026-03-29T00:00:00Z' },
    { code: 'algo', name: 'Algorithms', category: 'Core', score: 55, evidenceCount: 4, latestEvidenceAt: '2026-03-28T00:00:00Z' },
  ];

  const full = normalizeProgressDashboardResponse({ weakestCompetencies: backendList });
  assert.equal(full.weakestCompetencies.length, 3);
  assert.equal(full.weakestCompetencies[0].code, 'sys_design');
  assert.equal(full.weakestCompetencies[1].code, 'concurrency');
  assert.equal(full.weakestCompetencies[2].code, 'algo');
});

test('6. weakestCompetencies: handles empty collection gracefully', () => {
  const full = normalizeProgressDashboardResponse({ weakestCompetencies: [] });
  assert.deepEqual(full.weakestCompetencies, []);

  const fullNull = normalizeProgressDashboardResponse({ weakestCompetencies: null });
  assert.deepEqual(fullNull.weakestCompetencies, []);
});

test('7. weakestCompetencies: normalizes single competency safely', () => {
  const comp = normalizeProgressDashboardCompetency({
    code: 'react',
    name: 'React Fundamentals',
    category: 'Frontend',
    score: 62,
    evidenceCount: 5,
    latestEvidenceAt: '2026-03-31T12:00:00Z',
  });
  assert.equal(comp.code, 'react');
  assert.equal(comp.name, 'React Fundamentals');
  assert.equal(comp.category, 'Frontend');
  assert.equal(comp.score, 62);
  assert.equal(comp.evidenceCount, 5);
  assert.equal(comp.latestEvidenceAt, '2026-03-31T12:00:00Z');
});

test('8. recentImprovements: preserves previousScore, currentScore, delta and at timestamp', () => {
  const item = normalizeProgressDashboardImprovement({
    kind: 'interview',
    resourceId: 'b7c25c34-754e-4b62-9721-a1288c1b75c0',
    previousScore: 65,
    currentScore: 80,
    delta: 15,
    at: '2026-03-31T09:00:00Z',
  });
  assert.equal(item.kind, 'interview');
  assert.equal(item.resourceId, 'b7c25c34-754e-4b62-9721-a1288c1b75c0');
  assert.equal(item.previousScore, 65);
  assert.equal(item.currentScore, 80);
  assert.equal(item.delta, 15);
  assert.equal(item.at, '2026-03-31T09:00:00Z');
});

test('9. recentImprovements: handles negative or zero delta without altering values', () => {
  const negativeDelta = normalizeProgressDashboardImprovement({
    kind: 'scenario',
    resourceId: 'scen-1',
    previousScore: 70,
    currentScore: 65,
    delta: -5,
    at: '2026-03-31T08:00:00Z',
  });
  assert.equal(negativeDelta.delta, -5);

  const zeroDelta = normalizeProgressDashboardImprovement({
    kind: 'star',
    resourceId: 'star-1',
    previousScore: 70,
    currentScore: 70,
    delta: 0,
    at: '2026-03-31T08:00:00Z',
  });
  assert.equal(zeroDelta.delta, 0);
});

test('10. recentImprovements: handles unknown kind safely with fallback', () => {
  const item = normalizeProgressDashboardImprovement({
    kind: 'custom_drill',
    resourceId: 'drill-9',
  });
  assert.equal(item.kind, 'custom_drill');
});

test('11. weeklyCompletedActivities: preserves windowStart, windowEnd and exact totals', () => {
  const weekly = normalizeProgressDashboardWeeklyActivities({
    windowStart: '2026-03-24T00:00:00Z',
    windowEnd: '2026-03-31T00:00:00Z',
    total: 12,
    resumeAnalyses: 1,
    interviews: 3,
    scenarios: 4,
    starAttempts: 2,
    learningPathActivities: 2,
  });
  assert.equal(weekly.windowStart, '2026-03-24T00:00:00Z');
  assert.equal(weekly.windowEnd, '2026-03-31T00:00:00Z');
  assert.equal(weekly.total, 12);
  assert.equal(weekly.resumeAnalyses, 1);
  assert.equal(weekly.interviews, 3);
  assert.equal(weekly.scenarios, 4);
  assert.equal(weekly.starAttempts, 2);
  assert.equal(weekly.learningPathActivities, 2);
});

test('12. weeklyCompletedActivities: handles zero state gracefully', () => {
  const weekly = normalizeProgressDashboardWeeklyActivities({});
  assert.equal(weekly.total, 0);
  assert.equal(weekly.resumeAnalyses, 0);
  assert.equal(weekly.interviews, 0);
  assert.equal(weekly.scenarios, 0);
  assert.equal(weekly.starAttempts, 0);
  assert.equal(weekly.learningPathActivities, 0);
});

test('13. nextRecommendedPractice: re-uses canonical B12 normalizer', () => {
  const full = normalizeProgressDashboardResponse({
    nextRecommendedPractice: {
      reason: 'Focus on System Design next.',
      activityType: 'scenario',
      resourceId: 'c1234567-89ab-cdef-0123-456789abcdef',
      estimatedMinutes: 25,
      priority: 1,
    },
  });
  assert.ok(full.nextRecommendedPractice);
  assert.equal(full.nextRecommendedPractice.reason, 'Focus on System Design next.');
  assert.equal(full.nextRecommendedPractice.activityType, 'scenario');
  assert.equal(full.nextRecommendedPractice.resourceId, 'c1234567-89ab-cdef-0123-456789abcdef');
  assert.equal(full.nextRecommendedPractice.estimatedMinutes, 25);
  assert.equal(full.nextRecommendedPractice.priority, 1);
});

test('14. nextRecommendedPractice: handles null recommendation in dashboard response', () => {
  const full = normalizeProgressDashboardResponse({
    nextRecommendedPractice: null,
  });
  assert.equal(full.nextRecommendedPractice, null);
});

test('15. historicalStats: preserves completed counts and averages', () => {
  const stats = normalizeProgressHistoricalStats({
    completedInterviews: 10,
    averageInterviewScore: 82.5,
    completedScenarios: 5,
    averageScenarioScore: 78.0,
    completedStarAttempts: 8,
    recentInterviewScores: [
      { interviewId: 'iv-1', score: 85, completedAt: '2026-03-31T10:00:00Z' },
    ],
    starAverages: {
      situation: 4.2,
      task: 4.0,
      action: 4.5,
      result: 4.1,
    },
    recentActivity: [
      { kind: 'interview', resourceId: 'iv-1', at: '2026-03-31T10:00:00Z' },
    ],
  });

  assert.equal(stats.completedInterviews, 10);
  assert.equal(stats.averageInterviewScore, 82.5);
  assert.equal(stats.completedScenarios, 5);
  assert.equal(stats.averageScenarioScore, 78.0);
  assert.equal(stats.completedStarAttempts, 8);
  assert.equal(stats.recentInterviewScores.length, 1);
  assert.equal(stats.recentInterviewScores[0].score, 85);
  assert.ok(stats.starAverages);
  assert.equal(stats.starAverages.action, 4.5);
  assert.equal(stats.recentActivity.length, 1);
});

test('16. historicalStats: null averages and empty arrays handled safely', () => {
  const stats = normalizeProgressHistoricalStats({
    completedInterviews: 0,
    averageInterviewScore: null,
    starAverages: null,
    recentInterviewScores: null,
    recentActivity: null,
  });
  assert.equal(stats.completedInterviews, 0);
  assert.equal(stats.averageInterviewScore, null);
  assert.equal(stats.starAverages, null);
  assert.deepEqual(stats.recentInterviewScores, []);
  assert.deepEqual(stats.recentActivity, []);
});

test('17. full dashboard: complete wire object normalization', () => {
  const rawPayload = {
    readiness: {
      score: 85,
      assessedCompetencies: 6,
      evidenceCount: 18,
      priorityGapCount: 1,
      qualitativeWeaknessCount: 2,
      latestEvidenceAt: '2026-03-31T14:30:00Z',
    },
    weakestCompetencies: [
      {
        code: 'sys_design',
        name: 'System Design',
        category: 'Architecture',
        score: 60,
        evidenceCount: 4,
        latestEvidenceAt: '2026-03-30T10:00:00Z',
      },
    ],
    recentImprovements: [
      {
        kind: 'interview',
        resourceId: 'iv-99',
        previousScore: 70,
        currentScore: 85,
        delta: 15,
        at: '2026-03-31T12:00:00Z',
      },
    ],
    weeklyCompletedActivities: {
      windowStart: '2026-03-24T00:00:00Z',
      windowEnd: '2026-03-31T00:00:00Z',
      total: 5,
      resumeAnalyses: 1,
      interviews: 2,
      scenarios: 1,
      starAttempts: 1,
      learningPathActivities: 0,
    },
    nextRecommendedPractice: {
      reason: 'Focus on System Design',
      activityType: 'scenario',
      resourceId: 'scen-99',
      estimatedMinutes: 20,
      priority: 1,
    },
    historicalStats: {
      completedInterviews: 2,
      recentInterviewScores: [],
      averageInterviewScore: 85,
      starAverages: null,
      completedScenarios: 1,
      averageScenarioScore: 80,
      completedStarAttempts: 1,
      recentActivity: [],
    },
  };

  const dashboard = normalizeProgressDashboardResponse(rawPayload);
  assert.equal(dashboard.readiness.score, 85);
  assert.equal(dashboard.readiness.assessedCompetencies, 6);
  assert.equal(dashboard.weakestCompetencies.length, 1);
  assert.equal(dashboard.recentImprovements.length, 1);
  assert.equal(dashboard.weeklyCompletedActivities.total, 5);
  assert.ok(dashboard.nextRecommendedPractice);
  assert.equal(dashboard.nextRecommendedPractice.resourceId, 'scen-99');
  assert.equal(dashboard.historicalStats.completedInterviews, 2);
});

test('18. full dashboard: non-object or corrupt wire input does not crash and provides safe fallbacks', () => {
  const empty = normalizeProgressDashboardResponse(null);
  assert.equal(empty.readiness.score, null);
  assert.equal(empty.readiness.assessedCompetencies, 0);
  assert.deepEqual(empty.weakestCompetencies, []);
  assert.deepEqual(empty.recentImprovements, []);
  assert.equal(empty.weeklyCompletedActivities.total, 0);
  assert.equal(empty.nextRecommendedPractice, null);
  assert.equal(empty.historicalStats.completedInterviews, 0);
});

test('19. full dashboard: partial missing sub-objects normalize safely', () => {
  const partial = normalizeProgressDashboardResponse({
    readiness: { score: 90 },
  });
  assert.equal(partial.readiness.score, 90);
  assert.equal(partial.readiness.assessedCompetencies, 0);
  assert.deepEqual(partial.weakestCompetencies, []);
  assert.deepEqual(partial.recentImprovements, []);
  assert.equal(partial.weeklyCompletedActivities.total, 0);
  assert.equal(partial.nextRecommendedPractice, null);
  assert.equal(partial.historicalStats.completedInterviews, 0);
});

test('20. numerical field resilience: stringified or non-finite numbers normalize cleanly', () => {
  const raw = {
    readiness: {
      score: NaN,
      assessedCompetencies: '5',
      evidenceCount: Infinity,
    },
    weeklyCompletedActivities: {
      total: '10',
    },
  };

  const res = normalizeProgressDashboardResponse(raw);
  assert.equal(res.readiness.score, null);
  assert.equal(res.readiness.assessedCompetencies, 0);
  assert.equal(res.readiness.evidenceCount, 0);
  assert.equal(res.weeklyCompletedActivities.total, 0);
});

// ---------------------------------------------------------------------------
// Section 9 Regression Tests: B12/B13 Contract Integration & No-Duplicate Guarantees
// ---------------------------------------------------------------------------

test('21. canonical B12 normalizer: progressDashboardContract exports canonical recommendation normalizer', () => {
  assert.strictEqual(
    progressExportedNormalizeRecommendation,
    canonicalNormalizeRecommendation,
    'progressDashboardContract must re-export the exact canonical B12 normalizer without duplication'
  );
});

test('22. embedded recommendation: null recommendation in B13 wire payload normalizes strictly to null', () => {
  const wireWithNull = {
    readiness: { score: 80, assessedCompetencies: 4, evidenceCount: 10 },
    nextRecommendedPractice: null,
  };
  const resultNull = normalizeProgressDashboardResponse(wireWithNull);
  assert.equal(resultNull.nextRecommendedPractice, null);

  const wireWithUndefined = {
    readiness: { score: 80 },
  };
  const resultUndef = normalizeProgressDashboardResponse(wireWithUndefined);
  assert.equal(resultUndef.nextRecommendedPractice, null);

  const wireWithEmptyObj = {
    nextRecommendedPractice: {},
  };
  const resultEmpty = normalizeProgressDashboardResponse(wireWithEmptyObj);
  assert.equal(resultEmpty.nextRecommendedPractice, null);
});

test('23. embedded recommendation: valid recommendation preserves canonical B12 fields and deep links', () => {
  const wireWithRec = {
    nextRecommendedPractice: {
      reason: 'Cải thiện kỹ năng System Design để tăng điểm sẵn sàng',
      activityType: 'scenario',
      resourceId: 'b7b9-1234-5678-9abc',
      estimatedMinutes: 30,
      priority: 1,
    },
  };

  const result = normalizeProgressDashboardResponse(wireWithRec);
  assert.ok(result.nextRecommendedPractice);
  assert.equal(
    result.nextRecommendedPractice.reason,
    'Cải thiện kỹ năng System Design để tăng điểm sẵn sàng'
  );
  assert.equal(result.nextRecommendedPractice.activityType, 'scenario');
  assert.equal(result.nextRecommendedPractice.resourceId, 'b7b9-1234-5678-9abc');
  assert.equal(result.nextRecommendedPractice.estimatedMinutes, 30);
  assert.equal(result.nextRecommendedPractice.priority, 1);

  // Deep link contract verification on embedded recommendation
  const deepLink = getRecommendationDeepLink(result.nextRecommendedPractice);
  assert.equal(deepLink, '/dashboard/scenarios/b7b9-1234-5678-9abc');
});

test('24. embedded recommendation: non-scenario activity types resolve canonical deep links', () => {
  const starRec = canonicalNormalizeRecommendation({
    reason: 'Luyện tập STAR Drill',
    activityType: 'star_drill',
    resourceId: null,
    estimatedMinutes: 15,
    priority: 2,
  });
  assert.equal(getRecommendationDeepLink(starRec), '/dashboard/star-builder');

  const interviewRec = canonicalNormalizeRecommendation({
    reason: 'Luyện tập phỏng vấn mô phỏng',
    activityType: 'interview',
    resourceId: null,
    estimatedMinutes: 45,
    priority: 1,
  });
  assert.equal(getRecommendationDeepLink(interviewRec), '/dashboard/interviews/new');

  const resumeRec = canonicalNormalizeRecommendation({
    reason: 'Cập nhật CV theo góp ý mới',
    activityType: 'resume_improvement',
    resourceId: null,
    estimatedMinutes: 20,
    priority: 3,
  });
  assert.equal(getRecommendationDeepLink(resumeRec), '/dashboard/resumes');

  const externalRec = canonicalNormalizeRecommendation({
    reason: 'Tài liệu ngoài',
    activityType: 'external_learning',
    resourceId: null,
    estimatedMinutes: 60,
    priority: 4,
  });
  assert.equal(getRecommendationDeepLink(externalRec), null);
});
