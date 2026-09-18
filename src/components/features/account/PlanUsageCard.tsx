import React from 'react';
import Link from 'next/link';
import { BillingSummaryResponse } from '@/services/userApi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ClientDate } from '@/components/ui/ClientDate';
import { formatCurrency } from '@/utils/formatters';

interface PlanUsageCardProps {
  billing?: BillingSummaryResponse | null;
}

export const PlanUsageCard: React.FC<PlanUsageCardProps> = ({ billing }) => {
  const entitlement = billing?.entitlement;
  const orders = billing?.orders;

  if (!entitlement) {
    return (
      <Card variant="elevated" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-on-surface">Gói cước & Sử dụng</h2>
          <Badge variant="neutral" size="sm">
            Chưa kích hoạt
          </Badge>
        </div>
        <p className="text-xs text-on-surface-variant">
          Chưa có thông tin gói sử dụng.
        </p>
        <div className="pt-2">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none active:scale-[0.99] text-xs px-3 py-1.5 gap-1.5 min-h-[32px] bg-white border border-outline-variant hover:bg-surface-container-low text-on-surface hover:border-outline focus:ring-primary-container shadow-sm"
          >
            Khám phá các gói dịch vụ
          </Link>
        </div>
      </Card>
    );
  }

  const isUnlimited = entitlement.limit == null;
  const consumedStr = entitlement.consumed.toLocaleString('vi-VN');
  const limitStr = isUnlimited ? 'Không giới hạn' : `${entitlement.limit?.toLocaleString('vi-VN')} AI Credits`;
  const availableStr = entitlement.available != null ? `${entitlement.available.toLocaleString('vi-VN')} AI Credits` : 'Không giới hạn';

  return (
    <Card variant="elevated" padding="lg" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-on-surface">Gói cước & Sử dụng</h2>
            <Badge variant="primary" size="sm">
              {entitlement.planCode}
            </Badge>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Thông tin quyền lợi và hạn mức sử dụng tính năng AI của tài khoản.
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none active:scale-[0.99] text-xs px-3 py-1.5 gap-1.5 min-h-[32px] bg-white border border-outline-variant hover:bg-surface-container-low text-on-surface hover:border-outline focus:ring-primary-container shadow-sm flex-shrink-0"
        >
          Nâng cấp gói
        </Link>
      </div>

      {/* Grid of Usage Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 space-y-1">
          <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
            Ngày bắt đầu
          </span>
          <div className="text-sm font-semibold text-on-surface">
            <ClientDate date={entitlement.startsAt} format="date" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 space-y-1">
          <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
            Ngày hết hạn
          </span>
          <div className="text-sm font-semibold text-on-surface">
            {entitlement.endsAt ? (
              <ClientDate date={entitlement.endsAt} format="date" />
            ) : (
              'Không thời hạn'
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 space-y-1">
          <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
            Đã sử dụng
          </span>
          <div className="text-sm font-semibold text-on-surface">
            {consumedStr} / {limitStr}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 space-y-1">
          <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
            Khả dụng còn lại
          </span>
          <div className="text-sm font-semibold text-on-surface">
            {availableStr}
          </div>
        </div>
      </div>

      {/* Orders history if present */}
      {orders && orders.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-outline-variant/40">
          <h3 className="text-sm font-bold text-on-surface">Lịch sử giao dịch</h3>
          <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-low/80 text-on-surface-variant border-b border-outline-variant/40">
                  <th className="py-2.5 px-3 font-semibold">Mã đơn</th>
                  <th className="py-2.5 px-3 font-semibold">Gói cước</th>
                  <th className="py-2.5 px-3 font-semibold">Số tiền</th>
                  <th className="py-2.5 px-3 font-semibold">Ngày giao dịch</th>
                  <th className="py-2.5 px-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {orders.map((order) => {
                  const statusNorm = order.status.toLowerCase();
                  const isSuccess =
                    statusNorm === 'success' ||
                    statusNorm === 'completed' ||
                    statusNorm === 'paid';
                  const isPending =
                    statusNorm === 'pending' || statusNorm === 'processing';

                  const badgeVariant = isSuccess
                    ? 'success'
                    : isPending
                    ? 'warning'
                    : 'error';

                  return (
                    <tr key={order.id} className="hover:bg-surface-container-low/40">
                      <td className="py-2.5 px-3 font-mono font-medium text-on-surface">
                        #{order.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-2.5 px-3 text-on-surface">{order.planCode}</td>
                      <td className="py-2.5 px-3 text-on-surface font-medium">
                        {formatCurrency(order.amountMinor, order.currency || 'VND')}
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant">
                        <ClientDate date={order.createdAt} format="date" />
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={badgeVariant} size="sm">
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
};
export default PlanUsageCard;
