'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useDeleteCareerGoal } from '@/hooks/queries/useCareerGoals';
import { toast } from 'sonner';

export interface DeleteCareerGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: {
    id: string;
    targetRole: string;
  } | null;
}

export const DeleteCareerGoalModal: React.FC<DeleteCareerGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const deleteMutation = useDeleteCareerGoal();
  const isDeleting = deleteMutation.isPending;

  if (!isOpen || !goal) return null;

  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(goal.id);
      toast.success('Xóa mục tiêu nghề nghiệp thành công!');
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Không thể xóa mục tiêu nghề nghiệp.';
      toast.error(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isDeleting) onClose();
      }}
      title="Xác nhận xóa mục tiêu"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-error-container/20 border border-error/30 text-error">
          <span className="material-symbols-outlined text-[24px] shrink-0 mt-0.5">
            warning
          </span>
          <div className="text-xs text-on-surface leading-relaxed">
            <p className="font-semibold text-sm text-error mb-1">
              Xóa mục tiêu &ldquo;{goal.targetRole}&rdquo;?
            </p>
            <p className="text-on-surface-variant">
              Mục tiêu này sẽ không còn xuất hiện trong hồ sơ của bạn và hành động này không thể hoàn tác.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="!bg-error hover:!bg-error/90 !text-white"
            onClick={handleConfirmDelete}
            loading={isDeleting}
            disabled={isDeleting}
          >
            Xác nhận xóa
          </Button>
        </div>
      </div>
    </Modal>
  );
};
