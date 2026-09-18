'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export const CareerProfileHeader: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-semibold mb-2">
          <span className="material-symbols-outlined text-[16px]">fingerprint</span>
          <span>Bối cảnh cá nhân hóa</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Hồ sơ nghề nghiệp & Trung tâm bối cảnh
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
          Tổng hợp định danh, CV chính, mục tiêu tuyển dụng và bản đồ năng lực từ bằng chứng thực tế.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={() => router.push('/resume-analyses')}
          icon={<span className="material-symbols-outlined text-[18px]">document_scanner</span>}
        >
          Phân tích CV chuyên sâu
        </Button>
      </div>
    </div>
  );
};
