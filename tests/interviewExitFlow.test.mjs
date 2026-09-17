import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  isInterviewRoomRoute,
  isInterviewPreflightRoute,
  isFocusedPracticeRoute,
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

  // Shell context passes exitDestination defaulting to '/interviews' for interview routes
  assert.match(contextSource, /pathname\.startsWith\('\/interviews'\)\s*\?\s*'\/interviews'\s*:\s*'\/practice'/);
  assert.match(contextSource, /exitTo=\{exitDestination\}/);
  assert.match(contextSource, /router\.push\(exitDestination\)/);

  // Header handleConfirmExit executes onExit / router.push exactly once and closes modal
  assert.match(headerSource, /handleConfirmExit/);
  assert.match(headerSource, /onClick=\{handleConfirmExit\}/);
});

test('C & D: Cancel and closing modal do not trigger navigation', async () => {
  const headerSource = await readSource('../src/components/header/FocusedPracticeHeader.tsx');

  // Cancel button only sets modal state to false
  assert.match(headerSource, /onClick=\{\(\)\s*=>\s*setShowExitConfirm\(false\)\}/);
  // Modal onClose only sets modal state to false
  assert.match(headerSource, /onClose=\{\(\)\s*=>\s*setShowExitConfirm\(false\)\}/);

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
