'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useCareerGoals,
  useArchiveCareerGoal,
  useReactivateCareerGoal,
  type CareerGoalResponse,
} from '@/hooks/queries/useCareerGoals';
import type { CareerProfileResponse } from '@/services/profileApi';
import { formatSeniorityLabel } from '@/services/careerGoalContract';
import {
  EditCareerGoalModal,
  type CareerGoalModalGoal,
} from './EditCareerGoalModal';
import { DeleteCareerGoalModal } from './DeleteCareerGoalModal';
import { toast } from 'sonner';

export interface CareerGoalsSectionProps {
  activeGoalFromProfile?: CareerProfileResponse['activeCareerGoal'] | null;
}

const formatDate = (isoString?: string | null): string => {
  if (!isoString) return 'Chưa cập nhật';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Chưa cập nhật';
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return 'Chưa cập nhật';
  }
};

export const CareerGoalsSection: React.FC<CareerGoalsSectionProps> = ({
  activeGoalFromProfile,
}) => {
  const {
    data: allGoals = [],
    isLoading: isGoalsLoading,
    isError: isGoalsError,
    refetch: refetchGoals,
  } = useCareerGoals();

  const archiveMutation = useArchiveCareerGoal();
  const reactivateMutation = useReactivateCareerGoal();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<CareerGoalModalGoal | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<{
    id: string;
    targetRole: string;
  } | null>(null);

  const [pendingGoalId, setPendingGoalId] = useState<string | null>(null);

  // Reconcile active goal
  const activeFromGoals = allGoals.find((g) => g.active);
  const activeGoal = activeFromGoals || activeGoalFromProfile || null;

  // Inactive goals
  const otherGoals = allGoals.filter((g) => !g.active);

  const handleOpenCreateModal = () => {
    setGoalToEdit(null);
    setEditModalOpen(true);
  };

  const handleOpenEditModal = (goal: CareerGoalModalGoal) => {
    setGoalToEdit(goal);
    setEditModalOpen(true);
  };

  const handleArchive = async (goalId: string) => {
    setPendingGoalId(goalId);
    try {
      await archiveMutation.mutateAsync(goalId);
      toast.success('Đã lưu trữ mục tiêu nghề nghiệp');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Không thể lưu trữ mục tiêu.';
      toast.error(message);
    } finally {
      setPendingGoalId(null);
    }
  };

  const handleReactivate = async (goalId: string) => {
    setPendingGoalId(goalId);
    try {
      await reactivateMutation.mutateAsync(goalId);
      toast.success('Kích hoạt lại mục tiêu nghề nghiệp thành công!');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Không thể kích hoạt lại mục tiêu.';
      toast.error(message);
    } finally {
      setPendingGoalId(null);
    }
  };

  const handleOpenDeleteModal = (goal: { id: string; targetRole: string }) => {
    setGoalToDelete(goal);
    setDeleteModalOpen(true);
  };

  const hasNoGoals = !activeGoal && otherGoals.length === 0 && !isGoalsLoading;

  return (
    <section id="goals" tabIndex={-1} className="outline-none space-y-6">
      {/* Secondary query error notice if core profile is usable */}
      {isGoalsError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-on-surface">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600">
              warning
            </span>
            <span>
              Không thể làm mới danh sách mục tiêu đầy đủ. Đang hiển thị mục tiêu từ hồ sơ hiện tại.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetchGoals()}
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Main Career Goal Card */}
      <Card variant="elevated" padding="lg" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[24px]">flag</span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-on-surface">
                  Mục tiêu nghề nghiệp
                </h2>
                {activeGoal && (
                  <Badge variant="primary" size="sm">
                    Đang kích hoạt
                  </Badge>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Định hướng tuyển dụng được Nexora dùng làm bối cảnh cho phân tích và luyện tập AI.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCreateModal}
            icon={<span className="material-symbols-outlined text-[16px]">add</span>}
          >
            Thêm mục tiêu
          </Button>
        </div>

        {/* Empty State */}
        {hasNoGoals ? (
          <div className="py-10 px-4 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/60 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[26px]">flag</span>
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-sm font-bold text-on-surface">
                Chưa có mục tiêu nghề nghiệp
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Hãy thiết lập mục tiêu nghề nghiệp để Nexora giúp bạn chuẩn bị lộ trình tốt nhất và cá nhân hóa trải nghiệm luyện tập AI.
              </p>
            </div>
            <div className="pt-2">
              <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
                Tạo mục tiêu đầu tiên
              </Button>
            </div>
          </div>
        ) : (
          /* Active Goal Content */
          activeGoal && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Mục tiêu hiện tại
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Vị trí mục tiêu
                    </span>
                    <div className="font-bold text-sm text-on-surface mt-0.5">
                      {activeGoal.targetRole}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Cấp bậc
                    </span>
                    <div className="font-bold text-sm text-primary mt-0.5">
                      {formatSeniorityLabel(activeGoal.seniority)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Ngành ưu tiên
                    </span>
                    <div className="font-semibold text-xs sm:text-sm text-on-surface mt-0.5 truncate">
                      {activeGoal.industry?.trim() || 'Chưa cập nhật'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Công ty mục tiêu
                    </span>
                    <div className="font-semibold text-xs sm:text-sm text-on-surface mt-0.5 truncate">
                      {activeGoal.targetCompany?.trim() || 'Chưa cập nhật'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Mốc thời gian
                    </span>
                    <div className="font-semibold text-xs sm:text-sm text-on-surface mt-0.5">
                      {formatDate(activeGoal.targetDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Goal Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditModal(activeGoal)}
                  icon={<span className="material-symbols-outlined text-[16px]">tune</span>}
                >
                  Chỉnh sửa mục tiêu
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleArchive(activeGoal.id)}
                  loading={archiveMutation.isPending && pendingGoalId === activeGoal.id}
                  disabled={archiveMutation.isPending}
                >
                  Lưu trữ
                </Button>
              </div>
            </div>
          )
        )}

        {/* Other / Inactive Goals List */}
        {otherGoals.length > 0 && (
          <div className="pt-6 border-t border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-2">
                <span>Mục tiêu khác</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-[11px] font-semibold text-on-surface-variant">
                  {otherGoals.length}
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {otherGoals.map((goal: CareerGoalResponse) => (
                <div
                  key={goal.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 hover:border-outline-variant transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-on-surface">
                        {goal.targetRole}
                      </span>
                      <span className="text-xs text-primary font-medium">
                        · {formatSeniorityLabel(goal.seniority)}
                      </span>
                      <Badge variant="neutral" size="sm">
                        Tạm dừng
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                      <span>Ngành: {goal.industry?.trim() || 'Chưa cập nhật'}</span>
                      <span>·</span>
                      <span>Công ty: {goal.targetCompany?.trim() || 'Chưa cập nhật'}</span>
                      {goal.targetDate && (
                        <>
                          <span>·</span>
                          <span>Hạn: {formatDate(goal.targetDate)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(goal)}
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReactivate(goal.id)}
                      loading={
                        reactivateMutation.isPending && pendingGoalId === goal.id
                      }
                      disabled={reactivateMutation.isPending}
                    >
                      Kích hoạt lại
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!text-error hover:!bg-error-container/20"
                      onClick={() => handleOpenDeleteModal(goal)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Edit / Create Modal */}
      <EditCareerGoalModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setGoalToEdit(null);
        }}
        goalToEdit={goalToEdit}
      />

      {/* Custom Delete Confirmation Modal */}
      <DeleteCareerGoalModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setGoalToDelete(null);
        }}
        goal={goalToDelete}
      />
    </section>
  );
};
