'use client';

import Link from 'next/link';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { CareerGoalsSection } from './CareerGoalsSection';
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading';

export function CareerGoalsPageContent() {
  const profile = useCareerProfile();
  return <main className="nexora-workspace mx-auto max-w-5xl space-y-7 px-5 py-10 sm:px-8">
    <WorkspaceHeading feature="career-profile" title="Mục tiêu nghề nghiệp" eyebrow="Định hướng nghề nghiệp"
      description="Quản lý vai trò, cấp độ và ngành mục tiêu để Nexora cá nhân hóa lộ trình luyện tập."
      actions={<Link href="/profile" className="inline-block text-sm font-bold text-primary hover:underline">← Về hồ sơ</Link>} />
    {profile.isLoading && <p role="status">Đang tải mục tiêu...</p>}
    {profile.isError && !profile.data && <div role="alert">Chưa thể tải hồ sơ. <button type="button" onClick={() => void profile.refetch()} className="underline">Thử lại</button></div>}
    {profile.data && <CareerGoalsSection activeGoalFromProfile={profile.data.activeCareerGoal} />}
  </main>;
}
