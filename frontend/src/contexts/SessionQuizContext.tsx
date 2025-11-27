import React, { createContext, useContext, useState, useCallback } from 'react';

type PendingInterrupt = {
  interruptId?: string | null;
  quizId?: string | null;
  raw?: any;
};

interface SessionQuizContextValue {
  pendingInterrupt: PendingInterrupt | null;
  openQuiz: (quizId: string | null, interruptId?: string | null, raw?: any) => void;
  clearPending: () => void;
}

const SessionQuizContext = createContext<SessionQuizContextValue | undefined>(undefined);

export const useSessionQuiz = (): SessionQuizContextValue => {
  const ctx = useContext(SessionQuizContext);
  if (!ctx) throw new Error('useSessionQuiz must be used within SessionQuizProvider');
  return ctx;
};

export const SessionQuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingInterrupt, setPendingInterrupt] = useState<PendingInterrupt | null>(null);

  const persistToStorage = useCallback((p: PendingInterrupt | null) => {
    try {
      // Prefer chrome.storage.local when available (extension context), otherwise mirror to localStorage.
      const hasChromeStorage = (window as any).chrome && (window as any).chrome.storage && (window as any).chrome.storage.local && typeof (window as any).chrome.storage.local.set === 'function';
      if (hasChromeStorage) {
        try {
          if (p) {
            (window as any).chrome.storage.local.set({ si_interrupt_pending: true, si_pending_interrupt_quizId: String(p.quizId || ''), si_pending_interrupt_id: String(p.interruptId || '') }, () => { /* no-op */ });
          } else {
            (window as any).chrome.storage.local.set({ si_interrupt_pending: false }, () => { /* no-op */ });
            try { (window as any).chrome.storage.local.remove && (window as any).chrome.storage.local.remove(['si_pending_interrupt_quizId','si_pending_interrupt_id']); } catch (e) { /* ignore */ }
          }
          return;
        } catch (e) { /* fallthrough to localStorage */ }
      }
      // Fallback: mirror to localStorage for non-extension environments and to allow cross-window detection
      if (p) {
        try { localStorage.setItem('si_interrupt_pending', 'true'); } catch (e) {}
        try { localStorage.setItem('si_pending_interrupt_quizId', String(p.quizId || '')); } catch (e) {}
        try { localStorage.setItem('si_pending_interrupt_id', String(p.interruptId || '')); } catch (e) {}
      } else {
        try { localStorage.setItem('si_interrupt_pending', 'false'); } catch (e) {}
        try { localStorage.removeItem('si_pending_interrupt_quizId'); } catch (e) {}
        try { localStorage.removeItem('si_pending_interrupt_id'); } catch (e) {}
      }
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  const openQuiz = useCallback((quizId: string | null, interruptId: string | null = null, raw: any = null) => {
    const p: PendingInterrupt = { quizId: quizId || null, interruptId: interruptId || null, raw };
    setPendingInterrupt(p);
    // persist minimal markers so a newly-opened tab/app instance can pick it up
    persistToStorage(p);
    try {
      // navigate the current window to the quiz route using hash routing (app uses HashRouter)
      const rel = `#/quiz?quizId=${encodeURIComponent(String(quizId || ''))}${interruptId ? `&interruptId=${encodeURIComponent(String(interruptId))}` : ''}`;
      try { window.location.hash = rel; } catch (e) { /* ignore */ }
    } catch (e) {
      console.warn('Failed to navigate to quiz via SessionQuizContext', e);
    }
  }, [persistToStorage]);

  const clearPending = useCallback(() => {
    setPendingInterrupt(null);
    persistToStorage(null);
  }, [persistToStorage]);

  const value: SessionQuizContextValue = {
    pendingInterrupt,
    openQuiz,
    clearPending,
  };

  return <SessionQuizContext.Provider value={value}>{children}</SessionQuizContext.Provider>;
};

export default SessionQuizContext;
