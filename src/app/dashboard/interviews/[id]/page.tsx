'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import styles from '../Interviews.module.css';
import { interviewApi, type InterviewView } from '@/services/interviewApi';
import { useInterview } from '@/hooks/queries/useInterviews';
import { formatTime } from '@/utils/formatters';

export default function InterviewRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: interview, isLoading: loading, error: queryError } = useInterview(id);

  const error = queryError ? queryError.message : null;

  // Start timer when a question is active
  useEffect(() => {
    if (interview && (interview.status === 'active' || interview.status === 'ready')) {
      // Reset timer if we just loaded a new question
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSecondsElapsed(0);
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    
    // Redirect if completed
    if (interview?.status === 'completed') {
      router.push(`/dashboard/interviews/${id}/report`);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview?.questions?.length, interview?.answers?.length, interview?.status]); // Re-run when lengths change

  const handleComplete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn kết thúc bài thi ngay bây giờ?')) return;
    setSubmitting(true);
    try {
      await interviewApi.complete(id);
      router.push(`/dashboard/interviews/${id}/report`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi kết thúc bài thi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      const updatedInterview = await interviewApi.continue(id);
      queryClient.setQueryData(['interview', id], updatedInterview);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi tiếp tục bài thi. Có thể bạn chưa nâng cấp tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerContent.trim() || !activeQuestion) return;
    
    setSubmitting(true);
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      
      const result = await interviewApi.submitAnswer(id, {
        questionId: activeQuestion.id,
        content: answerContent,
        durationSeconds: secondsElapsed
      });
      
      setAnswerContent('');
      
      if (result.isComplete) {
        // Auto complete
        await interviewApi.complete(id);
        router.push(`/dashboard/interviews/${id}/report`);
      } else {
        // Tối ưu hóa: Cập nhật cache trực tiếp từ kết quả trả về của API, tránh refetch thừa thãi
        queryClient.setQueryData(['interview', id], (oldData: InterviewView | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            answers: [...oldData.answers, result.answer],
            questions: result.nextQuestion ? [...oldData.questions, result.nextQuestion] : oldData.questions,
            continuation: result.continuation,
          };
        });
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi gửi câu trả lời');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.container}><div className={styles.loadingState}>Đang tải dữ liệu...</div></div>;
  if (error && !interview) return <div className={styles.container}><div className={styles.panel} style={{ color: 'red' }}>{error}</div></div>;
  if (!interview) return null;

  if (interview.status === 'starting' || interview.status === 'queued') {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 className={styles.title}>Đang khởi tạo bài thi...</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>AI đang chuẩn bị các câu hỏi phù hợp nhất với cấu hình của bạn. Vui lòng đợi trong giây lát.</p>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (interview.status === 'completing') {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 className={styles.title}>Đang chấm điểm...</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>AI đang đánh giá phần thi của bạn để xuất báo cáo. Vui lòng đợi...</p>
        </div>
      </div>
    );
  }

  // Find active question
  const answeredIds = new Set(interview.answers.map(a => a.questionId));
  const activeQuestion = interview.questions.find(q => !answeredIds.has(q.id));



  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Phỏng vấn: {interview.role}</h1>
          <div style={{ marginTop: '0.5rem' }}>
            <span className={styles.statusBadge}>{interview.interviewType}</span>
            <span className={styles.statusBadge} style={{ marginLeft: '0.5rem', backgroundColor: '#f3f4f6', color: '#374151' }}>{interview.difficulty}</span>
          </div>
        </div>
        <button 
          className={styles.btnDanger} 
          onClick={handleComplete} 
          disabled={submitting || (interview.continuation && !interview.continuation.canFinishNow)}
          style={{ opacity: (interview.continuation && !interview.continuation.canFinishNow) ? 0.5 : 1 }}
        >
          Nộp bài sớm
        </button>
      </div>

      <div className={styles.panel}>
        {error && <div style={{ color: '#dc2626', marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '8px' }}>{error}</div>}
        
        {/* Render History with Per-Answer Coaching */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {interview.questions.filter(q => answeredIds.has(q.id)).map(q => {
             const ans = interview.answers.find(a => a.questionId === q.id);
             const hasCoaching = ans?.evaluation && (ans.evaluation.strengths || ans.evaluation.improvements || ans.evaluation.improvedAnswer);
             return (
               <div key={q.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem', backgroundColor: '#fff' }}>
                 <div style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937', fontSize: '1.05rem' }}>Hỏi: {q.content}</div>
                 <div style={{ marginBottom: '1.25rem', color: '#4b5563', lineHeight: '1.6' }}>Đáp: {ans?.content}</div>
                 
                 {hasCoaching && (
                   <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #e2e8f0' }}>
                     <h4 style={{ fontWeight: '600', color: '#334155', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <span style={{ fontSize: '1.2rem' }}>✨</span> AI Phản Hồi Trực Tiếp
                     </h4>
                     {ans.evaluation?.strengths && ans.evaluation.strengths.length > 0 && (
                       <div style={{ marginBottom: '1rem' }}>
                         <strong style={{ color: '#059669', display: 'block', marginBottom: '0.25rem' }}>Điểm mạnh:</strong>
                         <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#064e3b', listStyleType: 'disc' }}>
                           {ans.evaluation.strengths.map((s, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{s}</li>)}
                         </ul>
                       </div>
                     )}
                     {ans.evaluation?.improvements && ans.evaluation.improvements.length > 0 && (
                       <div style={{ marginBottom: '1rem' }}>
                         <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '0.25rem' }}>Cần cải thiện:</strong>
                         <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#7f1d1d', listStyleType: 'disc' }}>
                           {ans.evaluation.improvements.map((s, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{s}</li>)}
                         </ul>
                       </div>
                     )}
                     {ans.evaluation?.improvedAnswer && (
                       <div>
                         <strong style={{ color: '#2563eb', display: 'block', marginBottom: '0.25rem' }}>Câu trả lời mẫu gợi ý:</strong>
                         <div style={{ padding: '0.75rem 1rem', backgroundColor: '#eff6ff', color: '#1e3a8a', borderRadius: '6px', fontStyle: 'italic', lineHeight: '1.5' }}>
                           "{ans.evaluation.improvedAnswer}"
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             );
          })}
        </div>

        {interview.continuation?.state === 'upgrade_required' ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 2rem', border: '2px dashed #cbd5e1', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 'bold' }}>Bạn đã đạt giới hạn câu hỏi miễn phí 🔒</h3>
            <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
              Nâng cấp lên tài khoản Pro để mở khóa toàn bộ buổi phỏng vấn, nhận câu hỏi tình huống chuyên sâu và phản hồi AI chi tiết cho từng câu trả lời.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className={styles.btnDanger} 
                onClick={handleComplete} 
                disabled={submitting || !interview.continuation?.canFinishNow}
              >
                Kết thúc sớm & Xem báo cáo
              </button>
              {interview.continuation?.canUpgradeAndContinue && (
                <button 
                  className={styles.btnPrimary} 
                  onClick={() => window.open('/pricing', '_blank')}
                >
                  Nâng cấp tài khoản
                </button>
              )}
              <button 
                style={{ padding: '0.75rem 1.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', color: '#334155', fontWeight: '500', cursor: 'pointer' }}
                onClick={handleContinue}
                disabled={submitting}
              >
                {submitting ? 'Đang kiểm tra...' : 'Đã thanh toán? Tiếp tục ngay'}
              </button>
            </div>
          </div>
        ) : activeQuestion ? (
          <>
            <div className={styles.questionBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className={styles.questionSequence}>Câu hỏi {activeQuestion.sequence} / {interview.questions.length}</div>
                <div className={styles.timer}>⏱ {formatTime(secondsElapsed)}</div>
              </div>
              <div className={styles.questionContent}>{activeQuestion.content}</div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="answerContent">Câu trả lời của bạn</label>
              <textarea 
                id="answerContent"
                className={styles.textarea} 
                placeholder="Nhập câu trả lời chi tiết của bạn tại đây..."
                value={answerContent}
                onChange={e => setAnswerContent(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className={styles.buttonGroup}>
              <button 
                className={styles.btnPrimary} 
                onClick={handleSubmitAnswer}
                disabled={submitting || !answerContent.trim()}
              >
                {submitting ? 'Đang gửi...' : 'Gửi câu trả lời'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Bạn đã hoàn thành tất cả câu hỏi!</h3>
            <button className={styles.btnPrimary} onClick={handleComplete} disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Nộp bài & Xem báo cáo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
