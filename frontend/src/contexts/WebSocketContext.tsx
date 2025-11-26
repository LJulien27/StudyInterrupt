import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

type Player = { id?: string; username: string; score?: number };

type WSMessageHandler = (msg: any) => void;

interface WebSocketContextValue {
  connected: boolean;
  players: Player[];
  session: any | null;
  quizzes: any[] | null;
  interrupts: any[] | null;
  connect: (contestId: string, username: string, userId: string) => void;
  disconnect: () => void;
  send: (msg: any) => void;
  registerHandler: (h: WSMessageHandler) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<number, WSMessageHandler>>(new Map());
  const nextHandlerId = useRef(1);

  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [session, setSession] = useState<any | null>(null);
  const [quizzes, setQuizzes] = useState<any[] | null>(null);
  const [interrupts, setInterrupts] = useState<any[] | null>(null);

  const notifyHandlers = useCallback((msg: any) => {
    handlersRef.current.forEach((h) => {
      try { h(msg); } catch (e) { console.warn('ws handler failed', e); }
    });
  }, []);

  const onMessage = useCallback((ev: MessageEvent) => {
    let msg: any = null;
    try { msg = JSON.parse(ev.data); } catch (e) { console.warn('Invalid ws message', e); return; }
    // update local context state for known message types
    switch (msg.type) {
      case 'game_start':
        setSession(msg.payload.session);
        setQuizzes(msg.payload.quizzes);
        setInterrupts(msg.payload.interrupts);
        setPlayers(Array.isArray(msg.payload.players) ? msg.payload.players : []);
        break;
      case 'score_update':
        setPlayers((prev) => prev.map(p => p.username === msg.payload.username ? { ...p, score: msg.payload.score } : p));
        break;
      case 'user_joined':
        setPlayers((prev) => (prev.some(p => p.username === msg.payload.username) ? prev : [...prev, { username: msg.payload.username, id: msg.payload.id, score: msg.payload.score }]));
        break;
      case 'user_left':
        setPlayers((prev) => prev.filter(p => p.username !== msg.payload.username));
        break;
      default:
        break;
    }
    notifyHandlers(msg);
  }, [notifyHandlers]);

  const connect = useCallback((contestId: string, username: string, userId: string) => {
    try {
      if (wsRef.current) {
        // already connected or connecting
        return;
      }
      const url = `wss://studyinterruptbackend.onrender.com/ws/${contestId}/${encodeURIComponent(username)}/${encodeURIComponent(userId)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => { setConnected(true); };
      ws.onmessage = onMessage as any;
      ws.onclose = () => { setConnected(false); wsRef.current = null; };
      ws.onerror = (e) => { console.warn('WebSocket error', e); };
    } catch (e) {
      console.warn('Failed to connect websocket', e);
    }
  }, [onMessage]);

  const disconnect = useCallback(() => {
    try {
      const ws = wsRef.current;
      if (ws) {
        try { ws.close(1000); } catch (e) {}
      }
    } finally {
      wsRef.current = null;
      setConnected(false);
    }
  }, []);

  const send = useCallback((msg: any) => {
    try {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
        return true;
      }
    } catch (e) {
      console.warn('Failed to send ws message', e);
    }
    return false;
  }, []);

  const registerHandler = useCallback((h: WSMessageHandler) => {
    const id = nextHandlerId.current++;
    handlersRef.current.set(id, h);
    return () => { handlersRef.current.delete(id); };
  }, []);

  const value: WebSocketContextValue = {
    connected,
    players,
    session,
    quizzes,
    interrupts,
    connect,
    disconnect,
    send,
    registerHandler,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export default WebSocketContext;
