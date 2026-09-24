'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { CURRENT_USER_QUERY_KEY } from '@/hooks/queries/useUser';
import { careerProfileKeys } from '@/hooks/queries/useCareerProfile';
import { feedbackKeys } from '@/hooks/queries/useFeedback';
import { userApi, type UserResponse } from '@/services/userApi';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxSize = 2 * 1024 * 1024;

export function AvatarEditor({ user }: { user: UserResponse }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const reconcile = (avatarUrl: string | null) => {
    queryClient.setQueryData<UserResponse>(CURRENT_USER_QUERY_KEY, (old) => old ? { ...old, avatarUrl } : old);
    void queryClient.invalidateQueries({ queryKey: careerProfileKeys.all });
    void queryClient.invalidateQueries({ queryKey: [...feedbackKeys.all, 'public'] });
  };

  const upload = async (file?: File) => {
    if (!file || busy) return;
    setError(null);
    if (!allowedTypes.has(file.type)) {
      setError('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.');
      return;
    }
    if (file.size > maxSize) {
      setError('Ảnh không được vượt quá 2 MB.');
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setBusy(true);
    try {
      reconcile(await userApi.updateAvatar(file));
      toast.success('Đã cập nhật ảnh đại diện.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể cập nhật ảnh đại diện.';
      setError(message);
      toast.error(message);
    } finally {
      setPreviewUrl(null);
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await userApi.deleteAvatar();
      reconcile(null);
      toast.success('Đã xóa ảnh đại diện.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể xóa ảnh đại diện.';
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-outline-variant/40 pb-5">
      {previewUrl ? (
        // Local object URL preview; no remote image host configuration required.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Ảnh đại diện mới đang tải lên" className="h-14 w-14 shrink-0 rounded-full object-cover" />
      ) : (
        <UserAvatar avatarUrl={user.avatarUrl} displayName={user.displayName} email={user.email} className="h-14 w-14 text-lg" />
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-semibold text-on-surface">Ảnh đại diện</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-fixed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50">
            {busy ? 'Đang xử lý…' : user.avatarUrl ? 'Thay ảnh' : 'Tải ảnh lên'}
          </button>
          {user.avatarUrl && <button type="button" disabled={busy} onClick={remove} className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50">Xóa ảnh</button>}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Chọn ảnh đại diện JPEG, PNG hoặc WebP" onChange={(event) => void upload(event.target.files?.[0])} disabled={busy} />
        <p className="text-xs text-on-surface-variant">JPEG, PNG hoặc WebP · tối đa 2 MB</p>
        {error && <p role="alert" className="text-xs text-error">{error}</p>}
      </div>
    </div>
  );
}
