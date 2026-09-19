import { Button } from '@/components/ui/Button/Button';

interface AdminAsyncNoticeProps {
  kind: 'refreshing' | 'error';
  onRetry?: () => void;
  className?: string;
}

export function AdminAsyncNotice({ kind, onRetry, className = '' }: AdminAsyncNoticeProps) {
  if (kind === 'refreshing') {
    return (
      <p
        role="status"
        aria-live="polite"
        className={`flex min-h-8 items-center gap-2 text-xs font-medium text-on-surface-variant ${className}`}
      >
        <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        Đang cập nhật…
      </p>
    );
  }

  return (
    <div
      role="alert"
      className={`flex flex-col gap-3 rounded-xl border border-error/20 bg-error-container/30 p-3 text-sm text-on-surface sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="min-w-0 text-on-surface-variant">
        Không thể cập nhật dữ liệu mới nhất. Dữ liệu đã tải trước đó vẫn được giữ.
      </p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="shrink-0">
          Thử lại
        </Button>
      )}
    </div>
  );
}
