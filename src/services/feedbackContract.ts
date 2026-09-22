export type FeedbackModerationStatus = 'pending' | 'approved' | 'rejected';
export type FeedbackStatus = FeedbackModerationStatus | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface FeedbackRequest {
  rating: number;
  comment?: string;
  allowPublicDisplay: boolean;
}

export interface FeedbackResponse {
  id: string;
  rating: number;
  comment: string | null;
  allowPublicDisplay: boolean;
  moderationStatus: FeedbackModerationStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  moderatedAt?: string | null;
  publishedAt?: string | null;
  deletedAt?: string | null;
}

export type Feedback = FeedbackResponse;


export interface PublicFeedbackItem {
  id: string;
  displayName: string;
  rating: number;
  comment: string;
  publishedAt: string;
  avatarUrl?: string | null;
}

export type PublicFeedbackResponse = PublicFeedbackItem;

export interface PublicFeedbackPageResponse {
  averageRating: number | null;
  ratingCount: number;
  items: PublicFeedbackItem[];
}

export interface AdminFeedbackResponse {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  rating: number;
  comment: string | null;
  allowPublicDisplay: boolean;
  moderationStatus: FeedbackModerationStatus | string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  moderatedAt: string | null;
  publishedAt: string | null;
  deletedAt: string | null;
  moderatedByUserId?: string | null;
}

export interface AdminFeedbackPageResponse {
  items: AdminFeedbackResponse[];
  nextCursor: string | null;
  pageSize: number;
}

export interface AdminFeedbackSummaryResponse {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  published: number;
  featured: number;
  averageRating: number | null;
  ratingDistribution?: Record<number, number> | null;
}

export interface AdminFeedbackFilters {
  status?: string;
  search?: string;
  query?: string;
  featured?: boolean;
  consent?: boolean;
  rating?: number;
  from?: string;
  to?: string;
  includeDeleted?: boolean;
  cursor?: string;
  pageSize?: number;
}

export const FEEDBACK_MAX_COMMENT_LENGTH = 1000;

export const DEFAULT_PUBLIC_FEEDBACK_LIMIT = 20;

/**
 * Returns safe user-facing status label without exposing moderator ID,
 * reason, or audit metadata.
 */
export function getFeedbackStatusLabel(status: FeedbackModerationStatus | string | undefined): string {
  if (!status) return 'Đang chờ duyệt';
  switch (status.toLowerCase()) {
    case 'approved':
      return 'Đã duyệt';
    case 'rejected':
      return 'Không được hiển thị';
    case 'pending':
    default:
      return 'Đang chờ duyệt';
  }
}
