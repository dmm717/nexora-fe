'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './Analysis.module.css';
import { useResumeAnalysis } from '@/hooks/queries/useResumes';
import { REALTIME_FALLBACK_POLL_MS } from '@/constants/realtime';
import { readStatus } from '@/utils/queryPolling';

export default function ResumeAnalysisDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading: queryLoading, error: queryError } = useResumeAnalysis(
    id,
    (query) => {
      if (query.state.status === 'error') {
        return false;
      }
      const status = readStatus(query.state.data);
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      return REALTIME_FALLBACK_POLL_MS;
    }
  );

  const error = queryError ? queryError.message || 'Không thể tải kết quả phân tích.' : null;
  const loading = queryLoading;

  const currentStatus = readStatus(data);

  if (loading || (currentStatus === 'queued' || currentStatus === 'pending' || currentStatus === 'processing')) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div style={{ color: '#6b7280', fontSize: '1.25rem' }}>AI đang phân tích độ phù hợp (Quá trình này có thể mất vài chục giây)...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => router.back()}>&larr; Quay lại</button>
        </div>
        <div className={styles.errorMessage}>{error || 'Không tìm thấy dữ liệu'}</div>
      </div>
    );
  }

  if (currentStatus === 'failed') {
    const errorCode = data.errorCode || (data as unknown as Record<string, unknown>).ErrorCode;
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => router.back()}>&larr; Quay lại</button>
        </div>
        <div className={styles.errorMessage}>
          Quá trình phân tích thất bại. {errorCode ? `Mã lỗi: ${errorCode}` : 'Vui lòng thử lại sau.'}
        </div>
      </div>
    );
  }

  // Handle potential casing differences from backend
  let result: Record<string, unknown> = (data.result || (data as unknown as Record<string, unknown>).Result || {}) as Record<string, unknown>;
  if (typeof result === 'string') {
    try {
      result = JSON.parse(result) as Record<string, unknown>;
    } catch {
      result = {};
    }
  }
  
  const hasScore = result.matchScore !== undefined || result.MatchScore !== undefined;
  const score = (result.matchScore || result.MatchScore || 0) as number;
  
  const strengths = (result.strengths || result.Strengths || []) as string[];
  const gaps = (result.gaps || result.Gaps || result.weaknesses || result.Weaknesses || []) as string[];
  const recommendations = (result.recommendations || result.Recommendations || []) as string[];

  let scoreClass = styles.textPoor;
  let scoreText = 'Chưa phù hợp (Dưới mức kỳ vọng)';
  let scoreColor = '#ef4444'; // red

  if (score >= 80) {
    scoreClass = styles.textExcellent;
    scoreText = 'Tuyệt vời (Rất phù hợp với vị trí này)';
    scoreColor = '#10b981'; // green
  } else if (score >= 60) {
    scoreClass = styles.textGood;
    scoreText = 'Khá tốt (Đạt yêu cầu cơ bản)';
    scoreColor = '#3b82f6'; // blue
  } else if (score >= 40) {
    scoreClass = styles.textAverage;
    scoreText = 'Trung bình (Cần cải thiện nhiều)';
    scoreColor = '#f59e0b'; // yellow
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Báo cáo Phân tích CV</h1>
          <p className={styles.subtitle}>Kết quả phân tích độ phù hợp dựa trên Job Description</p>
        </div>
        <button className={styles.backButton} onClick={() => router.push('/dashboard/resumes')}>
          &larr; Tạo phân tích mới
        </button>
      </header>

      {/* Score Card - Only shown if Backend provides a score */}
      {hasScore && (
        <div className={styles.scoreCard}>
          <div className={styles.scoreCircle} style={{ borderColor: scoreColor }}>
            <div className={styles.scoreValue}>{score}</div>
            <div className={styles.scoreLabel}>/ 100</div>
          </div>
          <div className={`${styles.scoreText} ${scoreClass}`}>
            {scoreText}
          </div>
        </div>
      )}

      <div className={styles.detailsGrid}>
        {/* Strengths */}
        <div className={styles.panel}>
          <h2 className={`${styles.panelTitle} ${styles.strengths}`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Điểm mạnh
          </h2>
          {(!strengths || strengths.length === 0) ? (
            <p style={{ color: '#6b7280' }}>Không tìm thấy điểm mạnh nổi bật nào.</p>
          ) : (
            <ul className={`${styles.list} ${styles.strengths}`}>
              {strengths.map((item: string) => (
                <li key={item} className={styles.listItem}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Weaknesses */}
        <div className={styles.panel}>
          <h2 className={`${styles.panelTitle} ${styles.weaknesses}`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Điểm yếu / Khoảng trống
          </h2>
          {(!gaps || gaps.length === 0) ? (
            <p style={{ color: '#6b7280' }}>Không tìm thấy điểm yếu đáng kể.</p>
          ) : (
            <ul className={`${styles.list} ${styles.weaknesses}`}>
              {gaps.map((item: string) => (
                <li key={item} className={styles.listItem}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recommendations */}
        <div className={styles.panel} style={{ gridColumn: '1 / -1' }}>
          <h2 className={`${styles.panelTitle} ${styles.recommendations}`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Đề xuất cải thiện
          </h2>
          {(!recommendations || recommendations.length === 0) ? (
            <p style={{ color: '#6b7280' }}>Chưa có đề xuất nào.</p>
          ) : (
            <ul className={`${styles.list} ${styles.recommendations}`}>
              {recommendations.map((item: string) => (
                <li key={item} className={styles.listItem}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
