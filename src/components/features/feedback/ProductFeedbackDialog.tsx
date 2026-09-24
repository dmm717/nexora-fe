'use client';

import React, { useState, useRef, useId } from 'react';
import { Star, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useMyFeedback,
  useUpsertFeedback,
  useDeleteFeedback,
} from '@/hooks/queries/useFeedback';
import {
  FEEDBACK_MAX_COMMENT_LENGTH,
  getFeedbackStatusLabel,
  type Feedback,
} from '@/services/feedbackContract';
import { ApiError } from '@/services/apiClient';

export interface ProductFeedbackDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  // Radix-like compatibility
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  interviewId?: string;
}

interface ProductFeedbackDialogContentProps {
  myFeedback: Feedback | null | undefined;
  isLoadingMyFeedback: boolean;
  onClose: () => void;
}

const ProductFeedbackDialogContent: React.FC<ProductFeedbackDialogContentProps> = ({
  myFeedback,
  isLoadingMyFeedback,
  onClose,
}) => {
  const upsertMutation = useUpsertFeedback();
  const deleteMutation = useDeleteFeedback();

  const [rating, setRating] = useState<number>(() => myFeedback?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(() => myFeedback?.comment || '');
  const [allowPublicDisplay, setAllowPublicDisplay] = useState<boolean>(
    () => Boolean(myFeedback?.allowPublicDisplay)
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const consentId = useId();
  const radioGroupRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation for star radio group
  const handleKeyDown = (e: React.KeyboardEvent, starValue: number) => {
    let nextRating = starValue;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextRating = Math.min(5, starValue + 1);
      setRating(nextRating);
      focusStar(nextRating);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextRating = Math.max(1, starValue - 1);
      setRating(nextRating);
      focusStar(nextRating);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setRating(starValue);
    }
  };

  const focusStar = (value: number) => {
    if (!radioGroupRef.current) return;
    const button = radioGroupRef.current.querySelector<HTMLButtonElement>(
      `button[data-star-value="${value}"]`
    );
    button?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setErrorMessage('Vui lòng chọn số sao đánh giá (từ 1 đến 5 sao).');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await upsertMutation.mutateAsync({
        rating,
        comment: comment.trim() || undefined,
        allowPublicDisplay,
      });

      setSuccessMessage(
        'Cảm ơn bạn đã góp ý. Nếu bạn cho phép hiển thị công khai, đánh giá sẽ xuất hiện sau khi được duyệt.'
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof ApiError ? err.message : 'Chưa thể gửi đánh giá. Vui lòng thử lại.'
      );
    }
  };

  const handleDelete = async () => {
    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync();
      setShowDeleteConfirm(false);
      setRating(0);
      setComment('');
      setAllowPublicDisplay(false);
      setSuccessMessage('Đã rút lại đánh giá của bạn thành công.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof ApiError ? err.message : 'Chưa thể xóa đánh giá. Vui lòng thử lại.'
      );
    }
  };

  const isSubmitting = upsertMutation.isPending || deleteMutation.isPending;
  const isExisting = Boolean(myFeedback);

  return (
    <div className="space-y-5 py-1">
      {/* Existing Moderation Status Badge */}
      {isExisting && myFeedback && !successMessage && (
        <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/50 flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-on-surface-variant font-medium">Trạng thái đánh giá: </span>
            <span className="font-bold text-on-surface">
              {getFeedbackStatusLabel(myFeedback.moderationStatus)}
            </span>
          </div>
          <Badge
            variant={
              myFeedback.moderationStatus === 'approved'
                ? 'success'
                : myFeedback.moderationStatus === 'rejected'
                ? 'neutral'
                : 'warning'
            }
            size="sm"
          >
            {getFeedbackStatusLabel(myFeedback.moderationStatus)}
          </Badge>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p className="font-medium leading-relaxed">{successMessage}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="mt-1"
            >
              Đóng
            </Button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Main Feedback Form */}
      {!successMessage && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Star Rating Radio Group */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
              Mức độ hài lòng của bạn <span className="text-error">*</span>
            </label>
            <div
              ref={radioGroupRef}
              role="radiogroup"
              aria-label="Đánh giá sao"
              className="flex items-center gap-2 pt-1"
            >
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = (hoverRating || rating) >= starValue;
                const isChecked = rating === starValue;
                const label = `${starValue} sao`;

                return (
                  <button
                    key={starValue}
                    type="button"
                    role="radio"
                    data-star-value={starValue}
                    aria-checked={isChecked}
                    aria-label={label}
                    tabIndex={isChecked || (rating === 0 && starValue === 1) ? 0 : -1}
                    disabled={isSubmitting || isLoadingMyFeedback}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(starValue)}
                    onKeyDown={(e) => handleKeyDown(e, starValue)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Star
                      size={28}
                      className={`transition-colors ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs text-on-surface-variant ml-2 font-medium">
                {rating > 0 ? `${rating}/5 sao` : 'Chưa chọn'}
              </span>
            </div>
          </div>

          {/* 2. Optional Comment Textarea */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label
                htmlFor="feedback-comment"
                className="font-bold text-on-surface uppercase tracking-wider"
              >
                Nhận xét &amp; Góp ý (Tùy chọn)
              </label>
              <span
                className={`text-[11px] ${
                  comment.length > FEEDBACK_MAX_COMMENT_LENGTH
                    ? 'text-error font-bold'
                    : 'text-on-surface-variant'
                }`}
              >
                {comment.length}/{FEEDBACK_MAX_COMMENT_LENGTH}
              </span>
            </div>
            <textarea
              id="feedback-comment"
              rows={4}
              maxLength={FEEDBACK_MAX_COMMENT_LENGTH}
              value={comment}
              disabled={isSubmitting || isLoadingMyFeedback}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về phỏng vấn AI, phân tích CV, các câu hỏi hoặc tính năng bạn muốn cải thiện..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* 3. Explicit Public Display Consent (defaults false) */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-1">
            <label htmlFor={consentId} className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                id={consentId}
                checked={allowPublicDisplay}
                disabled={isSubmitting || isLoadingMyFeedback}
                onChange={(e) => setAllowPublicDisplay(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <div className="text-xs">
                <span className="font-semibold text-on-surface">
                  Cho phép Nexora hiển thị đánh giá này trên trang giới thiệu.
                </span>
                <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                  Nếu được duyệt, tên hiển thị, ảnh đại diện (nếu có), số sao và nhận xét của bạn có thể xuất hiện công khai.
                </p>
              </div>
            </label>
          </div>

          {/* 4. Delete Confirmation view if requested */}
          {showDeleteConfirm && (
            <div className="p-3.5 rounded-xl bg-error-container/20 border border-error/30 text-xs space-y-2">
              <p className="font-semibold text-error">
                Bạn có chắc chắn muốn rút lại và xóa đánh giá này?
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleDelete}
                >
                  Xác nhận xóa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}

          {/* 5. Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-outline-variant/30">
            <div>
              {isExisting && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 text-xs text-error hover:text-error/80 font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  <span>Rút lại đánh giá</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting || rating === 0 || comment.length > FEEDBACK_MAX_COMMENT_LENGTH}
                className="shadow-sm font-semibold"
              >
                {isSubmitting
                  ? 'Đang gửi...'
                  : isExisting
                  ? 'Cập nhật đánh giá'
                  : 'Gửi đánh giá'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export const ProductFeedbackDialog: React.FC<ProductFeedbackDialogProps> = ({
  isOpen,
  onClose,
  open,
  onOpenChange,
}) => {
  const isModalOpen = Boolean(open ?? isOpen);
  const handleModalClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  const { data: myFeedback, isLoading: isLoadingMyFeedback } = useMyFeedback();

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleModalClose}
      title={myFeedback ? 'Đánh giá & Góp ý của bạn' : 'Gửi đánh giá về Nexora'}
      maxWidth="md"
    >
      {isModalOpen && (
        <ProductFeedbackDialogContent
          key={myFeedback ? `${myFeedback.id}-${myFeedback.updatedAt || ''}` : (isLoadingMyFeedback ? 'loading' : 'new')}
          myFeedback={myFeedback}
          isLoadingMyFeedback={isLoadingMyFeedback}
          onClose={handleModalClose}
        />
      )}
    </Modal>
  );
};

export default ProductFeedbackDialog;
