import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { cvAnalysisApi, type ResumeAnalysisMode } from '@/services/cvAnalysisApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import {
  ResumeAnalysisOperation,
  JobTargetedAnalysisOperation,
  FieldBenchmarkAnalysisOperation,
  normalizePendingAnalysis,
} from '@/services/cvAnalysisContract';

export type {
  ResumeAnalysisOperation,
  JobTargetedAnalysisOperation,
  FieldBenchmarkAnalysisOperation,
};

export { normalizePendingAnalysis };

type PendingAnalysis = ResumeAnalysisOperation;
export type JobTargetedPendingAnalysis = JobTargetedAnalysisOperation;
export type FieldBenchmarkPendingAnalysis = FieldBenchmarkAnalysisOperation;

export interface AnalysisHistoryItem {
  id: string;
  mode?: ResumeAnalysisMode;
  jdTitle?: string;
  targetRole?: string;
  seniority?: string;
  industry?: string;
  createdAt: string;
  resumeId?: string;
}

type PendingAnalysisInput =
  | Omit<JobTargetedAnalysisOperation, 'timestamp'>
  | Omit<FieldBenchmarkAnalysisOperation, 'timestamp'>
  | ResumeAnalysisOperation;

const PENDING_KEY_PREFIX = 'nexora_resume_analysis_pending_v2';

function storageKey(prefix: string, userId: string): string {
  return `${prefix}:${encodeURIComponent(userId)}`;
}

export function useResumeAnalysisHistory(userId?: string) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingAnalysis | null>(null);
  const pendingKey = userId ? storageKey(PENDING_KEY_PREFIX, userId) : null;
  const { authReady, isAuthenticated } = useAuth();

  const historyQuery = useInfiniteQuery({
    queryKey: ['resumeAnalyses'],
    queryFn: ({ pageParam = 1 }) => cvAnalysisApi.getResumeAnalyses(pageParam as number, 20),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: authReady && isAuthenticated && !!userId,
    staleTime: 30000,
  });

  const history = historyQuery.data?.pages.flatMap(page => page.items) || [];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(null);
    if (!userId || !pendingKey) return;

    try {
      const storedPending = localStorage.getItem(pendingKey);
      if (!storedPending) return;
      const parsedPending = JSON.parse(storedPending) as unknown;
      const normalized = normalizePendingAnalysis(parsedPending, userId);

      if (!normalized) {
        localStorage.removeItem(pendingKey);
        return;
      }

      // If migrated from legacy (or format normalized), persist updated explicit schema
      const isLegacy = (parsedPending as Record<string, unknown>).mode === undefined;
      if (isLegacy) {
        localStorage.setItem(pendingKey, JSON.stringify(normalized));
      }

      setPending(normalized);
    } catch (error) {
      console.error('Failed to load resume analysis history', error);
    }
  }, [pendingKey, userId]);

  const addHistoryItem = useCallback(() => {
    // Với API mới, sau khi phân tích xong ta nên invalidate query để lấy danh sách mới nhất từ BE
    queryClient.invalidateQueries({ queryKey: ['resumeAnalyses'] });
  }, [queryClient]);

  const setPendingAnalysis = useCallback((item: PendingAnalysisInput | null) => {
    if (!pendingKey || !userId) return;
    if (!item) {
      setPending(null);
      localStorage.removeItem(pendingKey);
      return;
    }
    if (item.userId !== userId) return;

    const newItem: PendingAnalysis = {
      ...item,
      timestamp: 'timestamp' in item ? item.timestamp : new Date().toISOString(),
    };
    setPending(newItem);
    try {
      localStorage.setItem(pendingKey, JSON.stringify(newItem));
    } catch (error) {
      console.error('Failed to save pending analysis', error);
    }
  }, [pendingKey, userId]);

  const clearHistory = useCallback(() => {
    // Lịch sử hiện tại lưu trên server, không clear ở client nữa
  }, []);

  return {
    history,
    historyQuery,
    pending,
    addHistoryItem,
    setPendingAnalysis,
    clearHistory,
  };
}
