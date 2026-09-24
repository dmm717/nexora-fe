'use client';

import Link from 'next/link';
import { ArrowRight, Mic, RotateCcw } from 'lucide-react';
import { useInterviewsHistory } from '@/hooks/queries/useInterviews';
import { ClientDate } from '@/components/ui/ClientDate';

export default function InterviewsHubPage() {
  const { data, isLoading, isError, refetch } = useInterviewsHistory(5);
  const recent = data?.pages[0]?.items.slice(0, 5) ?? [];
  const active = recent.find((item) => item.status === 'active' || item.status === 'starting');
  return (
    <div className="mx-auto max-w-6xl space-y-7 px-5 py-10 sm:px-8">
      <div className="rounded-3xl border border-[#dbe3fa] bg-white p-7 shadow-subtle sm:p-10">
        <div className="mb-4 inline-flex rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">PHỎNG VẤN AI</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#172554] sm:text-4xl">Luyện tập cho cuộc phỏng vấn tiếp theo</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#52617e]">Chọn vai trò và bối cảnh phù hợp, trả lời theo nhịp của bạn rồi xem phản hồi dựa trên chính câu trả lời.</p>
        <Link href="/interviews/new" className="action-forward mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors">
          Bắt đầu phỏng vấn <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
      {active && <Link href={`/interviews/${active.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-fixed/70 p-5 text-primary hover:bg-primary-fixed">
        <span><strong>Tiếp tục phiên đang diễn ra</strong><br /><span className="text-sm">{active.role || 'Phỏng vấn'} · {active.seniority || 'Chưa chọn cấp độ'}</span></span><ArrowRight size={18} aria-hidden="true" />
      </Link>}
      <section className="rounded-3xl border border-[#dbe3fa] bg-white p-6 shadow-subtle sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-xl font-bold text-[#172554]">Phiên gần đây</h2><p className="mt-1 text-sm text-[#52617e]">Xem nhanh tiến trình và tiếp tục từ nơi bạn dừng lại.</p></div>
          <Link href="/interviews/history" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">Xem toàn bộ lịch sử <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        {isLoading && <p role="status" className="text-sm text-[#52617e]">Đang tải các phiên gần đây...</p>}
        {isError && !data && <div role="alert" className="flex items-center gap-3 text-sm text-error"><span>Chưa thể tải phiên phỏng vấn.</span><button type="button" onClick={() => void refetch()} className="inline-flex items-center gap-1 underline"><RotateCcw size={14} /> Thử lại</button></div>}
        {!isLoading && !isError && recent.length === 0 && <p className="flex items-center gap-3 rounded-2xl bg-[#f3f6ff] p-5 text-sm text-[#52617e]"><Mic size={20} /> Chưa có phiên nào. Bắt đầu một cuộc phỏng vấn để xem tiến trình ở đây.</p>}
        <div className="divide-y divide-[#e9edf7]">{recent.map((item) => <Link key={item.id} href={item.reportAvailable ? `/interviews/${item.id}/report` : `/interviews/${item.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:text-primary">
          <span><strong className="block text-sm">{item.role || 'Phỏng vấn'}</strong><span className="text-xs text-[#52617e]">{item.interviewType} · <ClientDate date={item.updatedAt || item.createdAt} /></span></span>
          <span className="flex items-center gap-2 text-xs font-semibold">{item.answeredQuestionCount}/{item.issuedQuestionCount} câu · {item.status}<ArrowRight size={15} /></span>
        </Link>)}</div>
      </section>
    </div>
  );
}
