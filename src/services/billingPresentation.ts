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
