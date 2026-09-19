import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  isInterviewRoomRoute,
  isInterviewPreflightRoute,
  isFocusedPracticeRoute,
  shouldRenderFocusedPracticeHeader,
  resolveDefaultFocusedExit,
  resolveFocusedExitDestination,
  navigateFocusedExitOnce,
} from '../src/services/focusedPracticeRoutes.ts';

const readSource = (relPath) => readFile(new URL(relPath, import.meta.url), 'utf8');

test('A & B: Interview room confirmation invokes exit navigation once to /interviews', async () => {
  const [headerSource, contextSource, roomSource] = await Promise.all([
    readSource('../src/components/header/FocusedPracticeHeader.tsx'),
    readSource('../src/components/layouts/FocusedPracticeShellContext.tsx'),
    readSource('../src/app/(dashboard)/interviews/[id]/page.tsx'),
  ]);

  // Interview room config specifies exitTo: '/interviews'
  assert.match(roomSource, /exitTo:\s*'\/interviews'/);

  // Shell context resolves exit destination defaulting to '/interviews' for interview routes
  assert.match(contextSource, /resolveFocusedExitDestination\(pathname, config\?\.exitTo\)/);
  assert.match(contextSource, /exitTo=\{exitDestination\}/);
  assert.doesNotMatch(contextSource, /handleExit|router\.push/);

  // Header owns the confirmation and navigates once after confirmation.
  assert.match(headerSource, /handleConfirmExit/);
  assert.match(headerSource, /onClick=\{handleConfirmExit\}/);
  assert.match(headerSource, /router\.replace\(destination\)/);
  assert.match(headerSource, /navigateFocusedExitOnce\(exitTo/);
  assert.match(roomSource, /const handleCandidateStateChange = useCallback/);
  assert.match(roomSource, /onStateChange=\{handleCandidateStateChange\}/);
});

test('C & D: Cancel and closing modal do not trigger navigation', async () => {
  const [headerSource, modalSource] = await Promise.all([
    readSource('../src/components/header/FocusedPracticeHeader.tsx'),
    readSource('../src/components/ui/Modal.tsx'),
  ]);

  // Cancel button only sets modal state to false
  assert.match(headerSource, /onClick=\{\(\)\s*=>\s*setShowExitConfirm\(false\)\}/);
  // Modal onClose only sets modal state to false
  assert.match(headerSource, /onClose=\{\(\)\s*=>\s*setShowExitConfirm\(false\)\}/);
  assert.match(modalSource, /onClick=\{onClose\}/);
  assert.match(modalSource, /if \(e\.key === 'Escape'\)[\s\S]*onCloseRef\.current\(\)/);

  // Neither cancel nor onClose call onExit or router.push
  const cancelSection = headerSource.slice(
    headerSource.indexOf('Ở lại luyện tập') - 80,
    headerSource.indexOf('Ở lại luyện tập') + 80
  );
  assert.doesNotMatch(cancelSection, /router\.push/);
  assert.doesNotMatch(cancelSection, /onExit/);
});

test('E: Route classification restricts interview rooms to dynamic session UUIDs and preserves preflight focused shell', () => {
  // Real active interview sessions (strict UUID)
  assert.equal(isInterviewRoomRoute('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33'), true);
  assert.equal(isFocusedPracticeRoute('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33'), true);
  assert.equal(isInterviewPreflightRoute('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33'), false);

  // Generic non-UUID slugs fail closed (NOT interview room, NOT focused)
  assert.equal(isInterviewRoomRoute('/interviews/session-123'), false);
  assert.equal(isFocusedPracticeRoute('/interviews/session-123'), false);
  assert.equal(isInterviewRoomRoute('/interviews/templates'), false);
  assert.equal(isFocusedPracticeRoute('/interviews/templates'), false);

  // History and index list routes (NOT interview room, NOT focused)
  assert.equal(isInterviewRoomRoute('/interviews'), false);
  assert.equal(isInterviewRoomRoute('/interviews/history'), false);
  assert.equal(isFocusedPracticeRoute('/interviews/history'), false);

  // Preflight setup (/interviews/new): IS preflight, IS focused (hides AuthenticatedHeader), but NOT interview room
  assert.equal(isInterviewPreflightRoute('/interviews/new'), true);
  assert.equal(isInterviewRoomRoute('/interviews/new'), false);
  assert.equal(isFocusedPracticeRoute('/interviews/new'), true);

  // Report route
  assert.equal(isInterviewRoomRoute('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33/report'), false);
  assert.equal(isFocusedPracticeRoute('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33/report'), false);

  // Other focused practice routes remain preserved
  assert.equal(isFocusedPracticeRoute('/practice/star'), true);
  assert.equal(isFocusedPracticeRoute('/practice/scenarios/system-design'), true);
  assert.equal(isFocusedPracticeRoute('/practice/scenarios'), false);
});

test('F: FocusedPracticeHeader rendering rules for preflight, active room, history, and report', () => {
  // A. /interviews/new -> isInterviewPreflightRoute = true, isFocusedPracticeRoute = true, FocusedPracticeHeader is rendered
  assert.equal(isInterviewPreflightRoute('/interviews/new'), true);
  assert.equal(isFocusedPracticeRoute('/interviews/new'), true);
  assert.equal(shouldRenderFocusedPracticeHeader('/interviews/new'), true);

  // B. /interviews/{UUID} -> focused header rendered
  assert.equal(isInterviewRoomRoute('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33'), true);
  assert.equal(shouldRenderFocusedPracticeHeader('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33'), true);

  // C. /interviews/history -> focused header NOT rendered (uses normal authenticated shell)
  assert.equal(isFocusedPracticeRoute('/interviews/history'), false);
  assert.equal(shouldRenderFocusedPracticeHeader('/interviews/history'), false);

  // D. /interviews/{UUID}/report -> focused header NOT rendered (uses normal/report shell)
  assert.equal(isInterviewRoomRoute('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33/report'), false);
  assert.equal(isFocusedPracticeRoute('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33/report'), false);
  assert.equal(shouldRenderFocusedPracticeHeader('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33/report'), false);
});

test('G: Preflight exit destination routes safely to /interviews without mutations', () => {
  // E. preflight exit destination = /interviews
  assert.equal(resolveDefaultFocusedExit('/interviews/new'), '/interviews');
  assert.equal(resolveDefaultFocusedExit('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33'), '/interviews');

  // Practice routes exit to /practice
  assert.equal(resolveDefaultFocusedExit('/practice/star'), '/practice');
  assert.equal(resolveDefaultFocusedExit('/practice/scenarios/tech-lead'), '/practice');
  assert.equal(resolveFocusedExitDestination('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33', '/interviews'), '/interviews');
  assert.equal(resolveFocusedExitDestination('/interviews/8f6b6920-5c29-4d69-a1b7-995f57de3b33', 'https://evil.example'), '/interviews');
});

test('confirmed focused exit calls the navigation authority at most once', () => {
  const navigations = [];
  const request = { requested: false };
  const navigate = (destination) => navigations.push(destination);

  assert.equal(navigateFocusedExitOnce('/interviews', navigate, request), true);
  assert.equal(navigateFocusedExitOnce('/interviews', navigate, request), false);
  assert.deepEqual(navigations, ['/interviews']);
});
