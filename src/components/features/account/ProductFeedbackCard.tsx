'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMyFeedback } from '@/hooks/queries/useFeedback';
import { ProductFeedbackDialog } from '@/components/features/feedback/ProductFeedbackDialog';
import { getFeedbackStatusLabel } from '@/services/feedbackContract';

export const ProductFeedbackCard: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: myFeedback, isLoading } = useMyFeedback();

  const getStatusBadgeVariant = (status: string): 'warning' | 'success' | 'neutral' => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <Card variant="elevated" padding="lg" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Đánh giá &amp; Góp ý</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Ý kiến đóng góp của bạn giúp Nexora nâng cao độ chính xác của AI và trải nghiệm luyện tập.
          </p>
        </div>
        <span className="material-symbols-outlined text-primary text-[28px]">rate_review</span>
      </div>

      {isLoading ? (
        <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 flex items-center justify-center py-6">
          <div className="functional-spinner w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : myFeedback ? (
        <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`material-symbols-outlined text-[20px] ${
                    s <= myFeedback.rating ? 'fill-current' : 'text-slate-300'
                  }`}
                  style={{ fontVariationSettings: s <= myFeedback.rating ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              ))}
              <span className="text-xs font-bold text-slate-700 ml-1">{myFeedback.rating}/5</span>
            </div>

            <Badge variant={getStatusBadgeVariant(myFeedback.moderationStatus)} size="sm">
              {getFeedbackStatusLabel(myFeedback.moderationStatus)}
            </Badge>
          </div>

          {myFeedback.comment && (
            <p className="text-xs text-slate-700 bg-white/80 p-3 rounded-lg border border-slate-200 italic leading-relaxed">
              &ldquo;{myFeedback.comment}&rdquo;
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                {myFeedback.allowPublicDisplay ? 'public' : 'lock'}
              </span>
              <span>
                {myFeedback.allowPublicDisplay
                  ? 'Cho phép hiển thị công khai trên trang chủ'
                  : 'Chỉ chia sẻ nội bộ với đội ngũ Nexora'}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="text-xs font-semibold"
            >
              Chỉnh sửa đánh giá
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 space-y-3">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Bạn chưa gửi đánh giá nào cho Nexora. Hãy chia sẻ cảm nhận và mức độ hài lòng của bạn để chúng tôi phục vụ bạn tốt hơn!
          </p>
          <div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDialogOpen(true)}
              icon={<span className="material-symbols-outlined text-[18px]">star</span>}
              className="font-semibold shadow-sm text-xs"
            >
              Gửi đánh giá &amp; Góp ý
            </Button>
          </div>
        </div>
      )}

      <ProductFeedbackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
};
