'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AnimatedProgressBar } from '@/components/motion/AnimatedProgressBar';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { motionTokens } from '@/components/motion/tokens';
import { ProductPageHero } from '@/components/product-visual';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSkillProfile } from '@/hooks/queries/useSkillProfile';
import { ApiError } from '@/services/apiClient';
import { ClientDate } from '@/components/ui/ClientDate';
import { getQueryPresentation } from '@/utils/queryPresentation';

export default function SkillProfile() {
  const router = useRouter();
  const { data: profile, isLoading, isError, error, refetch, isFetching } = useSkillProfile();
  const hasData = profile !== undefined;
  const queryPresentation = getQueryPresentation({ hasData, isLoading, isError, isFetching });
  const showInitialSkeleton = !queryPresentation.showBlockingError &&
    (queryPresentation.showInitialLoading || !hasData);

  const apiError = error instanceof ApiError ? error : null;
  const errorMessage = apiError?.message || (error instanceof Error ? error.message : null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* Hero */}
      <ProductPageHero
        feature="overview"
        title="Hồ sơ Kỹ năng & Bằng chứng Năng lực"
        description="Đánh giá năng lực thực tế dựa trên phân tích CV, các phiên phỏng vấn AI và bài tập giải quyết tình huống kỹ thuật."
      />

      <div className="flex justify-end gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/learning-path')}
          icon={<span className="material-symbols-outlined text-[18px]">route</span>}
          iconPosition="right"
        >
          Xem lộ trình học
        </Button>
      </div>

      {queryPresentation.showBackgroundError && (
        <div role="alert" className="p-4 bg-error/5 border border-error/20 rounded-xl text-on-surface text-xs flex items-start justify-between gap-3">
          <div>
            <strong className="text-error">Không thể cập nhật hồ sơ kỹ năng.</strong>{' '}
            Dữ liệu đã tải vẫn được giữ lại.
            {errorMessage && <div className="mt-1 text-on-surface-variant">{errorMessage}</div>}
            {(apiError?.code || apiError?.requestId) && (
              <div className="mt-1 text-[11px] text-on-surface-variant">
                {apiError.code && <span>Mã lỗi: {apiError.code}</span>}
                {apiError.code && apiError.requestId && <span> · </span>}
                {apiError.requestId && <span>Mã yêu cầu: {apiError.requestId}</span>}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            loading={isFetching}
          >
            Thử cập nhật lại
          </Button>
        </div>
      )}

      {queryPresentation.showRefreshing && !queryPresentation.showBackgroundError && (
        <p role="status" aria-live="polite" className="text-xs text-on-surface-variant">
          Đang cập nhật hồ sơ kỹ năng...
        </p>
      )}

      {showInitialSkeleton ? (
        <div className="space-y-4" role="status" aria-live="polite">
          <span className="sr-only">Đang tải hồ sơ kỹ năng...</span>
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">psychology</span>
              <span>Năng lực đã kiểm chứng</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Card key={index} variant="elevated" padding="md" className="space-y-3" aria-hidden="true">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36 max-w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex gap-1.5 pt-1">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : queryPresentation.showBlockingError ? (
        <div role="alert" className="rounded-2xl border border-error/30 bg-error/5 p-6 text-sm text-on-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p>Không thể tải hồ sơ kỹ năng lúc này. Vui lòng thử lại.</p>
            {errorMessage && <p className="mt-1 text-xs text-on-surface-variant">{errorMessage}</p>}
            {(apiError?.code || apiError?.requestId) && (
              <p className="mt-1 text-xs text-on-surface-variant">
                {apiError.code && <span>Mã lỗi: {apiError.code}</span>}
                {apiError.code && apiError.requestId && <span> · </span>}
                {apiError.requestId && <span>Mã yêu cầu: {apiError.requestId}</span>}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            loading={isFetching}
          >
            Thử tải lại
          </Button>
        </div>
      ) : hasData && profile ? (
        <>
          {/* Section: Competencies */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">psychology</span>
                <span>Năng lực đã kiểm chứng ({profile.competencies.length})</span>
              </h2>
            </div>

            {profile.competencies.length === 0 ? (
              <Card variant="flat" padding="lg" className="text-center py-10 space-y-4 border-dashed">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant">
                  <span className="material-symbols-outlined text-[24px]">school</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-on-surface">Chưa có đủ dữ liệu để đánh giá năng lực</h3>
                  <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                    Hãy upload CV, tạo câu trả lời STAR hoặc tham gia phỏng vấn thử để hệ thống phân tích và xác thực bằng chứng.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => router.push('/resume-analyses')}>
                    Phân tích CV
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => router.push('/interviews/new')}>
                    Luyện phỏng vấn
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push('/practice/scenarios')}>
                    Luyện tình huống
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push('/practice/star')}>
                    Luyện STAR
                  </Button>
                </div>
              </Card>
            ) : (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4" staggerDelay={motionTokens.stagger.fast}>
                {profile.competencies.map((comp, index) => {
                  const normalizedScore =
                    comp.score != null
                      ? Math.min(100, Math.max(0, Math.round(comp.score)))
                      : null;

                  const card = (
                    <Card variant="elevated" padding="md" className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-sm text-on-surface">{comp.name || comp.code}</h3>
                          <span className="text-[11px] text-on-surface-variant">{comp.category || 'Chung'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-base text-primary">
                            {normalizedScore != null ? `${normalizedScore}/100` : 'Chưa chấm'}
                          </span>
                        </div>
                      </div>

                      {normalizedScore !== null && (
                        <AnimatedProgressBar
                          label=""
                          value={normalizedScore}
                          heightClass="h-2"
                          colorClass="bg-primary"
                        />
                      )}

                      {comp.sources && comp.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {comp.sources.map((src, idx) => (
                            <Badge key={`${src.sourceType}-${idx}`} variant="neutral" size="sm">
                              {src.sourceType} ({src.evidenceCount})
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/30">
                        <span>Dựa trên {comp.evidenceCount} bằng chứng</span>
                        {comp.latestEvidenceAt && (
                          <span>
                            Gần nhất: <ClientDate date={comp.latestEvidenceAt} />
                          </span>
                        )}
                      </div>
                    </Card>
                  );

                  return index < 6 ? (
                    <StaggerItem key={comp.code}>{card}</StaggerItem>
                  ) : (
                    <React.Fragment key={comp.code}>{card}</React.Fragment>
                  );
                })}
              </StaggerContainer>
            )}
          </div>

          {/* Section: Weakness Signals */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-700 text-[22px]">warning</span>
              <span>Điểm cần cải thiện</span>
            </h2>

            {profile.weaknessSignals.length === 0 ? (
              <Card variant="subtle" padding="md" className="text-center py-6 text-xs text-on-surface-variant">
                {profile.competencies.some((c) => c.evidenceCount > 0)
                  ? 'Đã ghi nhận bằng chứng năng lực, hiện chưa có điểm yếu nào cần cảnh báo ưu tiên.'
                  : 'Chưa đủ dữ liệu để xác định điểm cần cải thiện.'}
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.weaknessSignals.map((signal, index) => (
                  <Card
                    key={`${signal.sourceType}-${index}`}
                    variant="elevated"
                    padding="md"
                    className="border-amber-200/80 bg-amber-50/40 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-xs text-on-surface">{signal.label}</div>
                      <div className="text-[11px] text-on-surface-variant">
                        Nguồn: <span className="font-medium text-on-surface">{signal.sourceType}</span>
                        {signal.latestEvidenceAt && (
                          <span>
                            {' '}· <ClientDate date={signal.latestEvidenceAt} />
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
