'use client';

import React from 'react';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { AccountHeader } from './AccountHeader';
import { PersonalInformationCard } from './PersonalInformationCard';
import { SecurityCard } from './SecurityCard';
import { PlanUsageCard } from './PlanUsageCard';
import { PrivacyDataCard } from './PrivacyDataCard';
import { ProductFeedbackCard } from './ProductFeedbackCard';
import { SessionsCard } from './SessionsCard';
import { DangerZoneCard } from './DangerZoneCard';
import { AccountSkeleton } from './AccountSkeleton';
import { Button } from '@/components/ui/Button';

export const AccountSettings: React.FC = () => {
  const { data: user, isLoading, isError, refetch } = useCurrentUser();

  // If initial load without cached user, render skeleton
  if (isLoading && !user) {
    return <AccountSkeleton />;
  }

  // Full-page error only when we have no user data at all and an error occurred
  if (!user) {
    if (isError) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="p-8 rounded-2xl bg-error-container/20 border border-error/30 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">error</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                Không thể tải thông tin tài khoản
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Đã xảy ra lỗi khi đồng bộ dữ liệu tài khoản từ hệ thống. Vui lòng thử lại.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => refetch()}>
              Thử tải lại
            </Button>
          </div>
        </div>
      );
    }
    return <AccountSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Account Hero / Identity summary */}
      <AccountHeader user={user} />

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column (7 cols): Personal Info & Privacy/Data & Feedback */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          <PersonalInformationCard user={user} />
          <PrivacyDataCard />
          <ProductFeedbackCard />
        </div>

        {/* Right Column (5 cols): Security, Plan & Usage, Sessions */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          <SecurityCard />
          <PlanUsageCard billing={user.billing} />
          <SessionsCard />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pt-2">
        <DangerZoneCard />
      </div>
    </div>
  );
};

export default AccountSettings;
