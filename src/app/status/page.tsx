'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './StatusPage.module.css';
import { useHealthLiveness, useHealthReadiness, useHealthOperations } from '@/hooks/queries/useHealth';

const getStatusClass = (status: string | undefined) => {
  if (!status) return styles.badgeUnknown;
  const s = status.toLowerCase();
  if (s === 'healthy' || s === 'ok' || s === 'active') return styles.badgeHealthy;
  if (s === 'degraded' || s === 'warning') return styles.badgeDegraded;
  return styles.badgeOffline;
};
const getOverallStatus = (liveness: string, readinessStatus: string, operationsStatus: string) => {
  const s1 = liveness.toLowerCase();
  const s2 = readinessStatus.toLowerCase();
  const s3 = operationsStatus.toLowerCase();

  if (s1 === 'offline' || s2 === 'offline' || s2 === 'unhealthy' || s3 === 'offline') {
    return { text: 'System Outage', className: styles.offline };
  }
  if (s2 === 'degraded' || s3 === 'degraded' || s3 === 'warning') {
    return { text: 'Degraded Performance', className: styles.degraded };
  }
  if ((s1 === 'healthy' || s1 === 'ok') && s2 === 'healthy' && (s3 === 'healthy' || s3 === 'ok')) {
    return { text: 'All Systems Operational', className: styles.healthy };
  }
  return { text: 'Checking Systems...', className: styles.degraded };
};

export default function SystemStatusPage() {
  const router = useRouter();
  const { data: livenessRes, isLoading: livenessLoading, refetch: refetchLiveness } = useHealthLiveness();
  const { data: readinessRes, isLoading: readinessLoading, refetch: refetchReadiness } = useHealthReadiness();
  const { data: operationsRes, isLoading: operationsLoading, refetch: refetchOperations } = useHealthOperations();

  const handleRefresh = () => {
    refetchLiveness();
    refetchReadiness();
    refetchOperations();
  };

  const loading = livenessLoading || readinessLoading || operationsLoading;
  
  const liveness = livenessRes || (livenessLoading ? 'Loading...' : 'Offline');
  const readiness = readinessRes || (readinessLoading ? null : { status: 'Offline', totalDuration: '0ms', entries: {} });
  const operations = operationsRes || (operationsLoading ? null : { status: 'Offline', totalDuration: '0ms', entries: {}, activeJobs: 0, failedJobs: 0, lastProcessed: 'N/A' });

  if (loading && !readiness) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Fetching system status...</p>
        </div>
      </div>
    );
  }

  const overall = getOverallStatus(
    liveness, 
    readiness?.status || 'unknown', 
    operations?.status || 'unknown'
  );

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.headerTop}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Trở lại
          </button>
        </div>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Image src="/logo.png" alt="Nexora" width={128} height={32} style={{ width: 'auto', height: '32px' }} priority />
          </div>
          <h1 className={styles.title}>System Status</h1>
          <div className={`${styles.overallStatus} ${overall.className}`}>
            <div className={styles.pulse}></div>
            {overall.text}
          </div>
        </div>

        <div className={styles.grid}>
          {/* Liveness Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <svg className={styles.cardIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                Core API (Liveness)
              </div>
              <span className={`${styles.statusBadge} ${getStatusClass(liveness)}`}>
                {liveness}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Endpoint</span>
              <span className={styles.detailValue}>/health/live</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Protocol</span>
              <span className={styles.detailValue}>HTTP/2</span>
            </div>
          </div>

          {/* Readiness Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <svg className={styles.cardIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
                Database (Readiness)
              </div>
              <span className={`${styles.statusBadge} ${getStatusClass(readiness?.status)}`}>
                {readiness?.status || 'Unknown'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Total Duration</span>
              <span className={styles.detailValue}>{readiness?.totalDuration || '0ms'}</span>
            </div>
            {readiness?.entries && Object.entries(readiness.entries).map(([key, val]) => (
              <div className={styles.detailRow} key={key}>
                <span className={styles.detailLabel}>{key}</span>
                <span className={styles.detailValue}>{val.status} ({val.duration || '0ms'})</span>
              </div>
            ))}
          </div>

          {/* Operations Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <svg className={styles.cardIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Background Jobs
              </div>
              <span className={`${styles.statusBadge} ${getStatusClass(operations?.status)}`}>
                {operations?.status || 'Unknown'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Active Jobs</span>
              <span className={styles.detailValue}>{operations?.activeJobs || 0}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Failed Jobs</span>
              <span className={styles.detailValue}>{operations?.failedJobs || 0}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Last Processed</span>
              <span className={styles.detailValue}>{operations?.lastProcessed || 'N/A'}</span>
            </div>
          </div>
        </div>

        <button onClick={handleRefresh} className={styles.refreshBtn} disabled={loading}>
          <svg className={loading ? styles.spinner : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>
    </div>
  );
}
