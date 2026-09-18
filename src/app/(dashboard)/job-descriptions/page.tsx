'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useJobDescriptions } from '@/hooks/queries/useJobDescriptions';
import { ClientDate } from '@/components/ui/ClientDate';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProductPageHero } from '@/components/product-visual';
import { Skeleton } from '@/components/ui/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { motionTokens } from '@/components/motion/tokens';
import { getQueryPresentation } from '@/utils/queryPresentation';

export default function JobDescriptionsIndexPage() {
  const router = useRouter();
  const { data, isLoading, isError, isFetching, refetch } = useJobDescriptions();
  const jds = data || [];
  const hasData = data !== undefined;
  const queryPresentation = getQueryPresentation({ hasData, isLoading, isError, isFetching });
  const showInitialLoading = queryPresentation.showInitialLoading || (!hasData && !isError);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <ProductPageHero
        feature="cv"
        title="Mô tả Công việc đã lưu"
        description="Quản lý danh sách các bản mô tả công việc (Job Descriptions) dùng để so khớp hồ sơ CV và khởi tạo phiên phỏng vấn mục tiêu."
      />

      <Card variant="elevated" padding="lg" className="space-y-6 bg-white border border-outline-variant/60 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div>
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">work_history</span>
              Danh sách Job Descriptions
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Các bản mô tả công việc được trích xuất yêu cầu năng lực và tiêu chí phỏng vấn.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/interviews/new')}
            icon={<span className="material-symbols-outlined text-[18px]">add</span>}
          >
            Tạo phỏng vấn với JD
          </Button>
        </div>

        {queryPresentation.showBackgroundError && (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-on-surface">
            <span>Không thể cập nhật danh sách JD. Nội dung đã tải vẫn được giữ lại.</span>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching} loading={isFetching}>
              Thử lại
            </Button>
          </div>
        )}

        {queryPresentation.showRefreshing && !queryPresentation.showBackgroundError && (
          <p role="status" aria-live="polite" className="text-xs text-on-surface-variant">
            Đang cập nhật danh sách JD...
          </p>
        )}

        {showInitialLoading ? (
          <div role="status" aria-live="polite" className="space-y-3">
            <span className="sr-only">Đang tải danh sách mô tả công việc...</span>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="p-4 sm:p-5 rounded-2xl border border-outline-variant/60 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3 max-w-72" />
                  <Skeleton className="h-3 w-1/2 max-w-56" />
                </div>
                <Skeleton className="h-4 w-24 self-end sm:self-center" />
              </div>
            ))}
          </div>
        ) : queryPresentation.showBlockingError ? (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-error/30 bg-error/5 p-6 text-sm text-on-surface">
            <p>Không thể tải danh sách JD lúc này. Vui lòng thử lại.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching} loading={isFetching}>
              Thử tải lại
            </Button>
          </div>
        ) : jds.length === 0 ? (
          <div className="text-center py-12 px-4 bg-surface-container-low/40 rounded-2xl border-2 border-dashed border-outline-variant/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mx-auto">
              <span className="material-symbols-outlined text-[28px]">assignment</span>
            </div>
            <div className="text-sm font-bold text-on-surface">Bạn chưa lưu Job Description nào</div>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Khi tạo phiên phỏng vấn hoặc phân tích CV theo vị trí tuyển dụng, nội dung JD sẽ được tự động lưu trữ tại đây.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/interviews/new')}
                icon={<span className="material-symbols-outlined text-[16px]">play_arrow</span>}
              >
                Tạo phiên phỏng vấn ngay
              </Button>
            </div>
          </div>
        ) : (
          <StaggerContainer className="space-y-3" staggerDelay={motionTokens.stagger.fast}>
            {jds.map((jd, index) => {
              const row = (
                <div
                  className="p-4 sm:p-5 rounded-2xl border border-outline-variant/60 bg-white hover:border-primary/40 hover:shadow-subtle transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="font-bold text-base text-on-surface">
                      {jd.title || 'Job Description không tên'}
                    </div>
                    <div className="text-xs text-on-surface-variant flex items-center gap-2">
                      <span>Đã tạo:</span>
                      <ClientDate date={jd.createdAt} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      href={`/job-descriptions/${jd.id}`}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Xem chi tiết</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              );

              return index < 6 ? (
                <StaggerItem key={jd.id}>{row}</StaggerItem>
              ) : (
                <React.Fragment key={jd.id}>{row}</React.Fragment>
              );
            })}
          </StaggerContainer>
        )}
      </Card>
    </div>
  );
}
