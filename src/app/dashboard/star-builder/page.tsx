'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import styles from './StarBuilder.module.css';
import { starBuilderApi, StarAttemptRequest, StarAttemptResponse } from '@/services/starBuilderApi';
import { useSearchParams } from 'next/navigation';
import { scenarioApi, ScenarioView } from '@/services/scenarioApi';

function StarBuilderContent() {
  const searchParams = useSearchParams();
  const scenarioSlug = searchParams.get('scenario');

  const [formData, setFormData] = useState<StarAttemptRequest>({
    question: '',
    situation: '',
    task: '',
    action: '',
    result: ''
  });
  const [scenarioData, setScenarioData] = useState<ScenarioView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StarAttemptResponse | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (scenarioSlug) {
      scenarioApi.getScenarioDetails(scenarioSlug)
        .then(data => {
          if (isMounted.current) {
            setScenarioData(data);
            setFormData(prev => ({ ...prev, question: data.content || data.summary || data.title }));
          }
        })
        .catch(err => {
          console.error('Lỗi tải tình huống:', err);
        });
    }
    return () => { isMounted.current = false; };
  }, [scenarioSlug]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const pollResult = async (attemptId: string) => {
    if (!isMounted.current) return;
    try {
      const data = await starBuilderApi.getAttempt(attemptId);
      if (!isMounted.current) return;
      
      if (data.status === 'completed' || data.status === 'failed') {
        setResult(data);
        setLoading(false);
      } else {
        setTimeout(() => pollResult(attemptId), 2000);
      }
    } catch (err: unknown) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err.message : 'Lỗi khi kiểm tra kết quả.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question || !formData.situation || !formData.task || !formData.action || !formData.result) {
      setError('Vui lòng điền đầy đủ Câu hỏi và các phần S, T, A, R.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await starBuilderApi.submitAttempt(formData);
      pollResult(response.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi gửi đánh giá.');
      setLoading(false);
    }
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return styles.scoreExcellent;
    if (score >= 65) return styles.scoreGood;
    if (score >= 50) return styles.scoreAverage;
    return styles.scorePoor;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>STAR Builder</h1>
        <p className={styles.subtitle}>Luyện tập kỹ năng kể chuyện theo phương pháp S-T-A-R để nhận đánh giá chi tiết.</p>
      </header>

      <div className={styles.contentWrapper}>
        <div className={styles.formPanel}>
          <form onSubmit={handleSubmit} className={styles.form}>
            
            <div className={styles.formGroup} style={{ backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <label className={styles.label} style={{ color: 'var(--primary-color)' }}>
                Tình huống phỏng vấn (Question / Scenario)
              </label>
              {scenarioData && <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', marginTop: 0 }}>{scenarioData.title}</h3>}
              <textarea 
                name="question" 
                value={formData.question} 
                onChange={handleChange} 
                className={styles.textarea}
                placeholder="Nhập câu hỏi phỏng vấn bạn muốn trả lời..."
                rows={3}
                disabled={loading || !!scenarioData}
                style={{ backgroundColor: scenarioData ? 'transparent' : undefined, border: scenarioData ? 'none' : undefined, padding: scenarioData ? 0 : undefined, resize: scenarioData ? 'none' : 'vertical' }}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.letter}>S</span>ituation (Hoàn cảnh)
              </label>
              <textarea 
                name="situation" 
                value={formData.situation} 
                onChange={handleChange} 
                className={styles.textarea}
                placeholder="Mô tả bối cảnh và hoàn cảnh bạn gặp phải..."
                rows={3}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.letter}>T</span>ask (Nhiệm vụ)
              </label>
              <textarea 
                name="task" 
                value={formData.task} 
                onChange={handleChange} 
                className={styles.textarea}
                placeholder="Nhiệm vụ hoặc mục tiêu bạn cần đạt được..."
                rows={3}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.letter}>A</span>ction (Hành động)
              </label>
              <textarea 
                name="action" 
                value={formData.action} 
                onChange={handleChange} 
                className={styles.textarea}
                placeholder="Bạn đã làm những gì? Chi tiết các bước bạn thực hiện..."
                rows={4}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.letter}>R</span>esult (Kết quả)
              </label>
              <textarea 
                name="result" 
                value={formData.result} 
                onChange={handleChange} 
                className={styles.textarea}
                placeholder="Kết quả cuối cùng là gì? Bạn học được gì? (Định lượng nếu có thể)..."
                rows={3}
                disabled={loading}
              />
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? (
                <><span className={styles.spinner}></span> Đang phân tích...</>
              ) : (
                'Nhận Đánh giá S-T-A-R'
              )}
            </button>
          </form>
        </div>

        <div className={styles.resultPanel}>
          {!result && !loading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✨</div>
              <h3>Sẵn sàng phân tích</h3>
              <p>Điền câu chuyện của bạn vào form bên trái để AI đánh giá theo tiêu chuẩn S-T-A-R.</p>
            </div>
          )}

          {loading && (
             <div className={styles.emptyState}>
               <div className={styles.spinnerLarge}></div>
               <h3>Đang xử lý</h3>
               <p>AI đang đọc và phân tích từng thành phần trong câu chuyện của bạn.</p>
             </div>
          )}

          {result && (
            <div className={styles.resultContent}>
              <div className={styles.scoreHeader}>
                <div className={styles.overallScore}>
                  <div className={styles.scoreTitle}>Điểm Đánh giá</div>
                  <div className={`${styles.scoreNumber} ${getScoreClass(result.overallScore)}`}>
                    {result.overallScore}<span>/100</span>
                  </div>
                </div>
              </div>

              {result.applicable ? (
                <div className={styles.starBreakdown}>
                  {result.situation && (
                    <div className={styles.breakdownItem}>
                      <div className={styles.breakdownHeader}>
                        <span className={styles.breakdownTitle}>Situation</span>
                        <span className={`${styles.breakdownScore} ${getScoreClass(result.situation.score)}`}>{result.situation.score}/100</span>
                      </div>
                      <p className={styles.breakdownFeedback}>{result.situation.feedback}</p>
                    </div>
                  )}
                  {result.task && (
                    <div className={styles.breakdownItem}>
                      <div className={styles.breakdownHeader}>
                        <span className={styles.breakdownTitle}>Task</span>
                        <span className={`${styles.breakdownScore} ${getScoreClass(result.task.score)}`}>{result.task.score}/100</span>
                      </div>
                      <p className={styles.breakdownFeedback}>{result.task.feedback}</p>
                    </div>
                  )}
                  {result.action && (
                    <div className={styles.breakdownItem}>
                      <div className={styles.breakdownHeader}>
                        <span className={styles.breakdownTitle}>Action</span>
                        <span className={`${styles.breakdownScore} ${getScoreClass(result.action.score)}`}>{result.action.score}/100</span>
                      </div>
                      <p className={styles.breakdownFeedback}>{result.action.feedback}</p>
                    </div>
                  )}
                  {result.result && (
                    <div className={styles.breakdownItem}>
                      <div className={styles.breakdownHeader}>
                        <span className={styles.breakdownTitle}>Result</span>
                        <span className={`${styles.breakdownScore} ${getScoreClass(result.result.score)}`}>{result.result.score}/100</span>
                      </div>
                      <p className={styles.breakdownFeedback}>{result.result.feedback}</p>
                    </div>
                  )}

                  {result.coachingTips && result.coachingTips.length > 0 && (
                    <div className={styles.tipsSection}>
                      <h4 className={styles.tipsTitle}>💡 Lời khuyên cải thiện</h4>
                      <ul className={styles.tipsList}>
                        {result.coachingTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.errorMessage} style={{ marginTop: '1rem' }}>
                  Câu trả lời không phù hợp với cấu trúc S-T-A-R hoặc không đủ thông tin để đánh giá.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StarBuilderPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Đang tải...</div>}>
      <StarBuilderContent />
    </Suspense>
  );
}
