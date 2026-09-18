'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AnimatedProgressBar } from '@/components/motion/AnimatedProgressBar';
import { StaggerContainer, StaggerItem } from '@/components/motion';
import { Skeleton } from '@/components/ui/Skeleton';
import { getLearningPathPresentation } from '@/utils/queryPresentation';
import {
  useLearningPath,
  useGenerateLearningPath,
  useRefreshLearningPath,
  useCompleteLearningPathActivity,
} from '@/hooks/queries/useLearningPath';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import {
  LearningPathValues,
  getActivityDeepLink,
  getLearningPathActivityDisposition,
  getActiveLearningPathProgress,
  type LearningPathActivityResponse,
} from '@/services/learningPathApi';
import { ApiError } from '@/services/apiClient';

export default function LearningPathView() {
  const router = useRouter();
  const {
    data: fetchedPath,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useLearningPath();
  const { data: careerProfile } = useCareerProfile();
  const generateMutation = useGenerateLearningPath();
  const refreshMutation = useRefreshLearningPath();
  const completeMutation = useCompleteLearningPathActivity();
  const [actionError, setActionError] = useState<string | null>(null);

  const apiError = error instanceof ApiError ? error : null;
  const queryPresentation = getLearningPathPresentation({
    data: fetchedPath,
    errorCode: apiError?.code,
    errorStatus: apiError?.status,
    isLoading,
    isError,
    isFetching,
  });
  const path = queryPresentation.data;

  const handleGenerate = async () => {
    setActionError(null);
    try {
      await generateMutation.mutateAsync();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo lộ trình học.';
      setActionError(msg);
    }
  };

  const handleRefresh = async () => {
    setActionError(null);
    try {
      await refreshMutation.mutateAsync();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể làm mới lộ trình học.';
      setActionError(msg);
    }
  };

  const handleCompleteActivity = async (activityId: string) => {
    setActionError(null);
    try {
      await completeMutation.mutateAsync(activityId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể đánh dấu hoàn thành hoạt động.';
      setActionError(msg);
    }
  };

  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case LearningPathValues.Interview:
        return <Badge variant="primary" size="sm">Phỏng vấn</Badge>;
      case LearningPathValues.Scenario:
        return <Badge variant="warning" size="sm">Tình huống</Badge>;
      case LearningPathValues.StarDrill:
        return <Badge variant="info" size="sm">STAR Method</Badge>;
      case LearningPathValues.ResumeImprovement:
        return <Badge variant="secondary" size="sm">Cải thiện CV</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Tài liệu ngoài</Badge>;
    }
  };

  const handleStartActivity = (activity: LearningPathActivityResponse) => {
    const link = getActivityDeepLink(activity);
    if (!link || getLearningPathActivityDisposition(activity.status) !== 'pending') return;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      router.push(link);
    }
  };

  if (queryPresentation.showInitialLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 space-y-6 text-on-surface-variant" role="status" aria-label="Loading learning path">
        <div className="space-y-3">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-9 w-3/4 max-w-xl" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="space-y-3" aria-hidden="true">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <span>Đang tải lộ trình học...</span>
        </div>
      </div>
    );
  }

  if (queryPresentation.domainState === 'no_goal') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <Card variant="elevated" padding="lg" className="space-y-5 text-center py-12">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">flag</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">Chưa thiết lập mục tiêu nghề nghiệp</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl mx-auto leading-relaxed">
            Bạn cần có ít nhất một mục tiêu nghề nghiệp đang kích hoạt để Nexora phân tích và tạo lộ trình học tập cá nhân hóa.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="primary" size="md" onClick={() => router.push('/career-profile?section=goals')}>
              Thiết lập mục tiêu ngay
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (queryPresentation.domainState === 'not_created') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <Card variant="elevated" padding="lg" className="space-y-5 text-center py-12">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-fixed text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">route</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">Chưa tạo lộ trình học</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl mx-auto leading-relaxed">
            Hệ thống sẽ tổng hợp các khoảng trống năng lực từ CV và các phiên phỏng vấn để lập ra lộ trình gồm các cột mốc và hoạt động phù hợp nhất với bạn.
          </p>
          {actionError && (
            <p className="text-xs text-error font-medium">{actionError}</p>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              icon={<span className="material-symbols-outlined text-[18px]">auto_awesome</span>}
              iconPosition="right"
            >
              {generateMutation.isPending ? 'Đang tạo lộ trình...' : 'Tạo lộ trình học ngay'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <Card variant="elevated" padding="lg" className="space-y-5 text-center py-12">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-error/10 text-error flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">cloud_off</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">Chưa thể tải lộ trình học</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl mx-auto leading-relaxed">
            Đây là lỗi kết nối hoặc máy chủ, không phải trạng thái “chưa tạo”. Hãy thử tải lại dữ liệu.
          </p>
          <div className="flex justify-center">
            <Button variant="primary" size="md" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? 'Đang tải lại...' : 'Thử tải lại'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const activeGoal = careerProfile?.activeCareerGoal;
  const progress = getActiveLearningPathProgress(path.milestones);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[16px]">alt_route</span>
            <span>Lộ trình thích ứng cá nhân hóa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Lộ trình chinh phục {activeGoal ? `${activeGoal.targetRole} · ${activeGoal.seniority}` : 'Mục tiêu'}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Lộ trình tự động điều chỉnh theo các khoảng trống phát hiện từ kết quả phỏng vấn và CV của bạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
            icon={<span className="material-symbols-outlined text-[18px]">refresh</span>}
          >
            {refreshMutation.isPending ? 'Đang làm mới...' : 'Làm mới'}
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

      {actionError && (
        <div className="p-3.5 bg-error/10 border border-error/20 rounded-xl text-xs text-error">
          {actionError}
        </div>
      )}

      {queryPresentation.showBackgroundError && (
        <div role="alert" className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300/80 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>Không thể cập nhật lộ trình. Dữ liệu đang hiển thị được giữ nguyên.</span>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? 'Đang thử lại...' : 'Thử lại'}
          </Button>
        </div>
      )}
      {queryPresentation.showRefreshing && !queryPresentation.showBackgroundError && (
        <p role="status" className="text-xs text-on-surface-variant">Đang cập nhật lộ trình...</p>
      )}

      {/* Progress Bar Card */}
      <Card variant="elevated" padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Tổng tiến độ lộ trình
            </div>
            <div className="text-lg font-bold text-on-surface">
              Đã hoàn thành {progress?.completedActivityCount ?? 0} / {progress?.totalActivityCount ?? 0} hoạt động ({progress?.percentage ?? 0}%)
            </div>
          </div>
          <Badge variant={(progress?.percentage ?? 0) >= 80 ? 'success' : 'primary'} size="lg">
            {progress?.percentage ?? 0}% Hoàn thành
          </Badge>
        </div>

        <AnimatedProgressBar
          label=""
          value={progress?.percentage ?? 0}
          heightClass="h-3"
          colorClass="bg-primary"
        />
      </Card>

      {/* Milestones Stepper */}
      <div className="space-y-6">
        {path.milestones.map((milestone, mIdx) => {
          const isDone = milestone.status === 'completed';
          const isInProgress = milestone.status === 'in_progress';

          return (
            <div key={milestone.id} className="relative pl-6 sm:pl-8 border-l-2 border-outline-variant/40 space-y-4">
              {/* Milestone Step Marker */}
              <div
                className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDone
                    ? 'bg-emerald-700 text-white'
                    : isInProgress
                    ? 'bg-primary text-white ring-4 ring-primary-fixed'
                    : 'bg-surface-container text-on-surface-variant border border-outline-variant'
                }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-[18px]">check</span>
                ) : (
                  <span>{mIdx + 1}</span>
                )}
              </div>

              {/* Milestone Title */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <span>{milestone.title}</span>
                    {isDone && <Badge variant="success" size="sm">Đã hoàn thành</Badge>}
                    {isInProgress && <Badge variant="primary" size="sm">Đang thực hiện</Badge>}
                  </h3>
                </div>
              </div>

              {/* Milestone Activities List */}
              <StaggerContainer className="space-y-3">
                {milestone.activities.map((activity, index) => {
                  const disposition = getLearningPathActivityDisposition(activity.status);
                  const isActDone = disposition === 'completed';
                  const isPending = disposition === 'pending';
                  const isObsolete = disposition === 'obsolete';
                  const activityLink = getActivityDeepLink(activity);
                  const isCompleting = completeMutation.isPending && completeMutation.variables === activity.id;
                  const ActivityItem = index < 8 ? StaggerItem : React.Fragment;

                  return (
                    <ActivityItem key={activity.id}>
                    <Card
                      variant="elevated"
                      padding="md"
                      className={`transition-all ${
                        isActDone ? 'opacity-75 bg-surface-container-low/40' : 'bg-white'
                      }`}
                      aria-busy={isCompleting || undefined}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {/* Permanent Status Indicator */}
                          <div className="mt-0.5 shrink-0">
                            {isActDone ? (
                              <span
                                className="material-symbols-outlined text-[22px] text-emerald-700"
                                title="Đã hoàn thành"
                              >
                                task_alt
                              </span>
                            ) : isPending ? (
                              <button
                                type="button"
                                onClick={() => handleCompleteActivity(activity.id)}
                                disabled={completeMutation.isPending}
                                className="text-outline-variant hover:text-primary transition-colors"
                                title="Đánh dấu đã hoàn thành"
                              >
                                <span className="material-symbols-outlined text-[22px]">
                                  {isCompleting ? 'progress_activity' : 'radio_button_unchecked'}
                                </span>
                              </button>
                            ) : (
                              <span
                                className="material-symbols-outlined text-[22px] text-on-surface-variant"
                                title={isObsolete ? 'Hoạt động đã lỗi thời' : 'Trạng thái không được hỗ trợ'}
                              >
                                {isObsolete ? 'block' : 'help'}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getActivityTypeBadge(activity.type)}
                              <h4
                                className={`text-xs sm:text-sm font-bold ${
                                  isActDone ? 'line-through text-on-surface-variant' : 'text-on-surface'
                                }`}
                              >
                                {activity.title}
                              </h4>
                              {isActDone && (
                                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Đã ghi nhận
                                </span>
                              )}
                              {isObsolete && <Badge variant="neutral" size="sm">Đã lỗi thời</Badge>}
                              {disposition === 'unknown' && <Badge variant="warning" size="sm">Không khả dụng</Badge>}
                            </div>
                            <p className="text-xs text-on-surface-variant leading-relaxed">
                              {activity.description}
                            </p>
                          </div>
                        </div>

                        {/* Action CTA */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {isPending && activityLink ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleStartActivity(activity)}
                              icon={<span className="material-symbols-outlined text-[16px]">play_arrow</span>}
                            >
                              Bắt đầu ngay
                            </Button>
                          ) : isPending ? (
                            <span className="text-xs font-semibold text-on-surface-variant">Chưa có đích đến khả dụng</span>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                    </ActivityItem>
                  );
                })}
              </StaggerContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
