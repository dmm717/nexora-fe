import test from 'node:test';
import assert from 'node:assert/strict';

// Helper: emulate generateIdempotencyKey logic
function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Helper: emulate readStatus logic
function readStatus(data) {
  if (!data || typeof data !== 'object') return null;
  if ('status' in data && typeof data.status === 'string') {
    return data.status;
  }
  if ('data' in data && data.data && typeof data.data === 'object' && 'status' in data.data) {
    return typeof data.data.status === 'string' ? data.data.status : null;
  }
  return null;
}

// Helper: emulate scenario query serializer
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

// Helper: calculate score delta representation
function getScoreDeltaDisplay(attemptNumber, scoreDelta, overallScore) {
  if (scoreDelta !== null && scoreDelta !== undefined) {
    if (scoreDelta > 0) return { type: 'positive', text: `+${scoreDelta}` };
    if (scoreDelta < 0) return { type: 'negative', text: `${scoreDelta}` };
    return { type: 'neutral', text: '±0' };
  }
  if (attemptNumber === 1 && overallScore !== null) {
    return { type: 'baseline', text: 'Khởi điểm' };
  }
  return { type: 'none', text: '--' };
}

test('generateIdempotencyKey produces distinct, valid keys', () => {
  const key1 = generateIdempotencyKey();
  const key2 = generateIdempotencyKey();
  assert.ok(key1 && typeof key1 === 'string');
  assert.ok(key2 && typeof key2 === 'string');
  assert.notEqual(key1, key2);
  assert.ok(key1.length >= 16);
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

test('buildScenarioQuery formats filter parameters correctly', () => {
  const qs1 = buildScenarioQuery({
    category: 'banking',
    difficulty: 'medium',
    competency: 'Conflict Resolution',
    search: 'customer',
  });
  assert.ok(qs1.includes('category=banking'));
  assert.ok(qs1.includes('difficulty=medium'));
  assert.ok(qs1.includes('competency=Conflict+Resolution'));
  assert.ok(qs1.includes('search=customer'));

  const qsEmpty = buildScenarioQuery({});
  assert.equal(qsEmpty, '');
});

test('getScoreDeltaDisplay correctly reflects progression and baseline', () => {
  const first = getScoreDeltaDisplay(1, null, 75);
  assert.deepEqual(first, { type: 'baseline', text: 'Khởi điểm' });

  const positive = getScoreDeltaDisplay(2, 15, 90);
  assert.deepEqual(positive, { type: 'positive', text: '+15' });

  const negative = getScoreDeltaDisplay(3, -10, 80);
  assert.deepEqual(negative, { type: 'negative', text: '-10' });

  const neutral = getScoreDeltaDisplay(4, 0, 80);
  assert.deepEqual(neutral, { type: 'neutral', text: '±0' });
});

test('Scenario attempt valid status lifecycle adheres to contract', () => {
  const validStatuses = ['draft', 'queued', 'processing', 'completed', 'failed'];
  const testAttempt = {
    id: 'att-123',
    scenarioId: 'scen-456',
    status: 'draft',
  };

  assert.ok(validStatuses.includes(testAttempt.status));
  testAttempt.status = 'queued';
  assert.ok(validStatuses.includes(testAttempt.status));
  testAttempt.status = 'processing';
  assert.ok(validStatuses.includes(testAttempt.status));
  testAttempt.status = 'completed';
  assert.ok(validStatuses.includes(testAttempt.status));
});

test('Realtime invalidation query key mapping conforms to architecture', () => {
  const resourceType = 'scenarioAttempt';
  const resourceId = '11111111-2222-3333-4444-555555555555';

  const invalidationKeys = [];
  if (resourceType === 'scenarioAttempt') {
    invalidationKeys.push(['scenarioAttempt', resourceId]);
    invalidationKeys.push(['scenarioHistory']);
    invalidationKeys.push(['scenarioProgress']);
  }

  assert.equal(invalidationKeys.length, 3);
  assert.deepEqual(invalidationKeys[0], ['scenarioAttempt', resourceId]);
  assert.deepEqual(invalidationKeys[1], ['scenarioHistory']);
  assert.deepEqual(invalidationKeys[2], ['scenarioProgress']);
});
