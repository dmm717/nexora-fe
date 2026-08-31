'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../Interviews.module.css';
import { interviewApi, ReportView } from '@/services/interviewApi';

export default function InterviewReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [report, setReport] = useState<ReportView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    interviewApi.getReport(id)
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(err => {
        // If the report isn't ready yet (maybe completing), poll it
        if (err.message?.includes('not found') || err.message?.includes('chưa có')) {
          const interval = setInterval(async () => {
            try {
              const data = await interviewApi.getReport(id);
              setReport(data);
              setLoading(false);
              clearInterval(interval);
            } catch {
              // keep polling
            }
          }, 3000);
          return () => clearInterval(interval);
        } else {
          setError(err.message || 'Lỗi tải báo cáo');
          setLoading(false);
        }
      });
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 className={styles.title}>Đang tải báo cáo...</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>AI đang tổng hợp và phân tích kết quả phỏng vấn của bạn.</p>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #22c55e', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !report) return <div className={styles.container}><div className={styles.panel} style={{ color: 'red' }}>{error}</div></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Báo cáo Kết quả Phỏng vấn</h1>
        <button className={styles.btnPrimary} style={{backgroundColor: '#6b7280'}} onClick={() => router.push('/dashboard/interviews')}>
          Trở về Danh sách
        </button>
      </div>

      <div className={styles.panel} style={{ textAlign: 'center' }}>
        <div className={styles.scoreCircle}>
          <div className={styles.scoreValue}>{report.overallScore}</div>
          <div className={styles.scoreLabel}>Điểm đánh giá</div>
        </div>
        <p style={{ color: '#4b5563', maxWidth: '600px', margin: '0 auto' }}>{report.disclaimer}</p>
        <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '1rem' }}>
          Tạo lúc: {new Date(report.createdAt).toLocaleString('vi-VN')}
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.panel}>
          <h2 className={styles.title} style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#16a34a' }}>Điểm mạnh (Strengths)</h2>
          <pre className={styles.jsonBlock}>{JSON.stringify(report.strengths, null, 2)}</pre>
        </div>
        
        <div className={styles.panel}>
          <h2 className={styles.title} style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#dc2626' }}>Điểm cần cải thiện (Gaps)</h2>
          <pre className={styles.jsonBlock}>{JSON.stringify(report.gaps, null, 2)}</pre>
        </div>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.title} style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#3b82f6' }}>Kế hoạch hành động (Action Plan)</h2>
        <pre className={styles.jsonBlock}>{JSON.stringify(report.actionPlan, null, 2)}</pre>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.title} style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#4b5563' }}>Tiêu chí đánh giá (Rubric)</h2>
        <pre className={styles.jsonBlock}>{JSON.stringify(report.rubric, null, 2)}</pre>
      </div>
    </div>
  );
}
