import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { passwordSchema, resolveYearsOfExperience } from '../src/schema/accountSchema.ts';

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

test('Requirement A: /account redirects to canonical account-only /settings', async () => {
  const pageSource = await readSource(
    '../src/app/(dashboard)/account/page.tsx'
  );
  assert.match(pageSource, /redirect\('\/settings'\)/);
  const settingsSource = await readSource('../src/app/(dashboard)/settings/page.tsx');
  assert.match(settingsSource, /<AccountSettings \/>/);

  const screenSource = await readSource(
    '../src/components/features/account/AccountSettings.tsx'
  );
  assert.doesNotMatch(screenSource, /<PersonalInformationCard/);
  assert.match(screenSource, /SecurityCard/);
  assert.doesNotMatch(screenSource, /<PlanUsageCard/);
  assert.match(screenSource, /PrivacyDataCard/);
  assert.match(screenSource, /SessionsCard/);
  assert.match(screenSource, /DangerZoneCard/);
});

test('Requirement B: Legacy AccountSettings.module.css is completely removed', async () => {
  await assert.rejects(() =>
    access(
      new URL(
        '../src/components/features/account/AccountSettings.module.css',
        import.meta.url
      ),
      constants.F_OK
    )
  );

  const screenSource = await readSource(
    '../src/components/features/account/AccountSettings.tsx'
  );
  assert.doesNotMatch(screenSource, /AccountSettings\.module\.css/);
});

test('Requirement C & D & U: No hardcoded ResumeManagementSection or resume hooks in Account', async () => {
  const screenSource = await readSource(
    '../src/components/features/account/AccountSettings.tsx'
  );
  assert.doesNotMatch(screenSource, /ResumeManagementSection/);
  assert.doesNotMatch(screenSource, /useResumes/);
  assert.doesNotMatch(screenSource, /useSetPrimaryResume/);

  // Verify ResumeManagementSection remains authoritative in /career-profile
  const cpScreenSource = await readSource(
    '../src/components/features/career-profile/CareerProfileScreen.tsx'
  );
  assert.match(cpScreenSource, /ResumeManagementSection/);

  const cpResumeSource = await readSource(
    '../src/components/features/career-profile/ResumeManagementSection.tsx'
  );
  assert.match(cpResumeSource, /useResumes/);
  assert.match(cpResumeSource, /useSetPrimaryResume/);
});

test('Requirement E: Contextual navigation link points to /career-profile', async () => {
  const headerSource = await readSource(
    '../src/components/features/account/AccountHeader.tsx'
  );
  assert.match(headerSource, /href="\/career-profile"/);
  assert.match(headerSource, /Quản lý CV/);
});

test('Requirement F: Raw user.roles.join(...) is no longer rendered in consumer Account UI', async () => {
  const screenSource = await readSource(
    '../src/components/features/account/AccountSettings.tsx'
  );
  assert.doesNotMatch(screenSource, /user\.roles/);
  assert.doesNotMatch(screenSource, /roles\.join/);

  const personalInfoSource = await readSource(
    '../src/components/features/account/PersonalInformationCard.tsx'
  );
  assert.doesNotMatch(personalInfoSource, /user\.roles/);
  assert.doesNotMatch(personalInfoSource, /roles\.join/);
  assert.doesNotMatch(personalInfoSource, /Admin/);
});

test('Requirement G: Profile edit supports displayName and yearsOfExperience', async () => {
  const personalInfoSource = await readSource(
    '../src/components/features/account/PersonalInformationCard.tsx'
  );
  assert.match(personalInfoSource, /displayName/);
  assert.match(personalInfoSource, /yearsOfExperience/);
  assert.match(personalInfoSource, /userApi\.updateProfile/);
  assert.match(personalInfoSource, /Lưu thay đổi/);
});

test('Requirement H: Email field remains read-only', async () => {
  const personalInfoSource = await readSource(
    '../src/components/features/account/PersonalInformationCard.tsx'
  );
  assert.match(personalInfoSource, /value=\{user\.email\}/);
  assert.match(personalInfoSource, /readOnly/);
  assert.match(personalInfoSource, /disabled/);
});

test('Requirement I: Password change calls existing production contract', async () => {
  const secSource = await readSource(
    '../src/components/features/account/SecurityCard.tsx'
  );
  assert.match(secSource, /userApi\.changePassword/);
  assert.match(secSource, /currentPassword/);
  assert.match(secSource, /newPassword/);
  assert.match(secSource, /confirmPassword/);
});

test('Requirement J & K: PlanUsageCard renders real entitlement and no fabricated values', async () => {
  const planSource = await readSource(
    '../src/components/features/account/PlanUsageCard.tsx'
  );
  assert.match(planSource, /billing\?\.entitlement/);
  assert.match(planSource, /entitlement\.planCode/);
  assert.match(planSource, /entitlement\.startsAt/);
  assert.match(planSource, /entitlement\.endsAt/);
  assert.match(planSource, /entitlement\.consumed/);
  assert.match(planSource, /entitlement\.available/);
  assert.match(planSource, /Chưa có thông tin gói sử dụng\./);
  // Ensure unlimited is not called "0 credits"
  assert.doesNotMatch(planSource, /0 credits/);
});

test('Requirement L: Data export calls userApi.exportData()', async () => {
  const privacySource = await readSource(
    '../src/components/features/account/PrivacyDataCard.tsx'
  );
  assert.match(privacySource, /userApi\.exportData/);
  assert.match(privacySource, /Xuất dữ liệu của tôi/);
  assert.match(privacySource, /nexora-export-/);
});

test('Requirement M & R: Account deletion calls userApi.requestDeletion() via custom Modal', async () => {
  const modalSource = await readSource(
    '../src/components/features/account/DeleteAccountModal.tsx'
  );
  assert.match(modalSource, /userApi\.requestDeletion/);
  assert.match(modalSource, /authApi\.logout/);
  assert.match(modalSource, /Modal/);
  assert.match(modalSource, /Yêu cầu xóa tài khoản/);
  assert.match(modalSource, /Hành động này không thể hoàn tác\./);
  assert.doesNotMatch(modalSource, /window\.confirm/);
});

test('Requirement N & O & Q: Sessions and logout-all use authApi and custom Modal', async () => {
  const sessionsSource = await readSource(
    '../src/components/features/account/SessionsCard.tsx'
  );
  assert.match(sessionsSource, /authApi\.logout\(\)/);
  assert.match(sessionsSource, /LogoutAllModal/);
  assert.doesNotMatch(sessionsSource, /window\.confirm/);

  const logoutAllModalSource = await readSource(
    '../src/components/features/account/LogoutAllModal.tsx'
  );
  assert.match(logoutAllModalSource, /authApi\.logoutAll\(\)/);
  assert.match(logoutAllModalSource, /Modal/);
  assert.doesNotMatch(logoutAllModalSource, /window\.confirm/);
});

test('Requirement P: No window.confirm remains across account components', async () => {
  const files = [
    '../src/components/features/account/AccountSettings.tsx',
    '../src/components/features/account/AccountHeader.tsx',
    '../src/components/features/account/PersonalInformationCard.tsx',
    '../src/components/features/account/SecurityCard.tsx',
    '../src/components/features/account/PlanUsageCard.tsx',
    '../src/components/features/account/PrivacyDataCard.tsx',
    '../src/components/features/account/SessionsCard.tsx',
    '../src/components/features/account/DangerZoneCard.tsx',
    '../src/components/features/account/LogoutAllModal.tsx',
    '../src/components/features/account/DeleteAccountModal.tsx',
    '../src/components/features/account/AccountSkeleton.tsx',
    '../src/components/features/account/AccountSecurityAsset.tsx',
  ];

  for (const file of files) {
    const src = await readSource(file);
    assert.doesNotMatch(src, /window\.confirm/, `File ${file} must not contain window.confirm`);
  }
});

test('Requirement S: Account uses structured layout skeleton instead of raw text loader', async () => {
  const screenSource = await readSource(
    '../src/components/features/account/AccountSettings.tsx'
  );
  assert.doesNotMatch(screenSource, /Đang tải thông tin\.\.\./);
  assert.match(screenSource, /AccountSkeleton/);

  const skeletonSource = await readSource(
    '../src/components/features/account/AccountSkeleton.tsx'
  );
  assert.match(skeletonSource, /animate-pulse/);
  assert.match(skeletonSource, /bg-surface-container/);
});

test('Requirement T: AccountSecurityAsset is decorative and accessibly hidden', async () => {
  const assetSource = await readSource(
    '../src/components/features/account/AccountSecurityAsset.tsx'
  );
  assert.match(assetSource, /aria-hidden="true"/);
  assert.match(assetSource, /<svg/);
  // Must not have text tags inside the SVG
  assert.doesNotMatch(assetSource, /<text/);
});

test('Requirement V: Account page remains independent from Career Profile mutations', async () => {
  const screenSource = await readSource(
    '../src/components/features/account/AccountSettings.tsx'
  );
  assert.doesNotMatch(screenSource, /useUpdateCareerGoal/);
  assert.doesNotMatch(screenSource, /useCreateCareerGoal/);
  assert.doesNotMatch(screenSource, /useDeleteCareerGoal/);
  assert.doesNotMatch(screenSource, /useReactivateCareerGoal/);
});

// ==========================================
// Corrective Tests (Items 1 - 5)
// ==========================================

test('Corrective 1: No localUserOverride store; useCurrentUser is canonical and profile writes through query cache', async () => {
  const userHookSource = await readSource(
    '../src/hooks/queries/useUser.ts'
  );
  assert.match(userHookSource, /CURRENT_USER_QUERY_KEY/);
  const sharedQueryKeysSource = await readSource('../src/services/sharedQueryKeys.ts');
  assert.match(sharedQueryKeysSource, /export const CURRENT_USER_QUERY_KEY\s*=\s*\['currentUser'\]/);

  const screenSource = await readSource(
    '../src/components/features/account/AccountSettings.tsx'
  );
  // No local state duplicate user store
  assert.doesNotMatch(screenSource, /localUserOverride/);
  assert.doesNotMatch(screenSource, /setLocalUserOverride/);
  assert.doesNotMatch(screenSource, /effectiveUser/);

  // Directly renders canonical user
  assert.match(screenSource, /const \{\s*data:\s*user/);
  const profileSource = await readSource('../src/app/(dashboard)/profile/page.tsx');
  assert.match(profileSource, /<PersonalInformationCard user=\{user\.data\} \/>/);

  const personalInfoSource = await readSource(
    '../src/components/features/account/PersonalInformationCard.tsx'
  );
  assert.match(personalInfoSource, /CURRENT_USER_QUERY_KEY/);
  assert.match(personalInfoSource, /queryClient\.setQueryData\(CURRENT_USER_QUERY_KEY,\s*updated\)/);
  assert.match(personalInfoSource, /queryClient\.invalidateQueries\(\{\s*queryKey:\s*CURRENT_USER_QUERY_KEY\s*\}\)/);
});

test('Corrective 2: Background refetch error with existing cached user keeps Account visible', async () => {
  const screenSource = await readSource(
    '../src/components/features/account/AccountSettings.tsx'
  );
  // Must NOT unconditionally block or throw full-page error on isError alone
  assert.doesNotMatch(screenSource, /if\s*\(\s*isError\s*\|\|\s*!user\s*\)/);
  assert.doesNotMatch(screenSource, /if\s*\(\s*isError\s*\|\|\s*!effectiveUser\s*\)/);

  // Must only show full-page error if !user AND isError
  assert.match(screenSource, /if\s*\(\s*!user\s*\)\s*\{\s*if\s*\(\s*isError\s*\)/);
});

test('Corrective 3: Account deletion copy is truthful to backend contract and does not claim all sessions terminate', async () => {
  const dangerZoneSource = await readSource(
    '../src/components/features/account/DangerZoneCard.tsx'
  );
  assert.doesNotMatch(dangerZoneSource, /kết thúc tất cả phiên đăng nhập/i);
  assert.doesNotMatch(dangerZoneSource, /toàn bộ phiên đăng nhập/i);
  assert.match(dangerZoneSource, /đăng xuất khỏi phiên hiện tại/i);

  const deleteModalSource = await readSource(
    '../src/components/features/account/DeleteAccountModal.tsx'
  );
  assert.doesNotMatch(deleteModalSource, /kết thúc tất cả phiên đăng nhập/i);
  assert.doesNotMatch(deleteModalSource, /toàn bộ phiên đăng nhập/i);
  assert.match(deleteModalSource, /đăng xuất khỏi phiên hiện tại/i);

  // Verify authApi.logoutAll is NOT called in deletion modal
  assert.doesNotMatch(deleteModalSource, /authApi\.logoutAll/);
  assert.match(deleteModalSource, /authApi\.logout\(\)/);

  // SessionsCard still preserves genuine logout-all
  const sessionsSource = await readSource(
    '../src/components/features/account/SessionsCard.tsx'
  );
  assert.match(sessionsSource, /LogoutAllModal/);
  const logoutAllModalSource = await readSource(
    '../src/components/features/account/LogoutAllModal.tsx'
  );
  assert.match(logoutAllModalSource, /authApi\.logoutAll\(\)/);
});

test('Corrective 4: AccountSecurityAsset uses actual Nexora --color-* tokens with no #6366f1 or #4f46e5 fallbacks', async () => {
  const assetSource = await readSource(
    '../src/components/features/account/AccountSecurityAsset.tsx'
  );

  // Uses actual Nexora semantic CSS tokens
  assert.match(assetSource, /var\(--color-primary\)/);
  assert.match(assetSource, /var\(--color-primary-container\)/);

  // Does NOT use wrong variable names or hardcoded fallback hex colors
  assert.doesNotMatch(assetSource, /var\(--primary[,)]/);
  assert.doesNotMatch(assetSource, /var\(--primary-container[,)]/);
  assert.doesNotMatch(assetSource, /#6366f1/i);
  assert.doesNotMatch(assetSource, /#4f46e5/i);
});

test('Corrective 5: PlanUsageCard does not nest Button inside Link for pricing CTAs', async () => {
  const planSource = await readSource(
    '../src/components/features/account/PlanUsageCard.tsx'
  );

  // Ensure no <Link> contains <Button>
  assert.doesNotMatch(planSource, /<Link[^>]*>[\s\S]*?<Button/);
  // Ensure Button is not imported or rendered as nested interactive element inside Link
  assert.doesNotMatch(planSource, /import\s*\{[^}]*Button[^}]*\}\s*from/);
  // Ensure Link with href="/pricing" exists directly
  assert.match(planSource, /<Link\s+href="\/pricing"/);
});

test('Blocker 1: Password change contract requires currentPassword, min 8 chars newPassword, and rejects Google OAuth bypass text', async () => {
  const userApiSource = await readSource('../src/services/userApi.ts');
  // API request type makes currentPassword required (not optional)
  assert.match(userApiSource, /currentPassword:\s*string;/);
  assert.doesNotMatch(userApiSource, /currentPassword\?:\s*string;/);

  const secSource = await readSource(
    '../src/components/features/account/SecurityCard.tsx'
  );
  // UI does NOT tell OAuth/Google users to leave current password blank
  assert.doesNotMatch(secSource, /Google/i);
  assert.doesNotMatch(secSource, /để trống.*Mật khẩu hiện tại/i);
  assert.doesNotMatch(secSource, /Mật khẩu hiện tại \(nếu có\)/);

  // UI label and placeholder reflect required current password and 8+ char requirement
  assert.match(secSource, /label="Mật khẩu hiện tại"/);
  assert.match(secSource, /placeholder="Tối thiểu 8 ký tự"/);
  assert.doesNotMatch(secSource, /placeholder="Tối thiểu 6 ký tự"/);

  // Request payload does NOT convert current password to undefined
  assert.doesNotMatch(secSource, /currentPassword\s*\|\|\s*undefined/);
  assert.match(secSource, /currentPassword:\s*data\.currentPassword/);
});

test('Blocker 1 (Runtime Schema): passwordSchema enforces 8+ chars new password, required current password, equality check, and max length', () => {
  // 7-char new password => rejected
  const res7 = passwordSchema.safeParse({
    currentPassword: 'currentPassword123',
    newPassword: 'short7!',
    confirmPassword: 'short7!',
  });
  assert.equal(res7.success, false, '7-char new password must be rejected');
  const issue7 = res7.error.issues.find((i) => i.path.includes('newPassword'));
  assert.ok(issue7, 'Must have issue on newPassword');
  assert.match(issue7.message, /8 ký tự/);

  // 8-char new password => accepted
  const res8 = passwordSchema.safeParse({
    currentPassword: 'currentPassword123',
    newPassword: 'valid8ch',
    confirmPassword: 'valid8ch',
  });
  assert.equal(res8.success, true, '8-char new password must be accepted');

  // empty current password => rejected
  const resEmptyCurr = passwordSchema.safeParse({
    currentPassword: '',
    newPassword: 'valid8chars',
    confirmPassword: 'valid8chars',
  });
  assert.equal(resEmptyCurr.success, false, 'Empty current password must be rejected');
  const issueEmptyCurr = resEmptyCurr.error.issues.find((i) => i.path.includes('currentPassword'));
  assert.ok(issueEmptyCurr, 'Must have issue on currentPassword');

  // missing current password => rejected (currentPassword is not optional)
  const resMissingCurr = passwordSchema.safeParse({
    newPassword: 'valid8chars',
    confirmPassword: 'valid8chars',
  });
  assert.equal(resMissingCurr.success, false, 'Missing current password must be rejected');

  // newPassword !== confirmPassword => rejected
  const resMismatch = passwordSchema.safeParse({
    currentPassword: 'currentPassword123',
    newPassword: 'valid8chars',
    confirmPassword: 'differentPassword',
  });
  assert.equal(resMismatch.success, false, 'Mismatched passwords must be rejected');
  const issueMismatch = resMismatch.error.issues.find((i) => i.path.includes('confirmPassword'));
  assert.ok(issueMismatch, 'Must have issue on confirmPassword');
  assert.match(issueMismatch.message, /không khớp/);

  // Password exceeding 128 characters => rejected
  const resTooLong = passwordSchema.safeParse({
    currentPassword: 'currentPassword123',
    newPassword: 'a'.repeat(129),
    confirmPassword: 'a'.repeat(129),
  });
  assert.equal(resTooLong.success, false, 'Password > 128 chars must be rejected');
});

test('Issue 2: yearsOfExperience resolution does not pretend to clear stored values and preserves numeric 0', () => {
  // blank input does NOT pretend to clear previously stored value (3 => 3)
  assert.equal(resolveYearsOfExperience('', 3), 3);
  assert.equal(resolveYearsOfExperience('   '.trim(), 3), 3);
  assert.equal(resolveYearsOfExperience(null, 3), 3);
  assert.equal(resolveYearsOfExperience(undefined, 3), 3);

  // 0 is valid and NOT accidentally treated as blank/falsy
  assert.equal(resolveYearsOfExperience(0, 3), 0);
  assert.equal(resolveYearsOfExperience('0', 3), 0);
  assert.equal(resolveYearsOfExperience(0, null), 0);

  // updating to another numeric value works
  assert.equal(resolveYearsOfExperience(5, 3), 5);
  assert.equal(resolveYearsOfExperience('5', 3), 5);

  // user with no previous value leaving blank remains null (not error or NaN)
  assert.equal(resolveYearsOfExperience('', null), null);
  assert.equal(resolveYearsOfExperience('', undefined), null);
});

test('Issue 2 (UI Contract): PersonalInformationCard provides clear helper text and does not send null to clear existing years', async () => {
  const personalInfoSource = await readSource(
    '../src/components/features/account/PersonalInformationCard.tsx'
  );

  // Helper text informs user about keeping existing value when blank
  assert.match(personalInfoSource, /Để trống sẽ giữ nguyên giá trị hiện có/);
  assert.match(personalInfoSource, /không hỗ trợ xóa trắng/);

  // Uses resolveYearsOfExperience rather than naive null mapping
  assert.match(personalInfoSource, /resolveYearsOfExperience/);
  assert.doesNotMatch(personalInfoSource, /data\.yearsOfExperience === ''\s*\|\|\s*data\.yearsOfExperience === null\s*\?\s*null\s*:\s*Number/);
});
