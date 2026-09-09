'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from '@/components/features/scenarios/ScenarioAcademy.module.css';
import {
  ScenarioPractice,
  ScenarioPracticeSkeleton,
} from '@/components/features/scenarios';
import { useScenarioDetails } from '@/hooks/queries/useScenarios';
import { ApiError } from '@/services/apiClient';

export default function ScenarioPracticePage() {
  const { slug } = useParams<{ slug: string }>();
  const {
    data: scenario,
    isLoading,
    error: queryError,
    refetch,
    isFetching,
  } = useScenarioDetails(slug);

  if (isLoading) {
    return (
      <main className={styles.practiceContainer}>
        <ScenarioPracticeSkeleton />
      </main>
    );
  }

  if (queryError || !scenario) {
    const notFound =
      queryError instanceof ApiError &&
      (queryError.code === 'SCENARIO_NOT_FOUND' || queryError.code === 'SCENARIO_NOT_PUBLISHED');

    return (
      <main className={styles.practiceContainer}>
        <div className={styles.emptyStateContainer} role="alert" aria-live="assertive">
          <div className={styles.emptyIconWrapper}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>
            {notFound ? 'Không tìm thấy tình huống' : 'Không thể tải tình huống'}
          </h2>
          <p className={styles.emptyDescription}>
            {notFound
              ? 'Tình huống bạn đang truy cập có thể đã được gỡ bỏ hoặc đường dẫn không chính xác.'
              : 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại; nếu lỗi tiếp tục, hãy cung cấp mã yêu cầu cho đội hỗ trợ.'}
          </p>
          {!notFound && (
            <button
              type="button"
              className={styles.btnSecondaryAction}
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? 'Đang thử lại...' : 'Thử tải lại'}
            </button>
          )}
          <Link href="/dashboard/scenarios" className={styles.btnSecondaryAction}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Quay lại Scenario Academy
          </Link>
        </div>
      </main>
    );
  }

  return <ScenarioPractice scenario={scenario} />;
}
