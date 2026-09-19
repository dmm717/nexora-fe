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

function createDocumentHarness() {
  const forms = [];
  const document = {
    body: { appendChild: (form) => forms.push(form) },
    createElement: (tagName) => {
      if (tagName === 'form') {
        return {
          method: '',
          action: '',
          fields: [],
          appendChild(input) { this.fields.push(input); },
          submit() { this.submitted = true; },
        };
      }
      return { type: '', name: '', value: '' };
    },
  };
  return { document, forms };
}

function createStorageHarness() {
  const values = new Map();
  return {
    values,
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
}

test('PayOS checkout forwards the server form and stores only validated return state', async () => {
  const { startPayOSCheckout } = await importTypeScript('src/services/payOSCheckout.ts');
  const storage = createStorageHarness();
  const { document, forms } = createDocumentHarness();
  const response = {
    orderId: 'order-1',
    status: 'pending',
    amountMinor: 1000,
    currency: 'VND',
    provider: 'payos',
    checkout: {
      method: 'POST',
      url: 'https://payos.example/checkout',
      fields: [
        { name: 'orderCode', value: '123' },
        { name: 'signature', value: 'server-signature' },
      ],
    },
  };

  await startPayOSCheckout(
    { planPriceId: ' price-42 ', returnTo: '/interviews/session-7?sessionContinuation=true' },
    {
      createCheckoutSession: async (priceId) => {
        assert.equal(priceId, 'price-42');
        return response;
      },
      isValidInternalPath: (candidate) => candidate === '/interviews/session-7?sessionContinuation=true',
      storage,
      document,
    },
  );

  assert.equal(storage.values.get('pendingPaymentOrderId'), 'order-1');
  assert.equal(storage.values.get('postPaymentReturnTo'), '/interviews/session-7?sessionContinuation=true');
  assert.equal(forms.length, 1);
  assert.equal(forms[0].method, 'POST');
  assert.equal(forms[0].action, response.checkout.url);
  assert.deepEqual(forms[0].fields, [
    { type: 'hidden', name: 'orderCode', value: '123' },
    { type: 'hidden', name: 'signature', value: 'server-signature' },
  ]);
  assert.equal(forms[0].submitted, true);
});

test('PayOS checkout rejects blank prices, malformed responses, and unsafe return routes', async () => {
  const { startPayOSCheckout } = await importTypeScript('src/services/payOSCheckout.ts');
  const storage = createStorageHarness();
  const { document } = createDocumentHarness();
  const createCheckoutSession = async () => ({
    orderId: 'order-2',
    status: 'pending',
    amountMinor: 1000,
    currency: 'VND',
    provider: 'payos',
    checkout: {
      method: 'POST',
      url: 'https://payos.example/checkout',
      fields: [{ name: 'orderCode', value: '456' }],
    },
  });

  await assert.rejects(
    () => startPayOSCheckout(
      { planPriceId: '   ' },
      { createCheckoutSession, isValidInternalPath: () => true, storage, document },
    ),
    /Gói dịch vụ không hợp lệ/,
  );

  await startPayOSCheckout(
    { planPriceId: 'price-42', returnTo: 'https://attacker.invalid/' },
    {
      createCheckoutSession,
      isValidInternalPath: () => false,
      storage,
      document,
    },
  );
  assert.equal(storage.values.get('postPaymentReturnTo'), undefined);

  await assert.rejects(
    () => startPayOSCheckout(
      { planPriceId: 'price-42' },
      {
        createCheckoutSession: async () => ({ orderId: '', status: 'pending', amountMinor: 0, currency: 'VND', provider: 'payos' }),
        isValidInternalPath: () => true,
        storage,
        document,
      },
    ),
    /Chưa thể tạo phiên thanh toán/,
  );
});
