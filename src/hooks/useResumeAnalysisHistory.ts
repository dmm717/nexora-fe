import { useState, useEffect, useCallback, useRef } from 'react';

export interface AnalysisHistoryItem {
  id: string;
  jdTitle: string;
  createdAt: string;
}

export interface PendingAnalysis {
  userId: string;
  idempotencyKey: string;
  resumeId: string;
  jobDescriptionId: string | null;
  analysisId: string | null;
  jdTitle: string;
  jdContent: string;
  timestamp: string;
}

type PendingAnalysisInput = Omit<PendingAnalysis, 'timestamp'> | PendingAnalysis;

const HISTORY_KEY_PREFIX = 'nexora_resume_analysis_history_v2';
const PENDING_KEY_PREFIX = 'nexora_resume_analysis_pending_v2';

function storageKey(prefix: string, userId: string): string {
  return `${prefix}:${encodeURIComponent(userId)}`;
}

function isPendingAnalysis(value: unknown): value is PendingAnalysis {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.userId === 'string'
    && typeof item.idempotencyKey === 'string'
    && typeof item.resumeId === 'string'
    && (typeof item.jobDescriptionId === 'string' || item.jobDescriptionId === null)
    && (typeof item.analysisId === 'string' || item.analysisId === null)
    && typeof item.jdTitle === 'string'
    && typeof item.jdContent === 'string'
    && typeof item.timestamp === 'string';
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
      if (!isPendingAnalysis(parsedPending) || parsedPending.userId !== userId) {
        localStorage.removeItem(pendingKey);
        return;
      }

      const ageInMs = Date.now() - new Date(parsedPending.timestamp).getTime();
      if (Number.isFinite(ageInMs) && ageInMs >= 0 && ageInMs < 60 * 60 * 1000) {
        setPending(parsedPending);
      } else {
        localStorage.removeItem(pendingKey);
      }
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
