import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

test('Requirement A: /account route renders AccountSettings replatformed surface', async () => {
  const pageSource = await readSource(
    '../src/app/(dashboard)/account/page.tsx'
  );
  assert.match(pageSource, /import AccountSettings from/);
  assert.match(pageSource, /<AccountSettings \/>/);

  const screenSource = await readSource(
    '../src/components/features/account/AccountSettings.tsx'
  );
  assert.match(screenSource, /AccountHeader/);
  assert.match(screenSource, /PersonalInformationCard/);
  assert.match(screenSource, /SecurityCard/);
  assert.match(screenSource, /PlanUsageCard/);
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
  assert.match(userHookSource, /export const CURRENT_USER_QUERY_KEY\s*=\s*\['currentUser'\]/);

  const screenSource = await readSource(
    '../src/components/features/account/AccountSettings.tsx'
  );
  // No local state duplicate user store
  assert.doesNotMatch(screenSource, /localUserOverride/);
  assert.doesNotMatch(screenSource, /setLocalUserOverride/);
  assert.doesNotMatch(screenSource, /effectiveUser/);

  // Directly renders canonical user
  assert.match(screenSource, /const \{\s*data:\s*user/);
  assert.match(screenSource, /<AccountHeader user=\{user\} \/>/);
  assert.match(screenSource, /<PersonalInformationCard user=\{user\} \/>/);

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
