'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from '@/components/features/scenarios/ScenarioAcademy.module.css';
import {
  ScenarioProgressOverview,
  ScenarioFilters,
  ScenarioGrid,
} from '@/components/features/scenarios';
import {
  useScenarios,
  useScenarioCategories,
  useScenarioProgress,
} from '@/hooks/queries/useScenarios';
import type { ScenarioFilterParams } from '@/types/scenario';
import { calculatePagination, SCENARIO_PAGE_SIZE } from '@/utils/scenarioHelpers';

const PAGE_SIZE = SCENARIO_PAGE_SIZE;

export default function ScenarioAcademyPage() {
  const [filters, setFilters] = useState<ScenarioFilterParams>({});
  const [page, setPage] = useState<number>(1);

  const queryParams = useMemo<ScenarioFilterParams>(() => {
    return {
      ...filters,
      page,
      pageSize: PAGE_SIZE,
    };
  }, [filters, page]);

  const {
    data: progressData,
    isLoading: progressLoading,
    isError: progressError,
    refetch: refetchProgress,
  } = useScenarioProgress();
  const { data: categories = [] } = useScenarioCategories();
  const {
    data: scenarioPage,
    isLoading: scenariosLoading,
    error: scenariosError,
    refetch: refetchScenarios,
  } = useScenarios(queryParams);

  const scenarios = useMemo(() => scenarioPage?.items || [], [scenarioPage?.items]);
  const totalScenarios = scenarioPage?.total ?? 0;

  const pagination = useMemo(
    () => calculatePagination(totalScenarios, page, PAGE_SIZE),
    [totalScenarios, page]
  );

  // When filters change: always reset page to 1
  const handleFilterChange = useCallback((updated: ScenarioFilterParams) => {
    const nextFilters = { ...updated };
    delete nextFilters.page;
    delete nextFilters.pageSize;
    setFilters(nextFilters);
    setPage(1);
  }, []);

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
    filters.search
  );

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const handleSelectRecommendedDifficulty = useCallback((recommended: string) => {
    setFilters((prev) => ({ ...prev, difficulty: recommended }));
    setPage(1);
  }, []);

  return (
    <main className={styles.academyRoot}>
      {/* Progress & Coaching Hero */}
      <ScenarioProgressOverview
        progress={progressData}
        isLoading={progressLoading}
        isError={progressError}
        onRetry={() => {
          void refetchProgress();
        }}
        onSelectRecommendedDifficulty={handleSelectRecommendedDifficulty}
      />

      {/* Filter Toolbar */}
      <ScenarioFilters
        categories={categories}
        filters={filters}
        onFilterChange={handleFilterChange}
        availableCompetencies={competencyOptions}
      />

      {/* Grid of Scenarios */}
      <ScenarioGrid
        scenarios={scenarios}
        isLoading={scenariosLoading}
        error={scenariosError}
        onRetry={() => {
          void refetchScenarios();
        }}
        hasFilters={hasFilters}
        onResetFilters={handleResetFilters}
        pagination={pagination}
        onPageChange={setPage}
      />
    </main>
  );
}
