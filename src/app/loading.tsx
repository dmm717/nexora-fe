import { NexoraBootLoader } from '@/components/brand/NexoraBootLoader';

export default function Loading() {
  return (
    <div className="relative">
      <NexoraBootLoader message="Đang tải trang..." />
      <span className="sr-only functional-spinner" aria-hidden="true" />
    </div>
  );
}


