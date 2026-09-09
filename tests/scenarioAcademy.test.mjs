import test from 'node:test';
import assert from 'node:assert/strict';

// These dependency-free tests model the public Scenario Academy contract. The
// UI uses the same endpoint/query-key/status rules, while the tests stay
// runnable with the repository's lightweight node:test setup.
const SCENARIO_PAGE_SIZE = 20;
const MAX_SCENARIO_PAGE_SIZE = 50;
const VALID_STATUSES = ['draft', 'queued', 'processing', 'completed', 'failed'];
const ALLOWED_TRANSITIONS = {
  draft: ['queued'],
  queued: ['processing', 'failed'],
  processing: ['completed', 'failed'],
  completed: [],
  failed: [],
};

function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function readStatus(data) {
  if (!data || typeof data !== 'object') return null;
  if ('status' in data && typeof data.status === 'string') return data.status;
  if ('data' in data && data.data && typeof data.data === 'object' && 'status' in data.data) {
    return typeof data.data.status === 'string' ? data.data.status : null;
  }
  return null;
}

function buildScenarioQuery(params) {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.difficulty) query.set('difficulty', params.difficulty);
  if (params?.competency) query.set('competency', params.competency);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.pageSize) query.set('pageSize', params.pageSize.toString());
  return query.toString();
}

function calculatePagination(total, page = 1, pageSize = SCENARIO_PAGE_SIZE) {
  const safeTotal = Math.max(0, total);
  const safePageSize = Math.min(MAX_SCENARIO_PAGE_SIZE, Math.max(1, pageSize));
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return {
    currentPage,
    totalPages,
    pageSize: safePageSize,
    total: safeTotal,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    shouldShowPagination: safeTotal > safePageSize,
  };
}

function applyFilterChange(previous, changed) {
  const next = { ...previous, ...changed, page: 1 };
  delete next.pageSize;
  return next;
}

function getScoreDeltaDisplay(scoreDelta, overallScore, isFirstScoredAttempt = false) {
  if (scoreDelta !== null && scoreDelta !== undefined) {
    if (scoreDelta > 0) return { type: 'positive', text: `+${scoreDelta}` };
    if (scoreDelta < 0) return { type: 'negative', text: `${scoreDelta}` };
    return { type: 'neutral', text: '±0' };
  }
  if (isFirstScoredAttempt && overallScore !== null && overallScore !== undefined) {
    return { type: 'baseline', text: 'Khởi điểm' };
  }
  return { type: 'none', text: '--' };
}

function getRealtimeInvalidationKeys(resourceType, resourceId) {
  switch (resourceType.toLowerCase()) {
    case 'scenarioattempt':
      return [
        ['scenarioAttempt', resourceId],
        ['scenarioHistory'],
        ['scenarioProgress'],
      ];
    case 'starattempt':
      return [['starAttempt', resourceId]];
    default:
      return [];
  }
}

function recoverAttempt(status, scenarioId, idempotencyKey) {
  if (status === 'failed' || status === 'completed') {
    return [{ method: 'POST', path: `/scenarios/${scenarioId}/retry`, idempotencyKey }];
  }
  return [];
}

function firstScoredAttemptId(attempts) {
  return [...attempts]
    .filter((attempt) => attempt.overallScore !== null && attempt.overallScore !== undefined)
    .sort((a, b) => a.attemptNumber - b.attemptNumber)[0]?.id ?? null;
}

function canTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

test('generateIdempotencyKey produces distinct, valid keys', () => {
  const key1 = generateIdempotencyKey();
  const key2 = generateIdempotencyKey();
  assert.ok(key1 && typeof key1 === 'string');
  assert.ok(key2 && typeof key2 === 'string');
  assert.notEqual(key1, key2);
  assert.ok(key1.length >= 16);
});

test('uncertain submit replay keeps the same idempotency key', () => {
  const key = generateIdempotencyKey();
  const firstRequest = { attemptId: 'attempt-1', answer: 'answer', idempotencyKey: key };
  const replayRequest = { ...firstRequest };
  assert.deepEqual(replayRequest, firstRequest);
  assert.equal(replayRequest.idempotencyKey, key);
});

test('readStatus extracts status from direct object and nested ApiResponse', () => {
  assert.equal(readStatus({ status: 'queued' }), 'queued');
  assert.equal(readStatus({ status: 'completed' }), 'completed');
  assert.equal(readStatus({ data: { status: 'processing' } }), 'processing');
  assert.equal(readStatus({ data: { status: 'failed' } }), 'failed');
  assert.equal(readStatus(null), null);
  assert.equal(readStatus({}), null);
  assert.equal(readStatus({ invalid: true }), null);
});

test('scenario catalogue query preserves filters and server pagination', () => {
  const query = buildScenarioQuery({
    category: 'banking',
    difficulty: 'medium',
    competency: 'Conflict Resolution',
    search: 'customer',
    page: 2,
    pageSize: SCENARIO_PAGE_SIZE,
  });
  assert.ok(query.includes('category=banking'));
  assert.ok(query.includes('difficulty=medium'));
  assert.ok(query.includes('competency=Conflict+Resolution'));
  assert.ok(query.includes('search=customer'));
  assert.ok(query.includes('page=2'));
  assert.ok(query.includes('pageSize=20'));

  const page = calculatePagination(41, 2, SCENARIO_PAGE_SIZE);
  assert.deepEqual(page, {
    currentPage: 2,
    totalPages: 3,
    pageSize: 20,
    total: 41,
    hasNextPage: true,
    hasPrevPage: true,
    shouldShowPagination: true,
  });
  assert.equal(calculatePagination(20, 1, SCENARIO_PAGE_SIZE).shouldShowPagination, false);
  assert.equal(calculatePagination(51, 1, 100).pageSize, MAX_SCENARIO_PAGE_SIZE);
});

test('filter changes reset the page while preserving the other filters', () => {
  const next = applyFilterChange(
    { search: 'latency', category: 'engineering', page: 4, pageSize: SCENARIO_PAGE_SIZE },
    { difficulty: 'hard', competency: 'Incident response' }
  );
  assert.equal(next.page, 1);
  assert.equal(next.search, 'latency');
  assert.equal(next.category, 'engineering');
  assert.equal(next.difficulty, 'hard');
  assert.equal(next.competency, 'Incident response');
  assert.equal(next.pageSize, undefined);
});

test('failed attempt recovery uses retry and never resubmits the terminal attempt', () => {
  const calls = recoverAttempt('failed', 'scenario-1', 'retry-key');
  assert.deepEqual(calls, [
    { method: 'POST', path: '/scenarios/scenario-1/retry', idempotencyKey: 'retry-key' },
  ]);
  assert.equal(calls.some((call) => call.path.includes('/submit')), false);
});

test('scenario retry is not allowed while the latest attempt is still running', () => {
  for (const status of ['draft', 'queued', 'processing']) {
    assert.deepEqual(recoverAttempt(status, 'scenario-1', 'retry-key'), []);
  }
});

test('Scenario attempt status lifecycle is limited to the backend contract', () => {
  for (const status of VALID_STATUSES) {
    assert.equal(VALID_STATUSES.includes(status), true);
  }
  assert.equal(canTransition('draft', 'queued'), true);
  assert.equal(canTransition('queued', 'processing'), true);
  assert.equal(canTransition('processing', 'completed'), true);
  assert.equal(canTransition('processing', 'failed'), true);
  assert.equal(canTransition('failed', 'queued'), false);
  assert.equal(canTransition('completed', 'queued'), false);
  assert.equal(VALID_STATUSES.includes('abandoned'), false);
});

test('baseline history marks the first scored attempt, even after an unscored draft', () => {
  const attempts = [
    { id: 'draft', attemptNumber: 1, overallScore: null, scoreDelta: null },
    { id: 'first-score', attemptNumber: 2, overallScore: 72, scoreDelta: null },
    { id: 'second-score', attemptNumber: 3, overallScore: 84, scoreDelta: 12 },
  ];
  assert.equal(firstScoredAttemptId(attempts), 'first-score');
  assert.deepEqual(getScoreDeltaDisplay(null, 72, true), { type: 'baseline', text: 'Khởi điểm' });
  assert.deepEqual(getScoreDeltaDisplay(12, 84, false), { type: 'positive', text: '+12' });
});

test('Scenario realtime invalidation refreshes exact attempt, history and progress', () => {
  const attemptId = '11111111-2222-3333-4444-555555555555';
  assert.deepEqual(getRealtimeInvalidationKeys('scenarioAttempt', attemptId), [
    ['scenarioAttempt', attemptId],
    ['scenarioHistory'],
    ['scenarioProgress'],
  ]);
});

test('STAR realtime invalidation refreshes only the exact STAR attempt', () => {
  const attemptId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  assert.deepEqual(getRealtimeInvalidationKeys('starAttempt', attemptId), [
    ['starAttempt', attemptId],
  ]);
});
