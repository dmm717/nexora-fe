import type { Metadata } from 'next';
import Link from 'next/link';
import { NavigationBrand, NavigationFrame, NavigationRow } from '@/components/header/NavigationFrame';

export const metadata: Metadata = {
  title: 'Xóa tài khoản — Nexora',
  description: 'Yêu cầu xóa tài khoản Nexora qua email xác minh, không cần đăng nhập.',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

// Stateless public navigation: no session-dependent controls or remote Site Content calls.
export default function AccountDeletionLayout({ children }: { children: React.ReactNode }) {
  return <div className="nexora-ambient-shell flex min-h-screen flex-col text-[#172554]">
    <NavigationFrame variant="public"><NavigationRow><NavigationBrand prefetch={false} /><Link href="/" prefetch={false} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">Về trang chủ</Link></NavigationRow></NavigationFrame>
    <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-5 pb-14 pt-28 sm:px-8 sm:pt-32">{children}
      <p className="mt-8 text-sm leading-7 text-[#52617e]">Biểu mẫu cần JavaScript để gửi yêu cầu. Nếu không sử dụng được, bạn có thể xem thông tin liên hệ trong <Link href="/privacy" prefetch={false} className="font-semibold text-primary underline">chính sách bảo mật</Link>. Chỉ mở trang này không gửi yêu cầu xóa tài khoản.</p>
    </main>
    <footer className="border-t border-[#dce4f7] bg-white/50 px-5 py-6">
      <nav aria-label="Thông tin pháp lý" className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[#405176]">
        <Link href="/privacy" prefetch={false} className="inline-flex min-h-11 items-center hover:underline">Chính sách bảo mật</Link>
        <Link href="/terms" prefetch={false} className="inline-flex min-h-11 items-center hover:underline">Điều khoản dịch vụ</Link>
        <Link href="/account-deletion" prefetch={false} className="inline-flex min-h-11 items-center hover:underline">Xóa tài khoản</Link>
        <Link href="/privacy" prefetch={false} className="inline-flex min-h-11 items-center hover:underline">Liên hệ hỗ trợ</Link>
      </nav>
    </footer>
  </div>;
}
