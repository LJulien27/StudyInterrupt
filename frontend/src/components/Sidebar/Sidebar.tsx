import React, { useEffect, useState } from 'react';
import { useSessionBridge } from '../../contexts/SessionBridgeContext';
import { useAuth } from '../../AuthContext';

const Sidebar: React.FC = () => {
  const { players: ctxPlayers, connected: wsConnected, currentContestId } = useSessionBridge();
  const { user } = useAuth();
  const [players, setPlayers] = useState<Array<{ id?: string; username: string; score?: number }>>([]);

  const readPlayers = () => {
    try {
      const raw = localStorage.getItem('si_session_players') || localStorage.getItem('si_session_leaderboard');
      if (!raw) return setPlayers([]);
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPlayers(parsed as any);
        else setPlayers([]);
      } catch (e) {
        setPlayers([]);
      }
    } catch (e) {
      setPlayers([]);
    }
  };

  useEffect(() => {
    // sync players from websocket context
    setPlayers(Array.isArray(ctxPlayers) ? ctxPlayers : []);
  }, [ctxPlayers]);

  // sort players by score desc (undefined scores treated as -Infinity so they appear last)
  const sorted = [...(players || [])].sort((a, b) => {
    const sa = typeof a.score === 'number' ? a.score : Number.NEGATIVE_INFINITY;
    const sb = typeof b.score === 'number' ? b.score : Number.NEGATIVE_INFINITY;
    if (sb !== sa) return sb - sa;
    return (a.username || '').localeCompare(b.username || '');
  });

  // Only render the sidebar when the sessionBridge reports an active contest id
  if (!currentContestId) return null;

  return (
    <aside style={{ width: 300, borderLeft: '1px solid #e9ecef', padding: 12, boxSizing: 'border-box', background: '#fafafa', position: 'sticky', top: 72 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h5 style={{ margin: 0 }}>Leaderboard</h5>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <small style={{ color: wsConnected ? '#0a0' : '#999' }}>{wsConnected ? 'Live' : 'Idle'}</small>
        </div>
      </div>

      {wsConnected ? (
        sorted && sorted.length > 0 ? (
          <ol style={{ paddingLeft: 18, margin: 0 }}>
            {sorted.map((p, idx) => {
              const rank = idx + 1;
              const isMe = user && (user.username === p.username || user._id === p.id || user.id === p.id);
              const scoreText = typeof p.score === 'number' ? String(p.score) : '—';
              const medalColor = rank === 1 ? '#f2c94c' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : undefined;
              return (
                <li key={p.id || p.username || idx} style={{ marginBottom: 10, listStyle: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 6, background: isMe ? '#0d6efd' : '#e9ecef', color: isMe ? '#fff' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {rank}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontWeight: isMe ? 700 : 600 }}>{p.username}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{isMe ? 'you' : ''}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {medalColor && <div style={{ width: 10, height: 10, borderRadius: 2, background: medalColor }} />}
                      <div style={{ fontWeight: 700 }}>{scoreText}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div style={{ color: '#666' }}>No players yet — leaderboard will appear when players join.</div>
        )
      ) : (
        <div style={{ color: '#666' }}>Leaderboard hidden — no websocket connection.</div>
      )}
    </aside>
  );
};

export default Sidebar;
