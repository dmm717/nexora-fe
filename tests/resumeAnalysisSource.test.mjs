import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  getResumeAnalysisReadiness,
  getResumeAnalysisSourceContract,
} from '../src/services/resumeAnalysisSource.ts';

const primary = { id: 'primary-1', status: 'ready', fileName: 'primary.pdf' };
const custom = { id: 'custom-1', status: 'ready', fileName: 'custom.pdf' };
const goal = { id: 'goal-1', targetRole: 'Frontend Developer', seniority: 'Fresher', industry: 'Công nghệ thông tin' };

test('Current Profile readiness uses the server-backed primary resume and active goal', () => {
  const readiness = getResumeAnalysisReadiness({
    sourceMode: 'current_profile',
    analysisMode: 'job_targeted',
    primaryResume: primary,
    activeCareerGoal: goal,
    customResume: custom,
    jdTitle: 'Frontend Developer',
    jdContent: 'React and TypeScript',
  });

  assert.equal(readiness.canAnalyze, true);
  assert.equal(readiness.primaryResumeId, 'primary-1');
  assert.equal(readiness.customResumeId, 'custom-1');
  assert.deepEqual(getResumeAnalysisSourceContract({
    sourceMode: 'current_profile',
    primaryResume: primary,
    activeCareerGoal: goal,
    customResume: custom,
  }), { resumeId: null, careerGoalId: 'goal-1' });
});

test('Current Profile stays blocked without primary even when a ready resume is locally selected', () => {
  const readiness = getResumeAnalysisReadiness({
    sourceMode: 'current_profile',
    analysisMode: 'field_benchmark',
    activeCareerGoal: goal,
    customResume: custom,
    industry: 'Công nghệ thông tin',
  });

  assert.equal(readiness.canAnalyze, false);
  assert.equal(readiness.missingPrimaryResume, true);
  assert.equal(readiness.missingCustomResume, false);
  assert.deepEqual(getResumeAnalysisSourceContract({
    sourceMode: 'current_profile',
    activeCareerGoal: goal,
    customResume: custom,
  }), { resumeId: null, careerGoalId: 'goal-1' });
});

test('Current Profile does not treat a processing server primary as ready', () => {
  const readiness = getResumeAnalysisReadiness({
    sourceMode: 'current_profile',
    analysisMode: 'job_targeted',
    primaryResume: { ...primary, status: 'processing' },
    activeCareerGoal: goal,
    jdTitle: 'Frontend Developer',
    jdContent: 'React',
  });

  assert.equal(readiness.canAnalyze, false);
  assert.equal(readiness.missingPrimaryResume, true);
});

test('Custom mode requires and submits the explicit ready resume without changing primary authority', () => {
  const readiness = getResumeAnalysisReadiness({
    sourceMode: 'custom',
    analysisMode: 'field_benchmark',
    primaryResume: primary,
    activeCareerGoal: goal,
    customResume: custom,
    industry: 'Fintech',
    targetRole: 'Frontend Developer',
    seniority: 'Senior',
  });

  assert.equal(readiness.canAnalyze, true);
  assert.deepEqual(getResumeAnalysisSourceContract({
    sourceMode: 'custom',
    primaryResume: primary,
    activeCareerGoal: goal,
    customResume: custom,
  }), { resumeId: 'custom-1' });
});

test('Custom processing resume and missing custom fields stay blocked', () => {
  const readiness = getResumeAnalysisReadiness({
    sourceMode: 'custom',
    analysisMode: 'job_targeted',
    customResume: { ...custom, status: 'processing' },
    jdTitle: 'Frontend Developer',
    jdContent: 'React',
  });

  assert.equal(readiness.canAnalyze, false);
  assert.equal(readiness.missingCustomResume, true);
});

test('Current field benchmark preserves the one-time industry supplement', () => {
  const readiness = getResumeAnalysisReadiness({
    sourceMode: 'current_profile',
    analysisMode: 'field_benchmark',
    primaryResume: primary,
    activeCareerGoal: { ...goal, industry: '' },
    industry: 'Fintech',
  });

  assert.equal(readiness.canAnalyze, true);
  assert.equal(readiness.missingIndustry, false);
});

test('Resume analysis page exposes explicit primary action and source labels', async () => {
  const source = await readFile(new URL('../src/app/(dashboard)/resume-analyses/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /useSetPrimaryResume/);
  assert.match(source, /setPrimaryResume\(primaryResumeCandidateId\)/);
  assert.match(source, /Đặt làm CV chính/);
  assert.match(source, /Dùng hồ sơ hiện tại/);
  assert.match(source, /Tùy chỉnh lần phân tích/);
});
