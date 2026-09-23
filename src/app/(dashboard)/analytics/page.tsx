'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RadialScore } from '@/components/ui/RadialScore';
import { AnimatedProgressBar } from '@/components/motion/AnimatedProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/motion';
import { useProgressDashboard } from '@/hooks/queries/useProgressDashboard';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { useSkillProfile } from '@/hooks/queries/useSkillProfile';
import {
  getLocalizedRecommendationReason,
  getRecommendationDeepLink,
} from '@/services/recommendationContract';
import { ApiError } from '@/services/apiClient';
import { ClientDate } from '@/components/ui/ClientDate';
import {
  getProgressDashboardPresentation,
  getQueryPresentation,
  isProgressDashboardFeatureLocked,
} from '@/utils/queryPresentation';
import { motionTokens } from '@/components/motion/tokens';

export default function AnalyticsPage() {
  const router = useRouter();
  const {
    data: queriedProgress,
    isLoading: loadingProgress,
    isError: isProgressError,
    error: progressError,
    refetch: refetchProgress,
    isFetching: refreshingProgress,
  } = useProgressDashboard();
  const {
    data: careerProfile,
    isLoading: loadingProfile,
    isError: isProfileError,
    refetch: refetchProfile,
    isFetching: refreshingProfile,
  } = useCareerProfile();
  const {
    data: skillProfile,
    isLoading: loadingSkills,
    isError: isSkillError,
    error: skillError,
    refetch: refetchSkillProfile,
    isFetching: refreshingSkills,
  } = useSkillProfile();

  const progressLocked =
    progressError instanceof ApiError && isProgressDashboardFeatureLocked(progressError);
  const progressPresentation = getProgressDashboardPresentation({
    hasData: queriedProgress !== undefined,
    isLoading: loadingProgress,
    isError: isProgressError,
    isFetching: refreshingProgress,
    featureLocked: progressLocked,
  });
  const progress = progressPresentation.hasData ? queriedProgress : undefined;
  const profilePresentation = getQueryPresentation({
    hasData: careerProfile !== undefined,
    isLoading: loadingProfile,
    isError: isProfileError,
    isFetching: refreshingProfile,
  });
  const skillPresentation = getQueryPresentation({
    hasData: skillProfile !== undefined,
    isLoading: loadingSkills,
    isError: isSkillError,
    isFetching: refreshingSkills,
  });

  if (progressPresentation.showInitialLoading && profilePresentation.showInitialLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 space-y-8 text-on-surface-variant" role="status" aria-label="Loading analytics">
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-56 rounded-full" />
            <Skeleton className="h-9 w-3/4 max-w-2xl" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-40 md:col-span-2 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Skeleton className="h-72 lg:col-span-7 rounded-2xl" />
            <Skeleton className="h-72 lg:col-span-5 rounded-2xl" />
          </div>
          <span>Đang tải dữ liệu tiến độ...</span>
        </div>
      </div>
    );
  }

  const activeGoal = careerProfile?.activeCareerGoal;
  const careerProfileKnown = careerProfile !== undefined;
  const goalSummary = !careerProfileKnown
    ? loadingProfile
      ? 'Đang tải mục tiêu...'
      : 'Chưa thể tải mục tiêu'
    : activeGoal
      ? `${activeGoal.targetRole} · ${activeGoal.seniority}${activeGoal.industry ? ` (${activeGoal.industry})` : ' (Chưa xác định lĩnh vực)'}`
      : 'Chưa thiết lập';
  const progressUnavailable = progressPresentation.showBlockingError;
  const hasProgressData = progress !== undefined;
  const hasCompetencyData =
    skillProfile?.competencies !== undefined ||
    careerProfile?.skillProfileSummary?.topCompetencies !== undefined;
  const readiness = hasProgressData ? progress.readiness : null;
  const hasScore = readiness?.score !== null && readiness?.score !== undefined;
  const evidenceCount = hasProgressData ? readiness?.evidenceCount ?? 0 : null;
  const weeklyActivities = hasProgressData ? progress.weeklyCompletedActivities : null;
  const recommendationDestination = getRecommendationDeepLink(
    hasProgressData ? progress.nextRecommendedPractice : null
  );

  // Weakest competencies from progress dashboard or skill profile summary
  const weakestCompetencies = hasProgressData ? progress.weakestCompetencies : [];
  const recentImprovements = hasProgressData ? progress.recentImprovements : [];

  // Competencies list from skill profile or careerProfile summary
  const competencies = skillProfile?.competencies ?? careerProfile?.skillProfileSummary?.topCompetencies ?? [];
  const assessedCompetencyCount =
    readiness?.assessedCompetencies !== undefined
      ? readiness.assessedCompetencies
      : hasCompetencyData
        ? competencies.filter((item) => item.evidenceCount > 0).length
        : null;
  const competencyInitialLoading =
    !hasCompetencyData && (skillPresentation.showInitialLoading || profilePresentation.showInitialLoading);

  const renderCompetencyCard = (comp: (typeof competencies)[number], idx: number) => {
    const score = comp.score != null ? Math.round(comp.score) : null;
    const evidenceNum = 'evidenceCount' in comp ? comp.evidenceCount : 0;
    const card = (
      <Card variant="elevated" padding="md" className="space-y-2 border border-outline-variant/80">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-on-surface">{comp.name || comp.code}</div>
            <div className="text-[11px] text-on-surface-variant">
              {comp.category || 'Chuyên môn'} {evidenceNum ? `· ${evidenceNum} dẫn chứng` : ''}
            </div>
          </div>
          <div className="text-xs font-bold text-primary">
            {score === null ? 'Chưa chấm' : `${score}%`}
          </div>
        </div>
        {score !== null && (
          <AnimatedProgressBar
            label=""
            value={score}
            heightClass="h-2"
            colorClass="bg-primary"
            delay={Math.min(idx, 7) * motionTokens.stagger.fast}
          />
        )}
      </Card>
    );

    return idx < 8
      ? <StaggerItem key={comp.code || idx}>{card}</StaggerItem>
      : <div key={comp.code || idx}>{card}</div>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Báo cáo hồ sơ năng lực thực chiến</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Chỉ số sẵn sàng & Năng lực cạnh tranh
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Mục tiêu hiện tại: {goalSummary}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/learning-path')}
            icon={<span className="material-symbols-outlined text-[18px]">route</span>}
          >
            Xem lộ trình chi tiết
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/practice')}
            icon={<span className="material-symbols-outlined text-[18px]">play_arrow</span>}
          >
            Luyện tập ngay
          </Button>
        </div>
      </div>

      {(profilePresentation.showBlockingError || profilePresentation.showBackgroundError) && (
        <div role="alert" className="p-4 rounded-xl bg-amber-50/80 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <span>
            {profilePresentation.showBackgroundError
              ? 'Không thể cập nhật hồ sơ mục tiêu. Dữ liệu đã tải trước đó vẫn được giữ.'
              : 'Không thể tải hồ sơ mục tiêu nên Nexora chưa thể xác nhận trạng thái mục tiêu.'}
          </span>
          <Button variant="outline" size="sm" onClick={() => void refetchProfile()} disabled={refreshingProfile}>
            {refreshingProfile ? 'Đang thử lại...' : 'Thử tải hồ sơ'}
          </Button>
        </div>
      )}

      {(skillPresentation.showBlockingError || skillPresentation.showBackgroundError) && (
        <div role="alert" className="p-3 rounded-xl bg-amber-50/80 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <span>
            {skillError instanceof Error ? skillError.message : 'Hồ sơ kỹ năng bổ sung chưa tải được; các nội dung khác vẫn khả dụng.'}
          </span>
          <Button variant="outline" size="sm" onClick={() => void refetchSkillProfile()} disabled={refreshingSkills}>
            {refreshingSkills ? 'Đang thử lại...' : 'Thử tải kỹ năng'}
          </Button>
        </div>
      )}

      {progressPresentation.showRefreshing && !progressUnavailable && !progressLocked && (
        <p role="status" className="text-xs text-on-surface-variant">Đang cập nhật chỉ số tiến độ...</p>
      )}

      {(progressLocked || progressUnavailable || progressPresentation.showBackgroundError) && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <span>
            {progressLocked
              ? 'Theo dõi tiến độ chưa có trong gói hiện tại. Các chỉ số sẵn sàng và hoạt động tuần không khả dụng.'
              : progressPresentation.showBackgroundError
                ? 'Chưa thể cập nhật tiến độ lúc này. Dữ liệu đã tải trước đó vẫn được giữ.'
                : 'Chưa thể tải dữ liệu tiến độ lúc này. Hãy thử làm mới trang.'}
          </span>
          {(progressUnavailable || progressPresentation.showBackgroundError) && (
            <Button variant="outline" size="sm" onClick={() => refetchProgress()} disabled={refreshingProgress}>
              {refreshingProgress ? 'Đang thử lại...' : 'Thử lại'}
            </Button>
          )}
        </div>
      )}

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Readiness Metric */}
        <Card variant="elevated" padding="lg" className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6">
            {progressPresentation.showInitialLoading ? (
              <Skeleton className="w-28 h-28 rounded-full" />
            ) : hasScore ? (
            <RadialScore score={readiness.score!} size={120} strokeWidth={10} tone="neutral" />
          ) : (
            <div className="w-28 h-28 rounded-full border-4 border-dashed border-outline-variant flex items-center justify-center text-center p-3">
              <span className="text-xs font-bold text-on-surface-variant">
                {hasProgressData ? 'Chưa đủ dữ liệu' : 'Chưa khả dụng'}
              </span>
            </div>
          )}

          <div className="space-y-1.5 text-center sm:text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Mức độ sẵn sàng tuyển dụng
            </div>
            <div className="text-xl font-bold text-on-surface">
              {progressPresentation.showInitialLoading ? (
                <Skeleton className="h-6 w-56" />
              ) : hasScore
                ? `Chỉ số hiện tại: ${readiness.score}/100`
                : hasProgressData
                  ? 'Chưa đủ dữ liệu đánh giá'
                  : progressLocked
                    ? 'Không có trong gói hiện tại'
                    : 'Không thể tải chỉ số'}
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {progressPresentation.showInitialLoading
                ? 'Đang tải chỉ số...'
                : hasScore
                ? `Dựa trên ${evidenceCount} bằng chứng từ quá trình luyện tập của bạn.`
                : hasProgressData
                  ? 'Hoàn thành một hoạt động có bằng chứng để hệ thống tổng hợp chỉ số sẵn sàng.'
                  : 'Dữ liệu tiến độ sẽ xuất hiện tại đây khi tính năng theo dõi tiến độ được kích hoạt.'}
            </p>
          </div>
        </Card>

        {/* Assessed Competencies */}
        <Card variant="elevated" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Năng lực đã kiểm chứng</span>
            <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-on-surface">
              {competencyInitialLoading ? <Skeleton className="h-7 w-12" /> : assessedCompetencyCount ?? '—'}
            </div>
            <span className="text-[11px] text-on-surface-variant">Năng lực đã có bằng chứng</span>
          </div>
        </Card>

        {/* Completed Activities */}
        <Card variant="elevated" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Hoạt động tuần này</span>
            <span className="material-symbols-outlined text-emerald-700 text-[20px]">task_alt</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-on-surface">
              {progressPresentation.showInitialLoading ? '…' : weeklyActivities?.total ?? '—'}
            </div>
            <span className="text-[11px] text-on-surface-variant font-medium">
              {progressPresentation.showInitialLoading
                ? 'Đang tải dữ liệu tuần...'
                : weeklyActivities
                ? `Bao gồm ${weeklyActivities.interviews} phiên phỏng vấn`
                : progressLocked
                  ? 'Không có trong gói hiện tại'
                  : 'Chưa thể tải dữ liệu tuần'}
            </span>
          </div>
        </Card>
      </div>

      {/* Next Recommended Practice Banner */}
      {hasProgressData && progress.nextRecommendedPractice && (
        <Card variant="elevated" padding="lg" className="border-primary/30 bg-primary-fixed/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">Đề xuất ưu tiên hàng đầu</Badge>
                {progress.nextRecommendedPractice.estimatedMinutes > 0 && (
                  <span className="text-xs text-on-surface-variant">
                    Ước tính: {progress.nextRecommendedPractice.estimatedMinutes} phút
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-on-surface">
                {getLocalizedRecommendationReason(progress.nextRecommendedPractice)}
              </h3>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => recommendationDestination && router.push(recommendationDestination)}
              disabled={!recommendationDestination}
              icon={<span className="material-symbols-outlined text-[18px]">replay</span>}
              iconPosition="right"
              className="shrink-0 shadow-md"
            >
              Luyện ngay theo đề xuất
            </Button>
          </div>
        </Card>
      )}

      {/* Main Grid: Competency Evidence List & Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Competency Evidence List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Chi tiết các năng lực đã được định lượng
            </h3>
            <span className="text-xs text-on-surface-variant">
              {activeGoal
                ? `Theo mục tiêu ${activeGoal.targetRole}`
                : careerProfileKnown
                  ? 'Chưa thiết lập vị trí mục tiêu'
                  : loadingProfile
                    ? 'Đang tải mục tiêu...'
                    : 'Chưa thể tải mục tiêu'}
            </span>
          </div>

          {!hasCompetencyData ? (
            competencyInitialLoading ? (
              <div className="space-y-3" role="status" aria-label="Loading competencies">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ) : (
              <div role="status" className="p-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant/60">
                Chưa nhận được dữ liệu năng lực để hiển thị. Thông tin này chưa đủ để kết luận rằng bạn chưa có năng lực được đánh giá.
              </div>
            )
          ) : competencies.length > 0 ? (
            <StaggerContainer className="space-y-3">{competencies.map(renderCompetencyCard)}</StaggerContainer>
          ) : (
            <div className="p-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant/60">
              Chưa có năng lực nào được đánh giá. Hãy hoàn thành một hoạt động tạo bằng chứng.
            </div>
          )}
        </div>

        {/* Right 5 cols: Weaknesses & Improvements */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weakness Signals */}
          <Card variant="elevated" padding="lg" className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">monitoring</span>
              <span>Năng lực có điểm thấp nhất hiện tại</span>
            </div>

            <div className="space-y-3">
              {weakestCompetencies.length > 0 ? (
                weakestCompetencies.map((w, idx) => (
                  <div key={idx} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/70 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                      <span>{w.name}</span>
                      <span className="text-primary">{w.score}%</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Đây là một trong các năng lực có điểm thấp nhất hiện tại, không phải kết luận tự động rằng năng lực này là điểm yếu.
                    </p>
                    <button
                      onClick={() => router.push('/practice')}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Xem bài luyện phù hợp</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-on-surface-variant italic">
                  {!hasProgressData
                    ? progressLocked
                    ? 'Danh sách năng lực theo điểm không có trong gói hiện tại.'
                    : 'Chưa thể tải danh sách năng lực lúc này.'
                    : evidenceCount === 0
                      ? 'Chưa đủ dữ liệu để xác định điểm cần cải thiện.'
                      : 'Chưa có đủ dữ liệu để xác định năng lực cần ưu tiên.'}
                </p>
              )}
            </div>
          </Card>

          {/* Recent Improvements */}
          <Card variant="elevated" padding="lg" className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">auto_graph</span>
              <span>Tiến bộ gần đây</span>
            </div>

            <div className="space-y-3">
              {recentImprovements.length > 0 ? (
                recentImprovements.map((imp, idx) => {
                  const improvementDestination =
                    imp.kind === 'interview' && imp.resourceId
                      ? `/interviews/${imp.resourceId}`
                      : null;
                  return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => improvementDestination && router.push(improvementDestination)}
                    disabled={!improvementDestination}
                    className="w-full flex items-center justify-between text-left text-xs p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/60 enabled:hover:border-primary/60 enabled:hover:bg-surface-container-low/80 enabled:cursor-pointer disabled:cursor-default transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-on-surface flex items-center gap-1">
                        <span>{imp.kind === 'interview' ? 'Tiến bộ qua phiên phỏng vấn' : 'Tiến bộ được ghi nhận'}</span>
                        {improvementDestination && (
                          <span className="material-symbols-outlined text-[13px] text-primary">open_in_new</span>
                        )}
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        Điểm tăng từ {imp.previousScore}% lên {imp.currentScore}%
                      </div>
                      {imp.at && (
                        <div className="text-xs text-on-surface-variant">
                          <ClientDate date={imp.at} />
                        </div>
                      )}
                    </div>
                    <Badge variant="success" size="sm">+{imp.delta}%</Badge>
                  </button>
                  );
                })
              ) : (
                <p className="text-xs text-on-surface-variant italic">
                  {hasProgressData
                    ? 'Chưa ghi nhận bước tiến bộ trong các kết quả gần đây.'
                    : progressLocked
                      ? 'Tiến bộ gần đây không có trong gói hiện tại.'
                      : 'Chưa thể tải tiến bộ gần đây lúc này.'}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
