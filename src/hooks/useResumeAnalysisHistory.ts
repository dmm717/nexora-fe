import { useState, useEffect, useCallback, useRef } from 'react';
import type { ResumeAnalysisMode } from '@/services/cvAnalysisApi';

export interface AnalysisHistoryItem {
  id: string;
  mode?: ResumeAnalysisMode;
  jdTitle?: string;
  targetRole?: string;
  seniority?: string;
  industry?: string;
  createdAt: string;
}

export interface BasePendingAnalysis {
  userId: string;
  idempotencyKey: string;
  resumeId: string;
  analysisId: string | null;
  timestamp: string;
}

export interface JobTargetedPendingAnalysis extends BasePendingAnalysis {
  mode: 'job_targeted';
  jobDescriptionId: string | null;
  jdTitle: string;
  jdContent: string;
}

export interface FieldBenchmarkPendingAnalysis extends BasePendingAnalysis {
  mode: 'field_benchmark';
  industry: string;
  targetRole: string;
  seniority: string;
}

export type PendingAnalysis =
  | JobTargetedPendingAnalysis
  | FieldBenchmarkPendingAnalysis;

type PendingAnalysisInput =
  | Omit<JobTargetedPendingAnalysis, 'timestamp'>
  | Omit<FieldBenchmarkPendingAnalysis, 'timestamp'>
  | PendingAnalysis;

const HISTORY_KEY_PREFIX = 'nexora_resume_analysis_history_v2';
const PENDING_KEY_PREFIX = 'nexora_resume_analysis_pending_v2';

function storageKey(prefix: string, userId: string): string {
  return `${prefix}:${encodeURIComponent(userId)}`;
}

export function normalizePendingAnalysis(raw: unknown, expectedUserId: string): PendingAnalysis | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  if (typeof item.userId !== 'string' || item.userId !== expectedUserId) return null;
  if (typeof item.idempotencyKey !== 'string' || !item.idempotencyKey.trim()) return null;
  if (typeof item.resumeId !== 'string' || !item.resumeId.trim()) return null;
  if (typeof item.timestamp !== 'string') return null;

  const ageInMs = Date.now() - new Date(item.timestamp).getTime();
  if (!Number.isFinite(ageInMs) || ageInMs < 0 || ageInMs >= 60 * 60 * 1000) {
    return null;
  }

  const analysisId = typeof item.analysisId === 'string' ? item.analysisId : null;

  if (item.mode === 'field_benchmark') {
    if (
      typeof item.industry === 'string' && item.industry.trim() &&
      typeof item.targetRole === 'string' && item.targetRole.trim() &&
      typeof item.seniority === 'string' && item.seniority.trim()
    ) {
      return {
        userId: item.userId,
        idempotencyKey: item.idempotencyKey,
        resumeId: item.resumeId,
        mode: 'field_benchmark',
        analysisId,
        industry: item.industry.trim(),
        targetRole: item.targetRole.trim(),
        seniority: item.seniority.trim(),
        timestamp: item.timestamp,
      };
    }
    return null;
  }

  if (item.mode === 'job_targeted') {
    if (
      typeof item.jdTitle === 'string' &&
      typeof item.jdContent === 'string'
    ) {
      return {
        userId: item.userId,
        idempotencyKey: item.idempotencyKey,
        resumeId: item.resumeId,
        mode: 'job_targeted',
        jobDescriptionId: typeof item.jobDescriptionId === 'string' ? item.jobDescriptionId : null,
        analysisId,
        jdTitle: item.jdTitle,
        jdContent: item.jdContent,
        timestamp: item.timestamp,
      };
    }
    return null;
  }

  // Legacy schema migration: record with resumeId + jdTitle + jdContent without explicit mode
  if (
    item.mode === undefined &&
    typeof item.jdTitle === 'string' &&
    typeof item.jdContent === 'string'
  ) {
    return {
      userId: item.userId,
      idempotencyKey: item.idempotencyKey,
      resumeId: item.resumeId,
      mode: 'job_targeted',
      jobDescriptionId: typeof item.jobDescriptionId === 'string' ? item.jobDescriptionId : null,
      analysisId,
      jdTitle: item.jdTitle,
      jdContent: item.jdContent,
      timestamp: item.timestamp,
    };
  }

  return null;
}

export function useResumeAnalysisHistory(userId?: string) {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [pending, setPending] = useState<PendingAnalysis | null>(null);
  const historyKey = userId ? storageKey(HISTORY_KEY_PREFIX, userId) : null;
  const pendingKey = userId ? storageKey(PENDING_KEY_PREFIX, userId) : null;
  const skipHistoryPersistence = useRef(false);

  useEffect(() => {
    // Scope changes reset the in-memory cache before loading the new user's data.
    skipHistoryPersistence.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory([]);
    setPending(null);
    if (!userId || !historyKey || !pendingKey) return;

    try {
      const storedHistory = localStorage.getItem(historyKey);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory) as unknown;
        if (Array.isArray(parsed)) setHistory(parsed as AnalysisHistoryItem[]);
      }

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
  }, [historyKey, pendingKey, userId]);

  const addHistoryItem = useCallback((item: Omit<AnalysisHistoryItem, 'createdAt'>) => {
    const newItem: AnalysisHistoryItem = { ...item, createdAt: new Date().toISOString() };
    setHistory(prev => {
      if (prev.some(x => x.id === newItem.id)) return prev;
      return [newItem, ...prev];
    });
  }, []);

  useEffect(() => {
    if (!historyKey) return;
    if (skipHistoryPersistence.current) {
      skipHistoryPersistence.current = false;
      return;
    }
    try {
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history', error);
    }
  }, [history, historyKey]);

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
    setHistory([]);
    if (historyKey) localStorage.removeItem(historyKey);
  }, [historyKey]);

  return {
    history,
    pending,
    addHistoryItem,
    setPendingAnalysis,
    clearHistory,
  };
}
