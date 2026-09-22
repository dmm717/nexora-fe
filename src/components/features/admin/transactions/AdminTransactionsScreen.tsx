'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useAdminTransactions } from '@/hooks/queries/useAdminDashboard';
import { StatusBadge } from '@/components/features/admin/dashboard/AdminDashboardScreen';
import { Button } from '@/components/ui/Button/Button';
import { formatMoneyMinor } from '@/utils/formatters';
import {
  advanceAdminTransactionCursor,
  canRetreatAdminTransactionCursor,
  resetAdminTransactionCursor,
  retreatAdminTransactionCursor,
} from '@/services/adminTransactionPagination';

const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' });
export default function AdminTransactionsScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [previousCursors, setPreviousCursors] = useState<Array<string | undefined>>([]);
  const cursorActionLock = useRef(false);
  const filters = useMemo(() => ({
    search: params.get('search') || undefined,
    status: params.get('status') || undefined,
    planCode: params.get('planCode') || undefined,
    currency: params.get('currency') || undefined,
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
    cursor: params.get('cursor') || undefined,
    pageSize: 25,
  }), [params]);
  const transactions = useAdminTransactions(filters);

  const updateParams = (values: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    next.delete('cursor');
    setPreviousCursors(resetAdminTransactionCursor().previousCursors);
    const href = `/admin/transactions?${next.toString()}`;
    router.replace(href, { scroll: false });
  };

  const navigateToCursor = (cursor: string | undefined) => {
    const next = new URLSearchParams(params.toString());
    if (cursor) next.set('cursor', cursor);
    else next.delete('cursor');
    router.push(`/admin/transactions?${next.toString()}`, { scroll: false });
  };

  const handleNext = () => {
    if (cursorActionLock.current || transactions.isFetching) return;
    const nextState = advanceAdminTransactionCursor(
      { cursor: filters.cursor, previousCursors },
      transactions.data?.nextCursor ?? undefined
    );
    if (nextState.cursor === filters.cursor) return;
    cursorActionLock.current = true;
    window.setTimeout(() => { cursorActionLock.current = false; }, 0);
    setPreviousCursors(nextState.previousCursors);
    navigateToCursor(nextState.cursor);
  };

  const handlePrevious = () => {
    if (cursorActionLock.current || transactions.isFetching) return;
    const nextState = retreatAdminTransactionCursor({ cursor: filters.cursor, previousCursors });
    if (nextState.previousCursors.length === previousCursors.length) return;
    cursorActionLock.current = true;
    window.setTimeout(() => { cursorActionLock.current = false; }, 0);
    setPreviousCursors(nextState.previousCursors);
    navigateToCursor(nextState.cursor);
  };

  const clearFilters = () => {
    setSearch('');
    setPreviousCursors(resetAdminTransactionCursor().previousCursors);
    router.replace('/admin/transactions', { scroll: false });
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
      <header><p className="text-sm font-semibold text-primary">Báo cáo thanh toán</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-on-surface">Giao dịch</h1><p className="mt-2 text-sm text-on-surface-variant">Tra cứu giao dịch toàn hệ thống theo dữ liệu đã lưu.</p></header>
      <form className="grid gap-3 rounded-xl border border-outline-variant/60 bg-white p-4 shadow-subtle md:grid-cols-2 xl:grid-cols-6" onSubmit={(event) => { event.preventDefault(); updateParams({ search: search.trim() || undefined }); }}>
        <label className="xl:col-span-2"><span className="text-xs font-semibold text-on-surface-variant">Tìm kiếm</span><span className="mt-1 flex items-center rounded-lg border border-outline-variant bg-white px-3"><Search size={16} className="text-on-surface-variant" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-10 w-full border-0 bg-transparent px-2 text-sm outline-none" placeholder="Email, tên, mã giao dịch" /></span></label>
        <FilterSelect label="Trạng thái" value={filters.status ?? ''} onChange={(value) => updateParams({ status: value || undefined })}><option value="">Tất cả</option><option value="fulfilled">Thành công</option><option value="processing">Đang xử lý</option><option value="pending">Chờ xử lý</option><option value="failed">Thất bại</option></FilterSelect>
        <label><span className="text-xs font-semibold text-on-surface-variant">Gói</span><input value={filters.planCode ?? ''} onChange={(event) => updateParams({ planCode: event.target.value || undefined })} className="mt-1 min-h-10 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm" placeholder="pro" /></label>
        <FilterSelect label="Tiền tệ" value={filters.currency ?? ''} onChange={(value) => updateParams({ currency: value || undefined })}><option value="">Tất cả</option><option value="VND">VND</option><option value="USD">USD</option></FilterSelect>
        <div className="flex items-end gap-2"><Button type="submit" className="w-full">Tìm</Button><Button type="button" variant="outline" onClick={clearFilters}>Xóa lọc</Button></div>
        <label><span className="text-xs font-semibold text-on-surface-variant">Từ ngày</span><input type="date" value={filters.from ?? ''} onChange={(event) => updateParams({ from: event.target.value || undefined })} className="mt-1 min-h-10 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm" /></label>
        <label><span className="text-xs font-semibold text-on-surface-variant">Đến ngày</span><input type="date" value={filters.to ?? ''} onChange={(event) => updateParams({ to: event.target.value || undefined })} className="mt-1 min-h-10 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm" /></label>
      </form>

      {transactions.isLoading && <div className="h-72 animate-pulse rounded-xl bg-surface-container" role="status" aria-label="Đang tải giao dịch" />}
      {transactions.isError && <div role="alert" className="rounded-xl border border-error/30 bg-error-container/40 p-5"><p>Không thể tải danh sách giao dịch.</p><Button className="mt-3" variant="outline" onClick={() => void transactions.refetch()}>Thử lại</Button></div>}
      {transactions.data && <section className="overflow-hidden rounded-xl border border-outline-variant/60 bg-white shadow-subtle" aria-busy={transactions.isFetching}>
        {transactions.data.items.length === 0 ? <p className="p-10 text-center text-sm text-on-surface-variant">Không có giao dịch phù hợp.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant"><tr><th className="px-4 py-3">Người dùng</th><th className="px-4 py-3">Gói</th><th className="px-4 py-3">Số tiền</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Nhà cung cấp</th><th className="px-4 py-3">Mã giao dịch</th><th className="px-4 py-3">Tạo lúc</th><th className="px-4 py-3">Hoàn tất</th></tr></thead><tbody>{transactions.data.items.map((row) => <tr key={row.id} className="border-b border-outline-variant/50 last:border-0"><td className="px-4 py-3"><p className="font-semibold">{row.userDisplayName || '—'}</p><p className="text-xs text-on-surface-variant">{row.userEmail}</p></td><td className="px-4 py-3 font-semibold uppercase">{row.planCode}</td><td className="px-4 py-3 font-semibold">{formatMoneyMinor(row.amountMinor, row.currency)}</td><td className="px-4 py-3"><StatusBadge status={row.status} /></td><td className="px-4 py-3">{row.paymentProvider}</td><td className="max-w-52 truncate px-4 py-3 font-mono text-xs" title={row.providerTransactionId}>{row.providerTransactionId}</td><td className="px-4 py-3 text-on-surface-variant">{dateTime.format(new Date(row.createdAt))}</td><td className="px-4 py-3 text-on-surface-variant">{row.fulfilledAt ? dateTime.format(new Date(row.fulfilledAt)) : '—'}</td></tr>)}</tbody></table></div>}
        <div className="flex items-center justify-between border-t border-outline-variant p-4"><p className="text-xs text-on-surface-variant">Tối đa {transactions.data.pageSize} giao dịch mỗi trang</p><div className="flex gap-2"><Button variant="outline" disabled={!canRetreatAdminTransactionCursor({ cursor: filters.cursor, previousCursors }) || transactions.isFetching} onClick={handlePrevious}>Trang trước</Button><Button variant="outline" disabled={!transactions.data.nextCursor || transactions.isFetching} onClick={handleNext}>Trang sau</Button></div></div>
      </section>}
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label><span className="text-xs font-semibold text-on-surface-variant">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm">{children}</select></label>;
}
