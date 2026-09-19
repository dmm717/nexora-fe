import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyPrimaryResumeToCareerProfile,
  getPrimaryResumeErrorMessage,
  shouldRetryCareerProfileRequest,
} from '../src/hooks/queries/careerProfilePolicy.ts';

const profile = {
  profile: { userId: 'user-1', email: 'qb@example.com' },
  primaryResume: null,
  skillProfileSummary: { topCompetencies: [], topWeaknessSignals: [] },
  onboarding: {
    hasDisplayName: true,
    hasYearsOfExperience: true,
    hasPrimaryResume: false,
    hasActiveCareerGoal: true,
    isComplete: false,
  },
};

test('career profile retries only one transient or network failure', () => {
  for (const status of [408, 429, 502, 503, 504]) {
    assert.equal(shouldRetryCareerProfileRequest(0, { status }), true);
    assert.equal(shouldRetryCareerProfileRequest(1, { status }), false);
  }

  assert.equal(shouldRetryCareerProfileRequest(0, new TypeError('network')), true);
  assert.equal(shouldRetryCareerProfileRequest(1, new TypeError('network')), false);
});

test('career profile does not retry deterministic client failures or HTTP 500', () => {
  for (const status of [400, 401, 403, 404, 409, 422, 500, 501]) {
    assert.equal(shouldRetryCareerProfileRequest(0, { status }), false);
  }
});

test('primary resume mutation result immediately updates the authoritative cache view', () => {
  const primaryResume = {
    id: 'resume-1',
    fileName: 'resume.pdf',
    status: 'ready',
    createdAt: '2026-09-19T00:00:00Z',
    latestAnalysis: null,
  };

  const updated = applyPrimaryResumeToCareerProfile(profile, primaryResume);
  assert.equal(updated.primaryResume, primaryResume);
  assert.equal(updated.onboarding.hasPrimaryResume, true);
  assert.equal(updated.onboarding.isComplete, true);

  const cleared = applyPrimaryResumeToCareerProfile(updated, null);
  assert.equal(cleared.primaryResume, null);
  assert.equal(cleared.onboarding.hasPrimaryResume, false);
  assert.equal(cleared.onboarding.isComplete, false);
});

test('failed mutations preserve cache state and expose safe actionable messages', () => {
  assert.equal(applyPrimaryResumeToCareerProfile(undefined, null), undefined);
  assert.equal(getPrimaryResumeErrorMessage({ code: 'RESUME_NOT_READY' }), 'CV chưa xử lý xong.');
  assert.equal(
    getPrimaryResumeErrorMessage({ code: 'NOT_FOUND' }),
    'CV không còn tồn tại hoặc không thuộc tài khoản.',
  );
  assert.equal(
    getPrimaryResumeErrorMessage({ status: 503 }),
    'Chưa thể cập nhật CV chính. Vui lòng thử lại sau.',
  );
});
