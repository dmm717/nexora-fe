'use client';

import React from 'react';
import Link from 'next/link';
import styles from './NextPracticeRecommendationCard.module.css';
import {
  getRecommendationDeepLink,
  type NextPracticeRecommendationResponse,
} from '@/services/recommendationsApi';
import { LearningPathValues } from '@/services/learningPathContract';
import { ApiError } from '@/services/apiClient';

function getActivityBadgeClass(activityType: string): string {
  switch (activityType) {
    case LearningPathValues.Scenario:
      return styles.badgeScenario;
    case LearningPathValues.StarDrill:
      return styles.badgeStar;
    case LearningPathValues.Interview:
      return styles.badgeInterview;
    case LearningPathValues.ResumeImprovement:
      return styles.badgeResume;
    case LearningPathValues.ExternalLearning:
    default:
      return styles.badgeExternal;
  }
}

function getActivityTypeLabel(activityType: string): string {
  switch (activityType) {
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
      return activityType;
  }
}

function getActivityActionLabel(activityType: string): string {
  switch (activityType) {
    case LearningPathValues.Scenario:
      return 'Bắt đầu luyện tình huống →';
    case LearningPathValues.StarDrill:
      return 'Luyện trả lời STAR →';
    case LearningPathValues.Interview:
      return 'Bắt đầu phỏng vấn →';
    case LearningPathValues.ResumeImprovement:
      return 'Xem lại CV →';
    default:
      return 'Bắt đầu ngay →';
  }
}

export interface NextPracticeRecommendationContentProps {
  recommendation?: NextPracticeRecommendationResponse | null;
  isLoading?: boolean;
  error?: unknown;
  refetch?: () => void;
  isFetching?: boolean;
}

/**
 * Pure presentation component for next practice recommendation.
 * Does NOT call useNextRecommendation() or trigger any network queries.
 */
export function NextPracticeRecommendationContent({
  recommendation,
  isLoading = false,
  error = null,
  refetch,
  isFetching = false,
}: NextPracticeRecommendationContentProps) {
  if (isLoading) {
    return (
      <div className={styles.loadingCard} role="status" aria-live="polite">
        <span>Đang tính toán đề xuất luyện tập phù hợp nhất...</span>
      </div>
    );
  }

  // Handle deterministic prerequisite and general errors
  if (error) {
    const apiError = error instanceof ApiError ? error : null;
    const isNoGoal = apiError?.code === 'ACTIVE_CAREER_GOAL_REQUIRED';
    const isNoPath =
      apiError?.code === 'LEARNING_PATH_NOT_FOUND' || apiError?.status === 404;

    if (isNoGoal) {
      return (
        <div className={styles.errorCard} role="alert">
          <div className={styles.errorTitle}>Chưa thiết lập mục tiêu nghề nghiệp</div>
          <p className={styles.errorMsg}>
            Hệ thống cần mục tiêu nghề nghiệp để đề xuất bài luyện tập trọng tâm cho bạn.
          </p>
          <div className={styles.errorActions}>
            <Link href="/dashboard/career-goals" className={styles.btnAction}>
              Thiết lập mục tiêu nghề nghiệp →
            </Link>
          </div>
        </div>
      );
    }

    if (isNoPath) {
      return (
        <div className={styles.errorCard} role="alert">
          <div className={styles.errorTitle}>Chưa tạo lộ trình học tập</div>
          <p className={styles.errorMsg}>
            Hãy tạo lộ trình học tập để nhận đề xuất bài luyện tập phù hợp với kỹ năng còn thiếu.
          </p>
          <div className={styles.errorActions}>
            <Link href="/dashboard/learning-path" className={styles.btnAction}>
              Đến Lộ trình học →
            </Link>
          </div>
        </div>
      );
    }

    const message =
      apiError?.message || (error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải đề xuất.');

    return (
      <div className={styles.errorCard} role="alert">
        <div className={styles.errorTitle}>Không thể tải đề xuất luyện tập</div>
        <p className={styles.errorMsg}>{message}</p>
        {(apiError?.code || apiError?.requestId) && (
          <div className={styles.errorDetails}>
            {apiError.code && <span>Mã lỗi: {apiError.code}</span>}
            {apiError.code && apiError.requestId && <span> · </span>}
            {apiError.requestId && <span>Mã yêu cầu: {apiError.requestId}</span>}
          </div>
        )}
        {refetch && (
          <div className={styles.errorActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? 'Đang thử lại...' : 'Thử lại'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Null recommendation is a completely valid state
  if (!recommendation) {
    return (
      <div className={styles.nullCard}>
        <span>🎯</span>
        <span>Hiện chưa có bài luyện tập tiếp theo được đề xuất.</span>
      </div>
    );
  }

  const deepLink = getRecommendationDeepLink(recommendation);

  return (
    <section
      className={styles.card}
      aria-label="Đề xuất luyện tập tiếp theo"
    >
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.sparkleIcon} aria-hidden="true">💡</span>
          <h2 className={styles.title}>Đề xuất luyện tập tiếp theo</h2>
        </div>
        <div className={styles.metaGroup}>
          <span
            className={`${styles.badge} ${getActivityBadgeClass(
              recommendation.activityType
            )}`}
          >
            {getActivityTypeLabel(recommendation.activityType)}
          </span>
          <span className={styles.pill}>
            Ưu tiên: {recommendation.priority}
          </span>
          {recommendation.estimatedMinutes > 0 && (
            <span className={styles.pill}>
              ⏱ ~{recommendation.estimatedMinutes} phút
            </span>
          )}
        </div>
      </div>

      <div className={styles.reasonBox}>
        <p className={styles.reasonText}>{recommendation.reason}</p>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerHint}>
          Dựa trên mục tiêu nghề nghiệp và khoảng trống năng lực của bạn
        </span>
        {deepLink ? (
          <Link href={deepLink} className={styles.btnAction}>
            {getActivityActionLabel(recommendation.activityType)}
          </Link>
        ) : (
          <span className={styles.footerHint}>
            Hoạt động này nằm trong lộ trình học của bạn
          </span>
        )}
      </div>
    </section>
  );
}
