import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

async function importTypeScript(path) {
  const js = ts.transpileModule(await source(path), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
}

function jsxTagName(node) {
  if (ts.isIdentifier(node.tagName)) return node.tagName.text;
  if (ts.isPropertyAccessExpression(node.tagName)) return `${node.tagName.expression.getText()}.${node.tagName.name.text}`;
  return '';
}

function findNestedInteractiveTags(root) {
  const interactive = new Set(['Link', 'a', 'Button', 'button']);
  const found = [];
  const visit = (node) => {
    if (node !== root && ts.isJsxElement(node) && interactive.has(jsxTagName(node.openingElement))) {
      found.push(jsxTagName(node.openingElement));
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return found;
}

test('public plan query presentation preserves loading, cached, error, and authoritative empty states', async () => {
  const { getQueryPresentation } = await importTypeScript('src/utils/queryPresentation.ts');

  assert.deepEqual(
    getQueryPresentation({ hasData: false, isLoading: true, isError: false, isFetching: true }),
    { showInitialLoading: true, showBlockingError: false, showBackgroundError: false, showRefreshing: false },
  );
  assert.deepEqual(
    getQueryPresentation({ hasData: false, isLoading: false, isError: true, isFetching: false }),
    { showInitialLoading: false, showBlockingError: true, showBackgroundError: false, showRefreshing: false },
  );
  assert.deepEqual(
    getQueryPresentation({ hasData: true, isLoading: false, isError: false, isFetching: true }),
    { showInitialLoading: false, showBlockingError: false, showBackgroundError: false, showRefreshing: true },
  );
  assert.deepEqual(
    getQueryPresentation({ hasData: true, isLoading: false, isError: true, isFetching: false }),
    { showInitialLoading: false, showBlockingError: false, showBackgroundError: true, showRefreshing: false },
  );
  assert.equal(
    getQueryPresentation({ hasData: true, isLoading: false, isError: false, isFetching: false }).showBlockingError,
    false,
    'a successful [] remains authoritative data rather than a loading/error state',
  );

  const landing = await source('src/components/features/landing/MarketingLanding.tsx');
  const pricing = await source('src/components/features/pricing/PricingCards.tsx');
  for (const component of [landing, pricing]) {
    assert.doesNotMatch(component, /data:\s*plans\s*=\s*\[\]/);
    assert.match(component, /getQueryPresentation/);
    assert.match(component, /showInitialLoading/);
    assert.match(component, /showBlockingError/);
    assert.match(component, /showBackgroundError/);
    assert.match(component, /showRefreshing/);
  }
  assert.match(landing, /refetchPlans\(\)/);
  assert.match(pricing, /refetchPlans\(\)/);
});

test('auth suspense fallback matches the auth surface and auth mode comes only from the URL', async () => {
  const page = await source('src/app/auth/page.tsx');
  const auth = await source('src/components/features/auth/Auth.tsx');
  const reset = await source('src/app/reset-password/page.tsx');
  const verify = await source('src/app/verify-email/page.tsx');

  assert.doesNotMatch(page, /fallback=\{<div>Loading\.\.\.<\/div>\}/);
  assert.match(page, /fallback=\{<AuthPageSkeleton\b/);
  assert.match(reset, /fallback=\{<AuthPageSkeleton\b/);
  assert.match(verify, /fallback=\{<AuthPageSkeleton\b/);
  assert.match(auth, /const mode = searchParams\.get\(['"]mode['"]\)/);
  assert.match(auth, /const isLogin = mode !== ['"]register['"]/);
  assert.doesNotMatch(auth, /setIsLogin|prevMode/);
  assert.match(auth, /new URLSearchParams\(searchParams\.toString\(\)\)/);
  assert.match(auth, /returnTo/);
  assert.match(auth, /planPriceId/);
  assert.match(auth, /intentAction/);
  assert.match(auth, /consumeAuthIntent/);
});

test('login/register navigation preserves checkout and safe return intent', async () => {
  const { buildAuthRedirectUrl, isValidInternalPath } = await importTypeScript('src/utils/authIntent.ts');
  const auth = await source('src/components/features/auth/Auth.tsx');
  const gate = await source('src/components/auth/AuthGateModal.tsx');
  const pricing = await source('src/components/features/pricing/PricingCards.tsx');

  const authUrl = new URL(buildAuthRedirectUrl({
    action: 'checkout',
    targetUrl: '/billing?selectedPriceId=price-42&returnTo=%2Finterviews%2Fsession-7',
    planPriceId: 'price-42',
  }, 'register'), 'https://nexora.test');
  assert.equal(authUrl.pathname, '/auth');
  assert.equal(authUrl.searchParams.get('mode'), 'register');
  assert.equal(authUrl.searchParams.get('planPriceId'), 'price-42');
  assert.equal(authUrl.searchParams.get('intentAction'), 'checkout');
  assert.equal(authUrl.searchParams.get('returnTo'), '/billing?selectedPriceId=price-42&returnTo=%2Finterviews%2Fsession-7');
  assert.equal(isValidInternalPath('https://attacker.invalid/'), false);

  assert.match(auth, /isValidInternalPath/);
  assert.match(auth, /selectedPriceId/);
  assert.match(auth, /router\.push\(destination\)/);
  assert.match(gate, /storeAuthIntent\(pendingIntent\)/);
  assert.match(gate, /buildAuthRedirectUrl\(pendingIntent, mode\)/);
  assert.match(pricing, /safeReturnTo/);
  assert.match(pricing, /selectedPriceId/);
  assert.match(pricing, /AuthGateModal/);
  assert.match(pricing, /authReady/);
});

test('auth removes nonfunctional remember-me and dead legal links while retaining password rules', async () => {
  const auth = await source('src/components/features/auth/Auth.tsx');
  const authSchema = await source('src/schema/authSchema.ts');
  const authFiles = [
    auth,
    await source('src/app/forgot-password/page.tsx'),
    await source('src/app/reset-password/page.tsx'),
    await source('src/app/verify-email/page.tsx'),
  ];

  assert.doesNotMatch(auth, /Ghi nhớ|remember\s*me/i);
  for (const file of authFiles) assert.doesNotMatch(file, /href\s*=\s*['"]#['"]/);
  assert.match(authSchema, /\.min\(8/);
  assert.match(authSchema, /\.max\(128/);
  assert.match(authSchema, /hasUppercase/);
  assert.match(authSchema, /hasLowercase/);
  assert.match(authSchema, /hasDigit/);
  assert.match(authSchema, /hasSpecial/);
  assert.match(authSchema, /PASSWORD_MISMATCH/);
});

test('touched public/auth components do not nest links, anchors, or buttons', async () => {
  const paths = [
    'src/components/features/auth/Auth.tsx',
    'src/components/auth/AuthGateModal.tsx',
    'src/app/forgot-password/page.tsx',
    'src/app/reset-password/page.tsx',
    'src/app/verify-email/page.tsx',
    'src/components/features/pricing/PricingCards.tsx',
    'src/components/features/landing/MarketingLanding.tsx',
    'src/components/layouts/Header.tsx',
    'src/components/layouts/Footer.tsx',
  ];

  for (const path of paths) {
    const text = await source(path);
    const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node) => {
      if (ts.isJsxElement(node) && ['Link', 'a', 'Button', 'button'].includes(jsxTagName(node.openingElement))) {
        assert.deepEqual(findNestedInteractiveTags(node), [], `${path} has nested interactive content`);
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
});

test('auth, landing demo, and header motion respect reduced-motion preferences', async () => {
  const auth = await source('src/components/features/auth/Auth.tsx');
  const authCss = await source('src/components/features/auth/Auth.module.css');
  const landing = await source('src/components/features/landing/MarketingLanding.tsx');
  const landingMotion = await source('src/components/features/landing/useLandingMotion.ts');
  const header = await source('src/components/layouts/Header.tsx');

  assert.match(auth, /prefers-reduced-motion/);
  assert.match(authCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(landingMotion, /prefers-reduced-motion:\s*no-preference/);
  assert.match(landing, /prefers-reduced-motion/);
  assert.match(landing, /78/);
  assert.match(header, /prefers-reduced-motion:\s*reduce/);
});

test('landing plan claims come from backend price features and current query authority', async () => {
  const card = await source('src/components/features/landing/LandingPlanCard.tsx');
  const landing = await source('src/components/features/landing/MarketingLanding.tsx');
  const pricing = await source('src/components/features/pricing/PricingCards.tsx');
  const pricingMotion = await source('src/components/product-motion/index.ts');

  assert.match(card, /describePlanFeature/);
  assert.match(card, /price\.features/);
  assert.match(card, /price\.interviewQuota/);
  assert.match(card, /price\.durationDays/);
  assert.doesNotMatch(card, /01 Phiên phỏng vấn AI mẫu|3 câu\/phiên|câu 4\+/i);
  assert.doesNotMatch(card, /interviewQuota\s*\|\|\s*['"]Nhiều/);
  assert.match(landing, /plansQuery|plansPresentation|planPresentation/);
  assert.match(pricing, /useCurrentUser/);
  assert.match(pricing, /isError|showBackgroundError|showBlockingError/);
  assert.match(pricing, /<ProductMotionBoundary>[\s\S]*<ProductPageHero/);
  assert.match(pricingMotion, /prefers-reduced-motion:\s*no-preference/);
});

test('pricing keeps an unknown current-user state distinct and preserves the auth/checkout gate', async () => {
  const pricing = await source('src/components/features/pricing/PricingCards.tsx');
  const shell = await source('src/components/features/pricing/PricingPageShell.tsx');
  const gate = await source('src/components/auth/AuthGateModal.tsx');

  assert.match(pricing, /currentPlanCode/);
  assert.match(pricing, /authReady/);
  assert.match(pricing, /planPriceId/);
  assert.match(pricing, /selectedPriceId/);
  assert.match(pricing, /safeReturnTo/);
  assert.match(pricing, /pendingIntent/);
  assert.match(shell, /if \(!authReady\)/);
  assert.match(shell, /Skeleton/);
  assert.match(gate, /pendingIntent/);
  assert.match(gate, /storeAuthIntent/);
});

test('forgot password stays privacy-safe; reset transient errors do not invalidate a token', async () => {
  const forgot = await source('src/app/forgot-password/page.tsx');
  const reset = await source('src/app/reset-password/page.tsx');

  assert.match(forgot, /Nếu email[\s\S]*thuộc một tài khoản hợp lệ/);
  assert.match(forgot, /role="alert"/);
  assert.match(reset, /if \(!userId \|\| !token/);
  assert.match(reset, /apiErr\?\.code === 'PASSWORD_RESET_INVALID'/);
  assert.doesNotMatch(reset, /apiErr\?\.message\?\.includes\(/);
  assert.match(reset, /role="alert"/);
});

test('email verification remains one-shot and resend cooldown stays at sixty seconds', async () => {
  const verify = await source('src/app/verify-email/page.tsx');

  assert.match(verify, /verificationAttempted\.current/);
  assert.match(verify, /if \(!userId \|\| !token \|\| verificationAttempted\.current\) return/);
  assert.match(verify, /verificationAttempted\.current = true/);
  assert.match(verify, /setResendCooldown\(60\)/);
  assert.match(verify, /status === 'verifying'[\s\S]*?role="status"/);
  assert.match(verify, /status === 'invalid'[\s\S]*?role="alert"/);
});

test('shared Input associates validation feedback with the invalid field', async () => {
  const input = await source('src/components/ui/Input/Input.tsx');

  assert.match(input, /aria-invalid=\{error \? true : ariaInvalid\}/);
  assert.match(input, /aria-describedby=\{mergedDescribedBy\}/);
  assert.match(input, /id=\{errorId\} role="alert"/);
});

test('public header keeps canonical navigation, Escape close, aria-expanded, and reduced-motion scrolling', async () => {
  const header = await source('src/components/layouts/Header.tsx');
  const landing = await source('src/components/features/landing/MarketingLanding.tsx');
  const footer = await source('src/components/layouts/Footer.tsx');

  for (const label of ['Phân tích CV', 'Phỏng vấn AI', 'Luyện tập', 'Năng lực', 'Bảng giá']) {
    assert.ok(header.includes(label), `missing canonical navigation label ${label}`);
  }
  assert.match(header, /aria-expanded=\{/);
  assert.match(header, /Escape/);
  assert.match(header, /usePathname/);
  assert.match(header, /prefers-reduced-motion:\s*reduce/);
  for (const id of ['cv-analysis', 'ai-interview', 'practice', 'capabilities']) {
    assert.match(landing, new RegExp(`id=["']${id}["']`));
  }
  assert.doesNotMatch(footer, /href=["']\/(?:terms|privacy)["']/i);
});
