'use client';

import React, { useEffect, useState } from 'react';
import styles from './Scenarios.module.css';
import { scenarioApi, ScenarioView } from '@/services/scenarioApi';
import { useRouter } from 'next/navigation';

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<ScenarioView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    scenarioApi.getScenarios()
      .then(res => {
        if (isMounted) {
          setScenarios(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách tình huống');
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className={styles.container}>Đang tải Thư viện Tình huống...</div>;
  }

  if (error) {
    return <div className={styles.container}><div className={styles.emptyState}>{error}</div></div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Thư viện Tình huống (Scenario Library)</h1>
        <p className={styles.subtitle}>Chọn một tình huống thực tế để thực hành kỹ năng S-T-A-R của bạn.</p>
      </header>

      {scenarios.length === 0 ? (
        <div className={styles.emptyState}>Hiện tại chưa có tình huống nào được xuất bản.</div>
      ) : (
        <div className={styles.grid}>
          {scenarios.map(scenario => (
            <div key={scenario.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={`${styles.badge} ${styles['badge-' + scenario.difficulty]}`}>
                  {scenario.difficulty === 'easy' ? 'Dễ' : scenario.difficulty === 'medium' ? 'Vừa' : 'Khó'}
                </span>
                <span className={styles.competency}>{scenario.competency}</span>
              </div>
              <h2 className={styles.cardTitle}>{scenario.title}</h2>
              <p className={styles.cardSummary}>{scenario.summary}</p>
              <div className={styles.cardFooter}>
                <span className={styles.timeInfo}>⏱ {scenario.estimatedMinutes} phút</span>
                <button 
                  className={styles.btnAction}
                  onClick={() => router.push(`/dashboard/star-builder?scenario=${scenario.slug}`)}
                >
                  Thực hành S-T-A-R
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
