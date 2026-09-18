'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductPageHero } from '@/components/product-visual';
import { useInterviewsHistory } from '@/hooks/queries/useInterviews';
import { useScenarioAttempts } from '@/hooks/queries/useScenarios';
import { useStarAttempts } from '@/hooks/queries/useStarAttempts';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { useNextRecommendation } from '@/hooks/queries/useNextRecommendation';
import { useProgressDashboard } from '@/hooks/queries/useProgressDashboard';
import { useLearningPath } from '@/hooks/queries/useLearningPath';
import { resolveNextBestAction } from '@/services/nextBestAction';
import { hasAvailableLearningPath } from '@/services/learningPathAvailability';
import { ApiError } from '@/services/apiClient';
import { getLearningPathPresentation } from '@/utils/queryPresentation';

type PracticeFeatureState = 'enabled' | 'locked' | 'unknown';

function getFeatureState(
  features: Array<{
    code: string;
    enabled: boolean;
    available: number | null;
    unlimited: boolean;
  }> | undefined,
  code: string
): PracticeFeatureState {
  if (!Array.isArray(features)) return 'unknown';
  const feature = features.find((item) => item.code === code);
  if (!feature) return 'unknown';
  if (!feature.enabled) return 'locked';
  if (!feature.unlimited && feature.available !== null && feature.available <= 0) return 'locked';
  return 'enabled';
}

export default function PracticeHub() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const interviews = useInterviewsHistory(8);
  const scenarios = useScenarioAttempts();
  const stars = useStarAttempts();
  const { data: careerProfile } = useCareerProfile();
  const { data: recommendation } = useNextRecommendation();
  const { data: progress } = useProgressDashboard();
  const {
    data: fetchedLearningPath,
    isLoading: loadingLearningPath,
    isError: isLearningPathError,
    error: learningPathError,
    isFetching: refreshingLearningPath,
    refetch: refetchLearningPath,
  } = useLearningPath();
  const learningPathApiError = learningPathError instanceof ApiError ? learningPathError : null;
  const learningPathPresentation = getLearningPathPresentation({
    data: fetchedLearningPath,
    errorCode: learningPathApiError?.code,
    errorStatus: learningPathApiError?.status,
    isLoading: loadingLearningPath,
    isError: isLearningPathError,
    isFetching: refreshingLearningPath,
  });
  const learningPath = learningPathPresentation.data;

  const [historyFilter, setHistoryFilter] = useState<'all' | 'interview' | 'scenario' | 'star'>('all');
  const historyLoading = interviews.isLoading || scenarios.isLoading || stars.isLoading;
  const historyError = interviews.error || scenarios.error || stars.error;

  const features = currentUser.data?.billing?.entitlement?.features;
  const scenarioState = getFeatureState(features, 'scenario');
  const starState = getFeatureState(features, 'star_builder');

  // Resolve Next Best Action
  const nextAction = resolveNextBestAction({
    recommendation: recommendation ?? null,
    targetRole: careerProfile?.activeCareerGoal?.targetRole,
    needsFirstEvidence: progress?.readiness?.score === null || progress?.readiness?.score === undefined,
  });

  // Check learning path availability
  const hasLearningPath = hasAvailableLearningPath(learningPath ?? null, careerProfile, progress);
  const learningPathNeedsGoal = learningPathPresentation.domainState === 'no_goal';
  const learningPathNotCreated = learningPathPresentation.domainState === 'not_created';
  const learningPathCtaHref = hasLearningPath
    ? '/learning-path'
    : learningPathNeedsGoal
      ? '/career-profile?section=goals'
      : learningPathNotCreated || learningPathPresentation.showBlockingError
        ? '/learning-path'
        : '/resume-analyses';
  const learningPathCtaLabel = hasLearningPath
    ? 'Khám phá lộ trình'
    : learningPathNeedsGoal
      ? 'Thiết lập mục tiêu'
      : learningPathNotCreated
        ? 'Tạo lộ trình học'
        : learningPathPresentation.showBlockingError
          ? 'Kiểm tra lộ trình'
          : 'Thiết lập mục tiêu & CV';

  // Unified practice history
  const allPracticeHistory = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'interview' | 'scenario' | 'star';
      title: string;
      subtitle: string;
      date: string;
      score?: number | null;
      isPracticeAgain?: boolean;
      actionUrl: string;
      actionLabel: string;
      actionIcon: string;
    }> = [];

    // 1. Interviews
    const interviewItems = (interviews.data?.pages.flatMap((page) => page.items) || []);
    interviewItems.forEach((iv) => {
      const isRepeat = Boolean(iv.sourceInterviewId || iv.sourceQuestionId || iv.practiceReason);
      list.push({
        id: `iv-${iv.id}`,
        type: 'interview',
        title: isRepeat
          ? iv.role
          : iv.interviewType === 'behavioral'
          ? `Phỏng vấn ứng xử: ${iv.role || 'Chuyên môn'}`
          : `Phỏng vấn kỹ thuật: ${iv.role || 'Chuyên môn'}`,
        subtitle: `${iv.role || 'Ứng viên'}${iv.seniority ? ` (${iv.seniority})` : ''} • ${iv.interviewType || 'technical'}`,
        date: iv.createdAt,
        score: null,
        isPracticeAgain: isRepeat,
        actionUrl: iv.reportAvailable ? `/interviews/${iv.id}/report` : `/interviews/${iv.id}`,
        actionLabel: iv.reportAvailable ? 'Xem báo cáo' : 'Vào lại phòng',
        actionIcon: iv.reportAvailable ? 'assessment' : 'play_arrow',
      });
    });

    // 2. Scenarios
    (scenarios.data || []).forEach((sc) => {
      list.push({
        id: `sc-${sc.id}`,
        type: 'scenario',
        title: `Tình huống: ${sc.scenarioTitle}`,
        subtitle: `${sc.status === 'completed' ? 'Đã hoàn thành' : 'Đang xử lý'} • ${sc.scenarioTitle}`,
        date: sc.createdAt,
        score: sc.evaluation?.overallScore ?? null,
        actionUrl: `/practice/scenarios`,
        actionLabel: 'Xem bài giải',
        actionIcon: 'description',
      });
    });

    // 3. STAR Attempts
    (stars.data || []).forEach((st) => {
      list.push({
        id: `star-${st.id}`,
        type: 'star',
        title: 'Luyện phản xạ STAR',
        subtitle: st.question,
        date: st.createdAt,
        score: st.evaluation?.overallScore ?? null,
        actionUrl: `/practice/star?attempt=${encodeURIComponent(st.id)}`,
        actionLabel: 'Xem chi tiết STAR',
        actionIcon: 'replay',
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [interviews.data, scenarios.data, stars.data]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return allPracticeHistory;
    return allPracticeHistory.filter((item) => item.type === historyFilter);
  }, [allPracticeHistory, historyFilter]);

  const goToTrack = (destination: string, isLocked: boolean) => {
    if (isLocked) {
      router.push(`/pricing?returnTo=${encodeURIComponent(destination)}`);
    } else {
      router.push(destination);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <ProductPageHero
        feature="practice"
        title="Trung tâm Luyện tập & Thử thách thực chiến"
        description="Mỗi buổi thực hành ghi nhận bằng chứng vào hồ sơ năng lực, để bạn luôn biết mình nên luyện điều gì tiếp theo."
      />

      {/* Primary Recommendation: Next Best Action */}
      <Card
        variant="elevated"
        padding="lg"
        className="relative overflow-hidden border-2 border-primary/40 bg-gradient-to-r from-primary-fixed/30 via-white to-white shadow-card"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-[24px]">recommend</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="primary" size="sm">
                  Hành động tốt nhất tiếp theo
                </Badge>
                {nextAction.estimatedMinutes && <span className="text-xs text-on-surface-variant font-mono">
                  {nextAction.estimatedMinutes} phút
                </span>}
              </div>
              <h3 className="font-bold text-base sm:text-lg text-on-surface">
                {nextAction.label}
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-2xl">
                {nextAction.description}
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Button
              variant="primary"
              size="md"
              onClick={() => nextAction.destination && router.push(nextAction.destination)}
              disabled={!nextAction.destination}
              icon={<span className="material-symbols-outlined text-[18px]">play_arrow</span>}
              iconPosition="right"
              className="w-full md:w-auto shadow-sm"
            >
              Thực hiện ngay
            </Button>
          </div>
        </div>
      </Card>

      {/* Section Title: Chọn cách bạn muốn luyện */}
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-bold text-on-surface">
          Chọn cách bạn muốn luyện
        </h2>
        <p className="text-xs text-on-surface-variant">
          Ba chế độ rèn luyện độc lập phục vụ từng mục tiêu năng lực cụ thể.
        </p>
      </div>

      {/* 3 Main Practice Tracks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Track 1: Mock Interview */}
        <Card variant="elevated" padding="lg" className="flex flex-col justify-between relative overflow-hidden border-primary/30 group hover:border-primary">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined text-[26px]">record_voice_over</span>
              </span>
              <Badge variant="primary" size="sm">Phổ biến nhất</Badge>
            </div>

            <h3 className="font-bold text-lg text-on-surface mb-2">
              Phỏng vấn AI
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Trả lời bằng giọng nói hoặc văn bản, chỉnh transcript trước khi nộp. Nhận phản hồi theo Rubric 4 tiêu chí trong phiên phỏng vấn 1-1.
            </p>

            <div className="space-y-2 text-xs text-on-surface-variant pt-3 border-t border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                <span>Q1–Q3 thuộc phạm vi miễn phí; quyền tiếp tục do máy chủ xác nhận</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                <span>Báo cáo đánh giá sau phiên phỏng vấn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                <span>Lịch sử và báo cáo lấy từ các phiên đã lưu</span>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/interviews/new')}
            className="mt-6 w-full shadow-sm"
            icon={<span className="material-symbols-outlined text-[18px]">play_arrow</span>}
            iconPosition="right"
          >
            Vào phòng phỏng vấn
          </Button>
        </Card>

        {/* Track 2: Scenario Practice */}
        <Card variant="elevated" padding="lg" className="flex flex-col justify-between border-outline-variant/60 hover:border-secondary transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-sm">
                <span className="material-symbols-outlined text-[26px]">terminal</span>
              </span>
              <Badge variant={scenarioState === 'locked' ? 'warning' : 'secondary'} size="sm">
                {scenarioState === 'locked' ? 'Đang khóa · Nâng cấp' : 'Hệ thống thực tế'}
              </Badge>
            </div>

            <h3 className="font-bold text-lg text-on-surface mb-2">
              Kho tình huống
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Luyện cách xử lý các tình huống thực tế theo vai trò, mức độ và năng lực bạn muốn cải thiện.
            </p>

            <div className="space-y-2 text-xs text-on-surface-variant pt-3 border-t border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                <span>Danh mục và nội dung tình huống lấy trực tiếp từ máy chủ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                <span>Đánh giá phương án xử lý ngắn hạn & dài hạn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                <span>Điểm và bằng chứng chỉ hiển thị khi backend trả về</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => goToTrack('/practice/scenarios', scenarioState === 'locked')}
            className="mt-6 w-full"
            icon={<span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            iconPosition="right"
          >
            {scenarioState === 'locked' ? 'Xem gói để mở khóa' : 'Khám phá kho tình huống'}
          </Button>
        </Card>

        {/* Track 3: STAR Mastery */}
        <Card variant="elevated" padding="lg" className="flex flex-col justify-between border-outline-variant/60 hover:border-tertiary transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-12 h-12 rounded-2xl bg-tertiary-container flex items-center justify-center text-on-tertiary-container shadow-sm">
                <span className="material-symbols-outlined text-[26px]">psychology_alt</span>
              </span>
              <Badge variant={starState === 'locked' ? 'warning' : 'tertiary'} size="sm">
                {starState === 'locked' ? 'Đang khóa · Nâng cấp' : 'Cấu trúc STAR'}
              </Badge>
            </div>

            <h3 className="font-bold text-lg text-on-surface mb-2">
              Luyện STAR
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Bẻ gãy thói quen kể chuyện lan man. Rèn luyện phản xạ đưa số liệu định lượng vào thành phần Kết quả (Result) để thuyết phục nhà tuyển dụng.
            </p>

            <div className="space-y-2 text-xs text-on-surface-variant pt-3 border-t border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                <span>Phân tích tức thời 4 thành phần S-T-A-R</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                <span>Cảnh báo thành phần bị khuyết thiếu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                <span>Lịch sử luyện tập được lưu theo từng lượt thật</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => goToTrack('/practice/star', starState === 'locked')}
            className="mt-6 w-full"
            icon={<span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            iconPosition="right"
          >
            {starState === 'locked' ? 'Xem gói để mở khóa' : 'Luyện phản xạ STAR'}
          </Button>
        </Card>
      </div>

      {/* Learning Path Banner */}
      <Card variant="elevated" padding="lg" className="bg-surface-container-low border-primary/20">
        {learningPathPresentation.showBackgroundError && (
          <p role="alert" className="mb-4 rounded-lg bg-amber-50/80 border border-amber-300/80 px-3 py-2 text-xs text-amber-950">
            Không thể cập nhật lộ trình. Dữ liệu đã tải trước đó vẫn được giữ.
          </p>
        )}
        {learningPathPresentation.showBlockingError && (
          <div role="alert" className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-amber-50/80 border border-amber-300/80 px-3 py-2 text-xs text-amber-950">
            <span>Không thể tải lộ trình lúc này; hãy thử lại để xác nhận trạng thái.</span>
            <Button variant="outline" size="sm" onClick={() => void refetchLearningPath()} disabled={refreshingLearningPath}>
              {refreshingLearningPath ? 'Đang thử lại...' : 'Thử lại'}
            </Button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0">
              <span className="material-symbols-outlined text-[28px]">route</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-on-surface">
                  {hasLearningPath
                    ? 'Lộ trình học tập & phát triển cá nhân'
                    : learningPathNeedsGoal
                      ? 'Chưa thiết lập mục tiêu nghề nghiệp'
                      : learningPathPresentation.showBlockingError
                        ? 'Chưa thể tải lộ trình lúc này'
                        : 'Chưa có lộ trình cá nhân hóa'}
                </h3>
                {hasLearningPath && learningPath?.progress && (
                  <Badge variant="primary" size="sm">
                    {learningPath.progress.percentage}% hoàn thành
                  </Badge>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                {hasLearningPath ? (
                  <>
                    Đã hoàn thành {learningPath?.progress?.completedActivityCount ?? 0}/{learningPath?.progress?.totalActivityCount ?? 0} hoạt động được cá nhân hóa cho bạn.
                  </>
                ) : learningPathNeedsGoal ? (
                  'Thiết lập mục tiêu nghề nghiệp để Nexora có bối cảnh xây dựng lộ trình.'
                ) : learningPathNotCreated ? (
                  'Tạo lộ trình học tập để xem các cột mốc và hoạt động được cá nhân hóa.'
                ) : learningPathPresentation.showBlockingError ? (
                  'Trạng thái lộ trình hiện chưa xác định; các hoạt động luyện tập khác vẫn khả dụng.'
                ) : (
                  'Thiết lập mục tiêu và thêm bằng chứng từ CV hoặc hoạt động luyện tập để Nexora có thể đề xuất lộ trình cá nhân hóa.'
                )}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => router.push(learningPathCtaHref)}
            className="w-full sm:w-auto flex-shrink-0"
            icon={<span className="material-symbols-outlined text-[18px]">map</span>}
            iconPosition="right"
          >
            {learningPathCtaLabel}
          </Button>
        </div>
      </Card>

      {/* LỊCH SỬ LUYỆN TẬP / PRACTICE HISTORY */}
      <section className="space-y-4 pt-4 border-t border-outline-variant/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">history</span>
            <h2 className="text-base sm:text-lg font-bold text-on-surface">Lịch sử luyện tập</h2>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-xl border border-outline-variant/40 flex-wrap">
            {(
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'interview', label: 'Phỏng vấn' },
                { id: 'scenario', label: 'Tình huống' },
                { id: 'star', label: 'Luyện STAR' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setHistoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  historyFilter === tab.id
                    ? 'bg-white text-primary shadow-subtle'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of attempts */}
        {historyLoading ? (
          <div className="grid gap-3" aria-live="polite" aria-label="Đang tải lịch sử luyện tập">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-xl border border-outline-variant/40 bg-surface-container-low" />
            ))}
          </div>
        ) : historyError ? (
          <Card variant="flat" padding="md" className="text-center py-8 border-dashed">
            <div className="text-sm font-bold text-on-surface">Chưa thể tải lịch sử luyện tập</div>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
              Dữ liệu lịch sử đang lỗi hoặc mất kết nối; đây không phải trạng thái trống.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                void interviews.refetch();
                void scenarios.refetch();
                void stars.refetch();
              }}
            >
              Thử tải lại
            </Button>
          </Card>
        ) : filteredHistory.length > 0 ? (
          <div className="space-y-3">
            {filteredHistory.map((item) => {
              const iconMap: Record<string, { icon: string; bg: string; text: string; badgeText: string }> = {
                interview: { icon: 'mic', bg: 'bg-emerald-100', text: 'text-emerald-700', badgeText: 'Phỏng vấn AI' },
                scenario: { icon: 'psychology', bg: 'bg-indigo-100', text: 'text-indigo-700', badgeText: 'Kho tình huống' },
                star: { icon: 'star', bg: 'bg-amber-100', text: 'text-amber-700', badgeText: 'Luyện STAR' },
              };
              const theme = iconMap[item.type] || iconMap.interview;
              const dateStr = new Date(item.date).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white border border-outline-variant/60 shadow-subtle hover:border-primary/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl ${theme.bg} ${theme.text} flex items-center justify-center shrink-0 mt-0.5 sm:mt-0`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{theme.icon}</span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" size="sm">
                          {theme.badgeText}
                        </Badge>
                        {item.isPracticeAgain && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-fixed/50 text-primary">
                            Luyện lại phản xạ
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-on-surface-variant">{dateStr}</span>
                      </div>

                      <h4 className="text-sm font-bold text-on-surface truncate">
                        {item.title}
                      </h4>

                      <p className="text-xs text-on-surface-variant line-clamp-1">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {item.score != null && (
                      <div className="text-right">
                        <div className="text-[10px] text-on-surface-variant uppercase font-medium">Điểm đánh giá</div>
                        <div className="text-sm font-bold text-primary">{item.score}/100</div>
                      </div>
                    )}

                    <Button
                      variant={item.type === 'interview' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => router.push(item.actionUrl)}
                      icon={<span className="material-symbols-outlined text-[16px]">{item.actionIcon}</span>}
                      iconPosition="right"
                    >
                      {item.actionLabel}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card variant="flat" padding="md" className="text-center py-8 border-dashed">
            <div className="w-12 h-12 mx-auto rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-2">
              <span className="material-symbols-outlined text-[24px]">history_toggle_off</span>
            </div>
            <div className="text-sm font-bold text-on-surface">Chưa có lịch sử luyện tập</div>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
              Các bài tập phỏng vấn giả lập, giải quyết tình huống kỹ thuật và phản xạ STAR của bạn sẽ được lưu vết đầy đủ tại đây.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
