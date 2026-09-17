'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AuthIntent, buildAuthRedirectUrl, storeAuthIntent } from '@/utils/authIntent';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingIntent?: AuthIntent | null;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  isOpen,
  onClose,
  pendingIntent,
}) => {
  const router = useRouter();

  const handleAuthAction = (mode: 'login' | 'register') => {
    if (pendingIntent) {
      storeAuthIntent(pendingIntent);
      const url = buildAuthRedirectUrl(pendingIntent, mode);
      onClose();
      router.push(url);
    } else {
      onClose();
      router.push(mode === 'register' ? '/auth?mode=register' : '/auth');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đăng nhập để tiếp tục"
      description="Bạn cần tài khoản Nexora để lưu hồ sơ, kết quả luyện tập và tiến độ cá nhân."
      size="md"
    >
      <div className="space-y-4 pt-2">
        {pendingIntent && (
          <div className="p-3.5 rounded-xl bg-primary-fixed/30 border border-primary/20 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5" aria-hidden="true">
              bookmark_added
            </span>
            <div className="text-xs">
              <span className="font-semibold text-on-surface">Đang giữ thao tác của bạn:</span>
              <p className="text-on-surface-variant mt-0.5">
                {pendingIntent.action === 'cv_analysis' && 'Phân tích hồ sơ CV & so khớp mục tiêu'}
                {pendingIntent.action === 'interview' && 'Bắt đầu phiên phỏng vấn thử'}
                {pendingIntent.action === 'star' && 'Luyện phản xạ cấu trúc STAR'}
                {pendingIntent.action === 'scenario' && 'Giải quyết tình huống thực tế'}
                {pendingIntent.action === 'pricing' && 'Xem bảng giá dịch vụ'}
                {pendingIntent.action === 'checkout' && 'Xác nhận kích hoạt gói dịch vụ'}
                {pendingIntent.action === 'navigation' && 'Tiếp tục truy cập trang được bảo vệ'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2.5 pt-1">
          <Button
            variant="primary"
            fullWidth
            onClick={() => handleAuthAction('login')}
          >
            Đăng nhập
          </Button>

          <Button
            variant="outline"
            fullWidth
            onClick={() => handleAuthAction('register')}
          >
            Tạo tài khoản mới
          </Button>
        </div>

        <p className="text-[11px] text-center text-on-surface-variant pt-2">
          Đăng ký miễn phí trong chưa đầy một phút. Không yêu cầu thẻ thanh toán.
        </p>
      </div>
    </Modal>
  );
};
