import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DeleteAccountModal } from './DeleteAccountModal';

export const DangerZoneCard: React.FC = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <>
      <div className="border border-error/30 bg-error-container/10 rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-[22px]">
            warning
          </span>
          <h2 className="text-base sm:text-lg font-bold text-error">
            Khu vực nguy hiểm
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-sm font-semibold text-on-surface">
              Yêu cầu xóa tài khoản người dùng
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Bắt đầu quy trình xóa tài khoản và kết thúc tất cả phiên đăng nhập. Sau khi gửi yêu cầu thành công, hành động này không thể hoàn tác.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex-shrink-0"
          >
            Yêu cầu xóa tài khoản
          </Button>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
};
export default DangerZoneCard;
