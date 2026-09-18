'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { CareerProfileHeader } from './CareerProfileHeader';
import { CareerIdentityCard } from './CareerIdentityCard';
import { CareerGoalsSection } from './CareerGoalsSection';
import { ResumeManagementSection } from './ResumeManagementSection';
import { SkillProfileSection } from './SkillProfileSection';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { getQueryPresentation } from '@/utils/queryPresentation';

/**
 * Isolated deep-link controller using useSearchParams so that the outer
 * CareerProfileScreen renders immediately and displays its normal skeleton
 * without requiring a full-page null Suspense fallback.
 */
const CareerProfileDeepLinkHandler: React.FC = () => {
  const searchParams = useSearchParams();
  const section = searchParams?.get('section');

  useEffect(() => {
    if (section === 'goals') {
      const el = document.getElementById('goals');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.focus({ preventScroll: true });
      }
    }
  }, [section]);

  return null;
};

export const CareerProfileScreen: React.FC = () => {
  const {
    data: profileData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useCareerProfile();
  const queryPresentation = getQueryPresentation({
    hasData: profileData !== undefined,
    isLoading,
    isError,
    isFetching,
  });

  if (queryPresentation.showInitialLoading) {
    return (
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8"
        role="status"
        aria-label="Đang tải hồ sơ nghề nghiệp"
      >
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="w-36 h-6 rounded-full" />
            <Skeleton className="w-72 sm:w-96 h-8 rounded-xl" />
            <Skeleton className="w-64 sm:w-80 h-4 rounded" />
          </div>
          <Skeleton className="w-44 h-10 rounded-lg" />
        </div>

        {/* Identity & Goal Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <Card variant="elevated" padding="md" className="h-64 flex flex-col justify-between">
              <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <div className="space-y-2 flex-1">
                  <Skeleton className="w-32 h-4 rounded" />
                  <Skeleton className="w-44 h-3 rounded" />
                  <Skeleton className="w-28 h-5 rounded-full" />
                </div>
              </div>
              <Skeleton className="w-full h-9 rounded-lg" />
            </Card>
          </div>
          <div className="lg:col-span-7">
            <Card variant="elevated" padding="md" className="h-64 flex flex-col justify-between">
              <div className="space-y-4">
                <Skeleton className="w-48 h-5 rounded" />
                <Skeleton className="w-full h-24 rounded-xl" />
              </div>
              <Skeleton className="w-32 h-9 rounded-lg self-end" />
            </Card>
          </div>
        </div>

        {/* Resume Management Skeleton */}
        <Card variant="elevated" padding="lg" className="h-56 space-y-4">
          <Skeleton className="w-56 h-6 rounded" />
          <Skeleton className="w-full h-16 rounded-xl" />
        </Card>

        {/* Skill Profile Skeleton */}
        <Card variant="elevated" padding="lg" className="h-64 space-y-4">
          <Skeleton className="w-64 h-6 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="w-full h-28 rounded-xl" />
            <Skeleton className="w-full h-28 rounded-xl" />
          </div>
        </Card>
      </div>
    );
  }

  if (queryPresentation.showBlockingError || !profileData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="p-8 rounded-2xl bg-error-container/20 border border-error/30 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px]">error</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">Không thể tải Hồ sơ nghề nghiệp</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Đã xảy ra lỗi khi đồng bộ dữ liệu hồ sơ từ hệ thống. Vui lòng thử lại.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => refetch()}>
            Thử tải lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Isolated deep-link controller wrapped in tiny Suspense */}
      <Suspense fallback={null}>
        <CareerProfileDeepLinkHandler />
      </Suspense>

      {queryPresentation.showBackgroundError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600" aria-hidden="true">
              warning
            </span>
            <span>
              Không thể đồng bộ hồ sơ mới nhất. Dữ liệu đang hiển thị được giữ nguyên.
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      )}
      {queryPresentation.showRefreshing && !queryPresentation.showBackgroundError && (
        <p className="text-xs text-on-surface-variant" role="status" aria-live="polite">
          Đang cập nhật hồ sơ...
        </p>
      )}

      {/* Title & Introduction */}
      <CareerProfileHeader />

      {/* Grid: Identity + Career Goal Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <CareerIdentityCard
            profile={profileData.profile}
            onboarding={profileData.onboarding}
          />
        </div>
        <div className="lg:col-span-7">
          <CareerGoalsSection
            activeGoalFromProfile={profileData.activeCareerGoal}
          />
        </div>
      </div>

      {/* Section 2: Resume Management (Primary Resume & List) */}
      <ResumeManagementSection
        primaryResumeId={profileData.primaryResume?.id}
      />

      {/* Section 3: Computed Skill Profile (Strictly Read-Only & Evidence-Derived) */}
      <SkillProfileSection
        skillProfileSummary={profileData.skillProfileSummary}
      />
    </div>
  );
};
