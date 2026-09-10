/* eslint-disable react-doctor/no-array-index-as-key */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import styles from './StarBuilder.module.css';
import { starBuilderApi, StarAttemptRequest, StarAttemptResponse, StarEvaluation } from '@/services/starBuilderApi';
import { useSearchParams } from 'next/navigation';
import { scenarioApi, ScenarioAttemptResponse, ScenarioEvaluationResult } from '@/services/scenarioApi';
import { useScenarioDetails } from '@/hooks/queries/useScenarios';
import { useStarAttempt } from '@/hooks/queries/useStarAttempts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { REALTIME_FALLBACK_POLL_MS } from '@/constants/realtime';
import { readStatus } from '@/utils/queryPolling';

const getScoreClass = (score: number) => {
  if (score >= 80) return styles.scoreExcellent;
  if (score >= 65) return styles.scoreGood;
  if (score >= 50) return styles.scoreAverage;
  return styles.scorePoor;
};

const ScenarioContent = ({ text }: { text: string }) => {
  return <>{text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    const lineKey = `${i}-${trimmed.substring(0, 10)}`;
    if (!trimmed) return <br key={lineKey} />;
    if (trimmed.startsWith('## ')) {
      return <h4 key={lineKey} style={{ marginTop: '0.75rem', marginBottom: '0.5rem', color: '#1f2937', fontWeight: 600 }}>{trimmed.replace('## ', '')}</h4>;
    }
    if (trimmed.startsWith('# ')) {
      return <h3 key={lineKey} style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#1f2937', fontWeight: 700 }}>{trimmed.replace('# ', '')}</h3>;
    }
    if (trimmed.startsWith('- ')) {
      return <li key={lineKey} style={{ marginLeft: '1.5rem', marginBottom: '0.25rem' }}>{trimmed.replace('- ', '')}</li>;
    }
    // Simple bold parsing
    const boldRegex = /\*\*(.*?)\*\*/g;
    if (boldRegex.test(trimmed)) {
      const parts = trimmed.split(boldRegex);
      return (
        <p key={lineKey} style={{ marginBottom: '0.25rem' }}>
          {parts.map((part, idx) => idx % 2 === 1 ? <strong key={`${idx}-${part.substring(0,5)}`} style={{ color: '#111827' }}>{part}</strong> : part)}
        </p>
      );
    }
    return <p key={lineKey} style={{ marginBottom: '0.25rem' }}>{trimmed}</p>;
  })}</>;
};

const ScenarioEvaluation = ({ evalData }: { evalData: ScenarioEvaluationResult }) => (
  <div className={styles.starBreakdown}>
    <h4 className={styles.tipsTitle} style={{ marginTop: '0', marginBottom: '1rem' }}>Phân tích theo tiêu chí</h4>
    {evalData.dimensions?.map((dim) => (
      <div key={dim.criterion} className={styles.breakdownItem}>
        <div className={styles.breakdownHeader}>
          <span className={styles.breakdownTitle}>{dim.criterion}</span>
          <span className={`${styles.breakdownScore} ${getScoreClass(dim.score)}`}>{dim.score}/100</span>
        </div>
        <p className={styles.breakdownFeedback}>{dim.feedback}</p>
      </div>
    ))}

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
      {evalData.strengths?.length > 0 && (
        <div className={styles.tipsSection} style={{ marginTop: 0 }}>
          <h4 className={styles.tipsTitle} style={{ color: '#166534' }}>👍 Điểm mạnh</h4>
          <ul className={styles.tipsList}>
            {evalData.strengths.map((str) => (
              <li key={str}>{str}</li>
            ))}
          </ul>
        </div>
      )}
      {evalData.gaps?.length > 0 && (
        <div className={styles.tipsSection} style={{ marginTop: 0 }}>
          <h4 className={styles.tipsTitle} style={{ color: '#b91c1c' }}>⚠️ Cần cải thiện</h4>
          <ul className={styles.tipsList}>
            {evalData.gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
    
    {evalData.recommendedApproach?.length > 0 && (
      <div className={styles.tipsSection}>
        <h4 className={styles.tipsTitle} style={{ color: '#1e40af' }}>💡 Hướng tiếp cận đề xuất</h4>
        <ul className={styles.tipsList}>
          {evalData.recommendedApproach.map((rec) => (
            <li key={rec}>{rec}</li>
          ))}
        </ul>
      </div>
    )}
    
    {evalData.feedback && (
      <div className={styles.tipsSection}>
        <h4 className={styles.tipsTitle}>📝 Nhận xét chung</h4>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{evalData.feedback}</p>
      </div>
    )}
  </div>
);

const GenericStarEvaluation = ({ evalData }: { evalData: StarEvaluation }) => (
  evalData.applicable ? (
    <div className={styles.starBreakdown}>
      {evalData.situation && (
        <div className={styles.breakdownItem}>
          <div className={styles.breakdownHeader}>
            <span className={styles.breakdownTitle}>Situation</span>
            <span className={`${styles.breakdownScore} ${getScoreClass(evalData.situation.score)}`}>{evalData.situation.score}/100</span>
          </div>
          <p className={styles.breakdownFeedback}>{evalData.situation.feedback}</p>
        </div>
      )}
      {evalData.task && (
        <div className={styles.breakdownItem}>
          <div className={styles.breakdownHeader}>
            <span className={styles.breakdownTitle}>Task</span>
            <span className={`${styles.breakdownScore} ${getScoreClass(evalData.task.score)}`}>{evalData.task.score}/100</span>
          </div>
          <p className={styles.breakdownFeedback}>{evalData.task.feedback}</p>
        </div>
      )}
      {evalData.action && (
        <div className={styles.breakdownItem}>
          <div className={styles.breakdownHeader}>
            <span className={styles.breakdownTitle}>Action</span>
            <span className={`${styles.breakdownScore} ${getScoreClass(evalData.action.score)}`}>{evalData.action.score}/100</span>
          </div>
          <p className={styles.breakdownFeedback}>{evalData.action.feedback}</p>
        </div>
      )}
      {evalData.result && (
        <div className={styles.breakdownItem}>
          <div className={styles.breakdownHeader}>
            <span className={styles.breakdownTitle}>Result</span>
            <span className={`${styles.breakdownScore} ${getScoreClass(evalData.result.score)}`}>{evalData.result.score}/100</span>
          </div>
          <p className={styles.breakdownFeedback}>{evalData.result.feedback}</p>
        </div>
      )}

      {evalData.coachingTips && evalData.coachingTips.length > 0 && (
        <div className={styles.tipsSection}>
          <h4 className={styles.tipsTitle}>💡 Lời khuyên cải thiện</h4>
          <ul className={styles.tipsList}>
            {evalData.coachingTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  ) : (
    <div className={styles.errorMessage} style={{ marginTop: '1rem' }}>
      Câu trả lời không phù hợp với cấu trúc S-T-A-R hoặc không đủ thông tin để đánh giá.
    </div>
  )
);

function isScenarioResult(result: StarAttemptResponse | ScenarioAttemptResponse): result is ScenarioAttemptResponse {
  return 'scenarioId' in result;
}

function StarBuilderContent() {
  const searchParams = useSearchParams();
  const scenarioSlug = searchParams.get('scenario');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<StarAttemptRequest>({
    question: '',
    answer: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const { data: scenarioData } = useScenarioDetails(scenarioSlug || '');

  useEffect(() => {
    if (scenarioData) {
      setFormData(prev => ({ ...prev, question: scenarioData.content || scenarioData.summary || scenarioData.title }));
    }
  }, [scenarioData]);

  const { data: rawResult, isLoading: attemptLoading, error: queryError } = useStarAttempt(
    attemptId || '',
    !!scenarioData,
    (query) => {
      const status = readStatus(query.state.data);
      if (status === 'completed' || status === 'failed' || status === 'abandoned') return false;
      return REALTIME_FALLBACK_POLL_MS;
    }
  );
  const result = rawResult as any;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (scenarioData) {
        const attempt = await scenarioApi.createAttempt({ scenarioId: scenarioData.id });
        await scenarioApi.submitAttempt(attempt.id, { answer: formData.answer });
        return attempt.id;
      } else {
        const response = await starBuilderApi.submitAttempt(formData);
        return response.id;
      }
    },
    onSuccess: (id) => {
      setAttemptId(id);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['starAttempts'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Lỗi khi gửi đánh giá.');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question || !formData.answer) {
      setError('Vui lòng điền đầy đủ Câu hỏi và Câu trả lời.');
      return;
    }
    setError(null);
    setAttemptId(null);
    submitMutation.mutate();
  };

  const loading = submitMutation.isPending || attemptLoading || (result && (result.status === 'pending' || result.status === 'processing'));
  const displayError = error || (queryError ? 'Lỗi khi kiểm tra kết quả.' : null);



  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>S-T-A-R Builder</h1>
        <p className={styles.subtitle}>Rèn luyện kỹ năng trả lời phỏng vấn theo phương pháp Situation - Task - Action - Result</p>
      </header>

      {displayError && <div className={styles.errorMessage}>{displayError}</div>}
      
      <div className={`${styles.contentWrapper} ${!(result || loading) ? styles.contentWrapperCentered : ''}`}>
        <div className={styles.formPanel}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formSplitLayout}>
              {/* Left Column: Scenario */}
              <div className={styles.leftColumn}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label} htmlFor="question">
                    Tình huống phỏng vấn (Question / Scenario)
                  </label>
                  <div className={styles.scenarioCard} style={{ margin: 0, height: '380px', display: 'flex', flexDirection: 'column' }}>
                    {scenarioData ? (
                      <div className={styles.scenarioContent} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#111827' }}>{scenarioData.title}</h3>
                        <div className={styles.scenarioBody} style={{ overflowY: 'auto', flexGrow: 1 }}>
                          <ScenarioContent text={formData.question} />
                        </div>
                      </div>
                    ) : (
                      <textarea
                        id="question"
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
                  <label className={styles.label} htmlFor="answer">
                    Câu trả lời (Vui lòng áp dụng cấu trúc S-T-A-R)
                  </label>
                  <textarea
                    id="answer"
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

                    {isScenarioResult(result)
                      ? (result.evaluation ? <ScenarioEvaluation evalData={result.evaluation as ScenarioEvaluationResult} /> : null)
                      : (result.evaluation ? <GenericStarEvaluation evalData={result.evaluation as StarEvaluation} /> : null)}
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
