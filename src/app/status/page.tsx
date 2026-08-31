'use client';

import React, { useEffect, useState } from 'react';
import styles from './StatusPage.module.css';
import { healthApi, HealthStatus, OperationStatus } from '@/services/healthApi';

export default function SystemStatusPage() {
  const [liveness, setLiveness] = useState<string>('Loading...');
  const [readiness, setReadiness] = useState<HealthStatus | null>(null);
  const [operations, setOperations] = useState<OperationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [liveRes, readyRes, opsRes] = await Promise.all([
        healthApi.getLiveness(),
        healthApi.getReadiness(),
        healthApi.getOperations()
      ]);
      setLiveness(liveRes);
      setReadiness(readyRes);
      setOperations(opsRes);
    } catch (error) {
      console.error('Failed to fetch health status', error);
      setLiveness('Offline');
      setReadiness({ status: 'Offline' });
      setOperations({ status: 'Offline' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusClass = (status: string | undefined) => {
    if (!status) return styles.badgeUnknown;
    const s = status.toLowerCase();
    if (s === 'healthy' || s === 'ok' || s === 'active') return styles.badgeHealthy;
    if (s === 'degraded' || s === 'warning') return styles.badgeDegraded;
    return styles.badgeOffline;
  };

  const getOverallStatus = () => {
    const s1 = liveness.toLowerCase();
    const s2 = readiness?.status.toLowerCase() || 'unknown';
    const s3 = operations?.status.toLowerCase() || 'unknown';

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

  const overall = getOverallStatus();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.brand}>NEXORA</span>
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

        <button onClick={fetchStatus} className={styles.refreshBtn} disabled={loading}>
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
