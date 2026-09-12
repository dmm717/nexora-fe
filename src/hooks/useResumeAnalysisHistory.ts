import { useState, useEffect, useCallback, useRef } from 'react';
import type { ResumeAnalysisMode } from '@/services/cvAnalysisApi';
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

export type PendingAnalysis = ResumeAnalysisOperation;
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

const HISTORY_KEY_PREFIX = 'nexora_resume_analysis_history_v2';
const PENDING_KEY_PREFIX = 'nexora_resume_analysis_pending_v2';

function storageKey(prefix: string, userId: string): string {
  return `${prefix}:${encodeURIComponent(userId)}`;
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
