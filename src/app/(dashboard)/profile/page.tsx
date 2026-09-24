'use client';

import Link from 'next/link';
import { ArrowRight, FileText, Target, TrendingUp } from 'lucide-react';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { PersonalInformationCard } from '@/components/features/account/PersonalInformationCard';

export default function ProfilePage() {
  const user = useCurrentUser();
  const career = useCareerProfile();
  if ((user.isLoading && !user.data) || (career.isLoading && !career.data)) return <div role="status" className="mx-auto max-w-6xl px-5 py-12">Đang tải hồ sơ...</div>;
  if (!user.data || !career.data) return <div role="alert" className="mx-auto max-w-6xl px-5 py-12">Chưa thể tải hồ sơ. <button type="button" className="underline" onClick={() => { void user.refetch(); void career.refetch(); }}>Thử lại</button></div>;
  const { activeCareerGoal: goal, primaryResume: resume, skillProfileSummary: skills } = career.data;
  const summaryCard = (icon: React.ReactNode, title: string, detail: React.ReactNode, href: string, label: string) => <section className="rounded-2xl border border-[#dbe3fa] bg-white p-6 shadow-subtle">
    <div className="mb-3 flex items-center gap-2 text-primary">{icon}<h2 className="font-bold text-[#172554]">{title}</h2></div>
    <div className="min-h-16 text-sm leading-6 text-[#52617e]">{detail}</div>
    <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">{label}<ArrowRight size={16} aria-hidden="true" /></Link>
  </section>;
  return <main className="mx-auto max-w-6xl space-y-7 px-5 py-10 sm:px-8">
    <header className="rounded-3xl border border-[#dbe3fa] bg-white p-7 shadow-subtle sm:p-9"><p className="text-xs font-bold uppercase tracking-widest text-primary">Tài khoản của bạn</p><h1 className="mt-2 text-3xl font-extrabold text-[#172554]">Hồ sơ</h1><p className="mt-2 text-sm text-[#52617e]">Thông tin cá nhân và những gì đang định hướng việc luyện tập của bạn.</p></header>
    <PersonalInformationCard user={user.data} />
    <div className="grid gap-5 md:grid-cols-3">
      {summaryCard(<Target size={20} />, 'Mục tiêu nghề nghiệp', goal ? <><strong className="block text-[#172554]">{goal.targetRole}</strong>{goal.seniority}{goal.industry ? ` · ${goal.industry}` : ''}</> : 'Bạn chưa chọn mục tiêu nghề nghiệp.', '/career-goals', 'Quản lý mục tiêu')}
      {summaryCard(<FileText size={20} />, 'CV chính', resume ? <><strong className="block break-all text-[#172554]">{resume.fileName}</strong>Trạng thái: {resume.status}</> : 'Bạn chưa chọn CV chính.', '/resumes', 'Quản lý CV')}
      {summaryCard(<TrendingUp size={20} />, 'Năng lực', skills.topCompetencies.length ? <ul>{skills.topCompetencies.slice(0, 3).map((skill) => <li key={skill.code}>{skill.name}: {skill.score}</li>)}</ul> : 'Chưa đủ dữ liệu để tóm tắt năng lực.', '/analytics', 'Xem năng lực')}
    </div>
  </main>;
}
