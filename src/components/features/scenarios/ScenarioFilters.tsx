'use client';
import React, { useEffect, useState } from 'react';
import styles from './ScenarioAcademy.module.css';
import type { ScenarioCategory, ScenarioFilterParams } from '@/types/scenario';

interface ScenarioFiltersProps {
  categories: ScenarioCategory[];
  filters: ScenarioFilterParams;
  onFilterChange: (updated: ScenarioFilterParams) => void;
  availableCompetencies?: string[];
}

export function ScenarioFilters({
  categories,
  filters,
  onFilterChange,
  availableCompetencies = [],
}: ScenarioFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Keep the local input in sync when another control clears or restores filters.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronize controlled filter state after external reset
    setSearchInput(filters.search || '');
  }, [filters.search]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        onFilterChange({ ...filters, search: searchInput.trim() || undefined, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters, onFilterChange]);

  const hasActiveFilters = Boolean(
    filters.category ||
    filters.difficulty ||
    filters.competency ||
    filters.search
  );

  const handleClear = () => {
    setSearchInput('');
    onFilterChange({
      category: undefined,
      difficulty: undefined,
      competency: undefined,
      search: undefined,
      page: 1,
    });
  };

  return (
    <search className={styles.filterToolbar} aria-label="Bộ lọc tình huống">
      {/* Category Horizontal Chips */}
      <div className={styles.categoryChipsBar} role="tablist" aria-label="Chọn lĩnh vực tình huống">
        <button
          type="button"
          role="tab"
          aria-selected={!filters.category}
          className={`${styles.categoryChip} ${!filters.category ? styles.categoryChipActive : ''}`}
          onClick={() => onFilterChange({ ...filters, category: undefined, page: 1 })}
        >
          Tất cả lĩnh vực
        </button>
        {categories.map((cat) => {
          const isActive = filters.category === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.categoryChip} ${isActive ? styles.categoryChipActive : ''}`}
              onClick={() => onFilterChange({ ...filters, category: cat.slug, page: 1 })}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Top Filter Controls: Search + Dropdowns */}
      <div className={styles.filterTopRow}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Tìm theo tiêu đề, kỹ năng, bối cảnh..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Tìm kiếm tình huống"
          />
        </div>

        <div className={styles.filterControls}>
          {/* Difficulty Dropdown */}
          <select
            className={styles.filterSelect}
            value={filters.difficulty || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                difficulty: e.target.value || undefined,
                page: 1,
              })
            }
            aria-label="Chọn độ khó"
          >
            <option value="">Độ khó: Tất cả</option>
            <option value="easy">Dễ (Easy)</option>
            <option value="medium">Vừa (Medium)</option>
            <option value="hard">Khó (Hard)</option>
          </select>

          {/* Competency Dropdown */}
          {availableCompetencies.length > 0 && (
            <select
              className={styles.filterSelect}
              value={filters.competency || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  competency: e.target.value || undefined,
                  page: 1,
                })
              }
              aria-label="Chọn năng lực cốt lõi"
            >
              <option value="">Năng lực: Tất cả</option>
              {availableCompetencies.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.btnClearFilters}
              onClick={handleClear}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>
    </search>
  );
}
