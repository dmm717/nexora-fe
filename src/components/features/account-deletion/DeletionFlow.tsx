'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AccountDeletionError, confirmPublicAccountDeletion, requestPublicAccountDeletion, type PublicDeletionStatus } from '@/services/accountDeletionApi';

const ACCEPTED_MESSAGE = 'Nếu email này được liên kết với một tài khoản Nexora hợp lệ, chúng tôi sẽ gửi hướng dẫn xác minh yêu cầu xóa tài khoản đến hộp thư của bạn.';

function errorMessage(error: unknown) {
  const kind = error instanceof AccountDeletionError ? error.kind : 'uncertain';
  if (kind === 'rate-limit') return 'Bạn đã gửi nhiều yêu cầu. Vui lòng chờ trước khi thử lại.';
  if (kind === 'validation') return 'Vui lòng kiểm tra địa chỉ email và thử lại.';
  if (kind === 'invalid-link') return 'Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng. Bạn có thể yêu cầu email xác minh mới.';
  if (kind === 'unavailable') return 'Dịch vụ hiện chưa khả dụng. Vui lòng thử lại sau.';
  return 'Chưa thể xác nhận kết quả do kết nối hoặc dịch vụ bị gián đoạn. Yêu cầu có thể đã được tiếp nhận. Hãy kiểm tra hộp thư hoặc liên hệ hỗ trợ trước khi gửi lại.';
}

function Notice({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <div role={error ? 'alert' : 'status'} className={`rounded-2xl border p-4 text-sm leading-7 ${error ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-blue-100 bg-blue-50 text-[#243d73]'}`}>{children}</div>;
}

export function DeletionRequestForm() {
  const [email, setEmail] = useState('');
  const [validation, setValidation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const inFlight = useRef(false);
  const input = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || accepted) return;
    if (!email.trim() || email.trim().length > 254 || !input.current?.validity.valid) {
      setValidation('Nhập địa chỉ email hợp lệ của bạn.');
      input.current?.focus();
      return;
    }
    inFlight.current = true;
    setBusy(true); setValidation(''); setError('');
    try {
      await requestPublicAccountDeletion(email);
      setAccepted(true); setEmail('');
    } catch (failure) { setError(errorMessage(failure)); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <div className="space-y-6">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-primary" aria-hidden="true">{accepted ? <CheckCircle2 /> : <Mail />}</div>
    <h2 className="text-xl font-semibold text-[#172554]">{accepted ? 'Kiểm tra hộp thư của bạn' : 'Gửi email xác minh'}</h2>
    {accepted ? <>
      <Notice>{ACCEPTED_MESSAGE}</Notice>
      <p className="text-sm leading-7 text-[#52617e]">Liên kết chỉ dùng một lần và có hiệu lực trong 30 phút. Việc gửi email chưa xóa tài khoản. Bạn cần mở liên kết và chủ động xác nhận yêu cầu.</p>
    </> : <form noValidate onSubmit={submit} className="space-y-5" aria-label="Yêu cầu xóa tài khoản" aria-busy={busy}>
      <Input ref={input} label="Email tài khoản Nexora" type="email" required maxLength={254} autoComplete="email" inputMode="email" value={email} disabled={busy}
        onChange={event => { setEmail(event.target.value); setValidation(''); }} error={validation} aria-describedby="deletion-email-hint" placeholder="ban@example.com" />
      <p id="deletion-email-hint" className="text-sm leading-6 text-[#52617e]">Không cần đăng nhập. Hướng dẫn xác minh được gửi đến email liên kết với tài khoản.</p>
      {error && <Notice error>{error}</Notice>}
      <Button type="submit" loading={busy} size="lg" fullWidth>{busy ? 'Đang gửi yêu cầu…' : 'Gửi hướng dẫn xác minh'}</Button>
    </form>}
  </div>;
}

export function DeletionConfirmation() {
  const router = useRouter();
  const token = useRef<string | null>(null);
  const captured = useRef(false);
  const inFlight = useRef(false);
  const [phase, setPhase] = useState<'checking' | 'ready' | 'missing' | 'invalid' | 'accepted'>('checking');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PublicDeletionStatus | null>(null);

  useEffect(() => {
    // Capture only into component memory, before removing the entire query/hash from this history entry.
    // The ref also guards StrictMode's repeated effect setup. No request happens here.
    if (captured.current) return;
    captured.current = true;
    const values = new URLSearchParams(window.location.search).getAll('token');
    const value = values.length === 1 ? values[0] : null;
    window.history.replaceState(null, '', window.location.pathname);
    // Native history changes clear the address bar but Next retains its old query in
    // history.state. Replacing the route also removes that query from the router tree.
    router.replace(window.location.pathname, { scroll: false });
    const nextPhase = !value ? 'missing' : !value.trim() || value.length > 128 ? 'invalid' : 'ready';
    token.current = nextPhase === 'ready' ? value : null;
    // One-time hydration from the browser URL; reading it during render would mismatch SSR.
    setPhase(nextPhase);
  }, [router]);

  async function confirm() {
    if (inFlight.current || phase !== 'ready' || !token.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const status = await confirmPublicAccountDeletion(token.current);
      token.current = null;
      setResult(status); setPhase('accepted');
    } catch (failure) {
      setError(errorMessage(failure));
      if (failure instanceof AccountDeletionError && failure.kind === 'invalid-link') {
        token.current = null; setPhase('invalid');
      }
    } finally { inFlight.current = false; setBusy(false); }
  }

  const statusLabels = { queued: 'Đã tiếp nhận', processing: 'Đang xử lý', completed: 'Đã hoàn tất', failed: 'Xử lý chưa thành công' };
  return <div className="space-y-6">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-primary" aria-hidden="true"><ShieldCheck /></div>
    <h2 className="text-xl font-semibold text-[#172554]">{result ? 'Kết quả từ Nexora' : 'Xác nhận yêu cầu của bạn'}</h2>
    {phase === 'checking' && <p role="status" className="text-sm text-[#52617e]">Đang kiểm tra liên kết…</p>}
    {phase === 'missing' && <Notice error>Thiếu liên kết xác minh. Hãy mở liên kết trong email hoặc yêu cầu một email mới.</Notice>}
    {phase === 'invalid' && !error && <Notice error>Liên kết không hợp lệ. Vui lòng yêu cầu email xác minh mới.</Notice>}
    {phase === 'ready' && <>
      <p className="text-sm leading-7 text-[#52617e]">Nhấn nút bên dưới để gửi yêu cầu xóa tài khoản Nexora và dữ liệu liên quan. Chỉ mở trang này sẽ không gửi yêu cầu xóa.</p>
      <p className="rounded-2xl border border-[#e0e7fa] bg-[#f7f9ff] p-4 text-sm leading-7 text-[#334166]">Đây là bước xác nhận yêu cầu xóa tài khoản. Hãy đọc <Link href="/privacy" prefetch={false} className="font-semibold text-primary underline">chính sách bảo mật</Link> trước khi tiếp tục.</p>
    </>}
    {error && <Notice error>{error}</Notice>}
    {phase === 'ready' && <Button variant="danger" size="lg" fullWidth loading={busy} onClick={confirm}>{busy ? 'Đang xác nhận…' : error ? 'Thử xác nhận lại' : 'Xác nhận yêu cầu xóa tài khoản'}</Button>}
    {result && <>
      <Notice>{result.status === 'completed' ? 'Backend xác nhận yêu cầu đã hoàn tất.' : result.status === 'failed' ? 'Backend ghi nhận yêu cầu nhưng quá trình xử lý chưa thành công. Vui lòng liên hệ hỗ trợ.' : 'Nexora đã tiếp nhận yêu cầu xóa tài khoản. Việc tiếp nhận không đồng nghĩa với việc xử lý đã hoàn tất.'}</Notice>
      <dl className="space-y-3 text-sm text-[#52617e]">
        <div><dt>Trạng thái</dt><dd className="mt-1 font-semibold text-[#172554]">{statusLabels[result.status]}</dd></div>
        <div><dt>Thời điểm tiếp nhận</dt><dd className="mt-1">{new Date(result.requestedAt).toLocaleString('vi-VN')}</dd></div>
        {result.completedAt && <div><dt>Thời điểm hoàn tất</dt><dd className="mt-1">{new Date(result.completedAt).toLocaleString('vi-VN')}</dd></div>}
      </dl>
    </>}
    <Link href="/account-deletion" prefetch={false} className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Yêu cầu email xác minh mới</Link>
    <noscript><p>Bật JavaScript để xác nhận. Trang này không tự động gửi yêu cầu xóa.</p></noscript>
  </div>;
}
