'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../Interviews.module.css';
import { interviewApi, StartInterviewCommand } from '@/services/interviewApi';

export default function NewInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<StartInterviewCommand>({
    role: '',
    seniority: 'Junior',
    interviewType: 'Technical',
    difficulty: 'Medium'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role.trim()) {
      setError('Vui lòng nhập vị trí ứng tuyển');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await interviewApi.start(form);
      router.push(`/dashboard/interviews/${res.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi bắt đầu phỏng vấn.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Bắt đầu Phỏng vấn mới</h1>
        <button className={styles.btnDanger} style={{ backgroundColor: '#6b7280' }} onClick={() => router.back()}>Hủy</button>
      </div>

      <div className={styles.panel}>
        {error && <div style={{ color: '#dc2626', marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="role">Vị trí ứng tuyển (Role)</label>
            <input
              id="role"
              type="text"
              className={styles.input}
              placeholder="Vd: Frontend Developer, Product Manager..."
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="seniority">Cấp bậc (Seniority)</label>
            <select
              id="seniority"
              className={styles.select}
              value={form.seniority}
              onChange={e => setForm({ ...form, seniority: e.target.value })}
              disabled={loading}
            >
              <option value="Intern">Intern / Thực tập sinh</option>
              <option value="Fresher">Fresher / Mới ra trường</option>
              <option value="Junior">Junior / Ít kinh nghiệm</option>
              <option value="Mid-level">Mid-level / Có kinh nghiệm</option>
              <option value="Senior">Senior / Chuyên viên</option>
              <option value="Lead">Lead / Trưởng nhóm</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="interviewType">Loại phỏng vấn (Type)</label>
            <select
              id="interviewType"
              className={styles.select}
              value={form.interviewType}
              onChange={e => setForm({ ...form, interviewType: e.target.value })}
              disabled={loading}
            >
              <option value="Technical">Technical (Kỹ thuật chuyên môn)</option>
              <option value="Behavioral">Behavioral (Hành vi & Văn hóa)</option>
              <option value="System Design">System Design (Thiết kế hệ thống)</option>
              <option value="General">General (Tổng quan)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="difficulty">Độ khó (Difficulty)</label>
            <select
              id="difficulty"
              className={styles.select}
              value={form.difficulty}
              onChange={e => setForm({ ...form, difficulty: e.target.value })}
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
