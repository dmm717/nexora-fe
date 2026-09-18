import React, { Suspense } from 'react';
import { CareerProfileScreen } from '@/components/features/career-profile/CareerProfileScreen';

export default function CareerProfilePage() {
  return (
    <Suspense fallback={null}>
      <CareerProfileScreen />
    </Suspense>
  );
}
