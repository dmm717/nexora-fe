'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardSummary } from '@/hooks/queries/useDashboard';
import { useProgressDashboard } from '@/hooks/queries/useProgressDashboard';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { useLearningPath } from '@/hooks/queries/useLearningPath';
import { useNextRecommendation } from '@/hooks/queries/useNextRecommendation';
import { RadialScore } from '@/components/ui/RadialScore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  EvidenceCard,
  InsightPanel,
  MotionEmptyState,
  ProductPageHero,
} from '@/components/product-visual';
import { resolveNextBestAction } from '@/services/nextBestAction';
import { hasAvailableLearningPath } from '@/services/learningPathAvailability';
import { ApiError } from '@/services/apiClient';

export default function OverviewPage() {
  const router = useRouter();

  const { data: dashboardData, isLoading: loadingDashboard } = useDashboardSummary();
  const {
    data: progressData,
    isLoading: loadingProgress,
    error: progressError,
    refetch: refetchProgress,
    isFetching: refreshingProgress,
  } = useProgressDashboard();
  const { data: careerProfile, isLoading: loadingProfile } = useCareerProfile();
  const { data: learningPathData } = useLearningPath();
  const { data: recommendationData } = useNextRecommendation();

  const progressLocked =
    progressError instanceof ApiError &&
    (progressError.code === 'FEATURE_NOT_AVAILABLE' || progressError.status === 403);
  const progressUnavailable = Boolean(progressError) && !progressLocked;
  const progressPending =
    loadingProgress && progressData === undefined && progressError == null;
  const hasProgressData = progressData !== undefined && progressError == null;
  const hasInsufficientEvidence =
    hasProgressData && progressData.readiness.score === null;
  const activeGoal = careerProfile?.activeCareerGoal;
  const primaryResume = careerProfile?.primaryResume;
  const onboarding = careerProfile?.onboarding;

  // Use either next recommendation from progress dashboard or recommendations endpoint
  const rec =
    (hasProgressData ? progressData.nextRecommendedPractice : null) ||
    recommendationData ||
    null;

  const nextAction = resolveNextBestAction({
    recommendation: rec,
    targetRole: activeGoal?.targetRole,
    needsFirstEvidence: hasInsufficientEvidence,
  });
  const showFirstEvidenceOnboarding = hasInsufficientEvidence && rec === null;

  const availablePath = hasAvailableLearningPath(
    learningPathData,
    careerProfile,
    progressData
  )
    ? learningPathData
    : null;

  const nextMilestone = availablePath?.milestones?.find(
    (milestone) => (milestone.status as string) === 'in_progress' || (milestone.status as string) === 'pending'
  );

  // Derive real recent activities
  const recentActivities: Array<{
    id: string;
    kind: 'cv_analysis' | 'interview' | 'scenario' | 'star';
    title: string;
    summary: string;
    createdAt: string;
    score: number | null;
    destinationUrl: string;
  }> = [];

  if (dashboardData?.interviews) {
    dashboardData.interviews.slice(0, 4).forEach((iv) => {
      const matchedReport = dashboardData.reports?.find((r) => r.interviewId === iv.id);
      const activityTimestamp = matchedReport?.createdAt || iv.updatedAt;
      if (!activityTimestamp) return;
      recentActivities.push({
        id: `iv-${iv.id}`,
        kind: 'interview',
        title: `Phỏng vấn: ${iv.role}`,
        summary: `Trạng thái: ${iv.status}`,
        createdAt: activityTimestamp,
        score: matchedReport?.overallScore ?? null,
        destinationUrl: `/interviews/${iv.id}`,
      });
    });
  }

  if (loadingDashboard && loadingProgress && loadingProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Đang tải dữ liệu tổng quan...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* 1. Context first: what should I do next? */}
      <ProductPageHero
        feature="overview"
        title={`Xin chào, ${careerProfile?.profile?.displayName || 'ứng viên'}!`}
        description={
          hasInsufficientEvidence
            ? 'Chưa đủ dữ liệu để tính chỉ số sẵn sàng. Nexora vẫn giữ các đề xuất khác do máy chủ cung cấp.'
            : progressLocked
              ? 'Progress Dashboard chưa có trong gói hiện tại. Các đề xuất độc lập vẫn được giữ nguyên khi có dữ liệu máy chủ.'
              : progressUnavailable
                ? 'Không thể tải Progress Dashboard lúc này. Nexora không suy luận rằng hồ sơ của bạn đang thiếu bằng chứng.'
                : hasProgressData
                  ? `Hệ thống ghi nhận ${progressData.readiness.evidenceCount} bằng chứng năng lực thực tế. Đây là bước đi tốt nhất tiếp theo trong hành trình của bạn.`
                  : 'Đang tải trạng thái bằng chứng từ Progress Dashboard.'
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <EvidenceCard
            label="Mục tiêu hiện tại"
            value={activeGoal ? `${activeGoal.targetRole} · ${activeGoal.seniority}` : 'Chưa thiết lập mục tiêu'}
            detail={activeGoal ? (activeGoal.industry || 'Đã có mục tiêu, chưa chốt ngành') : 'Thiết lập để kết quả có bối cảnh'}
            tone={activeGoal ? 'positive' : 'attention'}
          />
          <EvidenceCard
            label="CV chính"
            value={primaryResume?.fileName || 'Chưa có CV chính'}
            detail={primaryResume ? 'Đã sẵn sàng để đối chiếu' : 'Thêm CV khi bạn sẵn sàng'}
            tone={primaryResume ? 'positive' : 'neutral'}
          />
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <Button variant="primary" size="md" onClick={() => nextAction.destination && router.push(nextAction.destination)} disabled={!nextAction.destination}>
            {nextAction.label}
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push(primaryResume ? '/career-goals' : '/resume-analyses')}
          >
            {primaryResume ? 'Xem hồ sơ nghề nghiệp' : 'Thiết lập bối cảnh'}
          </Button>
        </div>
      </ProductPageHero>

      {/* Feature Gate Banner for ProgressAnalytics if unentitled */}
      {progressLocked && (
        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900">
            <span className="material-symbols-outlined text-[20px] text-amber-700">lock</span>
            <span>
              <strong>Tính năng Phân tích tiến độ nâng cao:</strong> Gói tài khoản hiện tại chưa hỗ trợ xem chỉ số sẵn sàng và phân tích tiến độ tuần.
            </span>
          </div>
          <Button variant="primary" size="sm" onClick={() => router.push('/pricing')}>
            Nâng cấp gói cước
          </Button>
        </div>
      )}

      {progressUnavailable && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface">
          <span>Không thể tải Progress Dashboard. Trạng thái bằng chứng hiện chưa xác định.</span>
          <Button variant="outline" size="sm" onClick={() => refetchProgress()} disabled={refreshingProgress}>
            {refreshingProgress ? 'Đang thử lại...' : 'Thử lại'}
          </Button>
        </div>
      )}

      {/* Onboarding Incomplete Reminder Banner (if applicable) */}
      {onboarding && !onboarding.isComplete && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900">
            <span className="material-symbols-outlined text-[20px] text-amber-700">info</span>
            <span>
              <strong>Hồ sơ nghề nghiệp chưa đầy đủ:</strong>{' '}
              {!primaryResume && 'Chưa có CV chính thức · '}
              {!activeGoal && 'Chưa chọn vị trí mục tiêu · '}
              Bạn có thể bổ sung trực tiếp khi bắt đầu tính năng hoặc cập nhật trong menu tài khoản.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/career-goals')}
          >
            Hoàn thiện hồ sơ
          </Button>
        </div>
      )}

      {/* 2. Core 4 Questions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* QUESTION 4: Tôi nên làm gì tiếp theo? (Spotlight Next Best Action) */}
        <div className="lg:col-span-7 flex flex-col justify-between relative overflow-hidden rounded-2xl bg-white p-6 sm:p-7 border border-outline-variant/60 shadow-card group">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  auto_awesome
                </span>
                Hành động tốt nhất tiếp theo (Next Best Action)
              </span>
              {nextAction.estimatedMinutes && <span className="text-xs text-on-surface-variant">Ước tính {nextAction.estimatedMinutes} phút</span>}
            </div>

            {showFirstEvidenceOnboarding ? (
              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                  {nextAction.label}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {nextAction.description}
                </p>
                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => nextAction.destination && router.push(nextAction.destination)}
                    disabled={!nextAction.destination}
                    icon={<span className="material-symbols-outlined text-[18px]">document_scanner</span>}
                  >
                    {nextAction.label}
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => router.push('/interviews/new')}
                    icon={<span className="material-symbols-outlined text-[18px]">mic</span>}
                  >
                    Hoặc thử phỏng vấn trước
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                  {nextAction.label}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {nextAction.description}
                </p>
                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => nextAction.destination && router.push(nextAction.destination)}
                    disabled={!nextAction.destination}
                    icon={<span className="material-symbols-outlined text-[18px]">replay</span>}
                  >
                    {nextAction.label}
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => router.push('/interviews')}
                    icon={<span className="material-symbols-outlined text-[18px]">assignment</span>}
                  >
                    Xem lại các buổi phỏng vấn
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QUESTION 3: Điểm đáng chú ý nhất hiện tại là gì? (Readiness & Highlights) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-white p-6 border border-outline-variant/60 shadow-card">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Chỉ số sẵn sàng ứng tuyển
              </span>
              <button
                onClick={() => router.push('/analytics')}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Chi tiết
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {hasProgressData && progressData.readiness.score != null ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <RadialScore score={progressData.readiness.score} size={88} strokeWidth={8} tone="neutral" />
                  <div>
                    <div className="text-lg font-bold text-on-surface">
                      Chỉ số hiện tại: {progressData.readiness.score}/100
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Dựa trên {progressData.readiness.evidenceCount} bằng chứng được máy chủ tổng hợp.
                    </p>
                  </div>
                </div>

                {progressData.readiness.priorityGapCount > 0 ? (
                  <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs space-y-1">
                    <div className="font-semibold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[16px]">priority_high</span>
                      Điểm cần chú ý nhất:
                    </div>
                    <p className="text-on-surface-variant text-[11px]">
                      Hệ thống ghi nhận {progressData.readiness.priorityGapCount} khoảng trống năng lực ưu tiên cần bồi đắp.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : hasInsufficientEvidence ? (
              <MotionEmptyState
                title="Chưa đủ dữ liệu để tính chỉ số"
                description="Điểm sẵn sàng cần thêm bằng chứng năng lực dạng số. Những bằng chứng hoặc đề xuất khác vẫn có thể tồn tại."
                action={
                  <Button variant="outline" size="sm" onClick={() => router.push('/resume-analyses')}>
                    Bổ sung bằng chứng định lượng
                  </Button>
                }
              />
            ) : progressPending ? (
              <div className="min-h-36 flex items-center justify-center gap-3 text-sm text-on-surface-variant">
                <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                <span>Đang tải chỉ số sẵn sàng...</span>
              </div>
            ) : (
              <MotionEmptyState
                title={progressLocked ? 'Chỉ số chưa có trong gói hiện tại' : 'Chưa thể tải chỉ số sẵn sàng'}
                description={
                  progressLocked
                    ? 'Nâng cấp gói để sử dụng Progress Dashboard. Không có điểm số nào được suy luận thay thế.'
                    : 'Trạng thái bằng chứng hiện chưa xác định. Hãy thử tải lại Progress Dashboard.'
                }
                action={
                  progressUnavailable ? (
                    <Button variant="outline" size="sm" onClick={() => refetchProgress()} disabled={refreshingProgress}>
                      {refreshingProgress ? 'Đang thử lại...' : 'Thử lại'}
                    </Button>
                  ) : undefined
                }
              />
            )}
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Mục tiêu: {activeGoal?.targetRole || 'Chưa thiết lập'}</span>
            <span className="font-semibold text-primary">{activeGoal?.industry || 'Chưa chọn ngành'}</span>
          </div>
        </div>
      </div>

      <InsightPanel title="Nexora học gì từ hành trình của bạn?">
        {hasInsufficientEvidence
          ? 'Mỗi CV, câu trả lời và lần luyện lại sẽ trở thành một mảnh bằng chứng. Khi đủ dữ liệu, hệ thống mới đề xuất điểm mạnh và khoảng trống đáng tin cậy.'
          : hasProgressData
            ? 'Bằng chứng mới nhất được nối vào mục tiêu hiện tại để gợi ý một hành động cụ thể, thay vì chỉ đưa ra thêm một bảng điểm.'
            : 'Khi Progress Dashboard khả dụng, Nexora sẽ nối bằng chứng mới nhất vào mục tiêu hiện tại mà không tự suy luận trạng thái còn thiếu.'}
      </InsightPanel>

      {/* 3. CONTEXTUAL RECENT ACTIVITIES (Hoạt động gần đây) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">history</span>
            <h2 className="text-base sm:text-lg font-bold text-on-surface">Hoạt động gần đây</h2>
          </div>
          {recentActivities.length > 0 && (
            <span className="text-xs text-on-surface-variant font-mono">
              Hiển thị {Math.min(recentActivities.length, 4)} hoạt động mới nhất
            </span>
          )}
        </div>

        {recentActivities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentActivities.slice(0, 4).map((act) => {
              const iconMap: Record<string, { icon: string; bg: string; text: string }> = {
                cv_analysis: { icon: 'document_scanner', bg: 'bg-primary-fixed/40', text: 'text-primary' },
                interview: { icon: 'mic', bg: 'bg-emerald-100', text: 'text-emerald-700' },
                scenario: { icon: 'psychology', bg: 'bg-indigo-100', text: 'text-indigo-700' },
                star: { icon: 'star', bg: 'bg-amber-100', text: 'text-amber-700' },
              };
              const theme = iconMap[act.kind] || iconMap.interview;
              const dateStr = new Date(act.createdAt).toLocaleDateString('vi-VN', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={act.id}
                  onClick={() => router.push(act.destinationUrl)}
                  className="p-4 rounded-xl bg-white border border-outline-variant/60 shadow-subtle hover:border-primary hover:shadow-card cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg ${theme.bg} ${theme.text} flex items-center justify-center`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{theme.icon}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                          {act.kind === 'cv_analysis'
                            ? 'Phân tích CV'
                            : act.kind === 'interview'
                            ? 'Phỏng vấn'
                            : act.kind === 'scenario'
                            ? 'Tình huống'
                            : 'Luyện STAR'}
                        </span>
                      </div>
                      {act.score != null && (
                        <Badge variant="primary" size="sm">
                          {act.score}/100
                        </Badge>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                      {act.title}
                    </h4>

                    <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                      {act.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between text-[10px] text-on-surface-variant">
                    <span className="font-mono">{dateStr}</span>
                    <span className="font-semibold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Xem chi tiết
                      <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card variant="flat" padding="md" className="text-center py-6 border-dashed">
            <div className="w-10 h-10 mx-auto rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-2">
              <span className="material-symbols-outlined text-[20px]">history_toggle_off</span>
            </div>
            <div className="text-xs font-bold text-on-surface">Chưa có hoạt động thực hành nào</div>
            <p className="text-[11px] text-on-surface-variant max-w-sm mx-auto mt-1">
              Các lượt phân tích CV, mock interview và bài tập phản xạ của bạn sẽ được lưu vết trực tiếp tại đây.
            </p>
          </Card>
        )}
      </section>

      {/* 4. QUESTION 1 & 2: Hồ sơ của tôi đang ở đâu & Tôi đang chuẩn bị cho mục tiêu nào? */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Hồ sơ hiện tại */}
        <Card variant="elevated" padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              1. Hồ sơ của tôi
            </span>
            <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
          </div>
          <div className="text-sm font-bold text-on-surface">
            {careerProfile?.profile?.displayName || 'Chưa đặt tên'}
          </div>
          <div className="text-xs text-on-surface-variant space-y-1">
            <div>Kinh nghiệm: {careerProfile?.profile?.yearsOfExperience != null ? `${careerProfile.profile.yearsOfExperience} năm` : 'Chưa cập nhật'}</div>
            <div>CV chính: {primaryResume ? primaryResume.fileName : 'Chưa chọn'}</div>
          </div>
          <button
            onClick={() => router.push('/career-goals')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 pt-1 cursor-pointer"
          >
            Xem Hồ sơ nghề nghiệp
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </Card>

        {/* Card 2: Mục tiêu chuẩn bị */}
        <Card variant="elevated" padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              2. Mục tiêu nghề nghiệp
            </span>
            <span className="material-symbols-outlined text-primary text-[20px]">ads_click</span>
          </div>
          <div className="text-sm font-bold text-on-surface">
            {activeGoal ? `${activeGoal.targetRole} (${activeGoal.seniority})` : 'Chưa thiết lập'}
          </div>
          <div className="text-xs text-on-surface-variant space-y-1">
            <div>Ngành: {activeGoal?.industry || 'Chưa chọn ngành'}</div>
            <div>Công ty mục tiêu: {activeGoal?.targetCompany || 'Chưa chọn công ty mục tiêu'}</div>
          </div>
          <button
            onClick={() => router.push('/career-goals')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 pt-1 cursor-pointer"
          >
            Điều chỉnh mục tiêu
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </Card>

        {/* Card 3: Lộ trình phát triển */}
        <Card variant="elevated" padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              3. Lộ trình học tập
            </span>
            <span className="material-symbols-outlined text-primary text-[20px]">route</span>
          </div>
          <div className="text-sm font-bold text-on-surface">
            {!availablePath
              ? 'Chưa đủ dữ liệu để tạo lộ trình'
              : `Hoàn thành ${availablePath.progress.completedActivityCount}/${availablePath.progress.totalActivityCount} hoạt động (${availablePath.progress.percentage}%)`}
          </div>
          <div className="text-xs text-on-surface-variant">
            {!availablePath
              ? 'Thiết lập mục tiêu và thêm bằng chứng từ CV hoặc hoạt động luyện tập.'
              : nextMilestone
              ? `Cột mốc tiếp theo: ${nextMilestone.title}`
              : 'Chưa có cột mốc tiếp theo.'}
          </div>
          <button
            onClick={() => router.push(availablePath ? '/learning-path' : '/resume-analyses')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 pt-1 cursor-pointer"
          >
            {availablePath ? 'Mở lộ trình chi tiết' : 'Thiết lập mục tiêu & CV'}
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </Card>
      </div>
    </div>
  );
}
