'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { billingApi, type CheckoutSessionResponse } from '@/services/billingApi';
import { isValidInternalPath, resolveSafeReturnUrl } from '@/utils/authIntent';

type PaymentResultPageProps = {
  mode: 'success' | 'cancel';
};

type PaymentResultState =
  | { kind: 'loading' }
  | { kind: 'fulfilled' }
  | { kind: 'pending' }
  | { kind: 'failed' }
  | { kind: 'missing-order' }
  | { kind: 'unauthenticated' }
  | { kind: 'error' };

const ORDER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const actionLinkClass =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:ring-offset-2 active:scale-[0.99]';

function readPendingOrderId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const orderId = window.sessionStorage.getItem('pendingPaymentOrderId');
    return orderId && ORDER_ID_PATTERN.test(orderId) ? orderId : null;
  } catch {
    return null;
  }
}

function clearPaymentOrder(): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem('pendingPaymentOrderId');
  } catch {
    // Session storage can be unavailable in restricted browser contexts.
  }
}

function clearPaymentIntent(): void {
  if (typeof window === 'undefined') return;

  try {
    clearPaymentOrder();
    window.sessionStorage.removeItem('postPaymentReturnTo');
  } catch {
    // Session storage can be unavailable in restricted browser contexts.
  }
}

function readContinueHref(): string {
  if (typeof window === 'undefined') return '/overview';

  try {
    const storedReturnTo = window.sessionStorage.getItem('postPaymentReturnTo');
    return isValidInternalPath(storedReturnTo)
      ? resolveSafeReturnUrl(storedReturnTo, '/overview')
      : '/overview';
  } catch {
    return '/overview';
  }
}

function getBackendResult(status: string): Extract<PaymentResultState, { kind: 'fulfilled' | 'pending' | 'failed' }> {
  const normalizedStatus = status.trim().toLowerCase();

  // Only the backend's fulfilled state can render success. payOS URL values are
  // intentionally not accepted here as proof of payment.
  if (normalizedStatus === 'fulfilled') return { kind: 'fulfilled' };
  if (['failed', 'cancelled', 'canceled', 'rejected'].includes(normalizedStatus)) {
    return { kind: 'failed' };
  }

  return { kind: 'pending' };
}

function PaymentIcon({ state }: { state: 'loading' | 'success' | 'pending' | 'failed' }) {
  const styles = {
    loading: 'bg-primary-fixed text-primary',
    success: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-rose-100 text-rose-700',
  };
  const glyphs = {
    loading: 'sync',
    success: 'check_circle',
    pending: 'schedule',
    failed: 'error',
  };

  return (
    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${styles[state]}`}>
      <span aria-hidden="true" className="material-symbols-outlined text-[34px]">
        {glyphs[state]}
      </span>
    </div>
  );
}

function PaymentResultShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function PaymentResultFallback() {
  return (
    <PaymentResultShell>
      <Card padding="lg" className="text-center">
        <PaymentIcon state="loading" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
          Đang xác nhận thanh toán...
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
          Vui lòng chờ trong giây lát để Nexora kiểm tra kết quả từ hệ thống.
        </p>
        <div className="mx-auto mt-8 max-w-sm space-y-3" aria-hidden="true">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="mx-auto mt-6 h-12 w-40 rounded-lg" />
        </div>
      </Card>
    </PaymentResultShell>
  );
}

function SuccessContent({
  result,
  continueHref,
  redirectContextFound,
  onRetry,
  canRetry,
}: {
  result: PaymentResultState;
  continueHref: string;
  redirectContextFound: boolean;
  onRetry: () => void;
  canRetry: boolean;
}) {
  if (result.kind === 'loading') {
    return (
      <Card padding="lg" className="text-center">
        <PaymentIcon state="loading" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
          Đang xác nhận thanh toán...
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
          Nexora đang xác thực giao dịch thanh toán của bạn một cách an toàn. Quá trình này thường chỉ mất vài giây.
        </p>
        <div className="mx-auto mt-8 max-w-sm space-y-3" aria-hidden="true">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="mx-auto mt-6 h-12 w-40 rounded-lg" />
        </div>
      </Card>
    );
  }

  if (result.kind === 'fulfilled') {
    return (
      <Card padding="lg" className="text-center">
        <PaymentIcon state="success" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Thanh toán</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
          Thanh toán thành công
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
          Giao dịch thanh toán đã hoàn tất thành công. Quyền lợi và gói dịch vụ của bạn đã được kích hoạt.
        </p>
        <Link href={continueHref} className={`${actionLinkClass} mt-8`}>
          Tiếp tục
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </Link>
      </Card>
    );
  }

  if (result.kind === 'pending') {
    return (
      <Card padding="lg" className="text-center">
        <PaymentIcon state="pending" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Đang xử lý</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
          Thanh toán đang được xác nhận
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
          Hệ thống chưa nhận được trạng thái hoàn tất. Bạn có thể kiểm tra lại sau vài giây.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={onRetry}
            disabled={!canRetry}
            icon={<span className="material-symbols-outlined text-[20px]">refresh</span>}
          >
            Kiểm tra lại
          </Button>
          <Link href="/pricing" className={`${actionLinkClass} bg-white text-on-surface shadow-none hover:bg-surface-container-low hover:text-primary`}>
            Quay lại bảng giá
          </Link>
        </div>
      </Card>
    );
  }

  if (result.kind === 'failed') {
    return (
      <Card padding="lg" className="text-center">
        <PaymentIcon state="failed" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Chưa hoàn tất</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
          Thanh toán chưa hoàn tất
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
          Giao dịch không được xác nhận hoàn tất. Bạn có thể quay lại bảng giá để thử lại.
        </p>
        <Link href="/pricing" className={`${actionLinkClass} mt-8`}>
          Quay lại bảng giá
        </Link>
      </Card>
    );
  }

  if (result.kind === 'unauthenticated') {
    return (
      <Card padding="lg" className="text-center">
        <PaymentIcon state="failed" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
          Chưa thể xác nhận thanh toán
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
          Phiên đăng nhập không còn khả dụng, nên Nexora không thể kiểm tra đơn hàng thuộc tài khoản của bạn.
        </p>
        <Link href="/pricing" className={`${actionLinkClass} mt-8`}>
          Quay lại bảng giá
        </Link>
      </Card>
    );
  }

  if (result.kind === 'missing-order') {
    return (
      <Card padding="lg" className="text-center">
        <PaymentIcon state="failed" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
          Chưa thể xác nhận thanh toán
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
          {redirectContextFound
            ? 'Thông tin chuyển hướng đã được nhận, nhưng không tìm thấy phiên thanh toán Nexora trong trình duyệt này.'
            : 'Không tìm thấy thông tin phiên thanh toán Nexora trong trình duyệt này. Vì lý do bảo mật, giao dịch cần được xác thực trực tiếp qua cổng thanh toán.'}
        </p>
        <Link href="/pricing" className={`${actionLinkClass} mt-8`}>
          Quay lại bảng giá
        </Link>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="text-center">
      <PaymentIcon state="failed" />
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
        Không thể xác nhận thanh toán
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
        Đã xảy ra lỗi khi kiểm tra trạng thái giao dịch. Bạn có thể thử lại hoặc quay lại bảng giá.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {canRetry && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={onRetry}
            icon={<span className="material-symbols-outlined text-[20px]">refresh</span>}
          >
            Thử lại
          </Button>
        )}
        <Link href="/pricing" className={`${actionLinkClass} ${canRetry ? 'bg-white text-on-surface shadow-none hover:bg-surface-container-low hover:text-primary' : ''}`}>
          Quay lại bảng giá
        </Link>
      </div>
    </Card>
  );
}

export default function PaymentResultPage({ mode }: PaymentResultPageProps) {
  const searchParams = useSearchParams();
  const { authReady, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  const initialCheckRef = useRef<string | null>(null);
  const [result, setResult] = useState<PaymentResultState>({ kind: 'loading' });

  const redirectContextFound = useMemo(() => {
    const values = ['code', 'id', 'cancel', 'status', 'orderCode'].map((key) => searchParams.get(key));
    return values.some(Boolean);
  }, [searchParams]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const checkOrderStatus = useCallback(
    async (orderId: string, refresh: boolean) => {
      setResult({ kind: 'loading' });

      try {
        let response: CheckoutSessionResponse = refresh
          ? await billingApi.refreshOrderStatus(orderId)
          : await billingApi.getOrderStatus(orderId);

        // Ask the backend to reconcile a pending order once on the initial return.
        // This still uses the backend response as the only source of truth.
        if (!refresh && getBackendResult(response.status).kind === 'pending') {
          response = await billingApi.refreshOrderStatus(orderId);
        }

        if (!isMountedRef.current) return;

        const nextResult = getBackendResult(response.status);
        setResult(nextResult);

        if (nextResult.kind === 'fulfilled') {
          clearPaymentOrder();
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        } else if (nextResult.kind === 'failed') {
          clearPaymentIntent();
        }
      } catch {
        if (isMountedRef.current) setResult({ kind: 'error' });
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (mode !== 'success' || !authReady) return;

    if (!isAuthenticated) {
      return;
    }

    const orderId = readPendingOrderId();
    if (!orderId) return;

    if (initialCheckRef.current === orderId) return;
    initialCheckRef.current = orderId;
    void checkOrderStatus(orderId, false);
  }, [authReady, checkOrderStatus, isAuthenticated, mode]);

  useEffect(() => {
    if (result.kind !== 'fulfilled' || typeof window === 'undefined') return;

    try {
      window.sessionStorage.removeItem('postPaymentReturnTo');
    } catch {
      // Session storage can be unavailable in restricted browser contexts.
    }
  }, [result.kind]);

  if (mode === 'cancel') {
    return (
      <PaymentResultShell>
        <Card padding="lg" className="text-center">
          <PaymentIcon state="failed" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Thanh toán</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
            Thanh toán đã bị hủy
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
            Giao dịch chưa được hoàn tất ở bước thanh toán này. Nếu bạn vẫn thấy khoản trừ tiền, hãy liên hệ hỗ trợ để được kiểm tra.
          </p>
          <Link href="/pricing" className={`${actionLinkClass} mt-8`}>
            Quay lại bảng giá
          </Link>
        </Card>
      </PaymentResultShell>
    );
  }

  const orderIdAvailable = Boolean(readPendingOrderId());
  const displayedResult =
    authReady && !isAuthenticated
      ? ({ kind: 'unauthenticated' } as const)
      : authReady && isAuthenticated && result.kind === 'loading' && !orderIdAvailable
        ? ({ kind: 'missing-order' } as const)
        : result;
  const canRetry = orderIdAvailable && displayedResult.kind !== 'loading';
  const continueHref = displayedResult.kind === 'fulfilled' ? readContinueHref() : '/overview';

  return (
    <PaymentResultShell>
      <SuccessContent
        result={displayedResult}
        continueHref={continueHref}
        redirectContextFound={redirectContextFound}
        onRetry={() => {
          const orderId = readPendingOrderId();
          if (orderId) void checkOrderStatus(orderId, true);
        }}
        canRetry={canRetry}
      />
    </PaymentResultShell>
  );
}
