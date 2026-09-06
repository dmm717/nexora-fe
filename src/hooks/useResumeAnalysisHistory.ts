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

const HISTORY_KEY = 'nexora_resume_analysis_history';
const PENDING_KEY = 'nexora_resume_analysis_pending';

export function useResumeAnalysisHistory() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [pending, setPending] = useState<PendingAnalysis | null>(null);

  useEffect(() => {
    // Load from local storage on mount
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        setTimeout(() => setHistory(JSON.parse(storedHistory)), 0);
      }

      const storedPending = localStorage.getItem(PENDING_KEY);
      if (storedPending) {
        const parsedPending = JSON.parse(storedPending) as PendingAnalysis;
        // Optionally, check if it's too old (e.g., > 1 hour) and discard
        const ageInMs = new Date().getTime() - new Date(parsedPending.timestamp).getTime();
        if (ageInMs < 60 * 60 * 1000) {
          setTimeout(() => setPending(parsedPending), 0);
        } else {
          localStorage.removeItem(PENDING_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to load resume analysis history', e);
    }
  }, []);

  const addHistoryItem = useCallback((item: Omit<AnalysisHistoryItem, 'createdAt'>) => {
    setHistory(prev => {
      const newItem: AnalysisHistoryItem = { ...item, createdAt: new Date().toISOString() };
      // Check if already exists
      if (prev.some(x => x.id === newItem.id)) return prev;
      
      const newHistory = [newItem, ...prev];
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (e) {
        console.error('Failed to save history', e);
      }
      return newHistory;
    });
  }, []);

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
