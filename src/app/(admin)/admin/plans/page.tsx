'use client';

import React, { useState } from 'react';
import { useAdminPlans } from '@/hooks/queries/useAdminPlans';
import { AdminPlanView, AdminPlanPriceView } from '@/services/adminApi';
import { getQueryPresentation } from '@/utils/queryPresentation';
import { AdminPageShell } from '@/components/features/admin/AdminPageShell';
import { AdminAsyncNotice } from '@/components/features/admin/AdminAsyncNotice';
import { AdminTableShell } from '@/components/features/admin/AdminTableShell';
import { AdminTableSkeleton } from '@/components/features/admin/AdminTableSkeleton';
import { PlanModal } from '@/components/features/admin/plans/PlanModal';
import { PriceModal } from '@/components/features/admin/plans/PriceModal';
import { FeatureMatrixModal } from '@/components/features/admin/plans/FeatureMatrixModal';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState';

const tableHeaders = ['Thông tin gói', 'Mức giá', 'Trạng thái', 'Thao tác gói'];

export default function AdminPlansPage() {
  const { data: plans, isLoading, isFetching, isError, refetch } = useAdminPlans();
  const presentation = getQueryPresentation({
    hasData: plans !== undefined,
    isLoading,
    isError,
    isFetching,
  });

  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlanView | null>(null);
  const [isPriceModalOpen, setPriceModalOpen] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState('');
  const [editingPrice, setEditingPrice] = useState<AdminPlanPriceView | null>(null);
  const [isFeatureModalOpen, setFeatureModalOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState<AdminPlanPriceView | null>(null);

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setPlanModalOpen(true);
  };

  const handleEditPlan = (plan: AdminPlanView) => {
    setEditingPlan(plan);
    setPlanModalOpen(true);
  };

  const handleAddPrice = (planId: string) => {
    setTargetPlanId(planId);
    setEditingPrice(null);
    setPriceModalOpen(true);
  };

  const handleEditPrice = (planId: string, price: AdminPlanPriceView) => {
    setTargetPlanId(planId);
    setEditingPrice(price);
    setPriceModalOpen(true);
  };

  const handleEditFeatures = (price: AdminPlanPriceView) => {
    setTargetPrice(price);
    setFeatureModalOpen(true);
  };

  return (
    <AdminPageShell
      active="plans"
      actions={(
        <Button onClick={handleCreatePlan}>
          <span aria-hidden="true" className="mr-1">+</span>
          Tạo gói mới
        </Button>
      )}
    >
      {presentation.showBackgroundError && (
        <AdminAsyncNotice kind="error" onRetry={() => void refetch()} className="mb-4" />
      )}
      {presentation.showRefreshing && !presentation.showBackgroundError && (
        <AdminAsyncNotice kind="refreshing" className="mb-2" />
      )}

      {presentation.showInitialLoading && (
        <AdminTableSkeleton
          headers={tableHeaders}
          rows={5}
          minWidthClass="min-w-[860px]"
          statusLabel="Đang tải danh sách gói cước"
        />
      )}

      {presentation.showBlockingError && (
        <Alert
          variant="error"
          title="Không thể tải danh sách gói cước"
          action={(
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Thử lại
            </Button>
          )}
        >
          Hãy kiểm tra kết nối hoặc quyền truy cập rồi thử lại. Dữ liệu chưa được tải nên không thể hiển thị danh sách trống.
        </Alert>
      )}

      {plans !== undefined && plans.length === 0 && !presentation.showBlockingError && (
        <EmptyState
          title="Chưa có gói cước"
          description="Danh mục gói hiện đang trống. Tạo gói mới để bắt đầu cấu hình giá và quyền lợi."
          action={<Button onClick={handleCreatePlan}>Tạo gói mới</Button>}
        />
      )}

      {plans !== undefined && plans.length > 0 && (
        <AdminTableShell minWidthClass="min-w-[860px]">
          <thead className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
            <tr>
              {tableHeaders.map((header, index) => (
                <th
                  key={header}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${index === 3 ? 'text-right' : ''}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-b border-outline-variant/50 align-top last:border-b-0">
                <td className="max-w-[240px] px-4 py-4">
                  <div className="font-semibold text-on-surface">{plan.name}</div>
                  <div className="mt-0.5 break-all text-xs text-on-surface-variant">{plan.code.toUpperCase()}</div>
                  {plan.badge && (
                    <Badge variant={plan.isHighlighted ? 'primary' : 'neutral'} size="sm" className="mt-2">
                      {plan.badge}{plan.isHighlighted ? ' · Nổi bật' : ''}
                    </Badge>
                  )}
                </td>

                <td className="px-4 py-4 text-on-surface-variant">
                  {plan.prices.length > 0 ? (
                    <ul className="space-y-2">
                      {plan.prices.map((price) => (
                        <li
                          key={price.id}
                          className={`rounded-lg border border-outline-variant/60 p-3 ${price.isActive ? 'bg-white' : 'bg-surface-container-low'}`}
                        >
                          <div className={`font-medium tabular-nums ${price.isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                            {price.amountMinor.toLocaleString('vi-VN')} {price.currency}
                            {price.durationDays ? ` / ${price.durationDays} ngày` : ''}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="!min-h-0 !px-0 !py-0 text-primary"
                              onClick={() => handleEditPrice(plan.id, price)}
                              aria-label={`Sửa giá ${price.currency} của gói ${plan.name}`}
                            >
                              Sửa giá
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="!min-h-0 !px-0 !py-0 text-primary"
                              onClick={() => handleEditFeatures(price)}
                              aria-label={`Cấu hình quyền lợi cho mức giá của gói ${plan.name}`}
                            >
                              Cấu hình quyền lợi
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-on-surface-variant">Chưa thiết lập giá</p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 !min-h-0 !px-0 !py-0 text-primary"
                    onClick={() => handleAddPrice(plan.id)}
                    aria-label={`Thêm mức giá mới cho gói ${plan.name}`}
                  >
                    + Thêm mức giá mới
                  </Button>
                </td>

                <td className="px-4 py-4">
                  <Badge variant={plan.isActive ? 'success' : 'neutral'} size="sm">
                    {plan.isActive ? 'Đang bán' : 'Đã ẩn'}
                  </Badge>
                </td>

                <td className="px-4 py-4 text-right">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleEditPlan(plan)}>
                    Sửa gói
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTableShell>
      )}

      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setPlanModalOpen(false)}
        editingPlan={editingPlan}
      />
      <PriceModal
        isOpen={isPriceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        planId={targetPlanId}
        editingPrice={editingPrice}
      />
      <FeatureMatrixModal
        isOpen={isFeatureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
        price={targetPrice}
      />
    </AdminPageShell>
  );
}
