'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ClientDate } from '@/components/ui/ClientDate';
import {
  useResumes,
  useSetPrimaryResume,
  careerProfileKeys,
  resumeKeys,
} from '@/hooks/queries/useCareerProfile';
import { cvAnalysisApi, getUploadContentType } from '@/services/cvAnalysisApi';
import { ApiError } from '@/services/apiClient';
import { toast } from 'sonner';

export interface ResumeManagementSectionProps {
  primaryResumeId?: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.requestId ? `${error.message} (Mã: ${error.requestId})` : error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

export const ResumeManagementSection: React.FC<ResumeManagementSectionProps> = ({
  primaryResumeId,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: resumes, isLoading, isError, refetch } = useResumes();
  const { mutate: setPrimaryResume, isPending: isSettingPrimary } = useSetPrimaryResume();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const contentType = getUploadContentType(file);
    if (!contentType) {
      toast.error('Chỉ chấp nhận file định dạng PDF hoặc DOCX.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size === 0) {
      toast.error('File CV không được để trống.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng file CV không được vượt quá 10MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const presign = await cvAnalysisApi.presignUpload({
        fileName: file.name,
        contentType,
        size: file.size,
      });

      await cvAnalysisApi.uploadFile(presign.uploadUrl, file, {
        contentType,
        expectedSize: file.size,
      });

      await cvAnalysisApi.createResume(presign.token);

      toast.success('Tải lên CV thành công! Đang bóc tách dữ liệu...');
      void queryClient.invalidateQueries({ queryKey: resumeKeys.all });
      void queryClient.invalidateQueries({ queryKey: careerProfileKeys.all });
    } catch (err: unknown) {
      toast.error(safeErrorMessage(err, 'Không thể tải lên CV. Vui lòng thử lại.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined text-[20px]">description</span>
            </span>
            <h3 className="font-bold text-base text-on-surface">Quản lý CV & Hồ sơ đính kèm</h3>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Chỉ 1 CV được đánh dấu là <strong>CV chính (Primary Resume)</strong> dùng làm nguồn bối cảnh mặc định cho các bài test.
          </p>
        </div>

        <label
          className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-semibold shadow-sm transition-all select-none ${
            isUploading ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          {isUploading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[18px]">upload</span>
          )}
          <span>{isUploading ? 'Đang tải lên...' : 'Tải thêm CV mới'}</span>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            disabled={isUploading}
            onChange={handleUpload}
          />
        </label>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-on-surface-variant">
          <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2 align-middle" />
          Đang tải danh sách CV...
        </div>
      ) : isError ? (
        <div className="p-4 rounded-xl bg-error-container/30 border border-error/30 flex items-center justify-between">
          <span className="text-xs text-error font-medium">Không thể tải danh sách CV.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      ) : !resumes || resumes.length === 0 ? (
        <div className="text-center py-10 px-4 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/60 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mx-auto">
            <span className="material-symbols-outlined text-[26px]">description</span>
          </div>
          <div className="text-sm font-bold text-on-surface">Bạn chưa có CV nào trong hồ sơ</div>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            Hãy tải lên bản CV đầu tiên để làm dữ liệu bối cảnh cho các bài kiểm tra năng lực và phỏng vấn AI.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((res) => {
            const isPrimary = res.id === primaryResumeId;
            const isReady = res.status === 'ready';
            const isFailed = res.status === 'failed';

            return (
              <div
                key={res.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isPrimary
                    ? 'bg-secondary-container/10 border-secondary/40 shadow-sm'
                    : 'bg-white border-outline-variant/40 hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isPrimary ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">description</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-on-surface truncate">
                        {res.fileName || 'CV Không tên'}
                      </span>
                      {isPrimary && (
                        <Badge variant="secondary" size="sm">
                          CV Chính thức
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-on-surface-variant mt-0.5 flex flex-wrap items-center gap-2">
                      <span>{formatFileSize(res.size)}</span>
                      <span>•</span>
                      <span>
                        Tải lên lúc <ClientDate date={res.createdAt} />
                      </span>
                      {isReady ? (
                        <>
                          <span>•</span>
                          <span className="text-secondary font-medium">Sẵn sàng phân tích</span>
                        </>
                      ) : isFailed ? (
                        <>
                          <span>•</span>
                          <span className="text-error font-medium">Lỗi xử lý</span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-medium">Đang xử lý</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {!isPrimary ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSettingPrimary || !isReady}
                      onClick={() => setPrimaryResume(res.id)}
                    >
                      Đặt làm CV chính
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isSettingPrimary}
                      onClick={() => setPrimaryResume(null)}
                      className="text-error hover:bg-error-container/20"
                    >
                      Bỏ chọn CV chính
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/resume-analyses')}
                    icon={<span className="material-symbols-outlined text-[16px]">analytics</span>}
                  >
                    Quét phân tích
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
