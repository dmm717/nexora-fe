import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { AdminAsyncNotice } from '@/components/features/admin/AdminAsyncNotice';
import { AdminUserView, EntitlementFeatureResponse, OrderResponse } from '@/services/adminApi';
import { useAdminUserDetail } from '@/hooks/queries/useAdminUsers';
import { getQueryPresentation } from '@/utils/queryPresentation';
import { GrantPlanModal } from './GrantPlanModal';
import { AdjustQuotaModal } from './AdjustQuotaModal';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export function UserDetailModal({ isOpen, onClose, userId }: UserDetailModalProps) {
  const detailsQuery = useAdminUserDetail(userId);
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  // The modal can remain mounted while its selected id changes. Never present
  // data belonging to the previous key during that transition.
  const user = detailsQuery.data?.id === userId ? detailsQuery.data : undefined;
  const queryPresentation = getQueryPresentation({
    hasData: user !== undefined,
    isLoading: detailsQuery.isLoading,
    isError: detailsQuery.isError,
    isFetching: detailsQuery.isFetching,
  });
  const showSubModal = isGrantOpen || isAdjustOpen;
  const retry = () => { void detailsQuery.refetch(); };

  return (
    <>
      <Modal
        isOpen={isOpen && Boolean(userId) && !showSubModal}
        onClose={onClose}
        title="Chi tiết người dùng"
        description="Thông tin tài khoản, gói cước, hạn mức và các giao dịch gần đây."
        size="xl"
      >
        {queryPresentation.showBackgroundError && (
          <AdminAsyncNotice kind="error" onRetry={retry} className="mb-4" />
        )}
        {queryPresentation.showRefreshing && !queryPresentation.showBackgroundError && (
          <AdminAsyncNotice kind="refreshing" className="mb-2" />
        )}

        {queryPresentation.showInitialLoading && <UserDetailSkeleton />}
        {queryPresentation.showBlockingError && (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-error/30 bg-error-container/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-on-surface-variant">Không thể tải thông tin chi tiết người dùng.</p>
            <Button type="button" variant="outline" onClick={retry}>Thử lại</Button>
          </div>
        )}
        {!user && !queryPresentation.showBlockingError && !queryPresentation.showInitialLoading && (
          <UserDetailSkeleton />
        )}
        {user && <UserDetailContent user={user} onGrant={() => setIsGrantOpen(true)} onAdjust={() => setIsAdjustOpen(true)} />}
      </Modal>

      {/* Render child dialogs as siblings so their focus traps do not compete with this dialog. */}
      <GrantPlanModal
        isOpen={isOpen && isGrantOpen}
        onClose={() => setIsGrantOpen(false)}
        user={user ?? null}
      />
      <AdjustQuotaModal
        isOpen={isOpen && isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        user={user ?? null}
      />
    </>
  );
}

function UserDetailSkeleton() {
  return (
    <div role="status" aria-label="Đang tải thông tin người dùng" className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-5 w-4/5" />)}
      </div>
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

function UserDetailContent({ user, onGrant, onAdjust }: { user: AdminUserView & { currentEntitlement?: { id: string; planCode: string; startsAt: string; endsAt?: string; features: EntitlementFeatureResponse[] }; recentOrders: OrderResponse[] }; onGrant: () => void; onAdjust: () => void }) {
  return (
    <div className="space-y-7">
      <section aria-labelledby="admin-user-basics" className="space-y-3">
        <h3 id="admin-user-basics" className="border-b border-outline-variant pb-2 text-sm font-bold text-on-surface">Thông tin cơ bản</h3>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <DetailField label="ID" value={user.id} />
          <DetailField label="Email" value={user.email} />
          <DetailField label="Tên hiển thị" value={user.displayName || '—'} />
          <DetailField label="Ngày tham gia" value={new Date(user.createdAt).toLocaleDateString('vi-VN')} />
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium text-on-surface-variant">Trạng thái</dt>
            <dd><Badge variant={user.active ? 'success' : 'error'} size="sm">{user.active ? 'Hoạt động' : 'Đã khóa'}</Badge></dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium text-on-surface-variant">Phân quyền</dt>
            <dd className="flex flex-wrap gap-1.5">
              {(user.roles || []).length > 0
                ? user.roles.map((role) => <Badge key={role} variant="primary" size="sm">{role}</Badge>)
                : <span className="text-on-surface">—</span>}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="admin-user-entitlement" className="space-y-3">
        <div className="flex flex-col gap-3 border-b border-outline-variant pb-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 id="admin-user-entitlement" className="text-sm font-bold text-on-surface">Gói cước & hạn mức</h3>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onAdjust}>Chỉnh quota</Button>
            <Button type="button" size="sm" onClick={onGrant}>Cấp gói cước</Button>
          </div>
        </div>

        {!user.currentEntitlement ? (
          <p className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-4 text-sm text-on-surface-variant">
            Người dùng chưa có gói cước nào đang kích hoạt.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-outline-variant/60">
            <div className="flex flex-col gap-1 bg-surface-container-low px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-on-surface">Gói hiện tại: {user.currentEntitlement.planCode.toUpperCase()}</p>
              <p className="text-xs text-on-surface-variant">
                Hiệu lực: {new Date(user.currentEntitlement.startsAt).toLocaleDateString('vi-VN')}{' '}
                {user.currentEntitlement.endsAt
                  ? `– ${new Date(user.currentEntitlement.endsAt).toLocaleDateString('vi-VN')}`
                  : '– Vĩnh viễn'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <caption className="sr-only">Hạn mức tính năng của gói hiện tại</caption>
                <thead className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-semibold">Tính năng</th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-semibold">Giới hạn</th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-semibold">Đã dùng</th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-semibold">Điều chỉnh</th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-semibold">Còn lại</th>
                  </tr>
                </thead>
                <tbody>
                  {user.currentEntitlement.features.map((feature: EntitlementFeatureResponse) => (
                    <tr key={feature.code} className="border-b border-outline-variant/50 last:border-b-0">
                      <td className="px-3 py-3">
                        <p className="font-medium text-on-surface">{feature.name}</p>
                        <p className="mt-0.5 text-xs text-on-surface-variant">{feature.code} · {feature.enabled ? 'Bật' : 'Tắt'}</p>
                      </td>
                      <td className="px-3 py-3 text-center text-on-surface">{feature.unlimited ? '∞' : feature.limit}</td>
                      <td className="px-3 py-3 text-center text-on-surface">{feature.consumed}</td>
                      <td className={`px-3 py-3 text-center ${feature.adjustment > 0 ? 'text-primary' : feature.adjustment < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                        {feature.adjustment > 0 ? `+${feature.adjustment}` : feature.adjustment}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-primary">{feature.unlimited ? '∞' : feature.available}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="admin-user-orders" className="space-y-3">
        <h3 id="admin-user-orders" className="border-b border-outline-variant pb-2 text-sm font-bold text-on-surface">Lịch sử giao dịch gần đây</h3>
        {user.recentOrders.length === 0 ? (
          <p className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-4 text-sm text-on-surface-variant">
            Chưa có giao dịch nào.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-outline-variant/60">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <caption className="sr-only">Các giao dịch gần đây của người dùng</caption>
              <thead className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold">Mã ĐH</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold">Gói</th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-semibold">Số tiền</th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-semibold">Trạng thái</th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-semibold">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {user.recentOrders.map((order: OrderResponse) => (
                  <tr key={order.id} className="border-b border-outline-variant/50 last:border-b-0">
                    <td className="px-3 py-3 font-mono text-xs text-on-surface-variant">{order.id.substring(0, 8)}…</td>
                    <td className="px-3 py-3 font-medium text-on-surface">{order.planCode.toUpperCase()}</td>
                    <td className="px-3 py-3 text-right text-on-surface">{order.amountMinor.toLocaleString('vi-VN')} {order.currency}</td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant={order.status === 'paid' ? 'success' : 'neutral'} size="sm">{order.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right text-on-surface-variant">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs font-medium text-on-surface-variant">{label}</dt>
      <dd className="break-all font-medium text-on-surface">{value}</dd>
    </div>
  );
}
