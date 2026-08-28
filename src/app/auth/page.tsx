import Auth from '@/components/features/auth/Auth';
import { Suspense } from 'react';

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Auth />
    </Suspense>
  );
}
