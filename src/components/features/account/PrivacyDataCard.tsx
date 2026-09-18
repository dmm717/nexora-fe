import React, { useState } from 'react';
import { toast } from 'sonner';
import { userApi } from '@/services/userApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const PrivacyDataCard: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await userApi.exportData();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexora-export-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Trích xuất dữ liệu thành công! Tệp JSON đã được tải về.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Lỗi khi trích xuất dữ liệu';
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card variant="elevated" padding="lg" className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-on-surface">Dữ liệu & Quyền riêng tư</h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Bạn có toàn quyền kiểm soát dữ liệu cá nhân của mình trên hệ thống Nexora.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
          <span className="material-symbols-outlined text-[20px] text-primary">
            file_download
          </span>
          <span>Tải xuống bản sao dữ liệu cá nhân</span>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Tệp xuất khẩu chứa toàn bộ thông tin tài khoản, lịch sử thực hành phỏng vấn, hồ sơ mục tiêu và dữ liệu liên quan ở định dạng JSON tiêu chuẩn.
        </p>
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            isLoading={isExporting}
          >
            Xuất dữ liệu của tôi
          </Button>
        </div>
      </div>
    </Card>
  );
};
export default PrivacyDataCard;
