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
      const result = await authApi.logout();
      if (!result.serverLogoutSucceeded) {
        toast.warning('Không thể xác nhận đăng xuất với máy chủ. Phiên trên thiết bị này đã được xóa.');
      }
      router.push('/auth');
    } catch {
      toast.warning('Không thể xác nhận đăng xuất với máy chủ. Phiên trên thiết bị này đã được xóa.');
      router.push('/auth');
    } finally {
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
