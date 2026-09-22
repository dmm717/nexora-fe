'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AdminPageShell } from '@/components/features/admin/AdminPageShell';
import { AdminTableShell } from '@/components/features/admin/AdminTableShell';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useAdminFeedback,
  useAdminFeedbackSummary,
  useApproveFeedback,
  useRejectFeedback,
  useFeatureFeedback,
  useUnfeatureFeedback,
} from '@/hooks/queries/useFeedback';
import { getFeedbackStatusLabel } from '@/services/feedbackContract';

export default function AdminFeedbackPage() {
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const currentCursor = cursorStack.at(-1);
  const pageSize = 10;

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [consentFilter, setConsentFilter] = useState<boolean | ''>('');
  const [featuredFilter, setFeaturedFilter] = useState<boolean | ''>('');

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useAdminFeedbackSummary();

  const {
    data: feedbackData,
    isLoading: feedbackLoading,
    isFetching,
    refetch: refetchFeedback,
  } = useAdminFeedback({
    cursor: currentCursor,
    pageSize,
    status: statusFilter ? statusFilter.toLowerCase() : undefined,
    rating: ratingFilter !== '' ? Number(ratingFilter) : undefined,
    consent: consentFilter !== '' ? Boolean(consentFilter) : undefined,
    featured: featuredFilter !== '' ? Boolean(featuredFilter) : undefined,
  });

  const approveMutation = useApproveFeedback();
  const rejectMutation = useRejectFeedback();
  const featureMutation = useFeatureFeedback();
  const unfeatureMutation = useUnfeatureFeedback();

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success('Đã duyệt phản hồi thành công.');
    } catch {
      toast.error('Không thể duyệt phản hồi.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMutation.mutateAsync(id);
      toast.success('Đã từ chối phản hồi.');
    } catch {
      toast.error('Không thể từ chối phản hồi.');
    }
  };

  const handleFeature = async (id: string) => {
    try {
      await featureMutation.mutateAsync(id);
      toast.success('Đã ghim nổi bật phản hồi.');
    } catch {
      toast.error('Không thể ghim nổi bật phản hồi.');
    }
  };

  const handleUnfeature = async (id: string) => {
    try {
      await unfeatureMutation.mutateAsync(id);
      toast.success('Đã gỡ ghim nổi bật phản hồi.');
    } catch {
      toast.error('Không thể gỡ ghim nổi bật.');
    }
  };

  const reloadAll = () => {
    void refetchSummary();
    void refetchFeedback();
  };

  const resetFilters = () => {
    setStatusFilter('');
    setRatingFilter('');
    setConsentFilter('');
    setFeaturedFilter('');
    setCursorStack([]);
  };

  // Prepare chart data from summary
  const distributionData = [1, 2, 3, 4, 5].map((stars) => ({
    name: `${stars} sao`,
    count: summary?.ratingDistribution?.[stars] ?? 0,
    stars,
  }));

  const chartBarColors: Record<number, string> = {
    5: '#10b981',
    4: '#3b82f6',
    3: '#f59e0b',
    2: '#f97316',
    1: '#ef4444',
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'approved':
        return <Badge variant="success" size="sm">{getFeedbackStatusLabel(s)}</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">{getFeedbackStatusLabel(s)}</Badge>;
      case 'rejected':
        return <Badge variant="neutral" size="sm">{getFeedbackStatusLabel(s)}</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const items = feedbackData?.items ?? [];
  const hasNextPage = Boolean(feedbackData?.nextCursor);
  const pageNumber = cursorStack.length + 1;

  return (
    <AdminPageShell
      active="feedback"
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={reloadAll}
          disabled={isFetching}
          loading={isFetching}
        >
          Làm mới
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="rounded-xl border border-outline-variant/60 bg-white p-4 shadow-subtle">
            <p className="text-xs font-semibold text-on-surface-variant">Tổng phản hồi</p>
            <p className="mt-1 text-2xl font-bold text-on-surface">
              {summaryLoading ? '...' : (summary?.total ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/60 bg-white p-4 shadow-subtle">
            <p className="text-xs font-semibold text-on-surface-variant">Điểm trung bình</p>
            <p className="mt-1 text-2xl font-bold text-amber-600 flex items-center gap-1">
              <span>{summaryLoading ? '...' : (summary?.averageRating?.toFixed(1) ?? '—')}</span>
              <span className="material-symbols-outlined text-[20px] text-amber-500 fill-current">star</span>
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/60 bg-white p-4 shadow-subtle">
            <p className="text-xs font-semibold text-amber-700">Chờ duyệt</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {summaryLoading ? '...' : (summary?.pending ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/60 bg-white p-4 shadow-subtle">
            <p className="text-xs font-semibold text-emerald-700">Đã duyệt</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {summaryLoading ? '...' : (summary?.approved ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/60 bg-white p-4 shadow-subtle">
            <p className="text-xs font-semibold text-slate-500">Từ chối</p>
            <p className="mt-1 text-2xl font-bold text-slate-600">
              {summaryLoading ? '...' : (summary?.rejected ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/60 bg-white p-4 shadow-subtle">
            <p className="text-xs font-semibold text-indigo-700">Nổi bật</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">
              {summaryLoading ? '...' : (summary?.featured ?? 0)}
            </p>
          </div>
        </div>

        {/* Rating Distribution Chart */}
        <div className="rounded-xl border border-outline-variant/60 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-on-surface">Phân bố xếp hạng đánh giá</h2>
              <p className="text-xs text-on-surface-variant">Thống kê số lượng đánh giá theo mức sao từ 1 đến 5</p>
            </div>
            <span className="text-xs font-medium text-on-surface-variant">
              Tổng lượt đánh giá: {summary?.total ?? 0}
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: number | string | readonly (number | string)[] | undefined) => [`${val ?? 0} lượt`, 'Số lượng']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distributionData.map((entry) => (
                    <Cell key={entry.stars} fill={chartBarColors[entry.stars] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-outline-variant/60 bg-white shadow-subtle">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCursorStack([]);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Xếp hạng
            </label>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value ? Number(e.target.value) : '');
                setCursorStack([]);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Tất cả số sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Quyền công khai
            </label>
            <select
              value={consentFilter === '' ? '' : consentFilter ? 'true' : 'false'}
              onChange={(e) => {
                setConsentFilter(e.target.value === '' ? '' : e.target.value === 'true');
                setCursorStack([]);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Tất cả</option>
              <option value="true">Được hiển thị công khai</option>
              <option value="false">Chỉ nội bộ</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nổi bật
            </label>
            <select
              value={featuredFilter === '' ? '' : featuredFilter ? 'true' : 'false'}
              onChange={(e) => {
                setFeaturedFilter(e.target.value === '' ? '' : e.target.value === 'true');
                setCursorStack([]);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Tất cả</option>
              <option value="true">Đang nổi bật</option>
              <option value="false">Bình thường</option>
            </select>
          </div>

          {(statusFilter !== '' || ratingFilter !== '' || consentFilter !== '' || featuredFilter !== '') && (
            <div className="self-end pb-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-slate-600"
              >
                Đặt lại bộ lọc
              </Button>
            </div>
          )}
        </div>

        {/* Feedback Data Table */}
        <AdminTableShell minWidthClass="min-w-[900px]">
          <thead>
            <tr className="border-b border-outline-variant text-xs uppercase tracking-wide text-on-surface-variant">
              <th className="py-3 px-4">Người dùng</th>
              <th className="py-3 px-3">Đánh giá</th>
              <th className="py-3 px-4">Nội dung góp ý</th>
              <th className="py-3 px-3 text-center">Công khai</th>
              <th className="py-3 px-3 text-center">Nổi bật</th>
              <th className="py-3 px-3">Trạng thái</th>
              <th className="py-3 px-3">Thời gian</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {feedbackLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-slate-500">
                  <div className="functional-spinner w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  Đang tải danh sách phản hồi...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-slate-500">
                  Không có phản hồi nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              items.map((fb) => {
                const s = fb.moderationStatus.toLowerCase();
                const isApproved = s === 'approved';
                const isRejected = s === 'rejected';

                return (
                  <tr key={fb.id} className="border-b border-outline-variant/40 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs">
                        {fb.displayName || 'Người dùng'}
                      </p>
                      <p className="text-[11px] text-slate-500">{fb.email}</p>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`material-symbols-outlined text-[15px] ${
                              star <= fb.rating ? 'fill-current' : 'text-slate-300'
                            }`}
                            style={{ fontVariationSettings: star <= fb.rating ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      {fb.comment ? (
                        <p className="text-xs text-slate-800 line-clamp-3 leading-relaxed">
                          {fb.comment}
                        </p>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Không có nhận xét</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {fb.allowPublicDisplay ? (
                        <span className="inline-flex items-center text-emerald-600 text-xs gap-1 font-medium">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          <span>Có</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-slate-400 text-xs gap-1">
                          <span className="material-symbols-outlined text-[16px]">lock</span>
                          <span>Không</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {fb.isFeatured ? (
                        <span className="inline-flex items-center text-amber-600 text-xs gap-0.5 font-bold">
                          <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                          <span>Ghim</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {getStatusBadge(fb.moderationStatus)}
                    </td>

                    <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Intl.DateTimeFormat('vi-VN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                        timeZone: 'Asia/Ho_Chi_Minh',
                      }).format(new Date(fb.createdAt))}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() => handleApprove(fb.id)}
                            disabled={approveMutation.isPending}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                          >
                            Duyệt
                          </button>
                        )}

                        {!isRejected && (
                          <button
                            type="button"
                            onClick={() => handleReject(fb.id)}
                            disabled={rejectMutation.isPending}
                            className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                          >
                            Từ chối
                          </button>
                        )}

                        {isApproved && (
                          fb.isFeatured ? (
                            <button
                              type="button"
                              onClick={() => handleUnfeature(fb.id)}
                              disabled={unfeatureMutation.isPending}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                            >
                              Bỏ nổi bật
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleFeature(fb.id)}
                              disabled={featureMutation.isPending}
                              className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors"
                            >
                              Nổi bật
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </AdminTableShell>

        {/* Pagination bar */}
        <div className="flex items-center justify-between px-2 text-xs text-slate-600">
          <div>
            Hiển thị <strong>{items.length}</strong> phản hồi (Trang {pageNumber})
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={cursorStack.length === 0 || isFetching}
              onClick={() => setCursorStack((s) => s.slice(0, -1))}
            >
              Trang trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasNextPage || isFetching}
              onClick={() => {
                if (feedbackData?.nextCursor) {
                  setCursorStack((s) => [...s, feedbackData.nextCursor!]);
                }
              }}
            >
              Trang sau
            </Button>
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
}
