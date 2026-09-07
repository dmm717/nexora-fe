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
    answer: ''
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
    if (!formData.question || !formData.answer) {
      setError('Vui lòng điền đầy đủ Câu hỏi và Câu trả lời.');
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

  const renderScenarioContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith('## ')) {
        return <h4 key={i} style={{ marginTop: '0.75rem', marginBottom: '0.5rem', color: '#1f2937', fontWeight: 600 }}>{trimmed.replace('## ', '')}</h4>;
      }
      if (trimmed.startsWith('# ')) {
        return <h3 key={i} style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#1f2937', fontWeight: 700 }}>{trimmed.replace('# ', '')}</h3>;
      }
      if (trimmed.startsWith('- ')) {
        return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.25rem' }}>{trimmed.replace('- ', '')}</li>;
      }
      // Simple bold parsing
      const boldRegex = /\*\*(.*?)\*\*/g;
      if (boldRegex.test(trimmed)) {
        const parts = trimmed.split(boldRegex);
        return (
          <p key={i} style={{ marginBottom: '0.25rem' }}>
            {parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} style={{ color: '#111827' }}>{part}</strong> : part)}
          </p>
        );
      }
      return <p key={i} style={{ marginBottom: '0.25rem' }}>{trimmed}</p>;
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>STAR Builder</h1>
        <p className={styles.subtitle}>Luyện tập kỹ năng kể chuyện theo phương pháp S-T-A-R để nhận đánh giá chi tiết.</p>
      </header>

      <div className={`${styles.contentWrapper} ${!(result || loading) ? styles.contentWrapperCentered : ''}`}>
        <div className={styles.formPanel}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formSplitLayout}>
              {/* Left Column: Scenario */}
              <div className={styles.leftColumn}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label}>
                    Tình huống phỏng vấn (Question / Scenario)
                  </label>
                  <div className={styles.scenarioCard} style={{ margin: 0, height: '380px', display: 'flex', flexDirection: 'column' }}>
                    {scenarioData ? (
                      <div className={styles.scenarioContent} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#111827' }}>{scenarioData.title}</h3>
                        <div className={styles.scenarioBody} style={{ overflowY: 'auto', flexGrow: 1 }}>
                          {renderScenarioContent(formData.question)}
                        </div>
                      </div>
                    ) : (
                      <textarea
                        name="question"
                        value={formData.question}
                        onChange={handleChange}
                        className={styles.textarea}
                        placeholder="Nhập câu hỏi phỏng vấn bạn muốn trả lời..."
                        style={{ height: '380px' }}
                        disabled={loading}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Answer */}
              <div className={styles.rightColumn}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label}>
                    Câu trả lời (Vui lòng áp dụng cấu trúc S-T-A-R)
                  </label>
                  <textarea
                    name="answer"
                    value={formData.answer}
                    onChange={handleChange}
                    className={styles.textarea}
                    placeholder="Nhập câu trả lời chi tiết của bạn..."
                    style={{ height: '380px' }}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {error && <div className={styles.errorMessage} style={{ marginTop: '1.5rem' }}>{error}</div>}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <button type="submit" className={styles.btnSubmit} disabled={loading} style={{ maxWidth: '400px' }}>
                {loading ? (
                  <><span className={styles.spinner}></span> Đang phân tích...</>
                ) : (
                  'Nhận Đánh giá S-T-A-R'
                )}
              </button>
            </div>
          </form>
        </div>

        {(result || loading) && (
          <div className={styles.resultPanel}>
            {loading && (
              <div className={styles.emptyState}>
                <div className={styles.spinnerLarge}></div>
                <h3>Đang xử lý</h3>
                <p>AI đang đọc và phân tích từng thành phần trong câu chuyện của bạn.</p>
              </div>
            )}

            {result && (
              <div className={styles.resultContent}>
                {result.status === 'failed' ? (
                  <div className={styles.errorMessage} style={{ marginTop: '1rem' }}>
                    Đã có lỗi xảy ra trong quá trình AI xử lý ({result.errorCode}). Vui lòng thử lại sau.
                  </div>
                ) : (
                  <>
                    <div className={styles.scoreHeader}>
                      <div className={styles.overallScore}>
                        <div className={styles.scoreTitle}>Điểm Đánh giá</div>
                        <div className={`${styles.scoreNumber} ${getScoreClass(result.evaluation?.overallScore ?? 0)}`}>
                          {result.evaluation?.overallScore ?? 0}<span>/100</span>
                        </div>
                      </div>
                    </div>

                    {result.evaluation?.applicable ? (
                      <div className={styles.starBreakdown}>
                        {result.evaluation.situation && (
                          <div className={styles.breakdownItem}>
                            <div className={styles.breakdownHeader}>
                              <span className={styles.breakdownTitle}>Situation</span>
                              <span className={`${styles.breakdownScore} ${getScoreClass(result.evaluation.situation.score)}`}>{result.evaluation.situation.score}/100</span>
                            </div>
                            <p className={styles.breakdownFeedback}>{result.evaluation.situation.feedback}</p>
                          </div>
                        )}
                        {result.evaluation.task && (
                          <div className={styles.breakdownItem}>
                            <div className={styles.breakdownHeader}>
                              <span className={styles.breakdownTitle}>Task</span>
                              <span className={`${styles.breakdownScore} ${getScoreClass(result.evaluation.task.score)}`}>{result.evaluation.task.score}/100</span>
                            </div>
                            <p className={styles.breakdownFeedback}>{result.evaluation.task.feedback}</p>
                          </div>
                        )}
                        {result.evaluation.action && (
                          <div className={styles.breakdownItem}>
                            <div className={styles.breakdownHeader}>
                              <span className={styles.breakdownTitle}>Action</span>
                              <span className={`${styles.breakdownScore} ${getScoreClass(result.evaluation.action.score)}`}>{result.evaluation.action.score}/100</span>
                            </div>
                            <p className={styles.breakdownFeedback}>{result.evaluation.action.feedback}</p>
                          </div>
                        )}
                        {result.evaluation.result && (
                          <div className={styles.breakdownItem}>
                            <div className={styles.breakdownHeader}>
                              <span className={styles.breakdownTitle}>Result</span>
                              <span className={`${styles.breakdownScore} ${getScoreClass(result.evaluation.result.score)}`}>{result.evaluation.result.score}/100</span>
                            </div>
                            <p className={styles.breakdownFeedback}>{result.evaluation.result.feedback}</p>
                          </div>
                        )}

                        {result.evaluation.coachingTips && result.evaluation.coachingTips.length > 0 && (
                          <div className={styles.tipsSection}>
                            <h4 className={styles.tipsTitle}>💡 Lời khuyên cải thiện</h4>
                            <ul className={styles.tipsList}>
                              {result.evaluation.coachingTips.map((tip, idx) => (
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
                  </>
                )}
              </div>
            )}
          </div>
        )}
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
