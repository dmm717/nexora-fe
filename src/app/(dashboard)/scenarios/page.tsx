'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/motion';
import {
  useScenarios,
  useScenarioCategories,
  useScenarioProgress,
} from '@/hooks/queries/useScenarios';
import type { ScenarioFilterParams, ScenarioDifficulty } from '@/types/scenario';
import { calculatePagination, SCENARIO_PAGE_SIZE } from '@/utils/scenarioHelpers';
import { getQueryPresentation } from '@/utils/queryPresentation';

const PAGE_SIZE = SCENARIO_PAGE_SIZE;

export default function ScenarioAcademyPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ScenarioFilterParams>({});
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const queryParams = useMemo<ScenarioFilterParams>(() => {
    return {
      ...filters,
      search: searchQuery.trim() || undefined,
      page,
      pageSize: PAGE_SIZE,
    };
  }, [filters, searchQuery, page]);

  const {
    data: progressData,
    isLoading: progressLoading,
    isError: progressError,
    isFetching: progressFetching,
    refetch: refetchProgress,
  } = useScenarioProgress();

  const { data: categories = [] } = useScenarioCategories();

  const {
    data: scenarioPage,
    isLoading: scenariosLoading,
    isError: scenariosIsError,
    isFetching: scenariosFetching,
    refetch: refetchScenarios,
  } = useScenarios(queryParams);

  const scenarioPresentation = getQueryPresentation({
    hasData: scenarioPage !== undefined,
    isLoading: scenariosLoading,
    isError: scenariosIsError,
    isFetching: scenariosFetching,
  });
  const progressPresentation = getQueryPresentation({
    hasData: progressData !== undefined,
    isLoading: progressLoading,
    isError: progressError,
    isFetching: progressFetching,
  });
  const showInitialScenarioLoading =
    scenarioPresentation.showInitialLoading || (scenarioPage === undefined && !scenariosIsError);

  const scenarios = useMemo(() => scenarioPage?.items || [], [scenarioPage?.items]);
  const totalScenarios = scenarioPage?.total ?? 0;

  const pagination = useMemo(
    () => calculatePagination(totalScenarios, page, PAGE_SIZE),
    [totalScenarios, page]
  );

  // Extract unique competencies from progress or current scenarios for filter options
  const competencyOptions = useMemo(() => {
    const set = new Set<string>();
    if (progressData?.competencies) {
      progressData.competencies.forEach((c) => {
        if (c.competency) set.add(c.competency);
      });
    }
    scenarios.forEach((s) => {
      if (s.competency) set.add(s.competency);
    });
    return Array.from(set).sort();
  }, [progressData, scenarios]);

  const hasFilters = Boolean(
    filters.category ||
    filters.difficulty ||
    filters.competency ||
    searchQuery.trim()
  );

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  }, []);

  // Pick recommended scenario
  const recommendedScenario = useMemo(() => {
    if (scenarios.length === 0) return null;
    const recDiff = progressData?.recommendedDifficulty;
    if (recDiff) {
      const match = scenarios.find((s) => s.difficulty === recDiff);
      if (match) return match;
    }
    return scenarios[0];
  }, [scenarios, progressData]);

  const hasProgressAuthority = progressData !== undefined;
  const isNewUser = hasProgressAuthority && progressData.completedAttempts === 0;
  const recommendationLabel = !hasProgressAuthority
    ? 'Tình huống gợi ý'
    : isNewUser
      ? 'Gợi ý để bắt đầu'
      : 'Tình huống ưu tiên hôm nay';
  const recommendationAction = !hasProgressAuthority
    ? 'Xem tình huống'
    : isNewUser
      ? 'Bắt đầu giải quyết'
      : 'Luyện lại tình huống';
  const displayedScenarioCount = scenarioPage ? totalScenarios : '—';

  const renderDifficultyBadge = (diff: string) => {
    const d = (diff || '').toLowerCase();
    if (d === 'easy' || d === 'dễ') {
      return <Badge variant="info" size="sm">Dễ</Badge>;
    }
    if (d === 'medium' || d === 'trung bình' || d === 'vừa') {
      return <Badge variant="warning" size="sm">Trung bình</Badge>;
    }
    return <Badge variant="error" size="sm">Khó</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link href="/practice" className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Luyện tập</span>
        </Link>
        <span>/</span>
        <span className="text-on-surface font-semibold">Kho tình huống</span>
      </div>

      {/* Catalogue Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            <span>Kho đề tình huống thực chiến</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Kho tình huống kỹ thuật thực chiến
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-3xl leading-relaxed">
            Chọn một tình huống thực tế để luyện cách phân tích, ra quyết định và trình bày hướng xử lý. Giải pháp được chấm điểm theo rubric Senior & Architect.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant font-medium bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30">
            {displayedScenarioCount} tình huống khả dụng
          </span>
        </div>
      </div>

      {/* Top Highlight / Recommended Scenario Card */}
      {recommendedScenario && (
        <Card
          variant="elevated"
          padding="lg"
          className="relative overflow-hidden border-2 border-secondary/40 bg-gradient-to-br from-white via-white to-secondary-container/10 shadow-card"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-white">
                  {recommendationLabel}
                </span>
                <Badge variant="outline" size="sm">
                  {recommendedScenario.categoryName}
                </Badge>
                {renderDifficultyBadge(recommendedScenario.difficulty)}
                <span className="text-xs text-on-surface-variant flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span>{recommendedScenario.estimatedMinutes} phút</span>
                </span>
              </div>

              <div>
                <h3
                  className="text-lg sm:text-xl font-bold text-on-surface hover:text-secondary transition-colors cursor-pointer"
                  onClick={() => router.push(`/practice/scenarios/${recommendedScenario.slug}`)}
                >
                  {recommendedScenario.title}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed line-clamp-2">
                  {recommendedScenario.summary}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-on-surface-variant font-medium">Năng lực trọng tâm:</span>
                <Badge variant="neutral" size="sm">
                  {recommendedScenario.competency}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push(`/practice/scenarios/${recommendedScenario.slug}`)}
                icon={<span className="material-symbols-outlined text-[18px]">play_arrow</span>}
                iconPosition="right"
                className="w-full sm:w-auto shadow-sm"
              >
                {recommendationAction}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filter & Search Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm kiếm tình huống, từ khóa, công nghệ..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-outline-variant/60 bg-white text-xs sm:text-sm focus:border-secondary focus:outline-none placeholder:text-on-surface-variant/60 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            )}
          </div>

          {/* Reset Filters button */}
          {hasFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-primary font-semibold hover:underline self-start sm:self-center cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Filter Chips Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Category Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Danh mục chuyên môn
            </label>
            <select
              value={filters.category || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((prev) => ({
                  ...prev,
                  category: val === 'all' ? undefined : val,
                }));
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-outline-variant/60 bg-white text-xs text-on-surface font-medium focus:border-secondary focus:outline-none"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id || c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Độ khó
            </label>
            <select
              value={filters.difficulty || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((prev) => ({
                  ...prev,
                  difficulty: val === 'all' ? undefined : (val as ScenarioDifficulty),
                }));
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-outline-variant/60 bg-white text-xs text-on-surface font-medium focus:border-secondary focus:outline-none"
            >
              <option value="all">Tất cả độ khó</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>

          {/* Competency Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Năng lực rèn luyện
            </label>
            <select
              value={filters.competency || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((prev) => ({
                  ...prev,
                  competency: val === 'all' ? undefined : val,
                }));
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-outline-variant/60 bg-white text-xs text-on-surface font-medium focus:border-secondary focus:outline-none"
            >
              <option value="all">Tất cả năng lực</option>
              {competencyOptions.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="space-y-4" aria-busy={scenarioPresentation.showRefreshing || undefined}>
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
          <h2 className="text-base sm:text-lg font-bold text-on-surface">
            Tất cả tình huống ({displayedScenarioCount})
          </h2>
          {scenarioPresentation.showRefreshing && (
            <span role="status" className="text-xs text-on-surface-variant">
              Đang cập nhật kết quả…
            </span>
          )}
        </div>

        {progressPresentation.showInitialLoading && (
          <p role="status" className="text-xs text-on-surface-variant">
            Đang tải tiến độ luyện tập…
          </p>
        )}
        {(progressPresentation.showBlockingError || progressPresentation.showBackgroundError) && (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300/80 bg-amber-50/80 p-3.5 text-xs text-amber-950">
            <span>
              Không thể cập nhật tiến độ luyện tập.
              {progressData ? ' Tiến độ hiện có vẫn được giữ nguyên.' : ' Chưa thể xác định trạng thái bắt đầu của bạn.'}
            </span>
            <Button variant="outline" size="sm" onClick={() => void refetchProgress()} disabled={progressFetching}>
              {progressFetching ? 'Đang thử lại…' : 'Thử tải lại tiến độ'}
            </Button>
          </div>
        )}

        {showInitialScenarioLoading ? (
          <div role="status" aria-label="Loading scenarios" className="grid grid-cols-1 md:grid-cols-2 gap-5 py-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`skel-${i}`} className="p-6 rounded-2xl bg-white border border-outline-variant/40 shadow-subtle space-y-3" aria-hidden="true">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : scenarioPresentation.showBlockingError ? (
          <Card variant="subtle" padding="lg" className="text-center py-10 space-y-3">
            <div className="text-sm font-bold text-error">Không thể tải danh sách tình huống</div>
            <p className="text-xs text-on-surface-variant">Vui lòng kiểm tra kết nối và thử lại.</p>
            <Button variant="outline" size="sm" onClick={() => refetchScenarios()}>
              Thử lại
            </Button>
          </Card>
        ) : scenarioPage && scenarios.length === 0 ? (
          <Card variant="subtle" padding="lg" className="text-center py-12 space-y-3">
            <span className="material-symbols-outlined text-[36px] text-on-surface-variant/60">
              filter_list_off
            </span>
            <div className="text-sm font-bold text-on-surface">Không tìm thấy tình huống phù hợp</div>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Hãy thử chọn lại danh mục hoặc xóa từ khóa tìm kiếm để hiển thị đầy đủ kho tình huống.
            </p>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Xem tất cả tình huống
              </Button>
            )}
          </Card>
        ) : scenarioPage ? (
          <div className="space-y-4">
            {scenarioPresentation.showBackgroundError && (
              <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300/80 bg-amber-50/80 p-3.5 text-xs text-amber-950">
                <span>Không thể cập nhật danh sách. Kết quả đang hiển thị được giữ nguyên.</span>
                <Button variant="outline" size="sm" onClick={() => void refetchScenarios()} disabled={scenariosFetching}>
                  {scenariosFetching ? 'Đang thử lại…' : 'Thử tải lại'}
                </Button>
              </div>
            )}
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {scenarios.map((sc, index) => {
              const ScenarioItem = index < 8 ? StaggerItem : React.Fragment;
              return (
              <ScenarioItem key={sc.id}>
              <Card
                key={sc.id}
                variant="interactive"
                padding="lg"
                onClick={() => router.push(`/practice/scenarios/${sc.slug}`)}
                className="flex flex-col justify-between border-outline-variant/60 hover:border-secondary transition-all space-y-4 group bg-white shadow-subtle hover:shadow-card cursor-pointer"
              >
                <div className="space-y-3">
                  {/* Card Top Meta */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral" size="sm">
                        {sc.categoryName}
                      </Badge>
                      {renderDifficultyBadge(sc.difficulty)}
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h3 className="font-bold text-base text-on-surface group-hover:text-secondary transition-colors line-clamp-2">
                      {sc.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">
                      {sc.summary}
                    </p>
                  </div>

                  {/* Competency */}
                  {sc.competency && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                        <span>{sc.competency}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1 font-mono">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span>{sc.estimatedMinutes} phút</span>
                  </span>

                  <span className="text-secondary font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Vào giải quyết</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Card>
              </ScenarioItem>
              );
            })}
            </StaggerContainer>
          </div>
        ) : null}

        {/* Pagination */}
        {pagination.shouldShowPagination && (
          <div className="flex items-center justify-between pt-6 border-t border-outline-variant/30">
            <span className="text-xs text-on-surface-variant">
              Trang {pagination.currentPage} / {pagination.totalPages} ({totalScenarios} tình huống)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage || scenariosFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage || scenariosFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
