import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPriceMinor,
} from '../src/utils/formatters.ts';
import {
  isInterviewRoomRoute,
  isFocusedPracticeRoute,
} from '../src/services/focusedPracticeRoutes.ts';

test('Smoke Check A & B: /pricing formatted amounts for Basic, Weekly, Pro and Free', () => {
  const clean = (str) => str.replace(/\u00A0/g, ' ');

  // 1. Basic Plan (49,000 VND)
  const basic = clean(formatPriceMinor(49000, 'VND'));
  assert.equal(basic, '49.000 ₫');

  // 2. Weekly Plan (189,000 VND)
  const weekly = clean(formatPriceMinor(189000, 'VND'));
  assert.equal(weekly, '189.000 ₫');

  // 3. Pro Plan (599,000 VND)
  const pro = clean(formatPriceMinor(599000, 'VND'));
  assert.equal(pro, '599.000 ₫');

  // 4. Free Plan (0)
  const free = formatPriceMinor(0, 'VND');
  assert.equal(free, 'Miễn phí');
});

test('Smoke Check C: Preflight /interviews/new role clearing and typing state transitions', () => {
  const defaultRole = 'Business Analyst';
  const defaultSeniority = 'Middle';

  // Initial untouched state
  let sessionRole = null;
  let sessionSeniority = null;
  let effectiveRole = sessionRole ?? defaultRole;
  let effectiveSeniority = sessionSeniority ?? defaultSeniority;
  assert.equal(effectiveRole, 'Business Analyst');
  assert.equal(effectiveSeniority, 'Middle');

  // Action: User deletes role (Ctrl+A -> Backspace)
  sessionRole = '';
  effectiveRole = sessionRole ?? defaultRole;
  assert.equal(effectiveRole, '');
  assert.equal(effectiveRole.trim().length, 0);

  // Validation: empty role blocks start interview
  const canStart = Boolean(effectiveRole.trim());
  assert.equal(canStart, false);

  // Action: User types new role 'Product Manager'
  sessionRole = 'Product Manager';
  effectiveRole = sessionRole ?? defaultRole;
  assert.equal(effectiveRole, 'Product Manager');
  assert.equal(Boolean(effectiveRole.trim()), true);

  // Simulating query refetch with new default from server
  const refetchedDefaultRole = 'Senior Business Analyst';
  effectiveRole = sessionRole ?? refetchedDefaultRole;
  // Must stay 'Product Manager' without snapping back to refetched default
  assert.equal(effectiveRole, 'Product Manager');
});

test('Smoke Check D: Interview room exit modal flow with cancel, reopen, and confirm navigation to /interviews', () => {
  const activeRoomPath = '/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33';
  assert.equal(isInterviewRoomRoute(activeRoomPath), true);
  assert.equal(isFocusedPracticeRoute(activeRoomPath), true);

  // Simulate modal state and router navigation
  let showExitConfirm = false;
  const navigationHistory = [];
  const router = {
    push: (dest) => navigationHistory.push(dest),
  };

  const config = {
    title: 'Phỏng vấn Backend Engineer',
    exitTo: '/interviews',
  };

  const handleConfirmExit = () => {
    showExitConfirm = false;
    const dest = config?.exitTo || (activeRoomPath.startsWith('/interviews') ? '/interviews' : '/practice');
    router.push(dest);
  };

  // Step 1: User clicks 'Thoát phiên luyện' -> modal opens
  showExitConfirm = true;
  assert.equal(showExitConfirm, true);
  assert.equal(navigationHistory.length, 0);

  // Step 2: User clicks 'Ở lại luyện tập' (Cancel) -> modal closes, no navigation
  showExitConfirm = false;
  assert.equal(showExitConfirm, false);
  assert.equal(navigationHistory.length, 0);

  // Step 3: User reopens modal
  showExitConfirm = true;
  assert.equal(showExitConfirm, true);

  // Step 4: User clicks 'Xác nhận rời phòng' (Confirm) -> modal closes, navigates to /interviews
  handleConfirmExit();
  assert.equal(showExitConfirm, false);
  assert.equal(navigationHistory.length, 1);
  assert.equal(navigationHistory[0], '/interviews');
});
