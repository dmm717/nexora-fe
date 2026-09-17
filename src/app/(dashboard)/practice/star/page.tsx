import { Suspense } from 'react';
import StarPractice from '@/components/features/practice/StarPractice';

export default function StarPracticePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-on-surface-variant">Đang tải phòng luyện STAR...</div>}>
      <StarPractice />
    </Suspense>
  );
}
