import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeNextPracticeRecommendationResponse,
  getRecommendationDeepLink,
} from '../src/services/recommendationContract.ts';

import { LearningPathValues } from '../src/services/learningPathContract.ts';

// ---------------------------------------------------------------------------
// B12 Next Practice Recommendation Contract Tests
// ---------------------------------------------------------------------------

test('1. null recommendation normalizes to null', () => {
  assert.equal(normalizeNextPracticeRecommendationResponse(null), null);
  assert.equal(normalizeNextPracticeRecommendationResponse(undefined), null);
  assert.equal(normalizeNextPracticeRecommendationResponse({}), null);
});

test('2. valid response preserves reason verbatim', () => {
  const raw = {
    reason: 'Practice System Design next because it is a priority 1 gap supported by 3 evidence items.',
    activityType: 'scenario',
    resourceId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    estimatedMinutes: 20,
    priority: 1,
  };

  const normalized = normalizeNextPracticeRecommendationResponse(raw);
  assert.ok(normalized);
  assert.equal(
    normalized.reason,
    'Practice System Design next because it is a priority 1 gap supported by 3 evidence items.'
  );
});

test('3. valid response preserves activityType verbatim', () => {
  const types = [
    LearningPathValues.Scenario,
    LearningPathValues.StarDrill,
    LearningPathValues.Interview,
    LearningPathValues.ResumeImprovement,
    LearningPathValues.ExternalLearning,
  ];

  for (const type of types) {
    const normalized = normalizeNextPracticeRecommendationResponse({
      reason: 'Test reason',
      activityType: type,
      resourceId: null,
      estimatedMinutes: 15,
      priority: 2,
    });
    assert.ok(normalized);
    assert.equal(normalized.activityType, type);
  }
});

test('4. nullable resourceId handled safely (string GUID vs null)', () => {
  const withGuid = normalizeNextPracticeRecommendationResponse({
    reason: 'Practice scenario',
    activityType: 'scenario',
    resourceId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    estimatedMinutes: 20,
    priority: 1,
  });
  assert.ok(withGuid);
  assert.equal(withGuid.resourceId, '7c9e6679-7425-40de-944b-e07fc1f90ae7');

  const withNull = normalizeNextPracticeRecommendationResponse({
    reason: 'Practice STAR',
    activityType: 'star_drill',
    resourceId: null,
    estimatedMinutes: 15,
    priority: 2,
  });
  assert.ok(withNull);
  assert.equal(withNull.resourceId, null);

  const withEmptyString = normalizeNextPracticeRecommendationResponse({
    reason: 'Practice interview',
    activityType: 'interview',
    resourceId: '   ',
    estimatedMinutes: 20,
    priority: 1,
  });
  assert.ok(withEmptyString);
  assert.equal(withEmptyString.resourceId, null);
});

test('5. estimatedMinutes preserved if valid number', () => {
  const res = normalizeNextPracticeRecommendationResponse({
    reason: 'Do interview',
    activityType: 'interview',
    resourceId: null,
    estimatedMinutes: 20,
    priority: 1,
  });
  assert.ok(res);
  assert.equal(res.estimatedMinutes, 20);

  const invalidMinutes = normalizeNextPracticeRecommendationResponse({
    reason: 'Do interview',
    activityType: 'interview',
    resourceId: null,
    estimatedMinutes: 'invalid',
    priority: 1,
  });
  assert.ok(invalidMinutes);
  assert.equal(invalidMinutes.estimatedMinutes, 0);
});

test('6. priority preserved if valid number', () => {
  const res = normalizeNextPracticeRecommendationResponse({
    reason: 'Do resume',
    activityType: 'resume_improvement',
    resourceId: null,
    estimatedMinutes: 15,
    priority: 3,
  });
  assert.ok(res);
  assert.equal(res.priority, 3);
});

test('7. scenario routing with valid resourceId navigates to direct scenario page', () => {
  const link = getRecommendationDeepLink({
    reason: 'Practice microservice timeout scenario',
    activityType: LearningPathValues.Scenario,
    resourceId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    estimatedMinutes: 20,
    priority: 1,
  });
  assert.equal(link, '/dashboard/scenarios/3fa85f64-5717-4562-b3fc-2c963f66afa6');
});

test('8. scenario fallback routing without resourceId navigates to scenario list', () => {
  const link = getRecommendationDeepLink({
    reason: 'Practice scenario',
    activityType: LearningPathValues.Scenario,
    resourceId: null,
    estimatedMinutes: 20,
    priority: 1,
  });
  assert.equal(link, '/dashboard/scenarios');
});

test('9. star_drill routing navigates to star-builder', () => {
  const link = getRecommendationDeepLink({
    reason: 'Drill STAR technique',
    activityType: LearningPathValues.StarDrill,
    resourceId: null,
    estimatedMinutes: 15,
    priority: 2,
  });
  assert.equal(link, '/dashboard/star-builder');
});

test('10. interview routing navigates to interviews/new', () => {
  const link = getRecommendationDeepLink({
    reason: 'Practice technical interview',
    activityType: LearningPathValues.Interview,
    resourceId: null,
    estimatedMinutes: 20,
    priority: 1,
  });
  assert.equal(link, '/dashboard/interviews/new');
});

test('11. resume_improvement routing navigates to resumes', () => {
  const link = getRecommendationDeepLink({
    reason: 'Update resume keywords',
    activityType: LearningPathValues.ResumeImprovement,
    resourceId: null,
    estimatedMinutes: 15,
    priority: 3,
  });
  assert.equal(link, '/dashboard/resumes');
});

test('12. external_learning does not fabricate a link because B12 provides no externalUrl', () => {
  const link = getRecommendationDeepLink({
    reason: 'Read architecture book',
    activityType: LearningPathValues.ExternalLearning,
    resourceId: null,
    estimatedMinutes: 20,
    priority: 1,
  });
  assert.equal(link, null);
});

test('13. unknown activity types return null deep link without crashing', () => {
  const link = getRecommendationDeepLink({
    reason: 'Something custom',
    activityType: 'hackathon_event',
    resourceId: 'custom-123',
    estimatedMinutes: 60,
    priority: 1,
  });
  assert.equal(link, null);

  assert.equal(getRecommendationDeepLink(null), null);
});

test('14. malformed optional wire data does not crash normalizer', () => {
  const weird = {
    reason: 'Valid reason',
    activityType: 'interview',
    resourceId: 12345, // Not a string
    estimatedMinutes: null,
    priority: undefined,
    extraRandomBackendField: 'ignored',
  };

  const normalized = normalizeNextPracticeRecommendationResponse(weird);
  assert.ok(normalized);
  assert.equal(normalized.reason, 'Valid reason');
  assert.equal(normalized.activityType, 'interview');
  assert.equal(normalized.resourceId, null);
  assert.equal(normalized.estimatedMinutes, 0);
  assert.equal(normalized.priority, 1);
});

test('15. non-object inputs (numbers, strings, arrays) normalize safely to null', () => {
  assert.equal(normalizeNextPracticeRecommendationResponse(42), null);
  assert.equal(normalizeNextPracticeRecommendationResponse('hello'), null);
  assert.equal(normalizeNextPracticeRecommendationResponse([1, 2, 3]), null);
  assert.equal(normalizeNextPracticeRecommendationResponse(true), null);
});

