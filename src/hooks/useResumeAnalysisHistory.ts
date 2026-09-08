import { useState, useEffect, useCallback } from 'react';

export interface AnalysisHistoryItem {
  id: string;
  jdTitle: string;
  createdAt: string;
}

export interface PendingAnalysis {
  resumeId: string;
  jobDescriptionId: string;
  jdTitle: string;
  timestamp: string;
}

const HISTORY_KEY = 'nexora_resume_analysis_history_v1';
const PENDING_KEY = 'nexora_resume_analysis_pending_v1';

export function useResumeAnalysisHistory() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [pending, setPending] = useState<PendingAnalysis | null>(null);

  useEffect(() => {
    // Load from local storage on mount
    try {
      let storedHistory = localStorage.getItem(HISTORY_KEY);
      // Migration from old key
      if (!storedHistory) {
        const oldHistory = localStorage.getItem('nexora_resume_analysis_history');
        if (oldHistory) {
          storedHistory = oldHistory;
          localStorage.setItem(HISTORY_KEY, oldHistory);
          localStorage.removeItem('nexora_resume_analysis_history');
        }
      }

      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }

      let storedPending = localStorage.getItem(PENDING_KEY);
      // Migration from old key
      if (!storedPending) {
        const oldPending = localStorage.getItem('nexora_resume_analysis_pending');
        if (oldPending) {
          storedPending = oldPending;
          localStorage.setItem(PENDING_KEY, oldPending);
          localStorage.removeItem('nexora_resume_analysis_pending');
        }
      }

      if (storedPending) {
        const parsedPending = JSON.parse(storedPending) as PendingAnalysis;
        // Optionally, check if it's too old (e.g., > 1 hour) and discard
        const ageInMs = new Date().getTime() - new Date(parsedPending.timestamp).getTime();
        if (ageInMs < 60 * 60 * 1000) {
          setPending(parsedPending);
        } else {
          localStorage.removeItem(PENDING_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to load resume analysis history', e);
    }
  }, []);

  const addHistoryItem = useCallback((item: Omit<AnalysisHistoryItem, 'createdAt'>) => {
    const newItem: AnalysisHistoryItem = { ...item, createdAt: new Date().toISOString() };
    setHistory(prev => {
      if (prev.some(x => x.id === newItem.id)) return prev;
      return [newItem, ...prev];
    });
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      } catch (e) {
        console.error('Failed to save history', e);
      }
    }
  }, [history]);

  const setPendingAnalysis = useCallback((item: Omit<PendingAnalysis, 'timestamp'> | null) => {
    if (!item) {
      setPending(null);
      localStorage.removeItem(PENDING_KEY);
    } else {
      const newItem: PendingAnalysis = { ...item, timestamp: new Date().toISOString() };
      setPending(newItem);
      try {
        localStorage.setItem(PENDING_KEY, JSON.stringify(newItem));
      } catch (e) {
        console.error('Failed to save pending analysis', e);
      }
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return {
    history,
    pending,
    addHistoryItem,
    setPendingAnalysis,
    clearHistory
  };
}
