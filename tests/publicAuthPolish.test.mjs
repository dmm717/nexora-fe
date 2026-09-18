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

  assert.match(auth, /resolveCheckoutDestination\(planPriceId, rawReturnTo\)/);
  assert.match(auth, /resolveCheckoutDestination\(storedIntent\.planPriceId, storedIntent\.targetUrl\)/);
  const explicitCheckoutBranchStart = auth.indexOf("if (intentAction === 'checkout') {");
  const explicitCheckoutBranchEnd = auth.indexOf('// Explicit URL intent wins', explicitCheckoutBranchStart);
  const explicitCheckoutBranch = auth.slice(explicitCheckoutBranchStart, explicitCheckoutBranchEnd);
  assert.ok(explicitCheckoutBranchStart >= 0 && explicitCheckoutBranchEnd > explicitCheckoutBranchStart,
    'explicit checkout branch can be inspected');
  assert.match(explicitCheckoutBranch,
    /destination = resolveCheckoutDestination\(planPriceId, rawReturnTo\)\s*\?\? ['"]\/overview['"]/);
  assert.doesNotMatch(explicitCheckoutBranch, /resolveSafeReturnUrl\(rawReturnTo/,
    'invalid explicit checkout intent must not fall back to an arbitrary returnTo');
  assert.match(auth, /storedIntent\.action === ['"]checkout['"]/);
  assert.match(auth, /router\.push\(destination\)/);
  const loginSuccess = auth.indexOf('await authApi.login');
  const explicitResolution = auth.indexOf('resolveCheckoutDestination(planPriceId, rawReturnTo)');
  const staleIntentConsumption = auth.indexOf('consumeAuthIntent();', explicitResolution);
  assert.ok(loginSuccess >= 0 && explicitResolution > loginSuccess, 'explicit checkout resolves after successful login');
  assert.ok(staleIntentConsumption > explicitResolution, 'stale stored intent is consumed after explicit destination resolution');

  const storedBranchStart = auth.indexOf('const storedIntent = peekAuthIntent();');
  const storedBranchEnd = auth.indexOf('router.push(destination)', storedBranchStart);
  const storedBranch = auth.slice(storedBranchStart, storedBranchEnd);
  const storedResolution = storedBranch.indexOf('resolveCheckoutDestination(storedIntent.planPriceId, storedIntent.targetUrl)');
  const storedConsumption = storedBranch.indexOf('consumeAuthIntent();');
  assert.ok(storedBranchStart >= 0 && storedBranchEnd > storedBranchStart, 'stored intent branch can be inspected');
  assert.ok(storedResolution >= 0 && storedConsumption > storedResolution, 'stored destination resolves before intent is consumed');
  assert.match(storedBranch,
    /resolveCheckoutDestination\(storedIntent\.planPriceId, storedIntent\.targetUrl\)\s*\?\? ['"]\/overview['"]/,
    'stored checkout intent without a plan price fails closed to overview');

  assert.match(gate, /storeAuthIntent\(pendingIntent\)/);
  assert.match(gate, /buildAuthRedirectUrl\(pendingIntent, mode\)/);
  assert.match(pricing, /safeReturnTo/);
  assert.match(pricing, /selectedPriceId/);
  assert.match(pricing, /AuthGateModal/);
  assert.match(pricing, /authReady/);
});

test('checkout destination resolver preserves only one safe post-checkout target', async () => {
  const { resolveCheckoutDestination } = await importTypeScript('src/utils/authIntent.ts');

  const assertDestination = (destination, priceId, expectedReturnTo) => {
    assert.equal(typeof destination, 'string');
    const parsed = new URL(destination, 'https://nexora.test');
    assert.equal(parsed.pathname, '/billing');
    assert.equal(parsed.searchParams.get('selectedPriceId'), priceId);
    assert.equal(parsed.searchParams.getAll('selectedPriceId').length, 1);
    assert.equal(parsed.searchParams.get('returnTo'), expectedReturnTo);
    assert.equal(parsed.hash, '');
  };

  // Existing checkout targets carry the post-checkout route inside billing.
  assertDestination(
    resolveCheckoutDestination('price-42', '/billing?selectedPriceId=stale&returnTo=%2Finterviews%2Fsession-7'),
    'price-42',
    '/interviews/session-7'
  );
  assertDestination(
    resolveCheckoutDestination('price-42', '/pricing?selectedPriceId=stale&returnTo=%2Finterviews%2Fsession-7'),
    'price-42',
    '/interviews/session-7'
  );

  // A direct safe route is already the post-checkout target.
  assertDestination(
    resolveCheckoutDestination('price-42', '/interviews/session-7'),
    'price-42',
    '/interviews/session-7'
  );

  // Explicit checkout intent without a return route still has a canonical destination.
  assertDestination(resolveCheckoutDestination('price-42'), 'price-42', null);

  // A return URL's selectedPriceId cannot substitute for an absent planPriceId.
  const billingWithSelectedPrice = '/billing?selectedPriceId=price-42';
  const billingWithWrappedInterview = '/billing?selectedPriceId=price-42&returnTo=%2Finterviews%2Fsession-7';
  assert.equal(resolveCheckoutDestination(null, billingWithSelectedPrice), null);
  assert.equal(resolveCheckoutDestination(null, billingWithWrappedInterview), null);
  assert.equal(resolveCheckoutDestination('   ', billingWithSelectedPrice), null);
  assert.equal(resolveCheckoutDestination('   ', billingWithWrappedInterview), null);

  // Absolute and protocol-relative nested redirects are discarded.
  assertDestination(
    resolveCheckoutDestination('price-42', '/billing?returnTo=https%3A%2F%2Fevil.example%2F'),
    'price-42',
    null
  );
  assertDestination(
    resolveCheckoutDestination('price-42', '/billing?returnTo=%2F%2Fevil.example%2F'),
    'price-42',
    null
  );

  // Unknown internal routes and nested billing/pricing loops fail closed.
  assertDestination(
    resolveCheckoutDestination('price-42', '/billing?returnTo=%2Fnot-a-real-route'),
    'price-42',
    null
  );
  assertDestination(
    resolveCheckoutDestination('price-42', '/pricing?returnTo=%2Fbilling%3FreturnTo%3D%252Finterviews%252Fsession-7'),
    'price-42',
    null
  );

  // URLSearchParams keeps query delimiters and fragments inside the price ID.
  const unusualPriceId = 'price /?+#';
  const encodedDestination = resolveCheckoutDestination(unusualPriceId);
  assertDestination(encodedDestination, unusualPriceId, null);
  assert.equal(
    encodedDestination,
    `/billing?${new URLSearchParams({ selectedPriceId: unusualPriceId }).toString()}`
  );
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
