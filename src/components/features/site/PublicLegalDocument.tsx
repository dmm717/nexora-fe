'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PublicSiteShell } from '@/components/layouts/PublicSiteShell';
import { siteContentApi, type SitePageKey } from '@/services/siteContentApi';

function PlainLegalBody({ body }: { body: string }) {
  return <div className="space-y-4 text-sm leading-8 text-[#405176]">{body.split(/\r?\n/).map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('## ')) return <h2 key={index} className="mt-9 text-xl font-bold text-[#172554]">{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith('# ')) return <h2 key={index} className="mt-9 text-2xl font-bold text-[#172554]">{trimmed.slice(2)}</h2>;
    if (trimmed.startsWith('- ')) return <p key={index} className="pl-5 before:mr-2 before:content-['•']">{trimmed.slice(2)}</p>;
    return <p key={index}>{trimmed}</p>;
  })}</div>;
}

export function PublicLegalDocument({ pageKey, fallbackTitle }: { pageKey: Extract<SitePageKey, 'terms' | 'privacy'>; fallbackTitle: string }) {
  const page = useQuery({ queryKey: ['public-site-page', pageKey], queryFn: () => siteContentApi.getPublicPage(pageKey), staleTime: 5 * 60_000, retry: false });
  return <PublicSiteShell><div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
    <header className="rounded-3xl border border-[#dbe3fa] bg-white p-7 shadow-subtle sm:p-10"><p className="text-xs font-bold uppercase tracking-widest text-primary">Tài liệu Nexora</p><h1 className="mt-3 text-3xl font-extrabold text-[#172554] sm:text-4xl">{page.data?.title || fallbackTitle}</h1>{page.data && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#52617e]">{page.data.effectiveAt && <span>Hiệu lực: {new Date(page.data.effectiveAt).toLocaleDateString('vi-VN')}</span>}{page.data.updatedAt && <span>Cập nhật: {new Date(page.data.updatedAt).toLocaleDateString('vi-VN')}</span>}</div>}</header>
    <article className="mt-6 rounded-3xl border border-[#dbe3fa] bg-white p-7 shadow-subtle sm:p-12">
      {page.isLoading && <p role="status" className="text-sm text-[#52617e]">Đang tải nội dung...</p>}
      {page.data?.bodyMarkdown ? <PlainLegalBody body={page.data.bodyMarkdown} /> : !page.isLoading && <div className="space-y-3 text-sm leading-7 text-[#52617e]"><p>Nội dung chính thức chưa được công bố hoặc hiện chưa tải được. Nexora không hiển thị bản nháp quản trị như một chính sách đã có hiệu lực.</p><p>Vui lòng liên hệ <a href="mailto:nexorainterview@gmail.com" className="text-primary hover:underline">nexorainterview@gmail.com</a> nếu bạn cần thông tin trước khi sử dụng dịch vụ.</p></div>}
      <Link href="/" className="mt-10 inline-block text-sm font-bold text-primary hover:underline">← Về trang chủ</Link>
    </article>
  </div></PublicSiteShell>;
}
