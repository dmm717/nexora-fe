'use client';

import React, { useState } from 'react';
import styles from './CareerGoals.module.css';
import type { CareerGoalResponse } from '@/services/careerGoalContract';
import { ApiError } from '@/services/apiClient';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import inputStyles from '@/components/ui/Input/Input.module.css';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useCareerGoals,
  useCreateCareerGoal,
  useUpdateCareerGoal,
  useArchiveCareerGoal,
  useReactivateCareerGoal,
  useDeleteCareerGoal,
  type CareerGoalFormValues,
} from '@/hooks/queries/useCareerGoals';
import { buildUpdateCareerGoalRequest } from '@/services/careerGoalContract';

const goalSchema = z.object({
  targetRole: z.string().min(2, 'Vị trí mục tiêu phải có ít nhất 2 ký tự'),
  seniority: z.string().min(1, 'Vui lòng nhập cấp bậc'),
  industry: z.string().optional(),
  targetCompany: z.string().optional(),
  targetDate: z.string().optional()
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface MutationError {
  message: string;
  code?: string;
  requestId?: string;
}

const toMutationError = (err: unknown, fallback: string): MutationError => {
  if (err instanceof ApiError) {
    return { message: err.message || fallback, code: err.code, requestId: err.requestId };
  }
  return { message: err instanceof Error ? err.message : fallback };
};

const ErrorNotice = ({ error }: { error: MutationError | null }) => {
  if (!error) return null;
  return (
    <div className={styles.errorMessage} style={{ marginBottom: '1rem' }}>
      <div>{error.message}</div>
      {(error.code || error.requestId) && (
        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#64748b' }}>
          {error.code && <span>Mã lỗi: {error.code}</span>}
          {error.code && error.requestId && <span> · </span>}
          {error.requestId && <span>Mã yêu cầu: {error.requestId}</span>}
        </div>
      )}
    </div>
  );
};

export default function CareerGoals() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CareerGoalResponse | null>(null);
  const [mutationError, setMutationError] = useState<MutationError | null>(null);

  const { data: goals = [], isLoading, error: queryError, refetch, isFetching } = useCareerGoals();
  const createMutation = useCreateCareerGoal();
  const updateMutation = useUpdateCareerGoal();
  const archiveMutation = useArchiveCareerGoal();
  const reactivateMutation = useReactivateCareerGoal();
  const deleteMutation = useDeleteCareerGoal();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema)
  });

  const openCreateModal = () => {
    setEditingGoal(null);
    setMutationError(null);
    reset({ targetRole: '', seniority: '', industry: '', targetCompany: '', targetDate: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (goal: CareerGoalResponse) => {
    setEditingGoal(goal);
    setMutationError(null);
    reset({
      targetRole: goal.targetRole,
      seniority: goal.seniority,
      industry: goal.industry || '',
      targetCompany: goal.targetCompany || '',
      targetDate: goal.targetDate || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const onSubmit = async (data: GoalFormValues) => {
    setMutationError(null);
    const values: CareerGoalFormValues = {
      targetRole: data.targetRole,
      seniority: data.seniority,
      industry: data.industry,
      targetCompany: data.targetCompany,
      targetDate: data.targetDate,
    };

    try {
      if (editingGoal) {
        const request = buildUpdateCareerGoalRequest(editingGoal, values);
        if (Object.keys(request).length > 0) {
          await updateMutation.mutateAsync({ id: editingGoal.id, request });
        }
      } else {
        await createMutation.mutateAsync(values);
      }
      closeModal();
    } catch (err: unknown) {
      setMutationError(toMutationError(err, 'Lỗi khi lưu mục tiêu.'));
    }
  };

  const handleArchive = async (goal: CareerGoalResponse) => {
    setMutationError(null);
    try {
      await archiveMutation.mutateAsync(goal.id);
    } catch (err: unknown) {
      setMutationError(toMutationError(err, 'Không thể lưu trữ mục tiêu.'));
    }
  };

  const handleReactivate = async (goal: CareerGoalResponse) => {
    setMutationError(null);
    try {
      await reactivateMutation.mutateAsync(goal.id);
    } catch (err: unknown) {
      setMutationError(toMutationError(err, 'Không thể kích hoạt lại mục tiêu.'));
    }
  };

  const handleDelete = async (goal: CareerGoalResponse) => {
    if (!window.confirm("Bạn có chắc muốn xóa mục tiêu này? Hành động này không thể hoàn tác.")) {
      return;
    }
    setMutationError(null);
    setDeletingId(goal.id);
    try {
      await deleteMutation.mutateAsync(goal.id);
    } catch (err: unknown) {
      setMutationError(toMutationError(err, 'Không thể xóa mục tiêu.'));
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading && goals.length === 0) {
    return <div className={styles.container}>Đang tải...</div>;
  }

  if (queryError && goals.length === 0) {
    const loadError = toMutationError(queryError, 'Không thể tải danh sách mục tiêu');
    return (
      <div className={styles.container}>
        <ErrorNotice error={loadError} />
        <button
          type="button"
          className={styles.buttonOutline}
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Đang thử lại...' : 'Thử tải lại'}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mục Tiêu Nghề Nghiệp</h1>
        <Button onClick={openCreateModal}>Thêm Mục Tiêu</Button>
      </div>

      {!isModalOpen && <ErrorNotice error={mutationError} />}

      {goals.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyStateTitle}>Chưa có mục tiêu nào</h3>
          <p className={styles.emptyStateDesc}>Hãy thiết lập mục tiêu nghề nghiệp để Nexora giúp bạn chuẩn bị lộ trình tốt nhất.</p>
          <Button onClick={openCreateModal}>Tạo Mục Tiêu Đầu Tiên</Button>
        </div>
      ) : (
        <div className={styles.goalsList}>
          {goals.map(goal => (
            <div key={goal.id} className={styles.goalCard}>
              <div className={styles.goalHeader}>
                <div className={styles.targetRole}>{goal.targetRole}</div>
                <div
                  className={`${styles.badge} ${goal.active ? styles.badgeActive : styles.badgeInactive}`}
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

              <div className={styles.modalFooter} style={{ marginTop: '0.75rem' }}>
                <button type="button" className={styles.buttonOutline} onClick={() => openEditModal(goal)}>
                  Chỉnh sửa
                </button>
                {goal.active ? (
                  <button
                    type="button"
                    className={styles.buttonOutline}
                    onClick={() => void handleArchive(goal)}
                    disabled={archiveMutation.isPending}
                  >
                    Lưu trữ
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.buttonOutline}
                    onClick={() => void handleReactivate(goal)}
                    disabled={reactivateMutation.isPending}
                  >
                    Kích hoạt lại
                  </button>
                )}
                <button
                  type="button"
                  className={styles.buttonOutline}
                  style={{ borderColor: '#ef4444', color: '#ef4444' }}
                  onClick={() => void handleDelete(goal)}
                  disabled={deleteMutation.isPending && deletingId === goal.id}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingGoal ? 'Chỉnh Sửa Mục Tiêu' : 'Thêm Mục Tiêu Mới'}</h3>
              <button className={styles.closeButton} onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <ErrorNotice error={mutationError} />

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
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <Button type="submit" isLoading={isSubmitting}>{editingGoal ? 'Cập Nhật' : 'Lưu Mục Tiêu'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
