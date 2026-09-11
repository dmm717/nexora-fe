'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './Analysis.module.css';
import { useResumeAnalysis } from '@/hooks/queries/useResumes';
import { REALTIME_FALLBACK_POLL_MS } from '@/constants/realtime';
import { readStatus } from '@/utils/queryPolling';
import type { ResumeAnalysisMode } from '@/services/cvAnalysisContract';

function parseResult(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
}

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
        <div style={{ color: '#6b7280', fontSize: '1.25rem' }}>AI đang phân tích hồ sơ (Quá trình này có thể mất vài chục giây)...</div>
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
    const errorCode = data.errorCode;
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

  const rawResult = parseResult(data.result);
  const mode: ResumeAnalysisMode = data.mode === 'field_benchmark' || rawResult?.mode === 'field_benchmark'
    ? 'field_benchmark'
    : 'job_targeted';
  const isBenchmark = mode === 'field_benchmark';

  const score = isBenchmark
    ? (typeof rawResult?.readinessScore === 'number' ? rawResult.readinessScore : null)
    : (typeof rawResult?.matchScore === 'number' ? rawResult.matchScore : null);

  const summary = typeof rawResult?.summary === 'string' ? rawResult.summary : '';
  const strengths = Array.isArray(rawResult?.strengths) ? (rawResult.strengths as string[]) : [];
  const gaps = Array.isArray(rawResult?.gaps) ? (rawResult.gaps as string[]) : [];
  const recommendations = Array.isArray(rawResult?.recommendations) ? (rawResult.recommendations as string[]) : [];
  const sectionFeedback = Array.isArray(rawResult?.sectionFeedback) ? (rawResult.sectionFeedback as string[]) : [];

  const matchedSkills = Array.isArray(rawResult?.matchedKeywordsOrSkills) ? (rawResult.matchedKeywordsOrSkills as string[]) : [];
  const missingSkills = Array.isArray(rawResult?.missingKeywordsOrSkills) ? (rawResult.missingKeywordsOrSkills as string[]) : [];

  const rawBreakdown = (rawResult?.breakdown && typeof rawResult.breakdown === 'object'
    ? rawResult.breakdown
    : {}) as Record<string, unknown>;

  const breakdownEntries = isBenchmark
    ? [
        { key: 'technicalFoundation', label: 'Nền tảng chuyên môn', value: typeof rawBreakdown.technicalFoundation === 'number' ? rawBreakdown.technicalFoundation : null },
        { key: 'projectEvidence', label: 'Minh chứng dự án', value: typeof rawBreakdown.projectEvidence === 'number' ? rawBreakdown.projectEvidence : null },
        { key: 'experiencePresentation', label: 'Trình bày kinh nghiệm', value: typeof rawBreakdown.experiencePresentation === 'number' ? rawBreakdown.experiencePresentation : null },
        { key: 'impactAchievements', label: 'Thành tựu & Tác động', value: typeof rawBreakdown.impactAchievements === 'number' ? rawBreakdown.impactAchievements : null },
        { key: 'clarity', label: 'Độ rõ ràng & Mạch lạc', value: typeof rawBreakdown.clarity === 'number' ? rawBreakdown.clarity : null },
        { key: 'roleAlignment', label: 'Định hướng vị trí', value: typeof rawBreakdown.roleAlignment === 'number' ? rawBreakdown.roleAlignment : null },
      ]
    : [
        { key: 'technicalSkillMatch', label: 'Phù hợp kỹ năng kỹ thuật', value: typeof rawBreakdown.technicalSkillMatch === 'number' ? rawBreakdown.technicalSkillMatch : null },
        { key: 'experienceRelevance', label: 'Mức độ liên quan kinh nghiệm', value: typeof rawBreakdown.experienceRelevance === 'number' ? rawBreakdown.experienceRelevance : null },
        { key: 'impactEvidence', label: 'Bằng chứng hiệu quả & tác động', value: typeof rawBreakdown.impactEvidence === 'number' ? rawBreakdown.impactEvidence : null },
        { key: 'clarity', label: 'Độ rõ ràng & mạch lạc', value: typeof rawBreakdown.clarity === 'number' ? rawBreakdown.clarity : null },
        { key: 'structure', label: 'Bố cục & cấu trúc', value: typeof rawBreakdown.structure === 'number' ? rawBreakdown.structure : null },
      ];

  const hasBreakdown = breakdownEntries.some(e => e.value !== null);

  let scoreClass = styles.textPoor;
  let scoreText = isBenchmark ? 'Chưa sẵn sàng (Cần lộ trình nâng cao)' : 'Chưa phù hợp (Dưới mức kỳ vọng)';
  let scoreColor = '#ef4444'; // red

  if (score !== null) {
    if (score >= 80) {
      scoreClass = styles.textExcellent;
      scoreText = isBenchmark ? 'Tuyệt vời (Mức độ sẵn sàng rất cao)' : 'Tuyệt vời (Rất phù hợp với vị trí này)';
      scoreColor = '#10b981'; // green
    } else if (score >= 60) {
      scoreClass = styles.textGood;
      scoreText = isBenchmark ? 'Khá tốt (Đạt yêu cầu tiêu chuẩn)' : 'Khá tốt (Đạt yêu cầu cơ bản)';
      scoreColor = '#3b82f6'; // blue
    } else if (score >= 40) {
      scoreClass = styles.textAverage;
      scoreText = isBenchmark ? 'Trung bình (Cần bồi dưỡng thêm)' : 'Trung bình (Cần cải thiện nhiều)';
      scoreColor = '#f59e0b'; // yellow
    }
  }

  const pageTitle = isBenchmark ? 'Báo cáo Đánh giá Chuẩn Ngành' : 'Báo cáo Phân tích CV';
  const pageSubtitle = isBenchmark
    ? 'Mức độ sẵn sàng cho vị trí mục tiêu'
    : 'Độ phù hợp với công việc mục tiêu';

  const contextData = data.context;
  const industry = contextData?.industry ?? (typeof rawResult?.industry === 'string' ? rawResult.industry : null);
  const targetRole = contextData?.targetRole ?? (typeof rawResult?.targetRole === 'string' ? rawResult.targetRole : null);
  const seniority = contextData?.seniority ?? (typeof rawResult?.seniority === 'string' ? rawResult.seniority : null);
  const showContextCard = isBenchmark && (industry || targetRole || seniority);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{pageTitle}</h1>
          <p className={styles.subtitle}>{pageSubtitle}</p>
        </div>
        <button className={styles.backButton} onClick={() => router.push('/dashboard/resumes')}>
          &larr; Tạo phân tích mới
        </button>
      </header>

      {/* Field Benchmark Context */}
      {showContextCard && (
        <div className={styles.contextCard}>
          {industry && (
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Ngành nghề / Lĩnh vực</span>
              <span className={styles.contextValue}>{industry}</span>
            </div>
          )}
          {targetRole && (
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Vị trí mục tiêu</span>
              <span className={styles.contextValue}>{targetRole}</span>
            </div>
          )}
          {seniority && (
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Cấp bậc kinh nghiệm</span>
              <span className={styles.contextValue}>{seniority}</span>
            </div>
          )}
        </div>
      )}

      {/* Score Card - Only shown if server provides a score */}
      {score !== null && (
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

      {/* Summary */}
      {summary && (
        <div className={styles.panel} style={{ marginBottom: '2rem' }}>
          <h2 className={styles.panelTitle}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tóm tắt tổng quan
          </h2>
          <p className={styles.summaryText}>{summary}</p>
        </div>
      )}

      {/* Job Targeted Skill Match Tags */}
      {!isBenchmark && (matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div className={styles.panel} style={{ marginBottom: '2rem' }}>
          <h2 className={styles.panelTitle}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Đối chiếu kỹ năng & yêu cầu
          </h2>
          <div className={styles.skillsContainer}>
            {matchedSkills.length > 0 && (
              <div>
                <div className={styles.skillGroupTitle}>Kỹ năng phù hợp ({matchedSkills.length})</div>
                <div className={styles.skillBadgeGroup}>
                  {matchedSkills.map(skill => (
                    <span key={skill} className={styles.matchedSkillBadge}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {missingSkills.length > 0 && (
              <div>
                <div className={styles.skillGroupTitle}>Kỹ năng còn thiếu hoặc cần bổ sung ({missingSkills.length})</div>
                <div className={styles.skillBadgeGroup}>
                  {missingSkills.map(skill => (
                    <span key={skill} className={styles.missingSkillBadge}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Breakdown Dimensions */}
      {hasBreakdown && (
        <div className={styles.panel} style={{ marginBottom: '2rem' }}>
          <h2 className={styles.panelTitle}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Đánh giá chi tiết từng khía cạnh
          </h2>
          <div className={styles.breakdownGrid}>
            {breakdownEntries.map(item => item.value !== null ? (
              <div key={item.key} className={styles.breakdownItem}>
                <div className={styles.breakdownHeader}>
                  <span>{item.label}</span>
                  <span className={styles.breakdownScore}>{item.value}/100</span>
                </div>
                <div className={styles.breakdownBarBg}>
                  <div
                    className={styles.breakdownBarFill}
                    style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }}
                  />
                </div>
              </div>
            ) : null)}
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

        {/* Gaps */}
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

        {/* Section Feedback */}
        {sectionFeedback.length > 0 && (
          <div className={styles.panel} style={{ gridColumn: '1 / -1' }}>
            <h2 className={styles.panelTitle}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Góp ý chi tiết từng phần hồ sơ
            </h2>
            <ul className={styles.list}>
              {sectionFeedback.map((feedback: string) => (
                <li key={feedback} className={styles.listItem}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20" style={{ color: '#6366f1' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{feedback}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
