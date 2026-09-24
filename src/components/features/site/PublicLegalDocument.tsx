'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ListFilter, ShieldCheck } from 'lucide-react';
import { PublicSiteShell } from '@/components/layouts/PublicSiteShell';
import { siteContentApi, type SitePageKey } from '@/services/siteContentApi';
import { parseLegalMarkdown, type LegalSection } from '@/services/legalParser';

function LegalSectionView({ section }: { section: LegalSection }) {
  return (
    <section id={section.id} className="scroll-mt-28 border-b border-[#e2e8f5] pb-10 pt-8 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs font-bold text-primary">{section.number}</span>
        <h2 className="text-xl font-extrabold tracking-tight text-[#172554] sm:text-2xl">
          {section.title}
        </h2>
      </div>
      <div className="mt-5 space-y-4">
        {section.blocks.map((block, idx) => {
          if (block.type === 'h3') {
            return (
              <h3 key={idx} className="mt-6 text-base font-bold text-[#172554]">
                {block.text}
              </h3>
            );
          }
          if (block.type === 'unordered-list') {
            return (
              <ul key={idx} className="my-3 space-y-2 pl-5 text-sm leading-7 text-[#405176]">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="list-disc marker:text-primary">
                    {item}
                  </li>
                ))}
              </ul>
            );
          }
          if (block.type === 'ordered-list') {
            return (
              <ol key={idx} className="my-3 space-y-2 pl-5 text-sm leading-7 text-[#405176]">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="list-decimal marker:font-bold marker:text-primary">
                    {item}
                  </li>
                ))}
              </ol>
            );
          }
          return (
            <p key={idx} className="text-sm leading-8 text-[#405176]">
              {block.text}
            </p>
          );
        })}
      </div>
    </section>
  );
}

export function PublicLegalDocument({
  pageKey,
  fallbackTitle,
}: {
  pageKey: Extract<SitePageKey, 'terms' | 'privacy'>;
  fallbackTitle: string;
}) {
  const page = useQuery({
    queryKey: ['public-site-page', pageKey],
    queryFn: () => siteContentApi.getPublicPage(pageKey),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const sections = useMemo(() => {
    return parseLegalMarkdown(page.data?.bodyMarkdown || '');
  }, [page.data?.bodyMarkdown]);

  const title = page.data?.title || fallbackTitle;

  return (
    <PublicSiteShell>
      <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 sm:py-12">
        {/* Editorial Header Masthead */}
        <header className="rounded-3xl border border-[#dbe3fa] bg-white/95 p-7 shadow-[0_12px_32px_-20px_rgba(23,37,84,0.08)] backdrop-blur-md sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <ShieldCheck size={14} className="text-primary" aria-hidden="true" />
              Tài liệu chính thức
            </span>
            <span className="text-xs font-semibold text-[#64748b]">· Nexora Platform</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#172554] sm:text-5xl">
            {title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#edf2fd] pt-4 text-xs font-medium text-[#52617e]">
            {page.data?.effectiveAt && (
              <span>
                Hiệu lực:{' '}
                <strong className="text-[#172554]">
                  {new Date(page.data.effectiveAt).toLocaleDateString('vi-VN')}
                </strong>
              </span>
            )}
            {page.data?.updatedAt && (
              <span>
                Cập nhật lần cuối:{' '}
                <strong className="text-[#172554]">
                  {new Date(page.data.updatedAt).toLocaleDateString('vi-VN')}
                </strong>
              </span>
            )}
            <span>Phiên bản công bố chính thức</span>
          </div>
        </header>

        {/* Mobile Table of Contents Accordion */}
        {sections.length > 0 && (
          <div className="mt-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              className="flex w-full items-center justify-between rounded-2xl border border-[#dbe3fa] bg-white px-5 py-3.5 text-left text-sm font-bold text-[#172554] shadow-sm"
              aria-expanded={mobileTocOpen}
            >
              <span className="inline-flex items-center gap-2">
                <ListFilter size={16} className="text-primary" />
                Mục lục tài liệu ({sections.length} điều khoản)
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${mobileTocOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {mobileTocOpen && (
              <nav
                aria-label="Mục lục điều khoản di động"
                className="mt-2 space-y-1 rounded-2xl border border-[#dbe3fa] bg-white p-4 shadow-sm"
              >
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setMobileTocOpen(false)}
                    className="flex items-baseline gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#334155] hover:bg-[#f1f5fd] hover:text-primary transition-colors"
                  >
                    <span className="font-mono font-bold text-primary">{section.number}</span>
                    <span className="line-clamp-1">{section.title}</span>
                  </a>
                ))}
              </nav>
            )}
          </div>
        )}

        {/* Desktop Layout: Sticky TOC + Reading Surface */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)] xl:gap-10">
          {/* Desktop Sticky In-page Navigation */}
          {sections.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-[#dbe3fa] bg-white/90 p-5 shadow-sm backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748b]">
                  Mục lục tài liệu
                </p>
                <nav aria-label="Mục lục các điều khoản" className="mt-4 space-y-1">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="group flex items-baseline gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#475569] transition-all hover:bg-[#f1f5fd] hover:text-primary"
                    >
                      <span className="font-mono text-[11px] font-bold text-primary group-hover:underline">
                        {section.number}
                      </span>
                      <span className="line-clamp-2 leading-relaxed">{section.title}</span>
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Reading Column */}
          <main className="min-w-0">
            <article className="rounded-3xl border border-[#dbe3fa] bg-white p-7 shadow-sm sm:p-12 sm:shadow-[0_16px_40px_-24px_rgba(23,37,84,0.06)]">
              {page.isLoading && (
                <div role="status" className="py-12 text-center text-sm text-[#52617e]">
                  <p>Đang tải nội dung văn bản...</p>
                </div>
              )}

              {sections.length > 0 ? (
                <div className="space-y-2">
                  {sections.map((section) => (
                    <LegalSectionView key={section.id} section={section} />
                  ))}
                </div>
              ) : (
                !page.isLoading && (
                  <div className="space-y-4 py-8 text-sm leading-7 text-[#52617e]">
                    <p>
                      Nội dung chính thức chưa được công bố hoặc hiện chưa tải được. Nexora không hiển
                      thị bản nháp quản trị như một chính sách đã có hiệu lực.
                    </p>
                    <p>
                      Vui lòng liên hệ{' '}
                      <a href="mailto:nexorainterview@gmail.com" className="font-semibold text-primary hover:underline">
                        nexorainterview@gmail.com
                      </a>{' '}
                      nếu bạn cần thông tin trước khi sử dụng dịch vụ.
                    </p>
                  </div>
                )
              )}

              <div className="mt-12 border-t border-[#edf2fd] pt-6">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Về trang chủ Nexora
                </Link>
              </div>
            </article>
          </main>
        </div>
      </div>
    </PublicSiteShell>
  );
}
