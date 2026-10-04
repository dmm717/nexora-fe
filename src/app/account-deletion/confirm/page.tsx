import { DeletionConfirmation } from '@/components/features/account-deletion/DeletionFlow';

export const metadata = { title: 'Xác nhận yêu cầu xóa tài khoản — Nexora' };
// Never cache a response to a sensitive email-link entry, even though its UI is generic.
export const dynamic = 'force-dynamic';

export default function ConfirmAccountDeletionPage() {
  return <div className="mx-auto max-w-xl">
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Nexora · Xác minh qua email</p>
    <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Xóa tài khoản Nexora</h1>
    <p className="mt-4 text-base leading-8 text-[#52617e]">Kiểm tra yêu cầu trước khi xác nhận. Liên kết có hiệu lực trong 30 phút và chỉ dùng một lần.</p>
    <section className="mt-8 rounded-3xl border border-[#dbe3fa] bg-white p-6 shadow-[0_20px_60px_-35px_rgba(40,65,130,0.3)] sm:p-8"><DeletionConfirmation /></section>
  </div>;
}
