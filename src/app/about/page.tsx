'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, ChartNoAxesCombined, FileText, Mic, Sparkles, Target } from 'lucide-react';
import { PublicSiteShell } from '@/components/layouts/PublicSiteShell';
import { siteAssetUrl, siteContentApi, type AboutContent } from '@/services/siteContentApi';

const fallback: AboutContent = {
  heroTitle: 'Tự tin bước vào phỏng vấn',
  heroSubtitle: 'Nexora kết nối CV, mục tiêu nghề nghiệp và từng câu trả lời để bạn luyện tập có định hướng.',
  heroAssetId: null,
  missionTitle: 'Tập trung vào sự tiến bộ của chính bạn',
  missionBody: 'Từ phân tích CV đến phỏng vấn mô phỏng và phản hồi theo tiêu chí, Nexora giúp bạn nhìn rõ điểm mạnh, điểm cần cải thiện và bước luyện tập tiếp theo.',
  missionAssetId: null,
  values: [
    { title: 'Phản hồi có căn cứ', description: 'Nhận xét dựa trên thông tin bạn cung cấp và nội dung câu trả lời.', iconKey: 'evidence' },
    { title: 'Luyện tập có chủ đích', description: 'Chọn kỹ năng và tình huống cần rèn luyện thay vì luyện tập ngẫu nhiên.', iconKey: 'practice' },
    { title: 'Theo dõi tiến bộ', description: 'Xem lại kết quả và các tín hiệu năng lực qua từng lần thực hành.', iconKey: 'progress' },
  ],
  milestones: [],
  teamSectionEnabled: false,
  teamHeading: null,
  teamMembers: [],
};

const capabilities = [
  { title: 'Phân tích CV', href: '/#cv-analysis', icon: FileText },
  { title: 'Phỏng vấn AI', href: '/#ai-interview', icon: Mic },
  { title: 'Luyện tập tình huống', href: '/#practice', icon: Target },
  { title: 'Luyện trả lời STAR', href: '/#practice', icon: Sparkles },
  { title: 'Năng lực & tiến bộ', href: '/#capabilities', icon: ChartNoAxesCombined },
  { title: 'Lộ trình học', href: '/#capabilities', icon: BookOpen },
];

export default function AboutPage() {
  const page = useQuery({ queryKey: ['public-site-page', 'about'], queryFn: () => siteContentApi.getPublicPage('about'), staleTime: 5 * 60_000, retry: false });
  const content = page.data?.about ?? fallback;
  const heroImage = content.heroAssetId ? siteAssetUrl(content.heroAssetId) : '/about-hero-nexora.png';
  const missionImage = content.missionAssetId ? siteAssetUrl(content.missionAssetId) : '/about-mission-nexora.png';
  const sections = [['01', 'Về Nexora', 'mission'], ['02', 'Giá trị cốt lõi', 'values'], ...(content.milestones.length ? [['03', 'Hành trình phát triển', 'milestones']] : []), ...(content.teamSectionEnabled && content.teamMembers.length ? [['04', 'Đội ngũ', 'team']] : []), ['05', 'Nexora hỗ trợ bạn', 'ecosystem']];
  return <PublicSiteShell><div className="mx-auto max-w-7xl space-y-16 px-5 py-10 sm:px-8 sm:py-14">
    <section className="relative overflow-hidden rounded-[2rem] bg-[#142765] text-white shadow-[0_24px_60px_-30px_rgba(12,33,99,.5)]">
      <Image src={heroImage} width={1536} height={1024} unoptimized={Boolean(content.heroAssetId)} alt="Người luyện phỏng vấn trong không gian làm việc" className="absolute inset-0 h-full w-full object-cover opacity-65" priority />
      <div className="absolute inset-0 bg-gradient-to-r from-[#071849]/95 via-[#0b225a]/75 to-transparent" />
      <div className="relative max-w-2xl px-7 py-20 sm:px-12 sm:py-28"><p className="text-sm font-bold uppercase tracking-[.25em] text-[#c8f38d]">Giới thiệu Nexora</p><h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">{content.heroTitle}</h1><p className="mt-6 max-w-xl text-base leading-8 text-white/90">{content.heroSubtitle}</p></div>
    </section>
    <nav aria-label="Mục lục trang giới thiệu" className="grid gap-3 rounded-2xl border border-[#dbe3fa] bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">{sections.map(([number, title, id]) => <a key={id} href={`#${id}`} className="flex items-center gap-3 rounded-xl p-3 text-sm font-semibold text-[#172554] hover:bg-primary-fixed"><span className="text-primary">{number}</span>{title}<ArrowRight size={15} className="ml-auto" aria-hidden="true" /></a>)}</nav>
    <section id="mission" className="grid items-center gap-10 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">01 / Về Nexora</p><h2 className="mt-3 text-3xl font-extrabold text-[#172554] sm:text-4xl">{content.missionTitle}</h2><p className="mt-5 max-w-xl whitespace-pre-line text-base leading-8 text-[#405176]">{content.missionBody}</p></div><Image src={missionImage} width={1440} height={1080} unoptimized={Boolean(content.missionAssetId)} alt="Người chuẩn bị cho buổi phỏng vấn cùng máy tính và ghi chú" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-card" /></section>
    <section id="values"><p className="text-xs font-bold uppercase tracking-widest text-primary">02 / Giá trị cốt lõi</p><h2 className="mt-3 text-3xl font-extrabold text-[#172554]">Nexora xây trên điều gì?</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{content.values.map((value) => <article key={value.title} className="rounded-2xl border border-[#dbe3fa] bg-white p-7 shadow-subtle"><h3 className="text-lg font-bold text-[#172554]">{value.title}</h3><p className="mt-3 text-sm leading-7 text-[#52617e]">{value.description}</p></article>)}</div></section>
    {content.milestones.length > 0 && <section id="milestones"><p className="text-xs font-bold uppercase tracking-widest text-primary">03 / Hành trình phát triển</p><h2 className="mt-3 text-3xl font-extrabold text-[#172554]">Những cột mốc của Nexora</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{content.milestones.map((item) => <article key={`${item.label}-${item.title}`} className="rounded-2xl border border-[#dbe3fa] bg-white p-6"><span className="text-sm font-bold text-primary">{item.label}</span><h3 className="mt-2 font-bold text-[#172554]">{item.title}</h3><p className="mt-2 text-sm leading-7 text-[#52617e]">{item.description}</p></article>)}</div></section>}
    {content.teamSectionEnabled && content.teamMembers.length > 0 && <section id="team"><p className="text-xs font-bold uppercase tracking-widest text-primary">04 / Đội ngũ</p><h2 className="mt-3 text-3xl font-extrabold text-[#172554]">{content.teamHeading || 'Đội ngũ Nexora'}</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{content.teamMembers.map((member) => <article key={`${member.name}-${member.role}`} className="rounded-2xl border border-[#dbe3fa] bg-white p-6">{member.assetId && <Image src={siteAssetUrl(member.assetId)} width={400} height={400} unoptimized alt={member.name} className="mb-4 aspect-square w-full rounded-xl object-cover" />}<h3 className="font-bold">{member.name}</h3><p className="text-sm text-primary">{member.role}</p>{member.bio && <p className="mt-2 text-sm text-[#52617e]">{member.bio}</p>}</article>)}</div></section>}
    <section id="ecosystem" className="pb-6"><p className="text-xs font-bold uppercase tracking-widest text-primary">05 / Nexora hỗ trợ bạn như thế nào</p><h2 className="mt-3 text-3xl font-extrabold text-[#172554]">Một hành trình luyện tập liền mạch</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{capabilities.map(({ title, href, icon: Icon }) => <Link key={title} href={href} className="flex items-center gap-3 rounded-2xl border border-[#dbe3fa] bg-white p-5 text-sm font-bold text-[#172554] hover:border-primary hover:text-primary"><Icon size={20} aria-hidden="true" />{title}<ArrowRight size={16} className="ml-auto" aria-hidden="true" /></Link>)}</div></section>
  </div></PublicSiteShell>;
}
