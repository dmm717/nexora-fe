'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { UserResponse } from '@/services/userApi';
import { AccountHeader } from './AccountHeader';
import { PersonalInformationCard } from './PersonalInformationCard';
import { SecurityCard } from './SecurityCard';
import { PlanUsageCard } from './PlanUsageCard';
import { PrivacyDataCard } from './PrivacyDataCard';
import { SessionsCard } from './SessionsCard';
import { DangerZoneCard } from './DangerZoneCard';
import { AccountSkeleton } from './AccountSkeleton';
import { Button } from '@/components/ui/Button';

export const AccountSettings: React.FC = () => {
  const { data: user, isLoading, isError, refetch } = useCurrentUser();
  const queryClient = useQueryClient();
  const [localUserOverride, setLocalUserOverride] = useState<UserResponse | null>(null);

  if (isLoading) {
    return <AccountSkeleton />;
  }

  const effectiveUser = localUserOverride || user;

  if (isError || !effectiveUser) {
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

  const handleUserUpdated = (updated: UserResponse) => {
    setLocalUserOverride(updated);
    queryClient.setQueryData(['currentUser'], updated);
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Account Hero / Identity summary */}
      <AccountHeader user={effectiveUser} />

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column (7 cols): Personal Info & Privacy/Data */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          <PersonalInformationCard
            user={effectiveUser}
            onUserUpdated={handleUserUpdated}
          />
          <PrivacyDataCard />
        </div>

        {/* Right Column (5 cols): Security, Plan & Usage, Sessions */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          <SecurityCard />
          <PlanUsageCard billing={effectiveUser.billing} />
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
