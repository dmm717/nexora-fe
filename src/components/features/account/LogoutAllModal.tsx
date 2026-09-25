import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '@/services/authApi';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface LogoutAllModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoutAllModal: React.FC<LogoutAllModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      const result = await authApi.logoutAll();
      if (result.serverLogoutSucceeded) {
        toast.success('Đã đăng xuất khỏi tất cả thiết bị');
      } else {
        toast.warning('Không thể xác nhận thu hồi tất cả phiên trên máy chủ. Phiên trên thiết bị này đã được xóa.');
      }
      onClose();
      router.push('/auth');
    } catch {
      toast.warning('Không thể xác nhận thu hồi tất cả phiên trên máy chủ. Phiên trên thiết bị này đã được xóa.');
      onClose();
      router.push('/auth');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đăng xuất khỏi tất cả thiết bị"
      description="Xác nhận kết thúc các phiên đăng nhập đang hoạt động trên mọi thiết bị."
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Bạn có chắc chắn muốn đăng xuất khỏi tất cả các thiết bị không? Các phiên làm việc hiện tại trên điện thoại, máy tính bảng và các trình duyệt khác sẽ kết thúc ngay lập tức.
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
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting}
          >
            Đăng xuất tất cả
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default LogoutAllModal;
