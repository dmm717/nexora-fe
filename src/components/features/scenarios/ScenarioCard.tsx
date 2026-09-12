'use client';

import React from 'react';
import Link from 'next/link';
import styles from './ScenarioAcademy.module.css';
import type { ScenarioCard as ScenarioCardType } from '@/types/scenario';

interface ScenarioCardProps {
  scenario: ScenarioCardType;
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  const diff = (scenario.difficulty || 'easy').toLowerCase();
  const diffLabel = diff === 'hard' ? 'Khó' : diff === 'medium' ? 'Vừa' : 'Dễ';
  const badgeClass =
    diff === 'hard'
      ? styles.badgeHard
      : diff === 'medium'
      ? styles.badgeMedium
      : styles.badgeEasy;

  return (
    <article className={styles.cardItem} aria-label={scenario.title}>
      <div className={styles.cardHeader}>
        <span className={styles.cardCategory}>{scenario.categoryName}</span>
        <span className={`${styles.difficultyPill} ${badgeClass}`}>
          {diffLabel}
        </span>
      </div>

      <h3 className={styles.cardTitle}>{scenario.title}</h3>

      <p className={styles.cardSummary}>{scenario.summary}</p>

      <div className={styles.cardMetaTags}>
        {scenario.competency && (
          <span className={styles.competencyBadge}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {scenario.competency}
          </span>
        )}
        <span className={styles.timeBadge}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {scenario.estimatedMinutes} phút
        </span>
      </div>

      <div className={styles.cardFooter}>
        <Link
          href={`/scenarios/${scenario.slug}`}
          className={styles.btnPracticeAction}
          aria-label={`Luyện tình huống: ${scenario.title}`}
        >
          <span>Luyện tình huống</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
