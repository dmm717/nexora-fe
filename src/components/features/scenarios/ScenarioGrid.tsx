'use client';

import React from 'react';
import styles from './ScenarioAcademy.module.css';
import { ScenarioCard } from './ScenarioCard';
import { ScenarioCardSkeleton } from './ScenarioSkeleton';
import type { ScenarioCard as ScenarioCardType } from '@/types/scenario';

interface ScenarioGridProps {
  scenarios: ScenarioCardType[];
  isLoading?: boolean;
  hasFilters?: boolean;
  onResetFilters?: () => void;
}

export function ScenarioGrid({
  scenarios,
  isLoading = false,
  hasFilters = false,
  onResetFilters,
}: ScenarioGridProps) {
  if (isLoading) {
    return (
      <div className={styles.scenarioGrid} aria-busy="true" aria-label="Đang tải danh sách tình huống">
        {Array.from({ length: 6 }).map((_, index) => (
          <ScenarioCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <section className={styles.emptyStateContainer} aria-label="Không có tình huống">
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
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>
        <h3 className={styles.emptyTitle}>
          {hasFilters
            ? 'Không tìm thấy tình huống phù hợp với bộ lọc'
            : 'Hiện tại chưa có tình huống nào được xuất bản'}
        </h3>
        <p className={styles.emptyDescription}>
          {hasFilters
            ? 'Hãy thử thay đổi từ khóa tìm kiếm, độ khó hoặc nhóm ngành nghề để khám phá thêm bài tập.'
            : 'Hệ thống đang cập nhật các tình huống phỏng vấn mới. Vui lòng quay lại sau.'}
        </p>
        {hasFilters && onResetFilters && (
          <button
            type="button"
            className={styles.btnSecondaryAction}
            onClick={onResetFilters}
          >
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
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Xóa bộ lọc tìm kiếm
          </button>
        )}
      </section>
    );
  }

  return (
    <section className={styles.scenarioGrid} aria-label="Danh sách tình huống luyện tập">
      {scenarios.map((scenario) => (
        <ScenarioCard key={scenario.id} scenario={scenario} />
      ))}
    </section>
  );
}
