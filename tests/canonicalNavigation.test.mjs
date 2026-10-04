import test from 'node:test';
import assert from 'node:assert/strict';
import { INTERVIEW_START_PATH, CANONICAL_NAV_ITEMS, isNavigationItemActive } from '../src/config/navigation.ts';
import { buildAuthRedirectUrl, resolveSafeReturnUrl } from '../src/utils/authIntent.ts';

test('practice intent survives login and registration with the canonical setup destination', () => {
  assert.equal(INTERVIEW_START_PATH, '/interviews/new');
  assert.equal(CANONICAL_NAV_ITEMS.find(item => item.label === 'Phỏng vấn AI').href, INTERVIEW_START_PATH);
  for (const mode of ['login', 'register']) {
    const url = new URL(buildAuthRedirectUrl({ action: 'interview', targetUrl: INTERVIEW_START_PATH }, mode), 'http://localhost');
    assert.equal(url.pathname, '/auth');
    assert.equal(url.searchParams.get('returnTo'), INTERVIEW_START_PATH);
    assert.equal(url.searchParams.get('intentAction'), 'interview');
    assert.equal(resolveSafeReturnUrl(url.searchParams.get('returnTo')), INTERVIEW_START_PATH);
  }
});

test('the corrected CTA still rejects unsafe return intents', () => {
  for (const targetUrl of ['https://evil.example', '//evil.example', '/auth?returnTo=https://evil.example']) {
    const url = new URL(buildAuthRedirectUrl({ action: 'interview', targetUrl }), 'http://localhost');
    assert.equal(url.searchParams.get('returnTo'), '/overview');
  }
});

test('detail and history routes retain consistent desktop and mobile navigation ownership', () => {
  const cases = [
    ['/resume-analyses', '/cv-analysis/history'],
    ['/resume-analyses', '/resume-analyses/analysis-123'],
    [INTERVIEW_START_PATH, '/interviews/session-123/report'],
    [INTERVIEW_START_PATH, '/interviews/history'],
    ['/practice', '/scenarios/scenario-123'],
    ['/analytics', '/learning-path'],
    ['/pricing', '/payment-history'],
  ];
  for (const [owner, path] of cases) {
    assert.equal(isNavigationItemActive(owner, path), true);
    assert.equal(CANONICAL_NAV_ITEMS.filter(item => isNavigationItemActive(item.href, path)).length, 1);
  }
  assert.equal(isNavigationItemActive(INTERVIEW_START_PATH, '/interviews-unrelated'), false);
  assert.equal(isNavigationItemActive('/practice', '/practice-other'), false);
});
