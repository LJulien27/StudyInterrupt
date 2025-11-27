import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

type Player = { id?: string; username: string; score?: number };

type WSMessageHandler = (msg: any) => void;

interface SessionBridgeContextValue {
  connected: boolean;
  players: Player[];
  session: any | null;
  quizzes: any[] | null;
  interrupts: any[] | null;
  currentContestId: string | null;
  connect: (contestId: string, username: string, userId: string) => void;
  disconnect: () => void;
  send: (msg: any) => void;
  registerHandler: (h: WSMessageHandler) => () => void;
}

const SessionBridgeContext = createContext<SessionBridgeContextValue | undefined>(undefined);

export const useSessionBridge = () => {
  const ctx = useContext(SessionBridgeContext);
  if (!ctx) throw new Error('useSessionBridge must be used within SessionBridgeProvider');
  return ctx;
};

export const SessionBridgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // No WebSocket: this provider uses HTTP endpoints (join/submit/events/scores)
  const handlersRef = useRef<Map<number, WSMessageHandler>>(new Map());
  const nextHandlerId = useRef(1);

  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [session, setSession] = useState<any | null>(null);
  const [quizzes, setQuizzes] = useState<any[] | null>(null);
  const [interrupts, setInterrupts] = useState<any[] | null>(null);
  const [currentContestId, setCurrentContestId] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const lastEventTsRef = useRef<string | null>(null);

  const notifyHandlers = useCallback((msg: any) => {
    handlersRef.current.forEach((h) => {
      try { h(msg); } catch (e) { console.warn('session handler failed', e); }
    });
  }, []);

  // Persist players to storage whenever they change so the leaderboard can be restored
  useEffect(() => {
    try {
      const trimmed = Array.isArray(players) ? players.map(p => ({ id: p.id, username: p.username, score: p.score })) : [];
      const hasChromeStorage = (window as any).chrome && (window as any).chrome.storage && (window as any).chrome.storage.local && typeof (window as any).chrome.storage.local.set === 'function';
      if (hasChromeStorage) {
        try {
          (window as any).chrome.storage.local.set({ si_session_players: trimmed }, () => { /* no-op */ });
        } catch (e) {
          try { localStorage.setItem('si_session_players', JSON.stringify(trimmed)); } catch (e2) { /* ignore */ }
        }
      } else {
        try { localStorage.setItem('si_session_players', JSON.stringify(trimmed)); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  }, [players]);

  // On mount, try to restore players from storage so leaderboard persists across reloads/close-open
  useEffect(() => {
    try {
      const hasChromeStorage = (window as any).chrome && (window as any).chrome.storage && (window as any).chrome.storage.local && typeof (window as any).chrome.storage.local.get === 'function';
      if (hasChromeStorage) {
        try {
          (window as any).chrome.storage.local.get(['si_session_players'], (items: any) => {
            try {
              const raw = items && items.si_session_players ? items.si_session_players : null;
              if (raw && Array.isArray(raw)) setPlayers(raw as Player[]);
              else {
                // fallback to localStorage if present
                const ls = localStorage.getItem('si_session_players') || localStorage.getItem('si_session_leaderboard');
                if (ls) {
                  try { const parsed = JSON.parse(ls); if (Array.isArray(parsed)) setPlayers(parsed as Player[]); } catch (e) { /* ignore */ }
                }
              }
            } catch (e) { /* ignore */ }
          });
        } catch (e) {
          const ls = localStorage.getItem('si_session_players') || localStorage.getItem('si_session_leaderboard');
          if (ls) {
            try { const parsed = JSON.parse(ls); if (Array.isArray(parsed)) setPlayers(parsed as Player[]); } catch (e) { /* ignore */ }
          }
        }
      } else {
        const ls = localStorage.getItem('si_session_players') || localStorage.getItem('si_session_leaderboard');
        if (ls) {
          try { const parsed = JSON.parse(ls); if (Array.isArray(parsed)) setPlayers(parsed as Player[]); } catch (e) { /* ignore */ }
        }
      }
    } catch (e) { /* ignore */ }
  }, []);

  // Messages are delivered via the HTTP /events poll; handlers are notified from the poll logic

  const connect = useCallback((contestId: string, username: string, userId: string) => {
    // New HTTP-based connect: register participant and start polling events/scores
    try {
      if (connected && currentContestId === contestId) return;
      // Persist public contest id so other tabs/extensions can see it
      try {
        const hasChromeStorage = (window as any).chrome && (window as any).chrome.storage && (window as any).chrome.storage.local && typeof (window as any).chrome.storage.local.set === 'function';
        if (hasChromeStorage) {
          try { (window as any).chrome.storage.local.set({ si_public_contest_id: contestId }, () => {}); } catch (e) { localStorage.setItem('si_public_contest_id', contestId); }
        } else {
          localStorage.setItem('si_public_contest_id', contestId);
        }
      } catch (e) { /* ignore */ }

      // call join endpoint (best-effort)
      const payload = { id: userId, username };
      axios.post(`https://studyinterruptbackend.onrender.com/contests/${contestId}/join`, payload).catch(() => { /* ignore join errors */ });

      setCurrentContestId(contestId);
      setConnected(true);

      // fetch initial scores
      axios.get(`https://studyinterruptbackend.onrender.com/contests/${contestId}/scores`).then(resp => {
        if (resp && resp.data && Array.isArray(resp.data.players)) setPlayers(resp.data.players as Player[]);
      }).catch(() => {});

      // start polling events
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      lastEventTsRef.current = new Date().toISOString();
      const poll = async () => {
        try {
          const since = lastEventTsRef.current;
          const url = since ? `https://studyinterruptbackend.onrender.com/contests/${contestId}/events?since=${encodeURIComponent(since)}` : `https://studyinterruptbackend.onrender.com/contests/${contestId}/events`;
          const resp = await axios.get(url);
          if (resp && resp.data && Array.isArray(resp.data.events)) {
            const evs = resp.data.events;
            evs.forEach((ev: any) => {
              // update lastEventTs
              if (ev.created_at) lastEventTsRef.current = ev.created_at;
              // normalize and dispatch
              switch (ev.type) {
                case 'score_update':
                  if (ev.payload && Array.isArray(ev.payload.players)) {
                    setPlayers(ev.payload.players);
                  }
                  break;
                case 'user_joined':
                  if (ev.payload && ev.payload.user) {
                    setPlayers((prev) => (prev.some(p => p.id === ev.payload.user.id) ? prev : [...prev, { id: ev.payload.user.id, username: ev.payload.user.username, score: ev.payload.user.score || 0 }]));
                  }
                  break;
                case 'user_left':
                  if (ev.payload && ev.payload.user) {
                    setPlayers((prev) => prev.filter(p => p.id !== ev.payload.user.id && p.username !== ev.payload.user.username));
                  }
                  break;
                case 'game_start':
                  try {
                    const payload = ev.payload || {};
                    setSession(payload.session || null);
                    setQuizzes(payload.quizzes || null);
                    setInterrupts(payload.interrupts || null);
                    if (Array.isArray(payload.players)) setPlayers(payload.players);
                  } catch (e) { }
                  break;
                case 'game_over':
                  // mark disconnected
                  setConnected(false);
                  break;
                default:
                  break;
              }
              notifyHandlers(ev);
            });
          }
        } catch (e) { /* ignore poll errors */ }
      };
      pollTimerRef.current = window.setInterval(poll, 2000);
      // run first poll immediately
      setTimeout(() => { poll(); }, 100);
    } catch (e) {
      console.warn('Failed to connect via HTTP flow', e);
    }
  }, [connected, currentContestId]);

  const disconnect = useCallback(() => {
    try {
      // clear polling
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      setCurrentContestId(null);
      lastEventTsRef.current = null;
      // remove persisted public contest id
      try { (window as any).chrome && (window as any).chrome.storage && (window as any).chrome.storage.local && (window as any).chrome.storage.local.remove && (window as any).chrome.storage.local.remove(['si_public_contest_id']); } catch (e) { try { localStorage.removeItem('si_public_contest_id'); } catch (e2) {} }
    } finally {
      setConnected(false);
    }
  }, []);

  const send = useCallback((msg: any) => {
    // HTTP-only submit: accept a score_update-like message and POST to submit endpoint
    try {
      if (!currentContestId) return false;
      if (msg && msg.type === 'score_update' && msg.payload) {
        const user_id = msg.payload.user_id || msg.payload.userId || (msg.payload.user && msg.payload.user.id) || null;
        const username = msg.payload.username || (msg.payload.user && msg.payload.user.username) || null;
        const delta = msg.payload.delta || msg.payload.points_earned || 0;
        if (!user_id) return false;
        // POST submit and, if the response contains an updated players list, update local state
        axios.post(`https://studyinterruptbackend.onrender.com/contests/${currentContestId}/submit`, { user_id, username, delta })
          .then((resp) => {
            try {
              if (resp && resp.data && Array.isArray(resp.data.players)) {
                setPlayers(resp.data.players as Player[]);
              }
            } catch (e) { /* ignore */ }
          })
          .catch(() => { /* ignore submit errors */ });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Failed to send via HTTP submit', e);
      return false;
    }
  }, [currentContestId]);

  const registerHandler = useCallback((h: WSMessageHandler) => {
    const id = nextHandlerId.current++;
    handlersRef.current.set(id, h);
    return () => { handlersRef.current.delete(id); };
  }, []);

  // Auto-reconnect on mount if a public contest id is persisted
  useEffect(() => {
    try {
      const hasChromeStorage = (window as any).chrome && (window as any).chrome.storage && (window as any).chrome.storage.local && typeof (window as any).chrome.storage.local.get === 'function';
      const tryConnect = async (cid: any) => {
        try {
          if (!cid) return;
          // if already connected, do nothing
          if (connected) return;
          // attempt to fetch current scoreboard via HTTP endpoint so the UI can show leaderboard
          try {
            const resp = await axios.get(`https://studyinterruptbackend.onrender.com/contests/${String(cid)}/scores`);
            if (resp && resp.data && Array.isArray(resp.data.players)) {
              setPlayers(resp.data.players as Player[]);
            }
          } catch (e) {
            // ignore fetch errors
          }
          // read user from localStorage (set during auth flows)
          let user = null;
          try {
            const raw = localStorage.getItem('user');
            if (raw) user = JSON.parse(raw);
          } catch (e) { user = null; }
          const username = (user && (user.name || user.username)) || null;
          const userId = (user && (user._id || user.id)) || null;
          if (username && userId) {
            // call connect from context
            try { connect(String(cid), String(username), String(userId)); } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }
      };

      if (hasChromeStorage) {
        try {
          (window as any).chrome.storage.local.get(['si_public_contest_id'], (items: any) => {
            try {
              const cid = items && items.si_public_contest_id ? items.si_public_contest_id : null;
              if (cid) tryConnect(cid);
              else {
                const ls = localStorage.getItem('si_public_contest_id');
                if (ls) tryConnect(ls);
              }
            } catch (e) { /* ignore */ }
          });
        } catch (e) {
          const ls = localStorage.getItem('si_public_contest_id');
          if (ls) tryConnect(ls);
        }
      } else {
        const ls = localStorage.getItem('si_public_contest_id');
        if (ls) tryConnect(ls);
      }
    } catch (e) { /* ignore */ }
  }, [connect, connected]);

  // Listen for storage changes to clear or update persisted contest id
  useEffect(() => {
    try {
      if ((window as any).chrome && (window as any).chrome.storage && (window as any).chrome.storage.onChanged) {
        const listener = (changes: any, area: string) => {
          if (area !== 'local') return;
          try {
            if (changes.si_session_active && changes.si_session_active.newValue === false) {
              try { (window as any).chrome.storage.local.remove && (window as any).chrome.storage.local.remove(['si_public_contest_id']); } catch (e) {}
              try { localStorage.removeItem('si_public_contest_id'); } catch (e) {}
            }
            if (changes.si_public_contest_id) {
              const newCid = changes.si_public_contest_id.newValue;
              // if new contest id appears and we're not connected, attempt to connect
              if (newCid && !connected) {
                // attempt to read user from localStorage
                let user = null;
                try { const raw = localStorage.getItem('user'); if (raw) user = JSON.parse(raw); } catch (e) { user = null; }
                const username = (user && (user.name || user.username)) || null;
                const userId = (user && (user._id || user.id)) || null;
                if (username && userId) {
                  try { connect(String(newCid), String(username), String(userId)); } catch (e) { /* ignore */ }
                }
              }
            }
          } catch (e) { /* ignore */ }
        };
        (window as any).chrome.storage.onChanged.addListener(listener);
        return () => { try { (window as any).chrome.storage.onChanged.removeListener(listener); } catch (e) {} };
      } else {
        // Fallback: listen to window 'storage' events (localStorage) for non-extension runs
        const onLs = (ev: StorageEvent) => {
          try {
            if (ev.key === 'si_session_active' && ev.newValue === 'false') {
              try { localStorage.removeItem('si_public_contest_id'); } catch (e) {}
            }
            if (ev.key === 'si_public_contest_id' && ev.newValue) {
              // attempt reconnect from localStorage change
              try {
                const raw = localStorage.getItem('user');
                let user = null;
                if (raw) user = JSON.parse(raw);
                const username = (user && (user.name || user.username)) || null;
                const userId = (user && (user._id || user.id)) || null;
                if (username && userId && !connected) {
                  connect(String(ev.newValue), String(username), String(userId));
                }
              } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }
        };
        window.addEventListener('storage', onLs);
        return () => { window.removeEventListener('storage', onLs); };
      }
    } catch (e) { /* ignore */ }
  }, [connect, connected]);

  const value: SessionBridgeContextValue = {
    connected,
    players,
    session,
    quizzes,
    interrupts,
    currentContestId,
    connect,
    disconnect,
    send,
    registerHandler,
  };

  return <SessionBridgeContext.Provider value={value}>{children}</SessionBridgeContext.Provider>;
};

export default SessionBridgeContext;
