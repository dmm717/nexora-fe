'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './LearningPath.module.css';
import {
  useLearningPath,
  useGenerateLearningPath,
  useRefreshLearningPath,
  useCompleteLearningPathActivity,
} from '@/hooks/queries/useLearningPath';
import {
  LearningPathValues,
  getActivityDeepLink,
  type LearningPathActivityResponse,
} from '@/services/learningPathApi';
import { ApiError } from '@/services/apiClient';
import NextPracticeRecommendationCard from '@/components/features/recommendations/NextPracticeRecommendationCard';

function getActivityTypeBadgeClass(type: string): string {
  switch (type) {
    case LearningPathValues.Scenario:
      return styles.typeBadgeScenario;
    case LearningPathValues.StarDrill:
      return styles.typeBadgeStar;
    case LearningPathValues.Interview:
      return styles.typeBadgeInterview;
    case LearningPathValues.ResumeImprovement:
      return styles.typeBadgeResume;
    case LearningPathValues.ExternalLearning:
    default:
      return styles.typeBadgeExternal;
  }
}

function getActivityTypeLabel(type: string): string {
  switch (type) {
    case LearningPathValues.Scenario:
      return 'Tình huống';
    case LearningPathValues.StarDrill:
      return 'STAR Drill';
    case LearningPathValues.Interview:
      return 'Phỏng vấn';
    case LearningPathValues.ResumeImprovement:
      return 'Cải thiện CV';
    case LearningPathValues.ExternalLearning:
      return 'Tài liệu ngoài';
    default:
      return type;
  }
}

function getActivityActionText(type: string): string {
  switch (type) {
    case LearningPathValues.Scenario:
      return 'Luyện tình huống →';
    case LearningPathValues.StarDrill:
      return 'Luyện STAR →';
    case LearningPathValues.Interview:
      return 'Phỏng vấn thử →';
    case LearningPathValues.ResumeImprovement:
      return 'Xem CV →';
    case LearningPathValues.ExternalLearning:
      return 'Mở tài liệu ↗';
    default:
      return 'Bắt đầu →';
  }
}

export default function LearningPathView() {
  const { data: path, isLoading, error, refetch, isFetching } = useLearningPath();
  const generateMutation = useGenerateLearningPath();
  const refreshMutation = useRefreshLearningPath();
  const completeMutation = useCompleteLearningPathActivity();
  const [actionError, setActionError] = useState<string | null>(null);

  const apiError = error instanceof ApiError ? error : null;
  const isNoGoal = apiError?.code === 'ACTIVE_CAREER_GOAL_REQUIRED';
  const isNotCreated = apiError?.code === 'LEARNING_PATH_NOT_FOUND' || apiError?.status === 404;

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

  const handleCompleteActivity = async (activity: LearningPathActivityResponse) => {
    if (activity.status === LearningPathValues.Completed) return;
    setActionError(null);
    try {
      await completeMutation.mutateAsync(activity.id);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'LEARNING_PATH_ACTIVITY_OBSOLETE') {
        setActionError('Hoạt động này đã thay đổi hoặc không còn hiệu lực trong lộ trình hiện tại.');
      } else {
        setActionError(err instanceof Error ? err.message : 'Không thể đánh dấu hoàn thành hoạt động.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p>Đang tải lộ trình học cá nhân hóa...</p>
      </div>
    );
  }

  if (isNoGoal) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>Chưa thiết lập mục tiêu nghề nghiệp</div>
          <p className={styles.emptySubtitle}>
            Lộ trình học được xây dựng theo mục tiêu công việc và khoảng trống kỹ năng của bạn. Vui lòng tạo mục tiêu nghề nghiệp trước.
          </p>
          <div className={styles.emptyActions}>
            <Link href="/dashboard/career-goals" className={styles.btnPrimary}>
              Thiết lập mục tiêu nghề nghiệp →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isNotCreated && !path) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Lộ Trình Học (Learning Path)</h1>
            <p className={styles.subtitle}>
              Xây dựng lộ trình học tập và rèn luyện dựa trên mục tiêu nghề nghiệp và hồ sơ kỹ năng của bạn.
            </p>
          </div>
        </div>
        {actionError && (
          <div className={styles.errorBanner} role="alert">
            <div>{actionError}</div>
          </div>
        )}
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>Chưa có lộ trình học</div>
          <p className={styles.emptySubtitle}>
            Hệ thống sẽ tổng hợp các điểm khuyết kỹ năng của bạn để tạo ra kế hoạch gồm các bài tập tình huống, phỏng vấn và tài liệu tự học phù hợp nhất.
          </p>
          <div className={styles.emptyActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? 'Đang tạo lộ trình...' : 'Tạo lộ trình học ngay'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const errorMessage = actionError || apiError?.message || (error instanceof Error ? error.message : null);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Lộ Trình Học (Learning Path)</h1>
          <p className={styles.subtitle}>
            Kế hoạch rèn luyện được cá nhân hóa theo kỹ năng còn thiếu để đạt mục tiêu nghề nghiệp.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/dashboard/skill-profile" className={styles.btnSecondary}>
            Xem hồ sơ kỹ năng
          </Link>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleRefresh}
            disabled={refreshMutation.isPending || isFetching}
          >
            {refreshMutation.isPending ? 'Đang đồng bộ...' : 'Cập nhật lộ trình'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <div>
            <strong>Thông báo:</strong> {errorMessage}
            {(apiError?.code || apiError?.requestId) && (
              <div className={styles.errorDetails}>
                {apiError.code && <span>Mã lỗi: {apiError.code}</span>}
                {apiError.code && apiError.requestId && <span> · </span>}
                {apiError.requestId && <span>Mã yêu cầu: {apiError.requestId}</span>}
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => {
              setActionError(null);
              refetch();
            }}
            disabled={isFetching}
          >
            Thử lại
          </button>
        </div>
      )}

      {path && (
        <>
          <NextPracticeRecommendationCard />

          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <span className={styles.progressTitle}>Tiến độ hoàn thành lộ trình</span>
              <span className={styles.progressStats}>
                {path.progress.completedActivityCount} / {path.progress.totalActivityCount} hoạt động ({path.progress.percentage}%)
              </span>
            </div>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${path.progress.percentage}%` }}
              />
            </div>
          </div>

          <div className={styles.milestonesList}>
            {path.milestones.map((milestone) => (
              <section key={milestone.id || milestone.code} className={styles.milestoneCard}>
                <div className={styles.milestoneHeader}>
                  <div className={styles.milestoneTitleGroup}>
                    <span className={styles.milestoneBadge}>Cột mốc {milestone.order}</span>
                    <h2 className={styles.milestoneTitle}>{milestone.title}</h2>
                  </div>
                  <span className={styles.milestoneStatus}>
                    {milestone.activities.filter((a) => a.status === LearningPathValues.Completed).length} / {milestone.activities.length} hoàn thành
                  </span>
                </div>

                <div className={styles.activitiesList}>
                  {milestone.activities.map((act) => {
                    const isCompleted = act.status === LearningPathValues.Completed;
                    const deepLink = getActivityDeepLink(act);
                    const isExternal = act.type === LearningPathValues.ExternalLearning && Boolean(act.externalUrl);
                    const isCompleting = completeMutation.isPending && completeMutation.variables === act.id;

                    return (
                      <div
                        key={act.id}
                        className={`${styles.activityCard} ${isCompleted ? styles.activityCardCompleted : ''}`}
                      >
                        <div className={styles.activityHeader}>
                          <div className={styles.activityTitleGroup}>
                            <span className={`${styles.typeBadge} ${getActivityTypeBadgeClass(act.type)}`}>
                              {getActivityTypeLabel(act.type)}
                            </span>
                            <span className={styles.priorityPill}>Ưu tiên: {act.priority}</span>
                            <div className={`${styles.activityTitle} ${isCompleted ? styles.activityTitleCompleted : ''}`}>
                              {act.title}
                            </div>
                          </div>
                        </div>

                        {act.description && (
                          <div className={styles.activityDescription}>{act.description}</div>
                        )}

                        <div className={styles.activityFooter}>
                          <div className={styles.activityCompetency}>
                            {act.competencyCode && (
                              <span>
                                Kỹ năng: <strong>{act.competencyCode}</strong>
                              </span>
                            )}
                          </div>
                          <div className={styles.activityActions}>
                            {deepLink && !isCompleted && (
                              isExternal ? (
                                <a
                                  href={deepLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.actionLink}
                                >
                                  {getActivityActionText(act.type)}
                                </a>
                              ) : (
                                <Link href={deepLink} className={styles.actionLink}>
                                  {getActivityActionText(act.type)}
                                </Link>
                              )
                            )}
                            {isCompleted ? (
                              <span className={styles.completedLabel}>✓ Đã hoàn thành</span>
                            ) : (
                              <button
                                type="button"
                                className={styles.completeBtn}
                                onClick={() => handleCompleteActivity(act)}
                                disabled={isCompleting}
                              >
                                {isCompleting ? 'Đang lưu...' : 'Đánh dấu xong'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
