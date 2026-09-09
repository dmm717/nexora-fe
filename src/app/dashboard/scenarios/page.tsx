'use client';

import React, { useState, useMemo } from 'react';
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

export default function ScenarioAcademyPage() {
  const [filters, setFilters] = useState<ScenarioFilterParams>({});

  const { data: progressData } = useScenarioProgress();
  const { data: categories = [] } = useScenarioCategories();
  const { data: scenarioPage, isLoading: scenariosLoading } = useScenarios(filters);

  const scenarios = useMemo(() => scenarioPage?.items || [], [scenarioPage?.items]);

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

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleSelectRecommendedDifficulty = (recommended: string) => {
    setFilters((prev) => ({ ...prev, difficulty: recommended, page: 1 }));
  };

  return (
    <main className={styles.academyRoot}>
      {/* Progress & Coaching Hero */}
      <ScenarioProgressOverview
        progress={progressData}
        onSelectRecommendedDifficulty={handleSelectRecommendedDifficulty}
      />

      {/* Filter Toolbar */}
      <ScenarioFilters
        categories={categories}
        filters={filters}
        onFilterChange={setFilters}
        availableCompetencies={competencyOptions}
      />

      {/* Grid of Scenarios */}
      <ScenarioGrid
        scenarios={scenarios}
        isLoading={scenariosLoading}
        hasFilters={hasFilters}
        onResetFilters={handleResetFilters}
      />
    </main>
  );
}
