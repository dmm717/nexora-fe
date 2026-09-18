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
  const { data: profileData, isLoading, isError, refetch } = useCareerProfile();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="w-36 h-6 rounded-full bg-surface-container-high" />
            <div className="w-72 sm:w-96 h-8 rounded-xl bg-surface-container-high" />
            <div className="w-64 sm:w-80 h-4 rounded bg-surface-container" />
          </div>
          <div className="w-44 h-10 rounded-lg bg-surface-container-high" />
        </div>

        {/* Identity & Goal Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <Card variant="elevated" padding="md" className="h-64 flex flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-container-high" />
                <div className="space-y-2 flex-1">
                  <div className="w-32 h-4 rounded bg-surface-container-high" />
                  <div className="w-44 h-3 rounded bg-surface-container" />
                  <div className="w-28 h-5 rounded-full bg-surface-container" />
                </div>
              </div>
              <div className="w-full h-9 rounded-lg bg-surface-container-high" />
            </Card>
          </div>
          <div className="lg:col-span-7">
            <Card variant="elevated" padding="md" className="h-64 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-48 h-5 rounded bg-surface-container-high" />
                <div className="w-full h-24 rounded-xl bg-surface-container-low" />
              </div>
              <div className="w-32 h-9 rounded-lg bg-surface-container-high self-end" />
            </Card>
          </div>
        </div>

        {/* Resume Management Skeleton */}
        <Card variant="elevated" padding="lg" className="h-56 space-y-4">
          <div className="w-56 h-6 rounded bg-surface-container-high" />
          <div className="w-full h-16 rounded-xl bg-surface-container-low" />
        </Card>

        {/* Skill Profile Skeleton */}
        <Card variant="elevated" padding="lg" className="h-64 space-y-4">
          <div className="w-64 h-6 rounded bg-surface-container-high" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full h-28 rounded-xl bg-surface-container-low" />
            <div className="w-full h-28 rounded-xl bg-surface-container-low" />
          </div>
        </Card>
      </div>
    );
  }

  if (isError || !profileData) {
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
