'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { billingApi } from '@/services/billingApi';
import { startPayOSCheckout } from '@/services/payOSCheckout';
import { useBillingPlans } from '@/hooks/queries/useBilling';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/utils/formatters';
import { isValidInternalPath } from '@/utils/authIntent';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { getQueryPresentation } from '@/utils/queryPresentation';
import {
  describePlanFeature,
  formatFeatureAvailability,
  formatInterviewQuestionLimit,
  getExactEntitlementFeature,
} from '@/services/billingPresentation';

function BillingPageHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-semibold mb-2">
          <span className="material-symbols-outlined text-[16px]">credit_card</span>
          <span>Quản lý tài khoản & Gói dịch vụ</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Gói dịch vụ & Lịch sử thanh toán
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
          Theo dõi hạn mức phỏng vấn, thời hạn gói và mở khóa thêm các tính năng phân tích & phỏng vấn AI mạnh mẽ.
        </p>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [error, setError] = useState<string | null>(null);

  const plansQuery = useBillingPlans();
  const currentUserQuery = useCurrentUser();
  const {
    data: loadedPlans,
    isLoading: loadingPlans,
    isError: plansHaveError,
    isFetching: fetchingPlans,
    refetch: refetchPlans,
  } = plansQuery;
  const {
    data: user,
    isLoading: loadingUser,
    isError: userHasError,
    isFetching: fetchingUser,
    refetch: refetchUser,
  } = currentUserQuery;
  const queryClient = useQueryClient();

  const hasUserData = user !== undefined;
  const hasPlansData = loadedPlans !== undefined;
  const userPresentation = getQueryPresentation({
    hasData: hasUserData,
    isLoading: loadingUser,
    isError: userHasError,
    isFetching: fetchingUser,
  });
  const plansPresentation = getQueryPresentation({
    hasData: hasPlansData,
    isLoading: loadingPlans,
    isError: plansHaveError,
    isFetching: fetchingPlans,
  });
  const showUserSkeleton = userPresentation.showInitialLoading || (user === undefined && !userHasError);
  const showPlansSkeleton = plansPresentation.showInitialLoading || (!hasPlansData && !plansHaveError);
  const currentPlanCode = user?.billing?.entitlement?.planCode || null;

  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPriceId = searchParams.get('selectedPriceId');
  const rawReturnTo = searchParams.get('returnTo');
  const safeReturnTo = rawReturnTo && isValidInternalPath(rawReturnTo) ? rawReturnTo : null;

  const autoCheckoutAttemptedRef = useRef(false);
  const checkoutInProgressRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    if (typeof window !== 'undefined') {
      const pendingOrderId = sessionStorage.getItem('pendingPaymentOrderId');
      if (pendingOrderId) {
        const currentParams = new URLSearchParams(window.location.search);
        if (currentParams.get('error') || currentParams.get('success')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const checkStatus = async () => {
          try {
            let statusRes = await billingApi.getOrderStatus(pendingOrderId);
            if (statusRes.status === 'pending') {
              await new Promise((r) => setTimeout(r, 2000));
              statusRes = await billingApi.refreshOrderStatus(pendingOrderId);
            }
            if (statusRes.status === 'fulfilled') {
              sessionStorage.removeItem('pendingPaymentOrderId');
              queryClient.invalidateQueries({ queryKey: ['currentUser'] });

              // If a validated post-payment returnTo exists in session storage, navigate there
              const postPaymentReturnTo = sessionStorage.getItem('postPaymentReturnTo');
              if (postPaymentReturnTo && isValidInternalPath(postPaymentReturnTo)) {
                sessionStorage.removeItem('postPaymentReturnTo');
                router.push(postPaymentReturnTo);
                return;
              }
            } else if (statusRes.status === 'failed') {
              sessionStorage.removeItem('pendingPaymentOrderId');
              sessionStorage.removeItem('postPaymentReturnTo');
              if (isMounted) setError('Thanh toán thất bại hoặc đã bị hủy.');
            } else {
              sessionStorage.removeItem('pendingPaymentOrderId');
              sessionStorage.removeItem('postPaymentReturnTo');
              if (isMounted) setError('Thanh toán chưa được xác nhận hoàn tất.');
            }
          } catch {
            sessionStorage.removeItem('pendingPaymentOrderId');
            sessionStorage.removeItem('postPaymentReturnTo');
            if (isMounted) setError('Lỗi khi kiểm tra trạng thái thanh toán.');
          }
        };
        
        checkStatus();
      } else {
        const currentParams = new URLSearchParams(window.location.search);
        const errorParam = currentParams.get('error');
        if (errorParam === 'webhook_error') {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setError('Lỗi kết nối máy chủ khi xác nhận thanh toán.');
        } else if (errorParam === 'webhook_failed') {
          setError('Xác nhận thanh toán từ hệ thống thất bại.');
        } else if (errorParam === 'invalid_transaction') {
          setError('Mã giao dịch thanh toán không hợp lệ.');
        }
        if (errorParam || currentParams.get('success')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
    return () => { isMounted = false; };
  }, [queryClient, router]);

  const createCheckoutMutation = useMutation({
    mutationFn: (planPriceId: string) => startPayOSCheckout(
      { planPriceId, returnTo: safeReturnTo },
      {
        createCheckoutSession: billingApi.createCheckoutSession,
        isValidInternalPath,
      },
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingPlans'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Chưa thể tạo phiên thanh toán. Vui lòng thử lại.');
    },
    onSettled: () => {
      checkoutInProgressRef.current = false;
    },
  });

  const handleBuyPlan = useCallback((planPriceId: string) => {
    if (checkoutInProgressRef.current || createCheckoutMutation.isPending) return;

    const matchedPrice = (loadedPlans ?? [])
      .flatMap((plan) => plan.prices ?? [])
      .find((price) => price.id === planPriceId);
    if (!matchedPrice || matchedPrice.amountMinor <= 0) {
      setError('Gói bạn chọn không còn khả dụng. Vui lòng chọn lại.');
      return;
    }

    checkoutInProgressRef.current = true;
    setError(null);
    createCheckoutMutation.mutate(matchedPrice.id);
  }, [createCheckoutMutation, loadedPlans]);

  // One-shot auto-checkout when selectedPriceId is passed in query
  useEffect(() => {
    if (
      !selectedPriceId ||
      autoCheckoutAttemptedRef.current ||
      !hasPlansData ||
      fetchingPlans ||
      !hasUserData ||
      userPresentation.showBlockingError
    ) {
      return;
    }

    autoCheckoutAttemptedRef.current = true;

    // Validate selectedPriceId against loaded production plans
    let matchedPrice: { id: string; amountMinor: number } | null = null;
    for (const plan of loadedPlans ?? []) {
      const found = plan.prices?.find((p) => p.id === selectedPriceId);
      if (found) {
        matchedPrice = found;
        break;
      }
    }

    if (!matchedPrice) {
      // Fail closed: show error and do not call checkout API
      setError('Gói cước đã chọn không tồn tại hoặc không còn hiệu lực.');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (matchedPrice.amountMinor <= 0) {
      // Free price does not trigger paid checkout
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Clean up query param so reloads don't re-trigger
    window.history.replaceState({}, document.title, window.location.pathname);

    // Invoke canonical checkout
    setError(null);
    handleBuyPlan(matchedPrice.id);
  }, [
    selectedPriceId,
    hasPlansData,
    fetchingPlans,
    hasUserData,
    loadedPlans,
    userPresentation.showBlockingError,
    createCheckoutMutation,
    handleBuyPlan,
  ]);

  if (showUserSkeleton) {
    return (
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8"
        role="status"
        aria-label="Đang tải thông tin gói dịch vụ và thanh toán"
      >
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-52 rounded-full" />
          <Skeleton className="h-8 w-80 max-w-full rounded-xl" />
          <Skeleton className="h-4 w-full max-w-2xl rounded" />
        </div>

        <Card variant="elevated" padding="lg" className="space-y-5 bg-white border border-outline-variant/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-44" />
            </div>
            <div className="space-y-2 sm:text-right">
              <Skeleton className="h-3 w-28 sm:ml-auto" />
              <Skeleton className="h-4 w-36 sm:ml-auto" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ))}
          </div>
        </Card>

        <section className="space-y-4 pt-2">
          <div className="space-y-2 border-b border-outline-variant/30 pb-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-3 w-full max-w-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }, (_, index) => (
              <Card key={index} variant="elevated" padding="lg" className="space-y-5 bg-white border border-outline-variant/60">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-9 w-1/2" />
                <div className="space-y-3">
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </Card>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (userPresentation.showBlockingError) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        <BillingPageHeader />
        <Alert
          variant="error"
          title="Không thể tải thông tin tài khoản và gói dịch vụ"
          action={(
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetchUser()}
              disabled={fetchingUser}
              loading={fetchingUser}
            >
              Thử tải lại
            </Button>
          )}
        >
          Chưa thể xác minh gói hiện tại và lịch sử thanh toán. Vui lòng thử lại; thông tin gói sẽ không được hiển thị cho đến khi tải thành công.
        </Alert>
        {error && <Alert variant="error" className="shadow-subtle">{error}</Alert>}
      </div>
    );
  }

  const entitlement = user?.billing?.entitlement;
  const orders = user?.billing?.orders || [];
  const planName = entitlement?.planCode ? entitlement.planCode.toUpperCase() : 'Chưa có thông tin gói';
  const expiresAtText = entitlement?.endsAt
    ? new Date(entitlement.endsAt).toLocaleDateString('vi-VN')
    : entitlement
      ? 'Không có ngày hết hạn'
      : 'Chưa có thông tin';

  const interviewFeature = getExactEntitlementFeature(entitlement?.features, 'interview');
  const cvFeature = getExactEntitlementFeature(entitlement?.features, 'cv_analysis');
  const questionLimitFeature = getExactEntitlementFeature(
    entitlement?.features,
    'interview_question_limit'
  );

  const interviewQuotaText = formatFeatureAvailability(interviewFeature, 'phiên');
  const cvAnalysisText = formatFeatureAvailability(cvFeature, 'lần');
  const interviewQuestionLimitText = formatInterviewQuestionLimit(questionLimitFeature);
  const plansWithPrices = loadedPlans?.filter((plan) => plan.prices[0]) ?? [];
  const hasNoPlans = loadedPlans?.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <BillingPageHeader />

      {error && (
        <Alert variant="error" className="shadow-subtle">
          {error}
        </Alert>
      )}

      {/* Current Entitlement Card */}
      <Card variant="elevated" padding="lg" className="border border-outline-variant/60 shadow-floating space-y-5 bg-white">
        {userPresentation.showBackgroundError && (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-3 py-2 text-xs text-on-surface">
            <span>Không thể cập nhật thông tin tài khoản. Gói và lịch sử đã tải vẫn được giữ lại.</span>
            <Button variant="outline" size="sm" onClick={() => void refetchUser()} disabled={fetchingUser} loading={fetchingUser}>
              Thử lại
            </Button>
          </div>
        )}
        {userPresentation.showRefreshing && !userPresentation.showBackgroundError && (
          <p role="status" aria-live="polite" className="text-xs text-on-surface-variant">
            Đang cập nhật thông tin gói và thanh toán...
          </p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Gói hiện tại</div>
            <div className="text-2xl font-black text-primary mt-1 flex items-center gap-2.5">
              <span>{planName}</span>
              <Badge variant="primary" size="sm">Đang hoạt động</Badge>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs text-on-surface-variant">Thời hạn sử dụng</div>
            <div className="text-sm font-bold text-on-surface mt-0.5">
              {expiresAtText}
            </div>
          </div>
        </div>

        {/* Quota Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div className="text-xs text-on-surface-variant font-medium">Hạn mức phỏng vấn khả dụng</div>
            <div className="text-xl font-extrabold text-on-surface mt-1">
              {interviewQuotaText}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div className="text-xs text-on-surface-variant font-medium">Phân tích CV & So khớp JD</div>
            <div className="text-xl font-extrabold text-on-surface mt-1">
              {cvAnalysisText}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div className="text-xs text-on-surface-variant font-medium">Giới hạn câu hỏi / phiên</div>
            <div className="text-xl font-extrabold text-on-surface mt-1">
              {interviewQuestionLimitText}
            </div>
          </div>
        </div>
      </Card>

      {/* Pricing / Upgrade Plans Grid */}
      <div className="space-y-4 pt-2">
        <div className="border-b border-outline-variant/30 pb-2">
          <h2 className="text-xl font-bold text-on-surface tracking-tight">
            Nâng cấp gói dịch vụ
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Chọn gói cước phù hợp với tốc độ luyện tập và mục tiêu chuẩn bị phỏng vấn của bạn.
          </p>
        </div>

        {plansPresentation.showBackgroundError && (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-3 py-2 text-xs text-on-surface">
            <span>Không thể cập nhật danh mục gói mới nhất. Các gói đã tải vẫn được giữ lại.</span>
            <Button variant="outline" size="sm" onClick={() => void refetchPlans()} disabled={fetchingPlans} loading={fetchingPlans}>
              Thử lại
            </Button>
          </div>
        )}
        {plansPresentation.showRefreshing && !plansPresentation.showBackgroundError && (
          <p role="status" aria-live="polite" className="text-xs text-on-surface-variant">
            Đang cập nhật danh mục gói...
          </p>
        )}

        {showPlansSkeleton ? (
          <div role="status" aria-label="Đang tải danh mục gói cước" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }, (_, index) => (
              <Card key={index} variant="elevated" padding="lg" className="space-y-5 bg-white border border-outline-variant/60">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-9 w-1/2" />
                <div className="space-y-3">
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </Card>
            ))}
          </div>
        ) : plansPresentation.showBlockingError ? (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-error/30 bg-error/5 p-5 text-sm text-on-surface">
            <div>
              <p className="font-semibold">Không thể tải danh mục gói dịch vụ.</p>
              <p className="mt-1 text-xs text-on-surface-variant">Thông tin gói hiện tại và lịch sử thanh toán vẫn được giữ nguyên.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refetchPlans()} disabled={fetchingPlans} loading={fetchingPlans}>
              Thử tải lại
            </Button>
          </div>
        ) : hasNoPlans ? (
          <div className="text-center py-10 px-4 bg-surface-container-low/40 rounded-2xl border-2 border-dashed border-outline-variant/60 space-y-2">
            <div className="text-sm font-bold text-on-surface">Hiện chưa có gói dịch vụ khả dụng</div>
            <p className="text-xs text-on-surface-variant">Danh mục đã tải thành công nhưng chưa có gói nào để lựa chọn.</p>
          </div>
        ) : plansWithPrices.length === 0 ? (
          <div className="text-center py-10 px-4 bg-surface-container-low/40 rounded-2xl border border-outline-variant/40 space-y-2">
            <div className="text-sm font-bold text-on-surface">Chưa có mức giá khả dụng</div>
            <p className="text-xs text-on-surface-variant">Các gói dịch vụ hiện có chưa được cấu hình mức giá để thanh toán.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plansWithPrices.map((plan) => {
              const price = plan.prices[0];
              if (!price) return null;

              const isCurrentPlan = currentPlanCode === plan.code;
              const isFree = price.amountMinor === 0;
              const isHighlighted = plan.isHighlighted;
              const featureDescriptions = price.features.map(describePlanFeature).filter(Boolean) as string[];

              return (
              <Card
                key={plan.id}
                variant="elevated"
                padding="lg"
                className={`flex flex-col justify-between relative bg-white transition-all ${
                  isHighlighted
                    ? 'border-2 border-primary shadow-card ring-1 ring-primary/20'
                    : 'border border-outline-variant/60 shadow-subtle'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary text-white shadow-sm">
                      Phổ biến nhất
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-on-surface tracking-tight">{plan.name}</h3>
                    {isCurrentPlan && (
                      <Badge variant="primary" size="sm">Đang dùng</Badge>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant min-h-[32px] leading-relaxed">
                    {plan.description || 'Thông tin quyền lợi chi tiết được máy chủ cung cấp theo từng mức giá.'}
                  </p>
                  <div className="pt-2 pb-2 border-b border-outline-variant/30">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-on-surface">
                        {isFree ? 'Miễn phí' : formatCurrency(price.amountMinor, price.currency)}
                      </span>
                      {!isFree && price.durationDays && (
                        <span className="text-xs text-on-surface-variant font-medium">
                          / {price.durationDays} ngày
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs text-on-surface">
                    {price.interviewQuota !== null && (
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                        <span>Hạn mức giá: {price.interviewQuota} lượt phỏng vấn</span>
                      </li>
                    )}
                    {featureDescriptions.map((description) => (
                      <li key={description} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                        <span>{description}</span>
                      </li>
                    ))}
                    {featureDescriptions.length === 0 && price.interviewQuota === null && (
                      <li className="text-on-surface-variant">Chưa có thông tin tính năng cho mức giá này.</li>
                    )}
                  </ul>
                </div>

                <div className="pt-6 mt-4 border-t border-outline-variant/20">
                  <Button
                    variant={isHighlighted ? 'primary' : 'outline'}
                    size="md"
                    fullWidth
                    onClick={() => handleBuyPlan(price.id)}
                    disabled={createCheckoutMutation.isPending || isCurrentPlan}
                    loading={createCheckoutMutation.isPending && createCheckoutMutation.variables === price.id}
                  >
                    {isCurrentPlan ? 'Gói hiện tại' : isHighlighted ? 'Nâng cấp ngay' : 'Chọn gói này'}
                  </Button>
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Orders History */}
      {orders.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-on-surface">Lịch sử giao dịch</h3>
          <Card variant="elevated" padding="none" className="overflow-hidden bg-white border border-outline-variant/60 shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/40">
                  <tr>
                    <th className="p-4">Mã đơn hàng</th>
                    <th className="p-4">Gói dịch vụ</th>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Số tiền</th>
                    <th className="p-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-4 font-mono font-semibold text-primary">{o.id.slice(0, 12)}</td>
                      <td className="p-4 font-semibold">{o.planCode}</td>
                      <td className="p-4 text-on-surface-variant">
                        {new Date(o.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4 font-bold">{formatCurrency(o.amountMinor, o.currency)}</td>
                      <td className="p-4">
                        <Badge
                          variant={o.status === 'fulfilled' ? 'success' : o.status === 'pending' ? 'warning' : 'neutral'}
                          size="sm"
                        >
                          {o.status === 'fulfilled' ? 'Thành công' : o.status === 'pending' ? 'Đang chờ' : o.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
