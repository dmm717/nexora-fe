import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import {
  CAREER_GOAL_SENIORITY_OPTIONS,
  formatSeniorityLabel,
  buildCreateCareerGoalRequest,
  buildCareerProfileGoalUpdateRequest,
} from '../src/services/careerGoalContract.ts';

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

test('A: Authenticated avatar "Hồ sơ nghề nghiệp" resolves to /career-profile, not /career-goals', async () => {
  const source = await readSource('../src/components/header/AuthenticatedHeader.tsx');
  assert.doesNotMatch(source, /if\s*\(\s*item\.href\s*===\s*['"]\/career-profile['"]\s*\)\s*resolvedHref\s*=\s*['"]\/career-goals['"]/);
  assert.match(source, /if\s*\(\s*item\.actionKey\s*===\s*['"]settings['"]\s*\)\s*resolvedHref\s*=\s*['"]\/account['"]/);

  const navSource = await readSource('../src/config/navigation.ts');
  assert.match(navSource, /label:\s*['"]Hồ sơ nghề nghiệp['"],\s*href:\s*['"]\/career-profile['"]/);
});

test('B: /career-profile route exists and renders CareerProfileScreen', async () => {
  await assert.doesNotReject(() =>
    access(new URL('../src/app/(dashboard)/career-profile/page.tsx', import.meta.url), constants.F_OK)
  );

  const source = await readSource('../src/app/(dashboard)/career-profile/page.tsx');
  assert.match(source, /CareerProfileScreen/);
});

test('C & D: Identity card uses real CareerProfile/User data and renders truthful empty copy', async () => {
  const source = await readSource('../src/components/features/career-profile/CareerIdentityCard.tsx');

  // Real data usage
  assert.match(source, /profile\.displayName/);
  assert.match(source, /profile\.email/);
  assert.match(source, /profile\.yearsOfExperience/);
  assert.match(source, /onboarding\.isComplete/);

  // Truthful empty copy for missing name and experience
  assert.match(source, /Chưa cập nhật tên/);
  assert.match(source, /Chưa có năm kinh nghiệm/);

  // Truthful onboarding copy (no fake 100%)
  assert.match(source, /Đã hoàn tất/);
  assert.match(source, /Chưa hoàn thiện/);
  assert.doesNotMatch(source, /100%/);

  // Link to canonical /account for profile editing
  assert.match(source, /\/account/);
  assert.doesNotMatch(source, /\/onboarding/);
});

test('E & F: Active career goal uses actual fields and renders truthful empty state without fake defaults', async () => {
  const cardSource = await readSource('../src/components/features/career-profile/CareerGoalsSection.tsx');

  assert.match(cardSource, /activeGoal\.targetRole/);
  assert.match(cardSource, /activeGoal\.seniority/);
  assert.match(cardSource, /activeGoal\.industry/);
  assert.match(cardSource, /Chưa cập nhật/);
  assert.match(cardSource, /Đang kích hoạt/);

  // No fake fallbacks
  assert.doesNotMatch(cardSource, /Fintech\s*\/\s*Đa ngành/);
  assert.doesNotMatch(cardSource, /targetRole\s*\|\|\s*['"]Backend Engineer['"]/);

  // Truthful empty state
  assert.match(cardSource, /Chưa có mục tiêu nghề nghiệp/);
});

test('G, H, I, J, K: Resume list uses production resumes, enforces primary rules, and supports unset-primary', async () => {
  const source = await readSource('../src/components/features/career-profile/ResumeManagementSection.tsx');

  // Uses production queries and mutations
  assert.match(source, /useResumes/);
  assert.match(source, /useSetPrimaryResume/);
  assert.match(source, /primaryResumeId/);

  // Primary badge only for canonical primary resume
  assert.match(source, /isPrimary\s*=\s*res\.id\s*===\s*primaryResumeId/);
  assert.match(source, /CV Chính thức/);

  // Unset-primary passes null
  assert.match(source, /setPrimaryResume\(null\)/);

  // Set-primary requires ready resume
  assert.match(source, /setPrimaryResume\(res\.id\)/);
  assert.match(source, /disabled=\{isSettingPrimary\s*\|\|\s*!isReady\}/);

  // Canonical route for analysis
  assert.match(source, /\/resume-analyses/);
  assert.doesNotMatch(source, /\/cv-analysis\/launch/);
});

test('L: No fake addResume or PrototypeContext dependency exists in Career Profile components', async () => {
  const screenSource = await readSource('../src/components/features/career-profile/CareerProfileScreen.tsx');
  const sectionSource = await readSource('../src/components/features/career-profile/ResumeManagementSection.tsx');
  const modalSource = await readSource('../src/components/features/career-profile/EditCareerGoalModal.tsx');

  for (const src of [screenSource, sectionSource, modalSource]) {
    assert.doesNotMatch(src, /usePrototype/);
    assert.doesNotMatch(src, /PrototypeContext/);
    assert.doesNotMatch(src, /handleUploadSimulate/);
  }
});

test('M, N, O: Skill Profile uses real evidence, never fabricates Date.now(), and handles empty states truthfully', async () => {
  const source = await readSource('../src/components/features/career-profile/SkillProfileSection.tsx');

  assert.match(source, /topCompetencies/);
  assert.match(source, /c\.score/);
  assert.match(source, /c\.evidenceCount/);

  // Never fall back to Date.now()
  assert.doesNotMatch(source, /Date\.now\(\)/);
  assert.match(source, /Chưa có mốc cập nhật/);

  // Empty state copy
  assert.match(source, /Chưa có đủ bằng chứng năng lực/);

  // Weakness signals
  assert.match(source, /topWeaknessSignals/);
  assert.match(source, /Tín hiệu khuyết thiếu năng lực đã được ghi nhận:/);
});

test('P: /account remains account settings and CareerProfileSection is retired', async () => {
  const accountSource = await readSource('../src/app/(dashboard)/account/page.tsx');
  assert.match(accountSource, /AccountSettings/);

  await assert.rejects(() =>
    access(new URL('../src/components/features/career/CareerProfileSection.tsx', import.meta.url), constants.F_OK)
  );
});

test('Q: Career profile CTAs route to canonical production endpoints', async () => {
  const headerSource = await readSource('../src/components/features/career-profile/CareerProfileHeader.tsx');
  assert.match(headerSource, /router\.push\(['"]\/resume-analyses['"]\)/);

  const identitySource = await readSource('../src/components/features/career-profile/CareerIdentityCard.tsx');
  assert.match(identitySource, /router\.push\(['"]\/account['"]\)/);
});

test('R: Mobile layout does not depend on desktop-only grid assumptions', async () => {
  const screenSource = await readSource('../src/components/features/career-profile/CareerProfileScreen.tsx');
  assert.match(screenSource, /grid-cols-1\s+lg:grid-cols-12/);
  assert.match(screenSource, /lg:col-span-5/);
  assert.match(screenSource, /lg:col-span-7/);

  const goalSource = await readSource('../src/components/features/career-profile/CareerGoalsSection.tsx');
  assert.match(goalSource, /grid-cols-1/);

  const resumeSource = await readSource('../src/components/features/career-profile/ResumeManagementSection.tsx');
  assert.match(resumeSource, /flex-col\s+sm:flex-row/);
});

// ==================================================
// SENIORITY CONTRACT & REGRESSION TESTS
// ==================================================

test('Seniority A & B: new Career Profile goal starts with seniority == "" and blocks submission if unselected', async () => {
  const modalSource = await readSource('../src/components/features/career-profile/EditCareerGoalModal.tsx');

  // Starts with '' when no active goal
  assert.match(modalSource, /const\s*\[seniority,\s*setSeniority\]\s*=\s*useState\(activeGoal\?\.seniority\s*\|\|\s*''\);/);
  assert.doesNotMatch(modalSource, /useState\(activeGoal\?\.seniority\s*\|\|\s*['"]Middle['"]\)/);
  assert.doesNotMatch(modalSource, /useState\(activeGoal\?\.seniority\s*\|\|\s*['"]mid['"]\)/);

  // Validation blocks empty seniority
  assert.match(modalSource, /if\s*\(!trimmedSeniority\)\s*\{\s*setError\(['"]Vui lòng chọn cấp bậc\.['"]\);/);
});

test('Seniority C & D: CAREER_GOAL_SENIORITY_OPTIONS uses canonical "mid", NOT "Middle", and excludes "Fresher"', () => {
  const values = CAREER_GOAL_SENIORITY_OPTIONS.map((opt) => opt.value);

  // Must contain canonical backend values
  assert.ok(values.includes('mid'), 'CAREER_GOAL_SENIORITY_OPTIONS must include "mid"');
  assert.ok(values.includes('entry'), 'CAREER_GOAL_SENIORITY_OPTIONS must include "entry"');
  assert.ok(values.includes('intern'), 'CAREER_GOAL_SENIORITY_OPTIONS must include "intern"');
  assert.ok(values.includes('junior'), 'CAREER_GOAL_SENIORITY_OPTIONS must include "junior"');
  assert.ok(values.includes('senior'), 'CAREER_GOAL_SENIORITY_OPTIONS must include "senior"');
  assert.ok(values.includes('lead'), 'CAREER_GOAL_SENIORITY_OPTIONS must include "lead"');

  // Must NOT contain unnormalized or unsupported values
  assert.equal(values.includes('Middle'), false, 'Values must not contain "Middle"');
  assert.equal(values.includes('middle'), false, 'Values must not contain "middle"');
  assert.equal(values.includes('Fresher'), false, 'Values must not contain "Fresher"');
  assert.equal(values.includes('fresher'), false, 'Values must not contain "fresher"');
});

test('Seniority E & F: existing active goal seniority ("mid", "entry") renders and formats correctly', () => {
  assert.equal(formatSeniorityLabel('mid'), 'Chuyên viên (Mid-level)');
  assert.equal(formatSeniorityLabel('entry'), 'Mới đi làm (Entry-level)');
  assert.equal(formatSeniorityLabel('intern'), 'Thực tập sinh (Intern)');
  assert.equal(formatSeniorityLabel('senior'), 'Chuyên viên cao cấp (Senior)');
  assert.equal(formatSeniorityLabel('lead'), 'Trưởng nhóm (Lead)');
});

test('Seniority G & H: manager, director, executive, staff, principal remain representable', () => {
  const values = CAREER_GOAL_SENIORITY_OPTIONS.map((opt) => opt.value);

  assert.ok(values.includes('staff'), 'staff must be representable');
  assert.ok(values.includes('principal'), 'principal must be representable');
  assert.ok(values.includes('manager'), 'manager must be representable');
  assert.ok(values.includes('director'), 'director must be representable');
  assert.ok(values.includes('executive'), 'executive must be representable');

  assert.equal(formatSeniorityLabel('staff'), 'Staff');
  assert.equal(formatSeniorityLabel('principal'), 'Principal');
  assert.equal(formatSeniorityLabel('manager'), 'Quản lý (Manager)');
  assert.equal(formatSeniorityLabel('director'), 'Giám đốc (Director)');
  assert.equal(formatSeniorityLabel('executive'), 'Điều hành (Executive)');
});

test('Seniority I: create payload with Mid-level UI selection sends seniority: "mid"', () => {
  const payload = buildCreateCareerGoalRequest({
    targetRole: 'Backend Engineer',
    seniority: 'mid',
    industry: 'Fintech',
  });

  assert.equal(payload.targetRole, 'Backend Engineer');
  assert.equal(payload.seniority, 'mid');
  assert.equal(payload.industry, 'Fintech');
});

test('Seniority J: editing role/industry without changing seniority preserves canonical seniority and does not clear unrelated fields', () => {
  const currentGoal = {
    targetRole: 'Backend Engineer',
    seniority: 'mid',
    industry: 'Fintech',
    targetCompany: 'Acme Corp',
    targetJobDescriptionId: 'jd-123',
    targetDate: '2026-12-31',
    active: true,
  };

  // User edits only targetRole and industry, leaves seniority as 'mid'
  const updateReq = buildCareerProfileGoalUpdateRequest(currentGoal, {
    targetRole: 'Senior Backend Engineer',
    seniority: 'mid',
    industry: 'Banking',
  });

  // Role and industry are specified
  assert.equal(updateReq.targetRoleSpecified, true);
  assert.equal(updateReq.targetRole, 'Senior Backend Engineer');
  assert.equal(updateReq.industrySpecified, true);
  assert.equal(updateReq.industry, 'Banking');

  // Seniority was unchanged so not marked specified (or if specified, remains 'mid')
  assert.equal(updateReq.senioritySpecified, undefined);

  // Unrelated fields MUST NOT be specified/cleared
  assert.equal('targetCompanySpecified' in updateReq, false);
  assert.equal('targetCompany' in updateReq, false);
  assert.equal('targetJobDescriptionIdSpecified' in updateReq, false);
  assert.equal('targetDateSpecified' in updateReq, false);
  assert.equal('activeSpecified' in updateReq, false);
});

test('Seniority K: consolidated career goal editor uses the shared option source', async () => {
  const source = await readSource('../src/components/features/career-profile/EditCareerGoalModal.tsx');

  assert.match(source, /CAREER_GOAL_SENIORITY_OPTIONS/);
  assert.match(source, /CAREER_GOAL_SENIORITY_OPTIONS\.map/);

  // Ensure hard-coded duplicated lists are removed
  assert.doesNotMatch(source, /<option value="intern">Thực tập sinh \(Intern\)<\/option>/);
  assert.doesNotMatch(source, /<option value="mid">Chuyên viên \(Mid-level\)<\/option>/);
});
