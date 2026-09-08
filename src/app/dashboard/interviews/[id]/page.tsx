'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import styles from '../Interviews.module.css';
import { interviewApi } from '@/services/interviewApi';
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

  const { data: interview, isLoading: loading, error: queryError, refetch } = useInterview(id, (query) => {
    const data = query.state.data as any;
    if (data && (data.status === 'starting' || data.status === 'queued')) {
      return 2000;
    }
    return false;
  });

  const error = queryError ? queryError.message : null;

  // Start timer when a question is active
  useEffect(() => {
    if (interview && (interview.status === 'active' || interview.status === 'ready')) {
      // Reset timer if we just loaded a new question
      setSecondsElapsed(0);
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    
    // Redirect if completed
    if (interview?.status === 'completed') {
      // eslint-disable-next-line react-doctor/nextjs-no-client-side-redirect
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
        queryClient.setQueryData(['interview', id], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            answers: [...oldData.answers, result.answer],
            questions: result.nextQuestion ? [...oldData.questions, result.nextQuestion] : oldData.questions,
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
        <button className={styles.btnDanger} onClick={handleComplete} disabled={submitting}>
          Nộp bài sớm
        </button>
      </div>

      <div className={styles.panel}>
        {error && <div style={{ color: '#dc2626', marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '8px' }}>{error}</div>}
        
        {activeQuestion ? (
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
                placeholder="Nhập câu trả lời..."
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
