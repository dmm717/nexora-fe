'use client';

import React from 'react';
import Link from 'next/link';
import styles from './SkillProfile.module.css';
import { useSkillProfile } from '@/hooks/queries/useSkillProfile';
import { ApiError } from '@/services/apiClient';

export default function SkillProfile() {
  const { data: profile, isLoading, error, refetch, isFetching } = useSkillProfile();

  const apiError = error instanceof ApiError ? error : null;
  const errorMessage = apiError?.message || (error instanceof Error ? error.message : null);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p>Đang phân tích dữ liệu kỹ năng...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Hồ Sơ Kỹ Năng (Skill Profile)</h1>
          <p className={styles.subtitle}>
            Đánh giá năng lực dựa trên phân tích CV, các buổi phỏng vấn AI và bài tập tình huống STAR.
          </p>
        </div>
        <div>
          <Link href="/dashboard/learning-path" className={styles.btnPrimary}>
            Xem lộ trình học →
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <div>
            <strong>Không thể tải hồ sơ kỹ năng:</strong> {errorMessage}
            {(apiError?.code || apiError?.requestId) && (
              <div className={styles.errorDetails}>
                {apiError.code && <span>Mã lỗi: {apiError.code}</span>}
                {apiError.code && apiError.requestId && <span> · </span>}
                {apiError.requestId && <span>Mã yêu cầu: {apiError.requestId}</span>}
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? 'Đang thử lại...' : 'Thử lại'}
          </button>
        </div>
      )}

      {profile && (
        <>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Năng Lực Hiện Tại</h2>

            {profile.competencies.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Chưa có đủ dữ liệu để đánh giá năng lực.</p>
                <p style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>
                  Hãy upload CV, tạo câu trả lời STAR hoặc tham gia phỏng vấn thử để hệ thống phân tích.
                </p>
                <div className={styles.emptyActionLinks}>
                  <Link href="/dashboard/resumes" className={styles.btnSecondary}>
                    Tải lên CV
                  </Link>
                  <Link href="/dashboard/scenarios" className={styles.btnSecondary}>
                    Luyện STAR & Tình huống
                  </Link>
                  <Link href="/dashboard/interviews/new" className={styles.btnSecondary}>
                    Bắt đầu phỏng vấn
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.competencyGrid}>
                {profile.competencies.map((comp) => {
                  const normalizedScore = Math.min(100, Math.max(0, Math.round(comp.score)));
                  return (
                    <div key={comp.code} className={styles.competencyCard}>
                      <div className={styles.compHeader}>
                        <div>
                          <div className={styles.compName}>{comp.name || comp.code}</div>
                          <div className={styles.compCategory}>{comp.category || 'Chung'}</div>
                        </div>
                        <div className={styles.compScore}>{normalizedScore}/100</div>
                      </div>

                      <div className={styles.progressBarBg}>
                        <div
                          className={styles.progressBarFill}
                          style={{ width: `${normalizedScore}%` }}
                        />
                      </div>

                      {comp.sources && comp.sources.length > 0 && (
                        <div className={styles.compSources}>
                          {comp.sources.map((src, idx) => (
                            <span key={`${src.sourceType}-${idx}`} className={styles.sourcePill}>
                              {src.sourceType} ({src.evidenceCount})
                            </span>
                          ))}
                        </div>
                      )}

                      <div className={styles.compStats}>
                        <span>Dựa trên {comp.evidenceCount} bằng chứng</span>
                        {comp.latestEvidenceAt && (
                          <span>
                            {new Date(comp.latestEvidenceAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Điểm Cần Cải Thiện (Weakness Signals)</h2>

            {profile.weaknessSignals.length === 0 ? (
              <div className={styles.emptyState}>
                Tuyệt vời! Hiện tại hệ thống chưa ghi nhận điểm yếu hoặc thiếu hụt năng lực nào đáng kể.
              </div>
            ) : (
              <div className={styles.weaknessList}>
                {profile.weaknessSignals.map((signal, index) => (
                  <div key={`${signal.sourceType}-${index}`} className={styles.weaknessCard}>
                    <div className={styles.weaknessIcon} aria-hidden="true">⚠️</div>
                    <div className={styles.weaknessContent}>
                      <div className={styles.weaknessLabel}>{signal.label}</div>
                      <div className={styles.weaknessMeta}>
                        Nguồn: {signal.sourceType}
                        {signal.latestEvidenceAt && (
                          <span>
                            {' '}• Ghi nhận: {new Date(signal.latestEvidenceAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
