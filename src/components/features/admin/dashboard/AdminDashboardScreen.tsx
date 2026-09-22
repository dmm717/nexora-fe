'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, BadgeDollarSign, CreditCard, RefreshCw, UserCheck, Users } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAdminDashboard } from '@/hooks/queries/useAdminDashboard';
import type { AdminDashboardView, AdminGranularity, AdminTransactionView } from '@/services/adminApi';
import { Button } from '@/components/ui/Button/Button';

const chartColors = ['#1b33c7', '#006c49', '#694100', '#ba1a1a', '#757686', '#7c3aed'];
const statusLabels: Record<string, string> = { fulfilled: 'Thành công', pending: 'Chờ xử lý', processing: 'Đang xử lý', failed: 'Thất bại' };
const numberFormatter = new Intl.NumberFormat('vi-VN');

function money(amountMinor: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amountMinor);
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === 'fulfilled' ? 'bg-secondary-fixed text-on-secondary-container' : status === 'failed' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{statusLabels[status] ?? status}</span>;
}

function TransactionTable({ rows }: { rows: AdminTransactionView[] }) {
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-on-surface-variant">Chưa có giao dịch.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-outline-variant text-xs uppercase tracking-wide text-on-surface-variant"><tr><th className="py-3 pr-4">Người dùng</th><th className="px-4 py-3">Gói</th><th className="px-4 py-3">Số tiền</th><th className="px-4 py-3">Trạng thái</th><th className="py-3 pl-4">Thời gian</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} className="border-b border-outline-variant/50 last:border-0"><td className="py-3 pr-4"><p className="font-semibold text-on-surface">{row.userDisplayName || row.userEmail}</p><p className="text-xs text-on-surface-variant">{row.userEmail}</p></td><td className="px-4 py-3 font-medium uppercase">{row.planCode}</td><td className="px-4 py-3 font-semibold">{money(row.amountMinor, row.currency)}</td><td className="px-4 py-3"><StatusBadge status={row.status} /></td><td className="py-3 pl-4 text-on-surface-variant">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(row.createdAt))}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <article className="rounded-xl border border-outline-variant/60 bg-white p-5 shadow-subtle"><h2 className="text-lg font-bold text-on-surface">{title}</h2><p className="mb-4 text-sm text-on-surface-variant">{description}</p><div role="img" aria-label={`${title}. ${description}`}>{children}</div></article>;
}

function EmptyChart({ message }: { message: string }) {
  return <div className="flex h-[300px] items-center justify-center rounded-lg bg-surface-container-low px-6 text-center text-sm text-on-surface-variant">{message}</div>;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawGranularity = searchParams.get('granularity');
  const granularity: AdminGranularity = rawGranularity === 'month' || rawGranularity === 'year' ? rawGranularity : 'day';
  const currency = (searchParams.get('currency') || 'VND').toUpperCase();
  const dashboard = useAdminDashboard({ granularity, currency });

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="text-sm font-semibold text-primary">Tổng quan hệ thống</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-on-surface">Dashboard quản trị</h1><p className="mt-2 text-sm text-on-surface-variant">Theo dõi người dùng và doanh thu theo dữ liệu vận hành thực tế.</p></div>
        <div className="flex flex-wrap gap-2">
          <label className="text-xs font-semibold text-on-surface-variant">Khoảng thời gian<select value={granularity} onChange={(event) => updateFilter('granularity', event.target.value)} className="ml-2 min-h-10 rounded-lg border border-outline-variant bg-white px-3 text-sm text-on-surface"><option value="day">30 ngày</option><option value="month">12 tháng</option><option value="year">5 năm</option></select></label>
          <label className="text-xs font-semibold text-on-surface-variant">Tiền tệ<select value={currency} onChange={(event) => updateFilter('currency', event.target.value)} className="ml-2 min-h-10 rounded-lg border border-outline-variant bg-white px-3 text-sm text-on-surface"><option value="VND">VND</option><option value="USD">USD</option></select></label>
          <Button variant="outline" size="sm" onClick={() => void dashboard.refetch()} loading={dashboard.isFetching}><RefreshCw size={16} /> Làm mới</Button>
        </div>
      </header>

      {dashboard.isLoading && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Đang tải số liệu dashboard">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-surface-container" />)}</div>}
      {dashboard.isError && <div role="alert" className="rounded-xl border border-error/30 bg-error-container/40 p-5"><p className="font-semibold text-on-error-container">Không thể tải dashboard.</p><Button className="mt-3" variant="outline" onClick={() => void dashboard.refetch()}>Thử lại</Button></div>}
      {dashboard.data && <DashboardData data={dashboard.data} currency={currency} />}
    </div>
  );
}

function DashboardData({ data, currency }: { data: AdminDashboardView; currency: string }) {
  const totalRevenue = data.summary.totalRevenueByCurrency.find((item) => item.currency === currency)?.amountMinor ?? 0;
  const periodRevenue = data.summary.periodRevenueByCurrency.find((item) => item.currency === currency)?.amountMinor ?? 0;
  const kpis = [
    { label: 'Tổng người dùng', value: numberFormatter.format(data.summary.totalUsers), note: `+${numberFormatter.format(data.summary.newUsersInPeriod)} trong kỳ`, icon: Users },
    { label: 'Người dùng hoạt động', value: numberFormatter.format(data.summary.activeUsers), note: `${numberFormatter.format(data.summary.inactiveUsers)} không hoạt động`, icon: UserCheck },
    { label: `Doanh thu lũy kế (${currency})`, value: money(totalRevenue, currency), note: 'Chỉ giao dịch thành công', icon: BadgeDollarSign },
    { label: `Doanh thu trong kỳ (${currency})`, value: money(periodRevenue, currency), note: `${data.range.from} – ${data.range.to}`, icon: Activity },
    { label: 'Giao dịch thành công', value: numberFormatter.format(data.summary.fulfilledTransactionsAllTime), note: `${numberFormatter.format(data.summary.fulfilledTransactionsInPeriod)} trong kỳ`, icon: CreditCard },
    { label: 'Người dùng trả phí', value: numberFormatter.format(data.summary.activePaidUsers), note: 'Entitlement trả phí hiện hành', icon: UserCheck },
  ];
  const revenue = data.revenueSeries;
  const growth = data.userGrowthSeries.map((item) => ({ ...item, label: new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(item.bucketStart)) }));
  const statuses = data.transactionStatusDistribution.map((item) => ({ ...item, name: statusLabels[item.status] ?? item.status }));
  return <>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Chỉ số chính">{kpis.map(({ label, value, note, icon: Icon }) => <article key={label} className="rounded-xl border border-outline-variant/60 bg-white p-5 shadow-subtle"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-on-surface-variant">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-on-surface">{value}</p><p className="mt-1 text-xs text-on-surface-variant">{note}</p></div><span className="rounded-lg bg-primary-fixed p-2.5 text-on-primary-fixed"><Icon size={20} /></span></div></article>)}</section>
    <section className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Doanh thu" description={`Đơn vị ${currency}; chỉ tính order fulfilled.`}>{revenue.some((item) => item.amountMinor > 0) ? <ResponsiveContainer width="100%" height={300}><AreaChart data={revenue} accessibilityLayer><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" minTickGap={28} /><YAxis tickFormatter={(value) => numberFormatter.format(Number(value))} width={72} /><Tooltip formatter={(value) => money(Number(value), currency)} /><Area type="monotone" dataKey="amountMinor" name="Doanh thu" stroke="#1b33c7" fill="#dfe0ff" /></AreaChart></ResponsiveContainer> : <EmptyChart message="Chưa có doanh thu thành công trong khoảng thời gian này." />}</ChartCard>
      <ChartCard title="Tăng trưởng người dùng" description="Người dùng mới và tổng lũy kế."><ResponsiveContainer width="100%" height={300}><ComposedChart data={growth} accessibilityLayer><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" minTickGap={28} /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="newUsers" name="Người dùng mới" fill="#bcc3ff" /><Line type="monotone" dataKey="cumulativeUsers" name="Tổng lũy kế" stroke="#006c49" strokeWidth={2} /></ComposedChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Phân bổ gói hiện hành" description="Mỗi người dùng thuộc tối đa một nhóm; none là chưa có gói.">{data.planDistribution.some((item) => item.userCount > 0) ? <ResponsiveContainer width="100%" height={300}><PieChart accessibilityLayer><Pie data={data.planDistribution} dataKey="userCount" nameKey="planCode" innerRadius={64} outerRadius={100} paddingAngle={2}>{data.planDistribution.map((entry, index) => <Cell key={entry.planCode} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer> : <EmptyChart message="Chưa có dữ liệu gói hiện hành." />}</ChartCard>
      <ChartCard title="Trạng thái giao dịch" description="Các order được tạo trong kỳ đã chọn."><ResponsiveContainer width="100%" height={300}><PieChart accessibilityLayer><Pie data={statuses} dataKey="count" nameKey="name" innerRadius={64} outerRadius={100}>{statuses.map((entry, index) => <Cell key={entry.status} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></ChartCard>
      <div className="xl:col-span-2"><ChartCard title="Doanh thu theo gói" description={`Tổng fulfilled trong kỳ, đơn vị ${currency}.`}><ResponsiveContainer width="100%" height={Math.max(240, data.revenueByPlan.length * 52)}><BarChart data={data.revenueByPlan} layout="vertical" accessibilityLayer margin={{ left: 10, right: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(value) => numberFormatter.format(Number(value))} /><YAxis type="category" dataKey="planCode" width={90} /><Tooltip formatter={(value) => money(Number(value), currency)} /><Bar dataKey="amountMinor" name="Doanh thu" fill="#006c49" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></ChartCard></div>
    </section>
    <section className="rounded-xl border border-outline-variant/60 bg-white p-5 shadow-subtle"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-bold text-on-surface">Giao dịch gần đây</h2><p className="text-sm text-on-surface-variant">Tối đa 8 giao dịch mới nhất toàn hệ thống.</p></div><Link href="/admin/transactions" className="text-sm font-bold text-primary hover:underline">Xem tất cả</Link></div><TransactionTable rows={data.recentTransactions} /></section>
  </>;
}
