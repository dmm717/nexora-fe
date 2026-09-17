'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RadialScore } from '@/components/ui/RadialScore';
import { AnimatedProgressBar } from '@/components/motion/AnimatedProgressBar';
import {
  MotionPage,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion';
import { useProgressDashboard } from '@/hooks/queries/useProgressDashboard';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { useSkillProfile } from '@/hooks/queries/useSkillProfile';
import { getRecommendationDeepLink } from '@/services/recommendationContract';
import { ApiError } from '@/services/apiClient';
import { ClientDate } from '@/components/ui/ClientDate';

export default function AnalyticsPage() {
  const router = useRouter();
  const {
    data: progress,
    isLoading: loadingProgress,
    error: progressError,
    refetch: refetchProgress,
    isFetching: refreshingProgress,
  } = useProgressDashboard();
  const { data: careerProfile, isLoading: loadingProfile } = useCareerProfile();
  const { data: skillProfile } = useSkillProfile();

  const loading = loadingProgress || loadingProfile;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Đang tải dữ liệu tiến độ...</span>
        </div>
      </div>
    );
  }

  const activeGoal = careerProfile?.activeCareerGoal;
  const progressLocked =
    progressError instanceof ApiError &&
    (progressError.code === 'FEATURE_NOT_AVAILABLE' || progressError.status === 403);
  const progressUnavailable = Boolean(progressError) && !progressLocked;
  const hasProgressData = progress !== undefined && progressError == null;
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
  const competencies = skillProfile?.competencies || careerProfile?.skillProfileSummary?.topCompetencies || [];

  return (
    <MotionPage className="max-w-6xl mx-auto px-4 py-8 sm:py-10 space-y-8">
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
            Mục tiêu hiện tại: {activeGoal ? `${activeGoal.targetRole} · ${activeGoal.seniority}` : 'Chưa thiết lập'}{' '}
            {activeGoal?.industry ? `(${activeGoal.industry})` : activeGoal ? '(Chưa xác định lĩnh vực)' : ''}
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

      {(progressLocked || progressUnavailable) && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <span>
            {progressLocked
              ? 'Gói hiện tại chưa hỗ trợ Progress Dashboard. Các chỉ số sẵn sàng và hoạt động tuần không khả dụng.'
              : 'Không thể tải Progress Dashboard. Dữ liệu lịch sử khác không được dùng thay cho các chỉ số này.'}
          </span>
          {progressUnavailable && (
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
          {hasScore ? (
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
              {hasScore
                ? `Chỉ số hiện tại: ${readiness.score}/100`
                : hasProgressData
                  ? 'Chưa đủ dữ liệu đánh giá'
                  : progressLocked
                    ? 'Không có trong gói hiện tại'
                    : 'Không thể tải chỉ số'}
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {hasScore
                ? `Dựa trên ${evidenceCount} bằng chứng được máy chủ tổng hợp.`
                : hasProgressData
                  ? 'Hoàn thành một hoạt động có bằng chứng để hệ thống tổng hợp chỉ số sẵn sàng.'
                  : 'Không suy luận điểm số hoặc tình trạng bằng chứng khi Progress Dashboard chưa khả dụng.'}
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
              {readiness?.assessedCompetencies ?? competencies.filter((item) => item.evidenceCount > 0).length}
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
              {weeklyActivities?.total ?? '—'}
            </div>
            <span className="text-[11px] text-on-surface-variant font-medium">
              {weeklyActivities
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
                {progress.nextRecommendedPractice.reason}
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
              {activeGoal ? `Theo mục tiêu ${activeGoal.targetRole}` : 'Chưa thiết lập vị trí mục tiêu'}
            </span>
          </div>

          <StaggerContainer className="space-y-3">
            {competencies.length > 0 ? (
              competencies.map((comp, idx) => {
                const score = comp.score != null ? Math.round(comp.score) : null;
                const evidenceNum = 'evidenceCount' in comp ? comp.evidenceCount : 0;
                return (
                  <StaggerItem key={idx}>
                    <Card variant="elevated" padding="md" className="space-y-2">
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

                      {score !== null && <AnimatedProgressBar
                        label=""
                        value={score}
                        heightClass="h-2"
                        colorClass={
                          'bg-primary'
                        }
                        delay={idx * 0.08}
                      />}
                    </Card>
                  </StaggerItem>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant/30">
                Chưa có năng lực nào được đánh giá. Hãy hoàn thành một hoạt động tạo bằng chứng.
              </div>
            )}
          </StaggerContainer>
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
                  <div key={idx} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1.5">
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
                      : 'Không thể tải danh sách năng lực theo điểm từ Progress Dashboard.'
                    : evidenceCount === 0
                      ? 'Chưa đủ dữ liệu để xác định điểm cần cải thiện.'
                      : 'Máy chủ chưa trả về danh sách năng lực có điểm thấp nhất.'}
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
                    className="w-full flex items-center justify-between text-left text-xs p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 enabled:hover:border-primary/50 enabled:cursor-pointer disabled:cursor-default transition-all"
                  >
                    <div>
                      <div className="font-bold text-on-surface flex items-center gap-1">
                        <span>{imp.kind === 'interview' ? 'Tiến bộ qua phiên phỏng vấn' : 'Tiến bộ được ghi nhận'}</span>
                        {improvementDestination && (
                          <span className="material-symbols-outlined text-[13px] text-primary">open_in_new</span>
                        )}
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        Điểm tăng từ {imp.previousScore}% lên {imp.currentScore}%
                      </div>
                      {imp.at && (
                        <div className="text-[11px] text-on-surface-variant">
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
                      : 'Không thể tải tiến bộ gần đây từ Progress Dashboard.'}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MotionPage>
  );
}
