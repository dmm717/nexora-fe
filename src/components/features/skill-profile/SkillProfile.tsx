'use client';

import React, { useEffect, useState } from 'react';
import styles from './SkillProfile.module.css';
import { skillProfileApi, SkillProfileResponse } from '@/services/skillProfileApi';

export default function SkillProfile() {
  const [profile, setProfile] = useState<SkillProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await skillProfileApi.getProfile();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ kỹ năng');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div className={styles.container}>Đang phân tích dữ liệu kỹ năng...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ color: '#ef4444' }}>{error}</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Hồ Sơ Kỹ Năng (Skill Profile)</h1>
        <p className={styles.subtitle}>
          Đánh giá năng lực dựa trên phân tích CV và kết quả các buổi phỏng vấn AI của bạn.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Năng Lực Hiện Tại</h2>
        
        {profile.competencies.length === 0 ? (
          <div className={styles.emptyState}>
            Chưa có đủ dữ liệu để đánh giá năng lực. Hãy upload CV hoặc tham gia phỏng vấn để hệ thống phân tích.
          </div>
        ) : (
          <div className={styles.competencyGrid}>
            {profile.competencies.map(comp => (
              <div key={comp.code} className={styles.competencyCard}>
                <div className={styles.compHeader}>
                  <div>
                    <div className={styles.compName}>{comp.name}</div>
                    <div className={styles.compCategory}>{comp.category}</div>
                  </div>
                  <div className={styles.compScore}>{comp.score.toFixed(1)}</div>
                </div>
                
                <div className={styles.progressBarBg}>
                  <div 
                    className={styles.progressBarFill} 
                    style={{ width: `${(comp.score / 10) * 100}%` }}
                  />
                </div>
                
                <div className={styles.compStats}>
                  <span>Dựa trên {comp.evidenceCount} bằng chứng</span>
                  <span>Cập nhật: {new Date(comp.latestEvidenceAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Điểm Cần Cải Thiện (Weakness Signals)</h2>
        
        {profile.weaknessSignals.length === 0 ? (
          <div className={styles.emptyState}>
            Tuyệt vời! Hiện tại hệ thống chưa phát hiện điểm yếu rõ rệt nào trong hồ sơ của bạn.
          </div>
        ) : (
          <div className={styles.weaknessList}>
            {profile.weaknessSignals.map((signal, index) => (
              <div key={index} className={styles.weaknessCard}>
                <div className={styles.weaknessIcon}>⚠️</div>
                <div className={styles.weaknessContent}>
                  <div className={styles.weaknessLabel}>{signal.label}</div>
                  <div className={styles.weaknessMeta}>
                    Nguồn: {signal.sourceType} • Ghi nhận: {new Date(signal.latestEvidenceAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
