'use client';

import React, { useEffect, useState } from 'react';
import styles from './CareerGoals.module.css';
import { careerGoalsApi, CareerGoalResponse, CreateCareerGoalRequest } from '@/services/careerGoalsApi';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import inputStyles from '@/components/ui/Input/Input.module.css';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const goalSchema = z.object({
  targetRole: z.string().min(2, 'Vị trí mục tiêu phải có ít nhất 2 ký tự'),
  seniority: z.string().min(1, 'Vui lòng nhập cấp bậc'),
  industry: z.string().optional(),
  targetCompany: z.string().optional(),
  targetDate: z.string().optional()
});

type GoalFormValues = z.infer<typeof goalSchema>;

export default function CareerGoals() {
  const [goals, setGoals] = useState<CareerGoalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema)
  });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await careerGoalsApi.list();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách mục tiêu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const onSubmit = async (data: GoalFormValues) => {
    try {
      setError(null);
      
      const requestData: CreateCareerGoalRequest = {
        targetRole: data.targetRole,
        seniority: data.seniority,
        industry: data.industry || null,
        targetCompany: data.targetCompany || null,
        targetDate: data.targetDate || null,
      };

      await careerGoalsApi.create(requestData);
      setIsModalOpen(false);
      reset();
      fetchGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo mục tiêu mới');
    }
  };

  const toggleActiveStatus = async (goal: CareerGoalResponse) => {
    // Optimistic UI Update: Thay đổi giao diện tức thì
    const originalGoals = [...goals];
    setGoals(goals.map(g => g.id === goal.id ? { ...g, active: !g.active } : g));

    try {
      // Gọi API chạy ngầm
      const updatedGoal = await careerGoalsApi.update(goal.id, {
        activeSpecified: true,
        active: !goal.active
      });
      
      // Đồng bộ dữ liệu thật từ backend thay vì fetch lại toàn bộ danh sách
      setGoals(currentGoals => currentGoals.map(g => g.id === goal.id ? updatedGoal : g));
    } catch (err) {
      // Đảo ngược lại nếu lỗi
      setGoals(originalGoals);
      alert('Không thể cập nhật trạng thái mục tiêu');
    }
  };

  if (loading && goals.length === 0) {
    return <div className={styles.container}>Đang tải...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mục Tiêu Nghề Nghiệp</h1>
        <Button onClick={() => setIsModalOpen(true)}>Thêm Mục Tiêu</Button>
      </div>

      {error && !isModalOpen && <div className={styles.errorMessage} style={{marginBottom: '1rem'}}>{error}</div>}

      {goals.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyStateTitle}>Chưa có mục tiêu nào</h3>
          <p className={styles.emptyStateDesc}>Hãy thiết lập mục tiêu nghề nghiệp để Nexora giúp bạn chuẩn bị lộ trình tốt nhất.</p>
          <Button onClick={() => setIsModalOpen(true)}>Tạo Mục Tiêu Đầu Tiên</Button>
        </div>
      ) : (
        <div className={styles.goalsList}>
          {goals.map(goal => (
            <div key={goal.id} className={styles.goalCard}>
              <div className={styles.goalHeader}>
                <div className={styles.targetRole}>{goal.targetRole}</div>
                <div 
                  className={`${styles.badge} ${goal.active ? styles.badgeActive : styles.badgeInactive}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleActiveStatus(goal)}
                  title="Nhấn để đổi trạng thái"
                >
                  {goal.active ? 'Đang theo đuổi' : 'Tạm dừng'}
                </div>
              </div>
              
              <div className={styles.goalDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Cấp bậc</span>
                  <span className={styles.detailValue}>{goal.seniority || 'Chưa xác định'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Ngành nghề</span>
                  <span className={styles.detailValue}>{goal.industry || 'Chưa xác định'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Công ty mơ ước</span>
                  <span className={styles.detailValue}>{goal.targetCompany || 'Chưa xác định'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Mục tiêu thời gian</span>
                  <span className={styles.detailValue}>
                    {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Thêm Mục Tiêu Mới</h3>
              <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              {error && <div className={styles.errorMessage}>{error}</div>}
              
              <div className={styles.formGroup}>
                <Input 
                  label="Vị trí mục tiêu (*)" 
                  placeholder="VD: Senior Frontend Engineer"
                  {...register('targetRole')} 
                  error={errors.targetRole?.message}
                />
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={inputStyles.label}>Cấp bậc (*)</label>
                  <div className={inputStyles.inputWrapper}>
                    <select
                      className={`${inputStyles.input} ${errors.seniority ? inputStyles.inputError : ''}`}
                      {...register('seniority')}
                    >
                      <option value="">Chọn cấp bậc</option>
                      <option value="intern">Thực tập sinh (Intern)</option>
                      <option value="entry">Mới đi làm (Entry-level)</option>
                      <option value="junior">Nhân viên (Junior)</option>
                      <option value="mid">Chuyên viên (Mid-level)</option>
                      <option value="senior">Chuyên viên cao cấp (Senior)</option>
                      <option value="lead">Trưởng nhóm (Lead)</option>
                      <option value="manager">Quản lý (Manager)</option>
                      <option value="director">Giám đốc (Director)</option>
                      <option value="executive">Điều hành (Executive)</option>
                    </select>
                  </div>
                  {errors.seniority && <span className={inputStyles.errorMessage}>{errors.seniority.message}</span>}
                </div>
                <div className={styles.formGroup}>
                  <Input 
                    label="Ngành nghề" 
                    placeholder="VD: FinTech, E-commerce"
                    {...register('industry')} 
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <Input 
                    label="Công ty mơ ước" 
                    placeholder="VD: Google, VNG"
                    {...register('targetCompany')} 
                  />
                </div>
                <div className={styles.formGroup}>
                  <Input 
                    type="date"
                    label="Hạn chót mục tiêu" 
                    {...register('targetDate')} 
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className={styles.buttonOutline}
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </button>
                <Button type="submit" isLoading={isSubmitting}>Lưu Mục Tiêu</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
