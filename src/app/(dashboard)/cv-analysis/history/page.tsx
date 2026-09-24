'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { cvAnalysisApi } from '@/services/cvAnalysisApi';
import { ClientDate } from '@/components/ui/ClientDate';

export default function CvAnalysisHistoryPage() {
  const { authReady, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('all');
  const [status, setStatus] = useState('all');
  const history = useInfiniteQuery({
    queryKey: ['resumeAnalyses'],
    queryFn: ({ pageParam = 1 }) => cvAnalysisApi.getResumeAnalyses(pageParam as number, 20),
    getNextPageParam: (last, pages) => last.hasNextPage ? pages.length + 1 : undefined,
    initialPageParam: 1,
    enabled: authReady && isAuthenticated,
    staleTime: 30_000,
  });
  const loaded = history.data?.pages.flatMap((page) => page.items) ?? [];
  const items = loaded.filter((item) => (mode === 'all' || item.mode === mode) && (status === 'all' || item.status === status));
  return <main className="mx-auto max-w-6xl space-y-6 px-5 py-10 sm:px-8">
    <header className="archive-hero rounded-3xl border border-[#dbe3fa] bg-white p-7 shadow-subtle sm:p-9">
      <span className="text-xs font-bold uppercase tracking-widest text-primary">Lịch sử tài khoản</span>
      <h1 className="mt-2 text-3xl font-extrabold text-[#172554]">Lịch sử phân tích CV</h1>
      <p className="mt-2 text-sm text-[#52617e]">Các phân tích đã tạo và bối cảnh đối chiếu được lưu theo từng lần thực hiện.</p>
    </header>
    <section className="archive-surface rounded-3xl border border-[#dbe3fa] bg-white p-5 shadow-subtle sm:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <label className="text-xs font-bold text-[#334166]">Chế độ<select value={mode} onChange={(event) => setMode(event.target.value)} className="mt-1 block min-h-10 rounded-lg border border-[#cbd6ef] bg-white px-3 text-sm"><option value="all">Tất cả</option><option value="job_targeted">Theo JD</option><option value="field_benchmark">Chuẩn thị trường</option></select></label>
          <label className="text-xs font-bold text-[#334166]">Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 block min-h-10 rounded-lg border border-[#cbd6ef] bg-white px-3 text-sm"><option value="all">Tất cả</option><option value="completed">Hoàn thành</option><option value="processing">Đang xử lý</option><option value="failed">Thất bại</option></select></label>
        </div>
        <Link href="/resume-analyses" className="text-sm font-bold text-primary hover:underline">Phân tích CV mới →</Link>
      </div>
      {(mode !== 'all' || status !== 'all') && <p className="mb-4 text-xs text-[#52617e]">Bộ lọc áp dụng trên các mục đã tải. Tải thêm để xem kết quả cũ hơn.</p>}
      {history.isLoading && <p role="status" className="py-10 text-sm">Đang tải lịch sử...</p>}
      {history.isError && !history.data && <div role="alert" className="py-8 text-sm text-error">Không thể tải lịch sử. <button type="button" className="underline" onClick={() => void history.refetch()}>Thử lại</button></div>}
      {!history.isLoading && !history.isError && loaded.length === 0 && <p className="rounded-xl bg-[#f3f6ff] p-8 text-sm text-[#52617e]">Bạn chưa có phân tích CV nào.</p>}
      {loaded.length > 0 && items.length === 0 && <p className="rounded-xl bg-[#f3f6ff] p-8 text-sm text-[#52617e]">Không có mục phù hợp trong các trang đã tải.</p>}
      <div className="divide-y divide-[#e9edf7]">{items.map((item) => <Link key={item.id} href={`/resume-analyses/${item.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:text-primary">
        <span><strong className="block text-sm">{item.context?.targetRole || (item.mode === 'job_targeted' ? 'Phân tích theo JD' : 'Đánh giá theo thị trường')}</strong><span className="text-xs text-[#52617e]">{item.context?.seniority || 'Chưa chọn cấp độ'} · <ClientDate date={item.createdAt} /></span></span>
        <span className="text-xs font-semibold">{item.status} →</span>
      </Link>)}</div>
      {history.hasNextPage && <button type="button" className="mt-6 min-h-10 rounded-lg border border-primary px-4 text-sm font-bold text-primary hover:bg-primary-fixed" disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>{history.isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}</button>}
    </section>
  </main>;
}
