'use client';

import { useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight,
  ChevronDown,
  Compass,
  FileCheck,
  FileText,
  LineChart,
  Mic,
  Sparkles,
  Target,
} from 'lucide-react';
import { PublicSiteShell } from '@/components/layouts/PublicSiteShell';
import { siteAssetUrl, siteContentApi, type AboutContent } from '@/services/siteContentApi';
import { visibleAboutSections, type AboutSectionId } from '@/services/aboutSections';
import { RECOMMENDED_ABOUT_CONTENT } from '@/services/siteContentDrafts';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const fallback: AboutContent = RECOMMENDED_ABOUT_CONTENT;

interface EcosystemItem {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  icon: typeof Mic;
  tag: string;
}

const ecosystemItems: EcosystemItem[] = [
  {
    id: 'ai-interview',
    title: 'Phỏng vấn AI',
    description:
      'Luyện trả lời theo bối cảnh nghề nghiệp, CV và mục tiêu của bạn. Sau khi hoàn thành, Nexora tổng hợp đánh giá dựa trên chính các câu trả lời đã nộp.',
    ctaText: 'Bắt đầu luyện phỏng vấn',
    href: '/interviews/new',
    icon: Mic,
    tag: 'Mô phỏng chân thực',
  },
  {
    id: 'cv-analysis',
    title: 'Phân tích CV & JD',
    description:
      'So sánh hồ sơ với vị trí mục tiêu, làm rõ điểm phù hợp, khoảng trống và những nội dung cần chuẩn bị kỹ hơn trước phỏng vấn.',
    ctaText: 'Phân tích CV ngay',
    href: '/cv-analysis',
    icon: FileText,
    tag: 'Đối chiếu CV & JD',
  },
  {
    id: 'practice-star',
    title: 'Luyện tập tình huống & STAR',
    description:
      'Rèn cách kể lại kinh nghiệm, xử lý tình huống và tổ chức câu trả lời theo cấu trúc rõ ràng mà không bịa thêm thành tích.',
    ctaText: 'Luyện câu hỏi STAR',
    href: '/practice',
    icon: Sparkles,
    tag: 'Khung phương pháp chuẩn',
  },
  {
    id: 'learning-path',
    title: 'Năng lực & lộ trình học',
    description:
      'Kết nối kết quả luyện tập thành tín hiệu năng lực và gợi ý hoạt động tiếp theo theo mục tiêu nghề nghiệp đang chọn.',
    ctaText: 'Xem lộ trình học',
    href: '/learning-path',
    icon: Compass,
    tag: 'Định hướng cá nhân hóa',
  },
];

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const tocRef = useRef<HTMLElement>(null);
  const valuesRef = useRef<HTMLElement>(null);
  const accordionRef = useRef<HTMLDivElement>(null);

  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
  const accordionId = useId();

  const page = useQuery({
    queryKey: ['public-site-page', 'about'],
    queryFn: () => siteContentApi.getPublicPage('about'),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const content = page.data?.about ?? fallback;
  const heroImage = content.heroAssetId ? siteAssetUrl(content.heroAssetId) : '/images/about-hero.jpg';
  const missionImage = content.missionAssetId ? siteAssetUrl(content.missionAssetId) : '/images/about-mission.jpg';

  const sections = visibleAboutSections(content);
  const numberFor = (id: AboutSectionId) => {
    const found = sections.find((s) => s.id === id);
    return found ? found.number : '00';
  };

  // GSAP Smooth Scroll & Entrance Animations (Respects prefers-reduced-motion)
  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion || !containerRef.current) return;

      // Hero Elements Stagger Reveal
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current.querySelectorAll('[data-hero-anim]'),
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.15,
            ease: 'power3.out',
          }
        );
      }

      // TOC Rows subtle slide in
      if (tocRef.current) {
        gsap.fromTo(
          tocRef.current.querySelectorAll('[data-toc-row]'),
          { opacity: 0, x: -16 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: tocRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }

      // Core Values Columns Stagger
      if (valuesRef.current) {
        gsap.fromTo(
          valuesRef.current.querySelectorAll('[data-value-col]'),
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.18,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: valuesRef.current,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }
    },
    { scope: containerRef, dependencies: [sections.length] }
  );

  return (
    <PublicSiteShell>
      <div ref={containerRef} className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 space-y-24 md:space-y-36">
        {/* 2A. HERO SECTION: Full cinematic image with localized copy gradient */}
        <section
          ref={heroRef}
          aria-label="Giới thiệu Nexora"
          className="relative min-h-[460px] sm:min-h-[540px] md:min-h-[580px] overflow-hidden rounded-[2.5rem] bg-[#071849] text-white shadow-[0_28px_70px_-25px_rgba(7,24,73,0.45)]"
        >
          {/* Background Image: Vivid, high resolution, unwashed */}
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt="Ứng viên thực hành phỏng vấn mô phỏng cùng máy tính và tài liệu CV"
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
              unoptimized={Boolean(content.heroAssetId)}
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Localized Left-Side Gradient: Preserves image clarity on right/middle while ensuring high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071849]/95 via-[#071849]/80 via-45% to-transparent sm:via-55% md:via-50%" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071849]/70 via-transparent to-transparent sm:hidden" />

          {/* Hero Content */}
          <div className="relative z-10 flex min-h-[460px] sm:min-h-[540px] md:min-h-[580px] max-w-3xl flex-col justify-center px-6 py-16 sm:px-12 sm:py-20 md:px-16">
            <p
              data-hero-anim
              className="text-xs font-bold uppercase tracking-[0.25em] text-[#a3ed3d]"
            >
              GIỚI THIỆU NEXORA
            </p>

            <h1
              data-hero-anim
              className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.12]"
            >
              {content.heroTitle}
            </h1>

            <p
              data-hero-anim
              className="mt-6 max-w-xl text-base leading-relaxed text-slate-100 sm:text-lg"
            >
              {content.heroSubtitle}
            </p>

            <div data-hero-anim className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/interviews/new"
                className="action-forward inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-md hover:scale-[1.02] transition-transform active:scale-[0.98]"
              >
                Trải nghiệm phỏng vấn AI
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a
                href="#mission"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                Tìm hiểu sứ mệnh
              </a>
            </div>
          </div>
        </section>

        {/* 2B. EDITORIAL TABLE OF CONTENTS: ProInterview-inspired numbered rows with thin rules */}
        <section aria-labelledby="toc-heading" className="pt-2">
          <div className="border-b border-[#cbd6ef] pb-4">
            <h2 id="toc-heading" className="text-xs font-bold uppercase tracking-widest text-[#52617e]">
              Mục lục trang giới thiệu
            </h2>
          </div>
          <nav
            ref={tocRef}
            aria-label="Mục lục trang giới thiệu"
            className="divide-y divide-[#e2e8f5]"
          >
            {sections.map(({ number, title, id }) => (
              <a
                key={id}
                data-toc-row
                href={`#${id}`}
                className="group flex items-center justify-between py-5 text-base sm:text-lg font-bold text-[#172554] transition-colors hover:text-primary"
              >
                <div className="flex items-baseline gap-4 sm:gap-6">
                  <span className="font-mono text-sm sm:text-base font-bold text-primary group-hover:text-[#172554] transition-colors">
                    {number}
                  </span>
                  <div className="border-b-2 border-transparent group-hover:border-[#a3ed3d] transition-all inline-block">
                    {title}
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="text-[#94a3b8] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
                  aria-hidden="true"
                />
              </a>
            ))}
          </nav>
        </section>

        {/* 2C. MISSION SECTION: Editorial two-column spread (Left text, Right photo) */}
        <section
          id="mission"
          className="scroll-mt-24 grid items-center gap-12 lg:grid-cols-12 xl:gap-16"
        >
          <div className="space-y-6 lg:col-span-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {numberFor('mission')} / Về Nexora
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#172554] sm:text-4xl md:text-5xl md:leading-tight">
              {content.missionTitle}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-[#405176] sm:text-lg sm:leading-8">
              {content.missionBody.split(/\n\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <div className="pt-2">
              <span className="inline-block rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                Phương châm cốt lõi: Phản hồi dựa trên bằng chứng, không đưa ra lời hứa ảo
              </span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-[#cbd6ef] bg-white p-2 shadow-[0_20px_50px_-20px_rgba(23,37,84,0.12)]">
              <Image
                src={missionImage}
                alt="Người chuẩn bị cho buổi phỏng vấn cùng máy tính và ghi chú"
                width={1440}
                height={1080}
                unoptimized={Boolean(content.missionAssetId)}
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </section>

        {/* 2D. CORE VALUES: Three editorial columns with top rules (NO generic cards) */}
        <section id="values" ref={valuesRef} className="scroll-mt-24 space-y-10">
          <div className="border-b border-[#cbd6ef] pb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {numberFor('values')} / Giá trị cốt lõi
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#172554] sm:text-4xl">
              Nexora xây trên điều gì?
            </h2>
          </div>

          <div className="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-12">
            {content.values.map((value, idx) => {
              const Icon =
                idx === 0 ? FileCheck : idx === 1 ? Target : LineChart;
              return (
                <article
                  key={value.title}
                  data-value-col
                  className="border-t-2 border-[#172554] pt-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary">
                        0{idx + 1}
                      </span>
                      <Icon size={20} className="text-[#3646c8]" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold tracking-tight text-[#172554]">
                      {value.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#52617e]">
                      {value.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 2F. TEAM SECTION: Optional. Rendered ONLY when teamSectionEnabled=true and has real members */}
        {content.teamSectionEnabled && content.teamMembers?.length > 0 && (
          <section id="team" className="scroll-mt-24 space-y-10">
            <div className="border-b border-[#cbd6ef] pb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                {numberFor('team')} / Đội ngũ
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#172554] sm:text-4xl">
                {content.teamHeading || 'Đội ngũ phát triển Nexora'}
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {content.teamMembers.map((member) => (
                <article
                  key={`${member.name}-${member.role}`}
                  className="rounded-2xl border border-[#cbd6ef] bg-white p-6 shadow-sm"
                >
                  {member.assetId && (
                    <Image
                      src={siteAssetUrl(member.assetId)}
                      width={400}
                      height={400}
                      unoptimized
                      alt={member.name}
                      className="mb-4 aspect-square w-full rounded-xl object-cover"
                    />
                  )}
                  <h3 className="text-lg font-bold text-[#172554]">{member.name}</h3>
                  <p className="text-sm font-semibold text-primary">{member.role}</p>
                  {member.bio && (
                    <p className="mt-2 text-sm leading-6 text-[#52617e]">{member.bio}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 2G. NEXORA SUPPORT / ECOSYSTEM: Large editorial accordion with 4 interactive rows */}
        <section id="ecosystem" className="scroll-mt-24 space-y-10 pb-12">
          <div className="border-b border-[#cbd6ef] pb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {numberFor('ecosystem')} / Nexora hỗ trợ bạn
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#172554] sm:text-4xl">
              Hệ sinh thái giải pháp luyện tập toàn diện
            </h2>
            <p className="mt-2 text-sm text-[#52617e]">
              Từ phân tích hồ sơ đầu vào đến phỏng vấn mô phỏng và định hình năng lực tiếp theo.
            </p>
          </div>

          <div
            ref={accordionRef}
            className="divide-y divide-[#e2e8f5] border-y border-[#cbd6ef]"
          >
            {ecosystemItems.map((item, index) => {
              const isOpen = activeAccordion === index;
              const Icon = item.icon;
              const contentId = `${accordionId}-content-${item.id}`;
              const triggerId = `${accordionId}-trigger-${item.id}`;

              return (
                <div key={item.id} className="py-6 sm:py-8 transition-colors">
                  <button
                    id={triggerId}
                    type="button"
                    onClick={() => setActiveAccordion(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    className="flex w-full items-center justify-between text-left focus-visible:outline-2 focus-visible:outline-primary rounded-xl"
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <span className="font-mono text-xs sm:text-sm font-bold text-primary">
                        0{index + 1}
                      </span>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-[#172554]">
                          {item.title}
                        </h3>
                        <span className="text-xs font-semibold text-[#64748b]">
                          {item.tag}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline-block text-xs font-semibold text-[#64748b]">
                        {isOpen ? 'Thu gọn' : 'Xem chi tiết'}
                      </span>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#cbd6ef] bg-white transition-transform duration-300 ${
                          isOpen ? 'rotate-180 bg-primary/5 border-primary' : ''
                        }`}
                      >
                        <ChevronDown size={16} className="text-[#172554]" aria-hidden="true" />
                      </span>
                    </div>
                  </button>

                  {/* Expanded Accordion Body */}
                  {isOpen && (
                    <div
                      id={contentId}
                      role="region"
                      aria-labelledby={triggerId}
                      className="mt-6 pl-8 sm:pl-16 pr-4 space-y-5 animate-in fade-in-50 duration-300"
                    >
                      <p className="max-w-2xl text-base leading-relaxed text-[#405176]">
                        {item.description}
                      </p>
                      <div>
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#172554] px-5 py-2.5 text-xs font-bold text-white hover:bg-primary transition-colors"
                        >
                          {item.ctaText}
                          <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PublicSiteShell>
  );
}
