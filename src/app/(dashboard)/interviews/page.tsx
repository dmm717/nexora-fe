'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInterviewsHistory } from '@/hooks/queries/useInterviews';
import { ClientDate } from '@/components/ui/ClientDate';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductPageHero } from '@/components/product-visual';
import { Skeleton } from '@/components/ui/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { motionTokens } from '@/components/motion/tokens';
import { getQueryPresentation } from '@/utils/queryPresentation';

function renderStatusBadge(status: string) {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'starting':
      return <Badge variant="info" size="sm">Đang khởi tạo</Badge>;
    case 'active':
      return <Badge variant="primary" size="sm">Đang diễn ra</Badge>;
    case 'completing':
      return <Badge variant="secondary" size="sm">Đang chấm điểm</Badge>;
    case 'completed':
      return <Badge variant="success" size="sm">Đã hoàn thành</Badge>;
    case 'failed':
      return <Badge variant="error" size="sm">Thất bại</Badge>;
    case 'abandoned':
      return <Badge variant="neutral" size="sm">Đã hủy</Badge>;
    default:
      return <Badge variant="neutral" size="sm">{status}</Badge>;
  }
}

export default function InterviewsIndexPage() {
  const router = useRouter();
  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInterviewsHistory(20);
  const interviews = data?.pages.flatMap((page) => page.items) || [];
  const hasData = data !== undefined;
  const queryPresentation = getQueryPresentation({ hasData, isLoading, isError, isFetching });
  const showInitialLoading = queryPresentation.showInitialLoading || (!hasData && !isError);

  const interviewTypeLabel: Record<string, string> = {
    technical: 'Kỹ thuật',
    behavioral: 'Hành vi',
    scenario: 'Tình huống',
    cv_targeted: 'Theo CV',
    jd_targeted: 'Theo JD',
    motivation_role_fit: 'Động lực',
    self_introduction: 'Giới thiệu',
  };

  const practiceReasonLabel: Record<string, string> = {
    repeat_question: 'Ôn lại câu hỏi',
    rubric_weakness: 'Cải thiện điểm yếu',
    recommendation: 'Theo đề xuất',
    manual: 'Luyện tập lại',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <ProductPageHero
        feature="interview"
        title="Lịch sử Phỏng vấn Giả lập"
        description="Theo dõi toàn bộ các phiên phỏng vấn đã thực hiện, trạng thái hoàn tất và báo cáo đánh giá chi tiết theo từng năng lực."
      />

      <Card variant="elevated" padding="lg" className="space-y-6 bg-white border border-outline-variant/60 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div>
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">history</span>
              Danh sách phiên phỏng vấn
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Hệ thống lưu giữ đầy đủ biên bản âm thanh, bản gỡ băng câu trả lời và rubric chấm điểm.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/interviews/new')}
            icon={<span className="material-symbols-outlined text-[18px]">add</span>}
          >
            Bắt đầu phỏng vấn mới
          </Button>
        </div>

        {queryPresentation.showBackgroundError && (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-on-surface">
            <span>Không thể cập nhật lịch sử phỏng vấn. Các phiên đã tải vẫn được giữ lại.</span>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching} loading={isFetching}>
              Thử lại
            </Button>
          </div>
        )}

        {queryPresentation.showRefreshing && !queryPresentation.showBackgroundError && !isFetchingNextPage && (
          <p role="status" aria-live="polite" className="text-xs text-on-surface-variant">
            Đang cập nhật lịch sử...
          </p>
        )}

        {showInitialLoading ? (
          <div role="status" aria-live="polite" className="space-y-3">
            <span className="sr-only">Đang tải lịch sử phỏng vấn...</span>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="p-4 sm:p-5 rounded-2xl border border-outline-variant/60 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3 max-w-72" />
                  <Skeleton className="h-3 w-1/2 max-w-56" />
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : queryPresentation.showBlockingError ? (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-error/30 bg-error/5 p-6 text-sm text-on-surface">
            <p>Không thể tải lịch sử phỏng vấn lúc này. Vui lòng thử lại.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching} loading={isFetching}>
              Thử tải lại
            </Button>
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-12 px-4 bg-surface-container-low/40 rounded-2xl border-2 border-dashed border-outline-variant/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mx-auto">
              <span className="material-symbols-outlined text-[28px]">mic</span>
            </div>
            <div className="text-sm font-bold text-on-surface">Bạn chưa có bài phỏng vấn nào</div>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Bắt đầu phiên phỏng vấn đầu tiên để hệ thống AI đánh giá phản xạ, cấu trúc câu trả lời và ghi nhận bằng chứng năng lực.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/interviews/new')}
                icon={<span className="material-symbols-outlined text-[16px]">play_arrow</span>}
              >
                Bắt đầu ngay
              </Button>
            </div>
          </div>
        ) : (
          <>
            <StaggerContainer className="space-y-3" staggerDelay={motionTokens.stagger.fast}>
              {interviews.map((inv, index) => {
                const targetUrl = inv.reportAvailable
                  ? `/interviews/${inv.id}/report`
                  : `/interviews/${inv.id}`;

                const typeText = interviewTypeLabel[inv.interviewType] || inv.interviewType;

                const row = (
                  <div
                    className="p-4 sm:p-5 rounded-2xl border border-outline-variant/60 bg-white hover:border-primary/40 hover:shadow-subtle transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-on-surface">
                          {inv.role || 'Phỏng vấn'}
                        </span>
                        {inv.seniority && (
                          <span className="text-xs text-on-surface-variant font-medium">
                            · {inv.seniority}
                          </span>
                        )}
                        <Badge variant="info" size="sm">
                          {typeText}
                        </Badge>
                        {inv.practiceReason && (
                          <Badge variant="warning" size="sm">
                            🔁 {practiceReasonLabel[inv.practiceReason] || inv.practiceReason}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                        <ClientDate date={inv.updatedAt || inv.createdAt} />
                        <span className="text-outline-variant">·</span>
                        <span>
                          {inv.answeredQuestionCount}/{inv.issuedQuestionCount} câu hỏi
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                      {renderStatusBadge(inv.status)}
                      <Link
                        href={targetUrl}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>{inv.reportAvailable ? 'Xem báo cáo' : 'Xem chi tiết'}</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                );

                return index < 6 ? (
                  <StaggerItem key={inv.id}>{row}</StaggerItem>
                ) : (
                  <React.Fragment key={inv.id}>{row}</React.Fragment>
                );
              })}
            </StaggerContainer>

            {hasNextPage && (
              <div className="pt-4 text-center border-t border-outline-variant/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  loading={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm lịch sử'}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
