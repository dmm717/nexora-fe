import React, { useState } from 'react';
import { useAdminFeatureDefinitions, useUpdatePlanPriceFeatures } from '@/hooks/queries/useAdminPlans';
import { getQueryPresentation } from '@/utils/queryPresentation';
import { AdminAsyncNotice } from '@/components/features/admin/AdminAsyncNotice';
import { AdminTableShell } from '@/components/features/admin/AdminTableShell';
import { AdminTableSkeleton } from '@/components/features/admin/AdminTableSkeleton';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { AdminPlanPriceView } from '@/services/adminApi';

interface FeatureMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  price: AdminPlanPriceView | null;
}

interface FeatureDefinition {
  code: string;
  name: string;
}

interface FeatureFormState {
  featureCode: string;
  enabled: boolean;
  limit: number | null;
}

const featureHeaders = ['Tính năng', 'Bật/tắt', 'Giới hạn'];

function FeatureMatrixForm({
  price,
  definitions,
  isPending,
  onCancel,
  onSave,
}: {
  price: AdminPlanPriceView;
  definitions: FeatureDefinition[];
  isPending: boolean;
  onCancel: () => void;
  onSave: (features: FeatureFormState[]) => void;
}) {
  const [featuresState, setFeaturesState] = useState<Record<string, FeatureFormState>>(() => {
    const initialState: Record<string, FeatureFormState> = {};
    definitions.forEach((definition) => {
      const existing = price.features.find((feature) => feature.code === definition.code);
      initialState[definition.code] = {
        featureCode: definition.code,
        enabled: existing ? existing.enabled : false,
        limit: existing && !existing.unlimited ? (existing.limit || 0) : null,
      };
    });
    return initialState;
  });

  const handleToggleEnabled = (code: string, enabled: boolean) => {
    setFeaturesState((previous) => ({
      ...previous,
      [code]: { ...previous[code], enabled },
    }));
  };

  const handleToggleUnlimited = (code: string, unlimited: boolean) => {
    setFeaturesState((previous) => ({
      ...previous,
      [code]: { ...previous[code], limit: unlimited ? null : 0 },
    }));
  };

  const handleChangeLimit = (code: string, limitValue: string) => {
    const limit = Number.parseInt(limitValue, 10);
    setFeaturesState((previous) => ({
      ...previous,
      [code]: { ...previous[code], limit: Number.isNaN(limit) ? 0 : limit },
    }));
  };

  return (
    <>
      <AdminTableShell minWidthClass="min-w-[520px]">
        <thead className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
          <tr>
            {featureHeaders.map((header) => (
              <th key={header} scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {definitions.map((definition) => {
            const state = featuresState[definition.code];
            const isUnlimited = state?.limit === null;
            return (
              <tr key={definition.code} className="border-b border-outline-variant/50 last:border-b-0">
                <td className="px-3 py-3">
                  <div className="font-medium text-on-surface">{definition.name}</div>
                  <div className="break-all text-xs text-on-surface-variant">{definition.code}</div>
                </td>
                <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={state?.enabled ?? false}
                    onChange={(event) => handleToggleEnabled(definition.code, event.target.checked)}
                    disabled={isPending || !state}
                    aria-label={`Bật ${definition.name}`}
                    className="h-4 w-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                </td>
                <td className="px-3 py-3">
                  {state?.enabled ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 whitespace-nowrap text-sm text-on-surface">
                        <input
                          type="checkbox"
                          checked={isUnlimited}
                          onChange={(event) => handleToggleUnlimited(definition.code, event.target.checked)}
                          disabled={isPending}
                          className="h-4 w-4 accent-primary"
                        />
                        Vô hạn
                      </label>
                      {!isUnlimited && (
                        <label className="flex items-center gap-2 text-xs text-on-surface-variant">
                          Giới hạn
                          <input
                            type="number"
                            min="0"
                            value={state.limit ?? 0}
                            onChange={(event) => handleChangeLimit(definition.code, event.target.value)}
                            disabled={isPending}
                            aria-label={`Giới hạn ${definition.name}`}
                            className="w-24 rounded-lg border border-outline-variant bg-white px-2 py-1.5 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-on-surface-variant">Đã tắt</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </AdminTableShell>

      <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant/50 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>Hủy</Button>
        <Button type="button" loading={isPending} onClick={() => onSave(Object.values(featuresState))}>
          {isPending ? 'Đang lưu…' : 'Lưu quyền lợi'}
        </Button>
      </div>
    </>
  );
}

export function FeatureMatrixModal({ isOpen, onClose, price }: FeatureMatrixModalProps) {
  const {
    data: featureDefs,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAdminFeatureDefinitions();
  const presentation = getQueryPresentation({
    hasData: featureDefs !== undefined,
    isLoading,
    isError,
    isFetching,
  });
  const {
    mutate: updateFeatures,
    isPending,
    isError: updateError,
    reset: resetUpdateMutation,
  } = useUpdatePlanPriceFeatures();

  const handleClose = () => {
    if (isPending) return;
    resetUpdateMutation();
    onClose();
  };

  if (!isOpen || !price) return null;

  const saveFeatures = (features: FeatureFormState[]) => {
    if (isPending || featureDefs === undefined || featureDefs.length === 0) return;
    updateFeatures({
      priceId: price.id,
      data: {
        features: features.map((feature) => ({
          featureCode: feature.featureCode,
          enabled: feature.enabled,
          limit: feature.limit,
        })),
      },
    }, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cấu hình quyền lợi"
      description="Các quyền lợi áp dụng cho mức giá đã chọn."
      size="lg"
    >
      <div className="max-h-[calc(100dvh-12rem)] space-y-4 overflow-y-auto">
        {presentation.showBackgroundError && (
          <AdminAsyncNotice kind="error" onRetry={() => void refetch()} />
        )}
        {presentation.showRefreshing && !presentation.showBackgroundError && (
          <AdminAsyncNotice kind="refreshing" />
        )}

        {updateError && (
          <Alert variant="error" title="Chưa lưu được quyền lợi">
            Lựa chọn hiện tại vẫn được giữ lại. Bạn có thể thử lưu lại.
          </Alert>
        )}

        {presentation.showInitialLoading && (
          <AdminTableSkeleton
            headers={featureHeaders}
            rows={4}
            minWidthClass="min-w-[520px]"
            statusLabel="Đang tải danh sách tính năng"
          />
        )}

        {presentation.showBlockingError && (
          <Alert
            variant="error"
            title="Không thể tải danh sách tính năng"
            action={(
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                Thử lại
              </Button>
            )}
          >
            Chưa thể hiển thị ma trận quyền lợi vì danh sách tính năng chưa tải thành công.
          </Alert>
        )}

        {featureDefs !== undefined && featureDefs.length === 0 && !presentation.showBlockingError && (
          <EmptyState
            title="Chưa có định nghĩa tính năng"
            description="Danh sách tính năng hiện đang trống; chưa có quyền lợi nào để cấu hình."
          />
        )}

        {featureDefs !== undefined && featureDefs.length > 0 && (
          <FeatureMatrixForm
            key={`${price.id}:${featureDefs.map((definition) => definition.code).join('|')}`}
            price={price}
            definitions={featureDefs}
            isPending={isPending}
            onCancel={handleClose}
            onSave={saveFeatures}
          />
        )}

        {(featureDefs === undefined || featureDefs.length === 0) && (
          <div className="flex justify-end border-t border-outline-variant/50 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>Hủy</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
