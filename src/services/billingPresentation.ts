export interface EntitlementFeatureLike {
  code: string;
  name?: string;
  enabled: boolean;
  limit: number | null;
  consumed: number;
  available: number | null;
  unlimited: boolean;
}

export interface PlanFeatureLike {
  code: string;
  name: string;
  enabled: boolean;
  limit: number | null;
  unlimited: boolean;
}

export function getExactEntitlementFeature(
  features: EntitlementFeatureLike[] | undefined,
  code: string
): EntitlementFeatureLike | null {
  return features?.find((feature) => feature.code === code) || null;
}

export function formatFeatureAvailability(
  feature: EntitlementFeatureLike | null,
  unit: string
): string {
  if (!feature || !feature.enabled) return 'Chưa khả dụng';
  if (feature.unlimited) return 'Không giới hạn';
  if (feature.available !== null) return `${feature.available} ${unit}`;
  return 'Chưa có thông tin hạn mức';
}

export function formatInterviewQuestionLimit(feature: EntitlementFeatureLike | null): string {
  if (!feature || !feature.enabled) return 'Chưa khả dụng';
  if (feature.unlimited) return 'Không giới hạn';
  if (feature.limit !== null) return `${feature.limit} câu / phiên`;
  return 'Chưa có thông tin hạn mức';
}

export function describePlanFeature(feature: PlanFeatureLike): string | null {
  if (!feature.enabled) return null;
  if (feature.unlimited) return `${feature.name}: Không giới hạn`;
  if (feature.limit !== null) return `${feature.name}: ${feature.limit}`;
  return feature.name;
}

export interface OrderStatusPresentation {
  label: string;
  variant: 'success' | 'warning' | 'info' | 'error' | 'neutral';
}

export function getOrderStatusPresentation(status: string | undefined | null): OrderStatusPresentation {
  switch (status?.toLowerCase()) {
    case 'fulfilled':
    case 'success':
    case 'completed':
    case 'paid':
      return { label: 'Thành công', variant: 'success' };
    case 'pending':
      return { label: 'Đang chờ', variant: 'warning' };
    case 'processing':
      return { label: 'Đang xử lý', variant: 'info' };
    case 'failed':
      return { label: 'Thất bại', variant: 'error' };
    case 'cancelled':
    case 'canceled':
      return { label: 'Đã hủy', variant: 'neutral' };
    default:
      return { label: 'Đang cập nhật', variant: 'neutral' };
  }
}
