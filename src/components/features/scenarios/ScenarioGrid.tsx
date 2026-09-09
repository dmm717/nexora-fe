'use client';

import React from 'react';
import styles from './ScenarioAcademy.module.css';
import { ScenarioCard } from './ScenarioCard';
import { ScenarioCardSkeleton } from './ScenarioSkeleton';
import type { ScenarioCard as ScenarioCardType } from '@/types/scenario';
import { getScenarioErrorMessage, type PaginationResult } from '@/utils/scenarioHelpers';

interface ScenarioGridProps {
  scenarios: ScenarioCardType[];
  isLoading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  hasFilters?: boolean;
  onResetFilters?: () => void;
  pagination?: PaginationResult;
  onPageChange?: (page: number) => void;
}

export function ScenarioGrid({
  scenarios,
  isLoading = false,
  error = null,
  onRetry,
  hasFilters = false,
  onResetFilters,
  pagination,
  onPageChange,
}: ScenarioGridProps) {
  // 1. Loading state
  if (isLoading) {
    return (
      <div
        className={styles.scenarioGrid}
        aria-busy="true"
        aria-label="Đang tải danh sách tình huống"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <ScenarioCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  // 2. Real API / Server error state
  if (error) {
    const errorText = getScenarioErrorMessage(
      error,
      'Đã xảy ra lỗi kết nối khi tải danh sách tình huống. Vui lòng thử lại.'
    );

    return (
      <section className={styles.catalogueErrorContainer} role="alert" aria-label="Lỗi tải dữ liệu">
        <div className={styles.catalogueErrorIcon}>
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
        <h3 className={styles.emptyTitle}>Không thể tải danh sách tình huống</h3>
        <p className={styles.emptyDescription}>{errorText}</p>
        {onRetry && (
          <button
            type="button"
            className={styles.btnSecondaryAction}
            onClick={onRetry}
            aria-label="Thử tải lại danh sách"
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
            Thử tải lại
          </button>
        )}
      </section>
    );
  }

  // 3. Genuine empty catalogue / empty filter results state
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

  // 4. Populated scenario grid with optional pagination controls
  return (
    <>
      <section className={styles.scenarioGrid} aria-label="Danh sách tình huống luyện tập">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </section>

      {pagination && pagination.shouldShowPagination && onPageChange && (
        <nav
          className={styles.paginationContainer}
          aria-label="Điều hướng trang danh sách tình huống"
        >
          <button
            type="button"
            className={styles.paginationBtn}
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            aria-label="Trang trước"
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Trước
          </button>

          <span className={styles.paginationInfo}>
            Trang <strong>{pagination.currentPage}</strong> / {pagination.totalPages}
            <span className={styles.paginationTotal}>
              ({pagination.total} tình huống)
            </span>
          </span>

          <button
            type="button"
            className={styles.paginationBtn}
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            aria-label="Trang sau"
          >
            Sau
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
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </nav>
      )}
    </>
  );
}
