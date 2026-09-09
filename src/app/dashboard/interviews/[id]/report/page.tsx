'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './Report.module.css';
import { useInterview, useInterviewReport } from '@/hooks/queries/useInterviews';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { ClientDate } from '@/components/ui/ClientDate';

export default function InterviewReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useAutoTranslate();

  const { data: interview } = useInterview(id);
  const { data: report, isLoading: loading, error: queryError } = useInterviewReport(id, (query) => {
    const errorMsg = query.state.error?.message?.toLowerCase() || '';
    if (errorMsg.includes('not found') || errorMsg.includes('chưa có') || errorMsg.includes('không tìm thấy')) {
      return 15000;
    }
    return false;
  });

  const errorMsg = queryError?.message?.toLowerCase() || '';
  const isGenerating = errorMsg.includes('not found') || errorMsg.includes('chưa có') || errorMsg.includes('không tìm thấy');

  if (loading || (isGenerating && !report)) {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 className={styles.title}>Đang tải báo cáo...</h2>
          <p style={{ color: '#000', marginTop: '1rem', fontWeight: 600, fontSize: '1.125rem' }}>
            AI đang tổng hợp và phân tích kết quả phỏng vấn của bạn. Quá trình này có thể mất đến 1 phút...
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #000', borderTop: '4px solid #4ade80', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const error = (queryError && !isGenerating) ? queryError.message : null;

  if (error || !report) return <div className={styles.container}><div className={styles.panel} style={{ color: 'red', fontWeight: 800 }}>{error || 'Đã xảy ra lỗi không xác định'}</div></div>;

  const strengths = (report.strengths || []) as unknown as string[];
  const gaps = (report.gaps || []) as unknown as string[];
  const actionPlan = (report.actionPlan || []) as unknown as string[];
  const rubric = (report.rubric || []) as unknown as Array<{score: number, criterion: string, evidence: string}>;

  return (
    <div className={styles.container}>
      <div id="google_translate_element"></div>
      <div className={styles.header}>
        <h1 className={styles.title}>Kết quả phỏng vấn</h1>
        <button className={styles.btnPrimary} onClick={() => router.push('/dashboard/interviews')}>
          Trở về Danh sách
        </button>
      </div>

      <div className={styles.panel} style={{ textAlign: 'center' }}>
        <div className={styles.scoreCircle}>
          <div className={styles.scoreValue}>{report.overallScore}</div>
          <div className={styles.scoreLabel}>Điểm số</div>
        </div>
        <p className={styles.disclaimer}>{report.disclaimer}</p>
        <div className={styles.timestamp}>
          Tạo lúc: <ClientDate date={report.createdAt} />
        </div>
      </div>

      {report.starSummary && (
        <div className={styles.panel} style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #3b82f6' }}>
          <h2 className={styles.sectionTitle} style={{ color: '#1e3a8a' }}>Phân tích Phương pháp S-T-A-R</h2>
          <div className={styles.infoGrid}>
            <div>
              <div className={styles.infoLabel}>Điểm STAR Trung bình</div>
              <div className={styles.infoValue} style={{ color: '#0f172a' }}>{report.starSummary.averageScore}/100</div>
            </div>
            <div>
              <div className={styles.infoLabel}>Thành phần Tốt nhất</div>
              <div className={styles.infoValue} style={{ color: '#16a34a' }}>{report.starSummary.strongestComponent}</div>
            </div>
            <div>
              <div className={styles.infoLabel}>Thành phần Yếu nhất</div>
              <div className={styles.infoValue} style={{ color: '#dc2626' }}>{report.starSummary.weakestComponent}</div>
            </div>
          </div>
          {report.starSummary.recurringIssues && report.starSummary.recurringIssues.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className={styles.infoLabel}>Vấn đề thường gặp:</div>
              <ul className={styles.list} style={{ marginTop: '0.5rem' }}>
                {report.starSummary.recurringIssues.map((issue) => (
                  <li key={issue} className={styles.listItem} style={{ paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: 'none' }}>
                    <div className={`${styles.listIcon} ${styles.iconDanger}`} style={{ width: 24, height: 24, fontSize: '0.8rem' }}>!</div>
                    <div className={styles.listContent}>{issue}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className={styles.contentGrid}>
        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>Điểm mạnh</h2>
          <ul className={styles.list}>
            {strengths.map((item) => (
              <li key={item} className={styles.listItem}>
                <div className={`${styles.listIcon} ${styles.iconSuccess}`}>✓</div>
                <div className={styles.listContent}>{item}</div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>Cần cải thiện</h2>
          <ul className={styles.list}>
            {gaps.map((item) => (
              <li key={item} className={styles.listItem}>
                <div className={`${styles.listIcon} ${styles.iconDanger}`}>!</div>
                <div className={styles.listContent}>{item}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.sectionTitle}>Kế hoạch hành động</h2>
        <ul className={styles.list}>
          {actionPlan.map((item, idx) => (
            <li key={item} className={styles.listItem}>
              <div className={`${styles.listIcon} ${styles.iconInfo}`}>{idx + 1}</div>
              <div className={styles.listContent}>{item}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.sectionTitle}>Tiêu chí đánh giá</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Tiêu chí</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Điểm</th>
                <th>Bằng chứng / Lời phê</th>
              </tr>
            </thead>
            <tbody>
              {rubric.map((item) => (
                <tr key={item.criterion}>
                  <td className={styles.criterion}>{item.criterion}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={styles.scorePill}>{item.score}/100</span>
                  </td>
                  <td>{item.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {interview && interview.answers && interview.answers.length > 0 && (
        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>Lịch sử Câu hỏi & Đánh giá chi tiết</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {interview.answers.map((answer, index) => {
              const question = interview.questions?.find(q => q.id === answer.questionId);
              const star = answer.evaluation?.star;
              return (
                <div key={answer.id} style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    Câu {index + 1}: {question?.content || 'Câu hỏi ẩn'}
                  </div>
                  <div style={{ color: '#4b5563', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                    {answer.content}
                  </div>
                  
                  {star?.applicable ? (
                     <div>
                       <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Đánh giá theo S-T-A-R</h4>
                       <div className={styles.tableWrapper}>
                         <table className={styles.table}>
                           <thead>
                             <tr>
                               <th style={{ width: '120px' }}>Thành phần</th>
                               <th style={{ width: '80px', textAlign: 'center' }}>Điểm</th>
                               <th>Nhận xét</th>
                             </tr>
                           </thead>
                           <tbody>
                             {star.situation && (
                               <tr>
                                 <td className={styles.criterion}>Situation</td>
                                 <td style={{ textAlign: 'center' }}><span className={styles.scorePill}>{star.situation.score}/100</span></td>
                                 <td>{star.situation.feedback}</td>
                               </tr>
                             )}
                             {star.task && (
                               <tr>
                                 <td className={styles.criterion}>Task</td>
                                 <td style={{ textAlign: 'center' }}><span className={styles.scorePill}>{star.task.score}/100</span></td>
                                 <td>{star.task.feedback}</td>
                               </tr>
                             )}
                             {star.action && (
                               <tr>
                                 <td className={styles.criterion}>Action</td>
                                 <td style={{ textAlign: 'center' }}><span className={styles.scorePill}>{star.action.score}/100</span></td>
                                 <td>{star.action.feedback}</td>
                               </tr>
                             )}
                             {star.result && (
                               <tr>
                                 <td className={styles.criterion}>Result</td>
                                 <td style={{ textAlign: 'center' }}><span className={styles.scorePill}>{star.result.score}/100</span></td>
                                 <td>{star.result.feedback}</td>
                               </tr>
                             )}
                           </tbody>
                         </table>
                       </div>
                       
                       {star.coachingTips && star.coachingTips.length > 0 && (
                         <div style={{ marginTop: '1rem' }}>
                           <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#16a34a', marginBottom: '0.5rem' }}>💡 Lời khuyên:</div>
                           <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151', fontSize: '0.95rem' }}>
                             {star.coachingTips.map((tip) => <li key={tip.substring(0, 30)} style={{ marginBottom: '0.25rem' }}>{tip}</li>)}
                           </ul>
                         </div>
                       )}
                     </div>
                  ) : (
                    answer.evaluation?.feedback && (
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nhận xét chung</h4>
                        <p style={{ color: '#374151', fontSize: '0.95rem', margin: 0 }}>{answer.evaluation.feedback}</p>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
