import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '@/services/authApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LogoutAllModal } from './LogoutAllModal';

export const SessionsCard: React.FC = () => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutAllOpen, setIsLogoutAllOpen] = useState(false);

  const handleLogoutCurrent = async () => {
    try {
      setIsLoggingOut(true);
      await authApi.logout();
      router.push('/auth');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Lỗi khi đăng xuất';
      toast.error(message);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <Card variant="elevated" padding="lg" className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Phiên đăng nhập</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Quản lý phiên làm việc hiện tại hoặc kết thúc tất cả phiên đăng nhập khác.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogoutCurrent}
            isLoading={isLoggingOut}
          >
            Đăng xuất thiết bị này
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsLogoutAllOpen(true)}
          >
            Đăng xuất khỏi tất cả thiết bị
          </Button>
        </div>
      </Card>

      <LogoutAllModal
        isOpen={isLogoutAllOpen}
        onClose={() => setIsLogoutAllOpen(false)}
      />
    </>
  );
};
export default SessionsCard;
