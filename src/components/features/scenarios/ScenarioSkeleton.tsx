'use client';
import React from 'react';
import styles from './ScenarioAcademy.module.css';

export function ScenarioProgressSkeleton() {
  return (
    <div className={styles.coachingPanel} aria-busy="true" aria-label="Đang tải dữ liệu tiến bộ">
      <div className={styles.coachingNextStep}>
        <div className={styles.skeletonLine} style={{ width: '30%', height: '1rem', marginBottom: '0.5rem' }} />
        <div className={styles.skeletonLine} style={{ width: '60%', height: '2rem', marginBottom: '0.5rem' }} />
        <div className={styles.skeletonLine} style={{ width: '80%', height: '1.25rem' }} />
      </div>
      <div className={styles.metricsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.metricCard}>
            <div className={styles.skeletonLine} style={{ width: '50%', height: '0.75rem', marginBottom: '0.5rem' }} />
            <div className={styles.skeletonLine} style={{ width: '70%', height: '1.5rem' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScenarioCardSkeleton() {
  return (
    <div className={styles.cardItem} aria-busy="true">
      <div className={styles.cardHeader}>
        <div className={styles.skeletonLine} style={{ width: '35%', height: '0.875rem' }} />
        <div className={styles.skeletonLine} style={{ width: '20%', height: '1.25rem', borderRadius: '9999px' }} />
      </div>
      <div className={styles.skeletonLine} style={{ width: '75%', height: '1.25rem', marginBottom: '0.5rem' }} />
      <div className={styles.skeletonLine} style={{ width: '100%', height: '3rem', marginBottom: '1rem' }} />
      <div className={styles.cardFooter}>
        <div className={styles.skeletonLine} style={{ width: '100%', height: '2.25rem' }} />
      </div>
    </div>
  );
}

export function ScenarioPracticeSkeleton() {
  return (
    <div className={styles.practiceContainer} aria-busy="true">
      <div className={styles.skeletonLine} style={{ width: '25%', height: '1rem', marginBottom: '1.5rem' }} />
      <div className={styles.practiceHeader}>
        <div className={styles.skeletonLine} style={{ width: '40%', height: '1.75rem', marginBottom: '0.5rem' }} />
        <div className={styles.skeletonLine} style={{ width: '80%', height: '1.25rem' }} />
      </div>
      <div className={styles.workbenchLayout}>
        <div className={styles.panelCard}>
          <div className={styles.skeletonLine} style={{ width: '100%', height: '300px' }} />
        </div>
        <div className={styles.panelCard}>
          <div className={styles.skeletonLine} style={{ width: '100%', height: '300px' }} />
        </div>
      </div>
    </div>
  );
}
