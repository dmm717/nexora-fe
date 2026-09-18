'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useDeleteResume } from '@/hooks/queries/useCareerProfile';
import { ApiError } from '@/services/apiClient';
import { toast } from 'sonner';

export interface DeleteResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: {
    id: string;
    fileName?: string;
  } | null;
  isPrimary?: boolean;
}

function safeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.requestId ? `${error.message} (Mã: ${error.requestId})` : error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

export const DeleteResumeModal: React.FC<DeleteResumeModalProps> = ({
  isOpen,
  onClose,
  resume,
  isPrimary = false,
}) => {
  const deleteMutation = useDeleteResume();
  const isDeleting = deleteMutation.isPending;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !resume) return null;

  const fileName = resume.fileName || 'CV Không tên';

  const handleClose = () => {
    if (isDeleting) return;
    setErrorMessage(null);
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(resume.id);
      toast.success('Đã xóa CV khỏi hồ sơ.');
      onClose();
    } catch (err: unknown) {
      const message = safeErrorMessage(err, 'Không thể xóa CV. Vui lòng thử lại.');
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Xóa CV “${fileName}”?`}
      maxWidth="sm"
    >
      <div className="space-y-4">
        {isPrimary && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900">
            <span
              className="material-symbols-outlined text-[22px] shrink-0 text-amber-600 mt-0.5"
              aria-hidden="true"
            >
              info
            </span>
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-on-surface mb-0.5">
                Đây là CV chính hiện tại.
              </p>
              <p className="text-on-surface-variant">
                Sau khi xóa, Nexora sẽ bỏ chọn CV chính. Bạn có thể chọn một CV khác sau.
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-on-surface-variant leading-relaxed space-y-2">
          <p>
            CV này sẽ không còn xuất hiện trong hồ sơ hoặc được dùng làm bối cảnh cho các phân tích và phiên luyện tập mới.
          </p>
          <p>
            Các phân tích và phiên phỏng vấn đã tạo trước đó vẫn được giữ lại trong lịch sử.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirmDelete}
            loading={isDeleting}
            disabled={isDeleting}
            aria-label={`Xác nhận xóa CV ${fileName}`}
          >
            Xác nhận xóa
          </Button>
        </div>
      </div>
    </Modal>
  );
};
