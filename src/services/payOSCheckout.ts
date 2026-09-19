import type { CheckoutSessionResponse } from './billingApi';

const CHECKOUT_ERROR = 'Chưa thể tạo phiên thanh toán. Vui lòng thử lại.';
const INVALID_PRICE_ERROR = 'Gói dịch vụ không hợp lệ. Vui lòng chọn lại.';

type CheckoutForm = NonNullable<CheckoutSessionResponse['checkout']>;

export interface PayOSCheckoutOptions {
  planPriceId: string;
  returnTo?: string | null;
}

export interface PayOSCheckoutDependencies {
  createCheckoutSession: (planPriceId: string) => Promise<CheckoutSessionResponse>;
  isValidInternalPath: (candidate: string | null | undefined) => boolean;
  storage?: Pick<Storage, 'setItem' | 'removeItem'>;
  document?: Document;
}

function isCheckoutForm(value: unknown): value is CheckoutForm {
  if (!value || typeof value !== 'object') return false;

  const checkout = value as Partial<CheckoutForm>;
  return (
    typeof checkout.method === 'string' && /^(GET|POST)$/i.test(checkout.method) &&
    typeof checkout.url === 'string' && isSafeCheckoutUrl(checkout.url) &&
    Array.isArray(checkout.fields) &&
    checkout.fields.every((field) =>
      Boolean(field) &&
      typeof field.name === 'string' && field.name.trim().length > 0 &&
      typeof field.value === 'string'
    )
  );
}

function isSafeCheckoutUrl(value: string): boolean {
  if (!value.trim()) return false;

  try {
    const url = new URL(value, 'https://nexora.internal');
    return url.protocol === 'https:' || (
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * Creates and submits the server-provided checkout form without changing any
 * provider URL, field, or signature value returned by the API.
 */
export async function startPayOSCheckout(
  { planPriceId, returnTo }: PayOSCheckoutOptions,
  dependencies: PayOSCheckoutDependencies,
): Promise<CheckoutSessionResponse> {
  const authoritativePriceId = typeof planPriceId === 'string' ? planPriceId.trim() : '';
  if (!authoritativePriceId) throw new Error(INVALID_PRICE_ERROR);

  let response: CheckoutSessionResponse;
  try {
    response = await dependencies.createCheckoutSession(authoritativePriceId);
  } catch {
    try {
      const storage = dependencies.storage ?? window.sessionStorage;
      storage.removeItem('pendingPaymentOrderId');
      storage.removeItem('postPaymentReturnTo');
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
    throw new Error(CHECKOUT_ERROR);
  }

  if (
    !response ||
    typeof response.orderId !== 'string' ||
    !response.orderId.trim() ||
    !isCheckoutForm(response.checkout)
  ) {
    throw new Error(CHECKOUT_ERROR);
  }

  let safeReturnTo: string | null = null;
  try {
    if (returnTo && dependencies.isValidInternalPath(returnTo)) {
      safeReturnTo = returnTo.trim();
    }
  } catch {
    // An unavailable or failing validator must never make the return route trusted.
  }

  try {
    const storage = dependencies.storage ?? window.sessionStorage;
    const checkoutDocument = dependencies.document ?? document;

    storage.setItem('pendingPaymentOrderId', response.orderId);
    if (safeReturnTo) {
      storage.setItem('postPaymentReturnTo', safeReturnTo);
    } else {
      storage.removeItem('postPaymentReturnTo');
    }

    const form = checkoutDocument.createElement('form');
    form.method = response.checkout.method;
    form.action = response.checkout.url;

    response.checkout.fields.forEach((field) => {
      const input = checkoutDocument.createElement('input');
      input.type = 'hidden';
      input.name = field.name;
      input.value = field.value;
      form.appendChild(input);
    });

    if (!checkoutDocument.body) throw new Error(CHECKOUT_ERROR);
    checkoutDocument.body.appendChild(form);
    form.submit();
  } catch {
    try {
      const storage = dependencies.storage ?? window.sessionStorage;
      storage.removeItem('pendingPaymentOrderId');
      storage.removeItem('postPaymentReturnTo');
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
    throw new Error(CHECKOUT_ERROR);
  }

  return response;
}
