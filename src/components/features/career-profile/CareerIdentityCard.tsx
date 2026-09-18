'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getAvatarColor } from '@/utils/colorUtils';
import type { CareerProfileResponse } from '@/services/profileApi';

export interface CareerIdentityCardProps {
  profile: CareerProfileResponse['profile'];
  onboarding: CareerProfileResponse['onboarding'];
}

export const CareerIdentityCard: React.FC<CareerIdentityCardProps> = ({
  profile,
  onboarding,
}) => {
  const router = useRouter();

  const displayName = profile.displayName?.trim() || 'Chưa cập nhật tên';
  const email = profile.email || 'Chưa cập nhật email';
  const avatarChar = (profile.displayName?.trim() || profile.email?.trim() || 'U')
    .charAt(0)
    .toUpperCase();
  const avatarBg = getAvatarColor(profile.email || profile.displayName || 'neutral-user');

  const yearsDisplay =
    profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined
      ? `${profile.yearsOfExperience} năm kinh nghiệm`
      : 'Chưa có năm kinh nghiệm';

  const onboardingStatusText = onboarding.isComplete ? 'Đã hoàn tất' : 'Chưa hoàn thiện';

  return (
    <Card variant="elevated" padding="md" className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0"
            style={{ backgroundColor: avatarBg }}
          >
            {avatarChar}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-on-surface truncate">
              {displayName}
            </h2>
            <p className="text-xs text-on-surface-variant truncate">{email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" size="sm">
                {yearsDisplay}
              </Badge>
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant/30 pt-3 space-y-2 text-xs text-on-surface-variant">
          <div className="flex justify-between items-center">
            <span>Trạng thái onboarding:</span>
            <span
              className={`font-semibold ${
                onboarding.isComplete ? 'text-secondary' : 'text-amber-600'
              }`}
            >
              {onboardingStatusText}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Quyền riêng tư dữ liệu:</span>
            <span className="text-on-surface">Được mã hóa & bảo vệ</span>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/account')}
        className="mt-4 w-full"
        icon={<span className="material-symbols-outlined text-[16px]">edit</span>}
      >
        Cập nhật thông tin cá nhân
      </Button>
    </Card>
  );
};
