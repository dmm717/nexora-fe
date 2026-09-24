'use client';

import Link from 'next/link';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { CareerGoalsSection } from './CareerGoalsSection';

export function CareerGoalsPageContent() {
  const profile = useCareerProfile();
  return <main className="mx-auto max-w-5xl space-y-7 px-5 py-10 sm:px-8">
    <header className="rounded-3xl border border-[#dbe3fa] bg-white p-7 shadow-subtle sm:p-9">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Định hướng nghề nghiệp</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#172554]">Mục tiêu nghề nghiệp</h1>
      <p className="mt-2 text-sm text-[#52617e]">Quản lý vai trò, cấp độ và ngành mục tiêu để Nexora cá nhân hóa lộ trình luyện tập.</p>
      <Link href="/profile" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">← Về hồ sơ</Link>
    </header>
    {profile.isLoading && <p role="status">Đang tải mục tiêu...</p>}
    {profile.isError && !profile.data && <div role="alert">Chưa thể tải hồ sơ. <button type="button" onClick={() => void profile.refetch()} className="underline">Thử lại</button></div>}
    {profile.data && <CareerGoalsSection activeGoalFromProfile={profile.data.activeCareerGoal} />}
  </main>;
}
