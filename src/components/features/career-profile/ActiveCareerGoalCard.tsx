'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EditCareerGoalModal } from './EditCareerGoalModal';
import type { CareerProfileResponse } from '@/services/profileApi';
import { formatSeniorityLabel } from '@/services/careerGoalContract';
import { useArchiveCareerGoal } from '@/hooks/queries/useCareerGoals';
import { toast } from 'sonner';

export interface ActiveCareerGoalCardProps {
  activeGoal?: CareerProfileResponse['activeCareerGoal'] | null;
  onEdit?: () => void;
  onArchive?: () => void;
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

export const ActiveCareerGoalCard: React.FC<ActiveCareerGoalCardProps> = ({
  activeGoal,
  onEdit,
  onArchive,
}) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const archiveMutation = useArchiveCareerGoal();

  const handleEditClick = () => {
    if (onEdit) {
      onEdit();
    } else {
      setInternalModalOpen(true);
    }
  };

  const handleArchiveClick = async () => {
    if (!activeGoal?.id) return;
    if (onArchive) {
      onArchive();
      return;
    }
    try {
      await archiveMutation.mutateAsync(activeGoal.id);
      toast.success('Đã lưu trữ mục tiêu nghề nghiệp');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Không thể lưu trữ mục tiêu.';
      toast.error(message);
    }
  };

  return (
    <>
      <Card variant="elevated" padding="md" className="h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">flag</span>
              </span>
              <div>
                <h3 className="font-bold text-sm text-on-surface">Mục tiêu nghề nghiệp hiện tại</h3>
                <p className="text-[11px] text-on-surface-variant">Được dùng làm bối cảnh cho AI</p>
              </div>
            </div>
            {activeGoal && (
              <Badge variant="primary" size="sm">
                Đang kích hoạt
              </Badge>
            )}
          </div>

          {activeGoal ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <div>
                <span className="text-[11px] text-on-surface-variant">Vị trí mục tiêu:</span>
                <div className="font-bold text-xs sm:text-sm text-on-surface mt-0.5">
                  {activeGoal.targetRole}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant">Cấp bậc mong muốn:</span>
                <div className="font-bold text-xs sm:text-sm text-primary mt-0.5">
                  {formatSeniorityLabel(activeGoal.seniority)}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant">Ngành ưu tiên:</span>
                <div className="font-bold text-xs sm:text-sm text-on-surface mt-0.5 truncate">
                  {activeGoal.industry?.trim() || 'Chưa cập nhật'}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant">Công ty mục tiêu:</span>
                <div className="font-bold text-xs sm:text-sm text-on-surface mt-0.5 truncate">
                  {activeGoal.targetCompany?.trim() || 'Chưa cập nhật'}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant">Mốc thời gian:</span>
                <div className="font-bold text-xs sm:text-sm text-on-surface mt-0.5">
                  {formatDate(activeGoal.targetDate)}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface-variant text-center">
              Bạn chưa chọn mục tiêu ứng tuyển. Hãy thiết lập để nhận câu hỏi phỏng vấn chuẩn xác.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-outline-variant/30">
          {activeGoal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleArchiveClick}
              loading={archiveMutation.isPending}
              disabled={archiveMutation.isPending}
            >
              Lưu trữ
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            icon={<span className="material-symbols-outlined text-[16px]">tune</span>}
          >
            {activeGoal ? 'Chỉnh sửa mục tiêu' : 'Thiết lập mục tiêu'}
          </Button>
        </div>
      </Card>

      {!onEdit && (
        <EditCareerGoalModal
          isOpen={internalModalOpen}
          onClose={() => setInternalModalOpen(false)}
          activeGoal={activeGoal}
        />
      )}
    </>
  );
};
