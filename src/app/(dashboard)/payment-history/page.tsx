'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { billingApi } from '@/services/billingApi';
import { getOrderStatusPresentation } from '@/services/billingPresentation';
import { formatPriceMinor } from '@/utils/formatters';

export default function PaymentHistoryPage() {
  const { authReady, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('');
  const history = useInfiniteQuery({
    queryKey: ['order-history', status],
    queryFn: ({ pageParam }) => billingApi.getOrderHistory(pageParam as string | null, status || undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor || undefined,
    enabled: authReady && isAuthenticated,
    staleTime: 30_000,
  });
  const orders = history.data?.pages.flatMap((page) => page.items) ?? [];
  return <main className="mx-auto max-w-6xl space-y-6 px-5 py-10 sm:px-8">
    <header className="archive-hero rounded-3xl border border-[#dbe3fa] bg-white p-7 shadow-subtle sm:p-9"><p className="text-xs font-bold uppercase tracking-widest text-primary">Lịch sử tài khoản</p><h1 className="mt-2 text-3xl font-extrabold text-[#172554]">Lịch sử thanh toán</h1><p className="mt-2 text-sm text-[#52617e]">Theo dõi các đơn hàng và trạng thái thanh toán của riêng bạn.</p></header>
    <section className="archive-surface rounded-3xl border border-[#dbe3fa] bg-white p-5 shadow-subtle sm:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <label className="text-xs font-bold text-[#334166]">Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 block min-h-10 rounded-lg border border-[#cbd6ef] bg-white px-3 text-sm"><option value="">Tất cả</option><option value="processing">Đang xử lý</option><option value="pending">Đang chờ</option><option value="fulfilled">Thành công</option><option value="failed">Thất bại</option></select></label>
        <div className="flex gap-4"><button type="button" onClick={() => void history.refetch()} className="text-sm font-bold text-primary hover:underline">Làm mới</button><Link href="/pricing" className="text-sm font-bold text-primary hover:underline">Xem bảng giá →</Link></div>
      </div>
      {history.isLoading && <p role="status" className="py-9 text-sm">Đang tải đơn hàng...</p>}
      {history.isError && !history.data && <div role="alert" className="py-8 text-sm text-error">Không thể tải lịch sử thanh toán. <button type="button" className="underline" onClick={() => void history.refetch()}>Thử lại</button></div>}
      {!history.isLoading && !history.isError && orders.length === 0 && <p className="rounded-xl bg-[#f3f6ff] p-8 text-sm text-[#52617e]">Chưa có đơn hàng nào ở trạng thái này.</p>}
      <div className="divide-y divide-[#e9edf7]">{orders.map((order) => {
        const presentation = getOrderStatusPresentation(order.status);
        return <article key={order.id} className="grid gap-3 py-5 text-sm sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto] sm:items-center">
          <div><span className="block text-xs text-[#52617e]">Mã đơn</span><span className="font-semibold text-[#172554]" title={order.id}>…{order.id.slice(-8)}</span></div>
          <div><span className="block text-xs text-[#52617e]">Gói</span><span className="font-semibold">{order.planCode}</span></div>
          <div><span className="block text-xs text-[#52617e]">Ngày tạo</span><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString('vi-VN')}</time></div>
          <div><span className="block text-xs text-[#52617e]">Số tiền</span><span className="font-bold">{formatPriceMinor(order.amountMinor, order.currency)}</span></div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${presentation.variant === 'success' ? 'bg-emerald-50 text-emerald-800' : presentation.variant === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>{presentation.label}</span>
        </article>;
      })}</div>
      {history.hasNextPage && <button type="button" disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()} className="mt-6 min-h-10 rounded-lg border border-primary px-4 text-sm font-bold text-primary hover:bg-primary-fixed">{history.isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}</button>}
    </section>
  </main>;
}
