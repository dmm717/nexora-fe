import { DeletionRequestForm } from '@/components/features/account-deletion/DeletionFlow';

export default function AccountDeletionPage() {
  return <div className="grid items-start gap-8 lg:grid-cols-[1fr_1fr] lg:gap-x-14 lg:gap-y-6">
    <section className="py-2">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Nexora · Quyền riêng tư</p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Bạn chủ động với<br className="hidden sm:block" /> tài khoản của mình.</h1>
      <p className="mt-5 max-w-lg text-base leading-8 text-[#52617e]">Yêu cầu xóa tài khoản Nexora và dữ liệu liên quan bằng email, ngay cả khi bạn không đăng nhập hoặc không còn sử dụng ứng dụng.</p>
    </section>
    <section className="rounded-3xl border border-[#dbe3fa] bg-white p-6 shadow-[0_20px_60px_-35px_rgba(40,65,130,0.3)] sm:p-8 lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label="Xóa tài khoản qua email"><DeletionRequestForm /><noscript><p className="mt-4">Bật JavaScript để gửi email xác minh hoặc liên hệ hỗ trợ.</p></noscript></section>
    <section aria-label="Các bước xóa tài khoản" className="lg:col-start-1 lg:row-start-2">
      <ol className="space-y-5 text-sm leading-7 text-[#405176]">
        <li><strong className="block text-[#172554]">01 — Nhập email tài khoản</strong>Gửi yêu cầu nhận hướng dẫn xác minh.</li>
        <li><strong className="block text-[#172554]">02 — Mở liên kết trong email</strong>Liên kết chỉ dùng một lần, có hiệu lực trong 30 phút.</li>
        <li><strong className="block text-[#172554]">03 — Chủ động xác nhận</strong>Nexora kiểm tra liên kết và tiếp nhận yêu cầu xử lý. 30 phút là thời hạn liên kết, không phải thời gian chờ xóa tài khoản.</li>
      </ol>
    </section>
  </div>;
}
