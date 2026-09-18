import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { userApi } from '@/services/userApi';
import { authApi } from '@/services/authApi';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await userApi.requestDeletion();
      toast.success('Yêu cầu xóa tài khoản thành công. Đang đăng xuất...');
      setTimeout(async () => {
        try {
          await authApi.logout();
        } catch {
          // ignore logout network errors during redirect
        } finally {
          onClose();
          router.push('/auth');
        }
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Lỗi khi gửi yêu cầu xóa tài khoản';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yêu cầu xóa tài khoản"
      description="Quy trình xử lý yêu cầu xóa vĩnh viễn tài khoản người dùng."
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        <div className="p-3.5 rounded-xl bg-error-container/20 border border-error/30 text-xs text-error flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[20px] flex-shrink-0">
            warning
          </span>
          <div className="space-y-1">
            <p className="font-semibold text-on-surface">Lưu ý quan trọng</p>
            <p className="text-on-surface-variant leading-relaxed">
              Yêu cầu này sẽ bắt đầu quy trình xóa tài khoản và bạn sẽ được đăng xuất khỏi hệ thống. Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Sau khi gửi yêu cầu, toàn bộ phiên đăng nhập của bạn sẽ kết thúc. Nếu bạn cần bản sao dữ liệu của mình, hãy đảm bảo bạn đã xuất dữ liệu trước khi tiếp tục.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting}
          >
            Xác nhận yêu cầu xóa
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default DeleteAccountModal;
