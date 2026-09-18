import Auth from '@/components/features/auth/Auth';
import { AuthPageSkeleton } from '@/components/features/auth/AuthPageSkeleton';
import { Suspense } from 'react';

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton fieldCount={3} />}>
      <Auth />
    </Suspense>
  );
}
