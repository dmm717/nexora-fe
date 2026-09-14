'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../Interviews.module.css';
import { interviewApi, type StartInterviewCommand } from '@/services/interviewApi';
import {
  getOrCreateStartIntent,
  type StartIntent,
} from '@/services/interviewContract';
import { ApiError } from '@/services/apiClient';
import { useCareerGoals } from '@/hooks/queries/useCareerGoals';

export default function NewInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);

  // Tabs state
  const [mode, setMode] = useState<'career_goal' | 'manual'>('career_goal');

  // Load career goals
  const { data: careerGoals, isLoading: loadingGoals } = useCareerGoals();
  const activeGoals = React.useMemo(() => careerGoals?.filter((g) => g.active) || [], [careerGoals]);

  // Stable intent tracking: reuse key for identical payload retries, regenerate on edit
  const pendingStartIntentRef = useRef<StartIntent | null>(null);

  const [form, setForm] = useState<StartInterviewCommand>({
    role: '',
    seniority: 'Junior',
    interviewType: 'technical',
    difficulty: 'Medium',
    careerGoalId: '',
  });

  // Removed useEffect to prevent set-state-in-effect error
  // We will derive the selected goal directly if empty

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let candidatePayload: StartInterviewCommand;

    if (mode === 'manual') {
      if (!form.role?.trim()) {
        setError({ message: 'Vui lòng nhập vị trí ứng tuyển mong muốn.' });
        return;
      }
      candidatePayload = {
        role: form.role.trim(),
        seniority: form.seniority,
        interviewType: form.interviewType,
        difficulty: form.difficulty,
      };
    } else {
      const targetGoalId = form.careerGoalId || (activeGoals.length > 0 ? activeGoals[0].id : '');
      if (!targetGoalId) {
        setError({ message: 'Vui lòng chọn mục tiêu nghề nghiệp.' });
        return;
      }
      candidatePayload = {
        careerGoalId: targetGoalId,
        interviewType: form.interviewType,
        difficulty: form.difficulty,
      };
    }

    const intent = getOrCreateStartIntent(pendingStartIntentRef.current, candidatePayload);
    pendingStartIntentRef.current = intent;

    setLoading(true);
    try {
      const res = await interviewApi.start(
        intent.payload as StartInterviewCommand,
        intent.key
      );
      // Succeeded: clear pending intent
      pendingStartIntentRef.current = null;
      router.push(`/interviews/${res.id}`);
    } catch (err: unknown) {
      setError({
        message: err instanceof ApiError ? err.message : 'Có lỗi xảy ra khi bắt đầu phỏng vấn.',
        requestId: err instanceof ApiError ? err.requestId : undefined,
      });
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Bắt đầu Phỏng vấn mới</h1>
        <button
          className={styles.btnDanger}
          style={{ backgroundColor: '#6b7280', color: '#ffffff' }}
          onClick={() => router.back()}
          disabled={loading}
        >
          Hủy
        </button>
      </div>

      <div className={styles.panel}>
        {error && (
          <div className={styles.actionError}>
            <div className={styles.errorTitle}>
              <span>⚠️</span>
              <span>{error.message}</span>
            </div>
            {error.requestId && (
              <div className={styles.errorMeta}>Mã yêu cầu (Request ID): {error.requestId}</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <button
            type="button"
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              fontSize: '1rem',
              fontWeight: mode === 'career_goal' ? '600' : '400',
              color: mode === 'career_goal' ? '#111827' : '#6b7280',
              borderBottom: mode === 'career_goal' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer'
            }}
            onClick={() => setMode('career_goal')}
          >
            Từ Mục tiêu nghề nghiệp
          </button>
          <button
            type="button"
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              fontSize: '1rem',
              fontWeight: mode === 'manual' ? '600' : '400',
              color: mode === 'manual' ? '#111827' : '#6b7280',
              borderBottom: mode === 'manual' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer'
            }}
            onClick={() => setMode('manual')}
          >
            Khởi tạo Thủ công
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'career_goal' && (
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="careerGoalId">
                Mục tiêu (Career Goal)
              </label>
              {loadingGoals ? (
                <div style={{ padding: '0.5rem', color: '#6b7280' }}>Đang tải danh sách mục tiêu...</div>
              ) : activeGoals.length === 0 ? (
                <div style={{ padding: '0.5rem', color: '#b91c1c', backgroundColor: '#fef2f2', borderRadius: '4px' }}>
                  Bạn chưa có Mục tiêu nghề nghiệp (Career Goal) nào. Vui lòng thiết lập hoặc chọn chế độ Khởi tạo thủ công.
                </div>
              ) : (
                <select
                  id="careerGoalId"
                  className={styles.select}
                  value={form.careerGoalId || (activeGoals.length > 0 ? activeGoals[0].id : '')}
                  onChange={(e) => setForm({ ...form, careerGoalId: e.target.value })}
                  disabled={loading}
                >
                  <option value="" disabled>-- Chọn Mục tiêu --</option>
                  {activeGoals.map(goal => (
                    <option key={goal.id} value={goal.id}>
                      {goal.targetRole} {goal.seniority ? `(${goal.seniority})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {mode === 'manual' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="role">
                  Vị trí ứng tuyển (Role)
                </label>
                <input
                  id="role"
                  type="text"
                  className={styles.input}
                  placeholder="Vd: Frontend Developer, Product Manager, Data Analyst..."
                  value={form.role || ''}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="seniority">
                  Cấp bậc (Seniority)
                </label>
                <select
                  id="seniority"
                  className={styles.select}
                  value={form.seniority || 'Junior'}
                  onChange={(e) => setForm({ ...form, seniority: e.target.value })}
                  disabled={loading}
                >
                  <option value="Intern">Intern / Thực tập sinh</option>
                  <option value="Fresher">Fresher / Mới tốt nghiệp</option>
                  <option value="Junior">Junior / 1-2 năm kinh nghiệm</option>
                  <option value="Mid-level">Mid-level / 2-4 năm kinh nghiệm</option>
                  <option value="Senior">Senior / Trên 5 năm kinh nghiệm</option>
                  <option value="Lead">Lead / Trưởng nhóm</option>
                </select>
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="interviewType">
              Loại phỏng vấn (Type)
            </label>
            <select
              id="interviewType"
              className={styles.select}
              value={form.interviewType}
              onChange={(e) => setForm({ ...form, interviewType: e.target.value })}
              disabled={loading}
            >
              <option value="technical">Technical (Kỹ thuật &amp; Chuyên môn)</option>
              <option value="behavioral">Behavioral (Hành vi &amp; Phương pháp STAR)</option>
              <option value="scenario">Scenario (Tình huống thực tế)</option>
              <option value="cv_targeted">CV Targeted (Theo CV của bạn)</option>
              <option value="jd_targeted">JD Targeted (Theo Job Description)</option>
              <option value="motivation_role_fit">Motivation &amp; Role Fit (Động lực &amp; Phù hợp)</option>
              <option value="self_introduction">Self Introduction (Giới thiệu bản thân)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="difficulty">
              Độ khó (Difficulty)
            </label>
            <select
              id="difficulty"
              className={styles.select}
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              disabled={loading}
            >
              <option value="Easy">Dễ (Easy)</option>
              <option value="Medium">Trung bình (Medium)</option>
              <option value="Hard">Khó (Hard)</option>
            </select>
          </div>

          <div className={styles.buttonGroup}>
            <button 
              type="submit" 
              className={styles.btnPrimary} 
              disabled={loading || (mode === 'career_goal' && activeGoals.length === 0)}
            >
              {loading ? 'Đang tạo phòng thi...' : 'Bắt đầu ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
