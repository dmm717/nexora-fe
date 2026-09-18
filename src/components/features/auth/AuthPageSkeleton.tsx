import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './Auth.module.css';

interface AuthPageSkeletonProps {
  backHref?: string;
  backLabel?: string;
  fieldCount?: number;
  title?: string;
}

export function AuthPageSkeleton({
  backHref = '/auth',
  backLabel = 'Đăng nhập',
  fieldCount = 2,
  title = 'Đang tải trang xác thực...',
}: AuthPageSkeletonProps) {
  return (
    <main className={styles.container} aria-busy="true">
      <Link href={backHref} className={styles.backButton}>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {backLabel}
      </Link>

      <div className={styles.glassCard}>
        <div className={styles.brandLogo}>
          <Image src="/logo.png" alt="Nexora" width={160} height={40} priority />
        </div>
        <div className="space-y-5" aria-hidden="true">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-7 w-44" />
            <Skeleton className="mx-auto h-4 w-60 max-w-full" />
          </div>
          {Array.from({ length: fieldCount }, (_, index) => (
            <div className="space-y-2" key={index}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="mx-auto h-4 w-40" />
        </div>
        <span className="sr-only" role="status" aria-live="polite">{title}</span>
      </div>
    </main>
  );
}
