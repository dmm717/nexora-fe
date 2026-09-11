'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../Interviews.module.css';
import { interviewApi, type StartInterviewCommand } from '@/services/interviewApi';
import { generateIdempotencyKey } from '@/services/interviewContract';
import { ApiError } from '@/services/apiClient';

export default function NewInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);

  // Stable idempotency key for the creation intent
  const startKeyRef = useRef<string>(generateIdempotencyKey());

  const [form, setForm] = useState<StartInterviewCommand>({
    role: '',
    seniority: 'Junior',
    interviewType: 'Technical',
    difficulty: 'Medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role.trim()) {
      setError({ message: 'Vui lòng nhập vị trí ứng tuyển mong muốn.' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await interviewApi.start(
        {
          ...form,
          role: form.role.trim(),
        },
        startKeyRef.current
      );
      router.push(`/dashboard/interviews/${res.id}`);
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

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="role">
              Vị trí ứng tuyển (Role)
            </label>
            <input
              id="role"
              type="text"
              className={styles.input}
              placeholder="Vd: Frontend Developer, Product Manager, Data Analyst..."
              value={form.role}
              onChange={(e) => {
                setForm({ ...form, role: e.target.value });
                // Reset startKey if user changes role intent
                startKeyRef.current = generateIdempotencyKey();
              }}
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
              value={form.seniority}
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
              <option value="Technical">Technical (Kỹ thuật &amp; Chuyên môn)</option>
              <option value="Behavioral">Behavioral (Hành vi &amp; Phương pháp STAR)</option>
              <option value="System Design">System Design (Thiết kế hệ thống)</option>
              <option value="General">General (Tổng quan &amp; Định hướng)</option>
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
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Đang tạo phòng thi...' : 'Bắt đầu ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
