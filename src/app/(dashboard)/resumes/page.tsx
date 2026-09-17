'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientDate } from '@/components/ui/ClientDate';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductPageHero } from '@/components/product-visual';
import { useResumes, useSetPrimaryResume, useCareerProfile } from '@/hooks/queries/useCareerProfile';

export default function ResumesManagementPage() {
  const router = useRouter();
  
  const { data: resumes, isLoading, isError } = useResumes();
  const { data: careerProfile } = useCareerProfile();
  const { mutate: setPrimaryResume, isPending: isSettingPrimary } = useSetPrimaryResume();
  const primaryResumeId = careerProfile?.primaryResume?.id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      <ProductPageHero
        feature="cv"
        title="Quản lý Hồ sơ CV"
        description="Quản lý các bản CV của bạn và thiết lập CV chính thức cho các bài phân tích cũng như phỏng vấn giả lập."
      />

      <Card variant="elevated" padding="lg" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div>
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">folder_shared</span>
              Danh sách CV đã lưu
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Hệ thống lưu giữ nguyên trạng tệp đã tải lên và bóc tách tự động.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/resume-analyses')}
            icon={<span className="material-symbols-outlined text-[18px]">add</span>}
          >
            Tải CV mới lên & Phân tích
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-on-surface-variant">
            <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2 align-middle" />
            Đang tải danh sách CV...
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-error bg-error/10 border border-error/20 rounded-xl">
            Đã xảy ra lỗi khi tải danh sách CV. Vui lòng thử tải lại trang.
          </div>
        ) : !resumes || resumes.length === 0 ? (
          <div className="text-center py-12 px-4 bg-surface-container-low/40 rounded-2xl border-2 border-dashed border-outline-variant/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mx-auto">
              <span className="material-symbols-outlined text-[28px]">description</span>
            </div>
            <div className="text-sm font-bold text-on-surface">Bạn chưa tải lên CV nào</div>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Tải lên bản CV đầu tiên của bạn để kích hoạt đối chiếu năng lực và thiết lập bối cảnh cho các phiên phỏng vấn.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/resume-analyses')}
                icon={<span className="material-symbols-outlined text-[16px]">upload</span>}
              >
                Tải lên ngay
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {resumes.map((resume) => {
              const isPrimary = resume.id === primaryResumeId;
              const isReady = resume.status === 'ready';
              const isFailed = resume.status === 'failed';
              
              return (
                <div
                  key={resume.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isPrimary
                      ? 'border-primary/40 bg-primary-fixed/20 shadow-sm'
                      : 'border-outline-variant/60 bg-white hover:border-outline-variant'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                      isPrimary ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      <span className="material-symbols-outlined text-[24px]">description</span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-on-surface truncate">
                          {resume.fileName || 'CV Không tên'}
                        </span>
                        {isPrimary && (
                          <Badge variant="primary" size="sm" icon={<span className="material-symbols-outlined text-[14px]">star</span>}>
                            CV Chính
                          </Badge>
                        )}
                        {isReady ? (
                          <Badge variant="success" size="sm">Đã sẵn sàng</Badge>
                        ) : isFailed ? (
                          <Badge variant="error" size="sm">Lỗi xử lý</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Đang xử lý</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                        <span>{(resume.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>
                          Tải lên: <ClientDate date={resume.createdAt} />
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/30">
                    {isPrimary ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSettingPrimary}
                        onClick={() => setPrimaryResume(null as unknown as string)}
                        className="text-error hover:text-error hover:border-error/50"
                      >
                        Bỏ chọn CV chính
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSettingPrimary || !isReady}
                        onClick={() => setPrimaryResume(resume.id)}
                      >
                        Đặt làm CV chính
                      </Button>
                    )}
                    <Link href="/resume-analyses">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<span className="material-symbols-outlined text-[16px]">analytics</span>}
                      >
                        Phân tích
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
