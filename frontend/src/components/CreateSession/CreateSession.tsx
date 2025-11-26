// Importing necessary libraries and components

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Form, FloatingLabel, Card, Container, InputGroup, Spinner } from 'react-bootstrap';
import axios from 'axios';
import OopsModal from '../Default/OopsModal';
import { useAuth } from '../../AuthContext';



// Lightweight quiz type
type QuizLite = { _id: string; title: string; created_at?: string | null };

// Interruption queue item can be a quiz or a link
type InterruptItem =
  | { id: string; type: 'quiz'; quizId: string; title: string }
  | { id: string; type: 'link'; url: string; title?: string };

interface Message {
  type: string;
  username?: string;
  from?: string;
  data?: any;
}

const generateShareLink = (contest_id: string) => {
  return contest_id;
};

const CreateSession: React.FC = () => {
  const { user } = useAuth();
  const [sessionName, setSessionName] = useState('');
  // Separate date and time fields for start/end so user can edit time without opening a calendar
  const [startDate, setStartDate] = useState(''); // yyyy-MM-dd
  const [startTime, setStartTime] = useState(''); // HH:mm
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participants, setParticipants] = useState('');

  const [intervalChoice, setIntervalChoice] = useState<'15' | '30' | '45' | '60' | 'custom'>('30');
  const [customInterval, setCustomInterval] = useState<number | ''>('');

  const [isPublic, setIsPublic] = useState(false);
  const [publicLink, setPublicLink] = useState<string | null>(null);

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [username, setUsername] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [contestId, setContestId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const { connect, disconnect, registerHandler } = useWebSocket();
  const wsHandlerUnsub = useRef<(() => void) | null>(null);

  const [session, setSession] = useState("");
  const [quizzes, setQuizzes] = useState("");
  const [interrupts, setInterrupts] = useState("");


  const [players, setPlayers] = useState<{ username: string; id: string; score: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  // Quiz selection / interruption queue states
  const [availableQuizzes, setAvailableQuizzes] = useState<QuizLite[]>([]);
  const [interruptQueue, setInterruptQueue] = useState<InterruptItem[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setIsErrorModalOpen(true);
  };

  // Autofill session name to "<FirstName>'s session" when a user is available
  useEffect(() => {
    try {
      if (user && !sessionName) {
        const full = (user && (user.username || user.name || user.displayName || '')) as string;
        const first = full ? full.split(' ')[0] : '';
        if (first) setSessionName(`${first}'s session`);
      }
    } catch (e) {
      // ignore
    }
  }, [user]);

  const quizById = useMemo(
    () => Object.fromEntries(availableQuizzes.map((q) => [q._id, q])),
    [availableQuizzes]
  );

  // 🆕 Load quizzes (real or fake)
  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setLoadingQuizzes(true);

        //----- OPTION A: Real backend -----
        if (!user || (!user._id && !user.id)) return;
        const userId = (user as any)._id || user.id;
        const { data } = await axios.get<{ quizzes?: QuizLite[] }>(
          `https://studyinterruptbackend.onrender.com/users/${userId}/quizzes`
        );
        setAvailableQuizzes(Array.isArray(data?.quizzes) ? data.quizzes : []);

        // // ----- OPTION B: Fake quizzes for testing -----
        // // Comment this out once backend is live
        // setAvailableQuizzes([
        //   { _id: 'q1', title: 'Sample Quiz 1: Math Basics' },
        //   { _id: 'q2', title: 'Sample Quiz 2: Science Trivia' },
        //   { _id: 'q3', title: 'Sample Quiz 3: History of Canada' },
        //   { _id: 'q4', title: 'Sample Quiz 4: Programming 101' },
        // ]);
      } catch {
        // fallback fake quizzes
        setAvailableQuizzes([
          { _id: 'f1', title: 'Fallback Quiz A' },
          { _id: 'f2', title: 'Fallback Quiz B' },
        ]);
      } finally {
        setLoadingQuizzes(false);
      }
    };
    loadQuizzes();
  }, [user]);

  const effectiveIntervalMinutes =
    intervalChoice === 'custom' ? Number(customInterval) : Number(intervalChoice);

  // Helper: convert ISO or Date to the string format accepted by <input type="datetime-local" />
  const toDateTimeLocal = (input: string | Date) => {
    const d = typeof input === 'string' ? new Date(input) : input;
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
  };

  // Helper: format yyyy-MM-dd for <input type="date">
  const formatDate = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  // Helper: format HH:mm for <input type="time">
  const formatTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // If the route includes quick=create params (e.g. #/create-session?quick=1&start=...)
  // prefill the form fields so the user can immediately pick quizzes and submit.
  useEffect(() => {
    try {
      // location.search may be empty when using hash routing; support params in location.hash too
      let search = location.search || '';
      if (!search && location.hash) {
        const idx = location.hash.indexOf('?');
        if (idx >= 0) search = location.hash.slice(idx);
      }
      if (!search) return;
      const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
      if (params.get('quick') !== '1') return;

      // Prefill fields only if they are empty to avoid overwriting user's edits
      if (!sessionName) setSessionName('Quick Session');

      const startParam = params.get('start');
      const endParam = params.get('end');
      const intervalParam = params.get('interval');
      const isPublicParam = params.get('is_public');

      if (startParam && !startDate && !startTime) {
        try {
          const d = new Date(startParam);
          const dateStr = formatDate(d);
          const timeStr = formatTime(d);
          if (dateStr) setStartDate(dateStr);
          if (timeStr) setStartTime(timeStr);
        } catch (e) {}
      }
      if (endParam && !endDate && !endTime) {
        try {
          const d = new Date(endParam);
          const dateStr = formatDate(d);
          const timeStr = formatTime(d);
          if (dateStr) setEndDate(dateStr);
          if (timeStr) setEndTime(timeStr);
        } catch (e) {}
      }

      if (intervalParam) {
        if (['15', '30', '45', '60'].includes(intervalParam)) {
          setIntervalChoice(intervalParam as '15'|'30'|'45'|'60');
          setCustomInterval('' as any);
        } else {
          setIntervalChoice('custom');
          const num = Number(intervalParam);
          if (!Number.isNaN(num) && num > 0) setCustomInterval(num as any);
        }
      }

      if (isPublicParam) {
        setIsPublic(isPublicParam === 'true');
      }
    } catch (e) {
      // ignore parse errors
      console.warn('Failed to parse quick-create params', e);
    }
    // run once on mount or when location changes
  }, [location]);

  // Autofill start/end to now and +1h if not already set
  useEffect(() => {
    try {
      const now = new Date();
      const later = new Date(now.getTime() + 60 * 60000);
      if (!startDate) setStartDate(formatDate(now));
      if (!startTime) setStartTime(formatTime(now));
      if (!endDate) setEndDate(formatDate(later));
      if (!endTime) setEndTime(formatTime(later));
    } catch (e) {
      // ignore
    }
  }, []);

  const handleCreateSession = async () => {
    if (!sessionName || !startDate || !startTime || !endDate || !endTime) {
      showError('Please fill in all required fields.');
      return;
    }

    if (interruptQueue.length === 0) {
      showError('Please add at least one interruption to the queue (quiz, link, or video).');
      return;
    }

    if (
      !effectiveIntervalMinutes ||
      Number.isNaN(effectiveIntervalMinutes) ||
      effectiveIntervalMinutes <= 0
    ) {
      showError('Please select a valid interrupt interval (minutes).');
      return;
    }

    // combine date + time into local datetime strings
    const startLocal = `${startDate}T${startTime}`;
    const endLocal = `${endDate}T${endTime}`;
    const start = new Date(startLocal).getTime();
    const end = new Date(endLocal).getTime();
    if (isNaN(start) || isNaN(end) || start >= end) {
      showError('Start time must be before end time.');
      return;
    }

    const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

    // derive quiz ids from queue (for backwards compatibility with backend)
    const quizIdsFromQueue = interruptQueue
      .filter((it) => it.type === 'quiz')
      .map((it) => (it as any).quizId);

    // Create Interrupt objects on the backend first, collect their IDs,
    // then include those IDs in the session payload (the backend expects interrupt_ids to be strings)
    setCreating(true);
    try {
      const userId = (user as any)._id || user.id;

  // compute base time for interrupts (first interrupt at startTime)
  const startMs = new Date(startLocal).getTime();

  const createdInterruptIds: string[] = [];
  // Keep trimmed interrupt payloads to send to the extension background for private sessions
  const createdInterruptsTrimmed: any[] = [];

      for (let i = 0; i < interruptQueue.length; i++) {
        const it = interruptQueue[i];
        // schedule each interrupt spaced by the selected interval
        const interruptTime = new Date(startMs + i * effectiveIntervalMinutes * 60000).toISOString();

        const interruptPayload: any = {
          // type: integer identifier (frontend -> backend uses numeric types)
          // 1 = quiz, 2 = link, 3 = video (legacy mapping)
          type: it.type === 'quiz' ? 1 : it.type === 'link' ? 2 : 3,
          link: it.type === 'quiz' ? '' : (it as any).url || '',
          interrupt_time: interruptTime,
          creator_id: userId,
          session_id: null,
          quiz_id: it.type === 'quiz' ? (it as any).quizId : null,
        };

        try {
          const resp = await axios.post('https://studyinterruptbackend.onrender.com/interrupts', interruptPayload);
          const created = resp.data;
          // backend returns newly created object with _id
          if (created && (created._id || created.id)) {
            createdInterruptIds.push(created._id || created.id);
          } else if (created && created.inserted_id) {
            createdInterruptIds.push(created.inserted_id);
          } else {
            // fallback: if backend returned the full object without id, attempt to read ._id
            createdInterruptIds.push((created && created._id) || '');
          }
          // prepare a trimmed copy for the extension background (client-side cache)
          try {
            const trimmed = {
              _id: created && (created._id || created.id) ? (created._id || created.id) : null,
              type: interruptPayload.type,
              link: created && (created.link || interruptPayload.link) ? (created.link || interruptPayload.link) : null,
              quiz_id: created && (created.quiz_id || interruptPayload.quiz_id) ? (created.quiz_id || interruptPayload.quiz_id) : null,
              interrupt_time: created && (created.interrupt_time || interruptPayload.interrupt_time) ? (created.interrupt_time || interruptPayload.interrupt_time) : null,
              title: (it as any).title || null
            };
            createdInterruptsTrimmed.push(trimmed);
          } catch (e) {
            // ignore trimming errors
          }
        } catch (err: any) {
          console.error('Failed to create interrupt', err);
          showError(`Failed to create interrupt: ${err?.message || String(err)}`);
          setCreating(false);
          return;
        }
      }

      const sessionObject = {
        name: sessionName,
        start_time: startLocal,
        end_time: endLocal,
        duration: durationMinutes,
        interrupt_interval_minutes: effectiveIntervalMinutes,
        participants: participants
          ? participants.split(',').map((p) => p.trim()).filter(Boolean)
          : [],
        creator_id: userId,
        contest_id: contestId ? contestId : null,
        is_public: isPublic,
        quizz_ids: quizIdsFromQueue,
        // include the array of created interrupt IDs (strings)
        interrupt_ids: createdInterruptIds,
        public_link: isPublic ? publicLink : null,
        created_at: new Date().toISOString(),
      };
      console.log('Session payload:', sessionObject);

      const { data } = await axios.post('https://studyinterruptbackend.onrender.com/sessions', sessionObject);

      // If this session is not public, notify the extension background immediately so the creator
      // gets scheduled interrupts right away (background will dedupe if it's already scheduled).
      if (!sessionObject.is_public) {
          try {
            const runtime = (window as any).chrome && (window as any).chrome.runtime;
            const newSessionId = data && (data._id || data.id || data.session_id || null);
            if (runtime && typeof runtime.sendMessage === 'function') {
              try {
                // include trimmed interrupt payloads for private sessions so the extension can cache them
                const msg: any = {
                  type: 'SESSION_STARTED',
                  sessionId: newSessionId,
                  interrupt_interval_minutes: sessionObject.interrupt_interval_minutes,
                  end_time: sessionObject.end_time || null,
                  duration: sessionObject.duration || null,
                  start_time: sessionObject.start_time || null
                };
                // if we collected trimmed interrupts, attach them so background doesn't need to call the API
                if (createdInterruptsTrimmed && createdInterruptsTrimmed.length > 0) {
                  msg.session_interrupts = createdInterruptsTrimmed;
                }
                runtime.sendMessage(msg, (resp: any) => {
                  console.log('SESSION_STARTED message sent to extension background', resp);
                });
              } catch (err) {
                console.warn('Failed to send SESSION_STARTED to background', err);
              }
            }
          } catch (e) {
            console.warn('Could not reach chrome.runtime to send SESSION_STARTED', e);
          }
      }

      // Keep spinner visible briefly, then navigate to landing page
      setTimeout(() => navigate('/'), 1000);
      // Note: don't clear `creating` here so spinner remains until navigation/unmount
    } catch (error: any) {
      showError(`Error: ${error?.message || 'An unknown error occurred.'}`);
      setCreating(false);
    }
  };

  // Connect to an existing contest via WebSocket
  const handleMakePublic = async() => {
    if (!user || (!user._id && !user.id)) {
      showError('You must be logged in to make a session public.');
      return;
    }
    const userId = (user as any)._id || user.id;
    console.log(userId);
    if (!isPublic) {
      const userNameObject = {
      id: userId,
      username: user.username,


    };

    const contestObject = {
      participants: [userNameObject]
    };

    console.log(contestObject)
      
    let contest = await axios.post('https://studyinterruptbackend.onrender.com/contests', contestObject);
    setContestId(contest.data._id)
    console.log(contestId)
    // connect via WebSocket context
    connect(contest.data._id, user.username, user._id);
    // register a local handler to forward messages into component state
    wsHandlerUnsub.current = registerHandler((msg: any) => {
      switch (msg.type) {
        case 'game_start':
          setSession(msg.payload.session);
          setQuizzes(msg.payload.quizzes);
          setInterrupts(msg.payload.interrupts);
          setPlayers(msg.payload.players || []);
          break;
        case 'score_update':
          setPlayers((prevPlayers) => prevPlayers.map((p) => (p.username === msg.payload.username ? { ...p, score: msg.payload.score } : p)));
          break;
        case 'game_over':
          setGameOver(true);
          break;
        case 'user_joined':
          setPlayers((prevPlayers) => (prevPlayers.some((p) => p.username === msg.payload.username) ? prevPlayers : [...prevPlayers, { username: msg.payload.username, id: msg.payload.id, score: msg.payload.score }]));
          break;
        default:
          break;
      }
    });

    setIsPublic(true);
    setPublicLink(generateShareLink(contest.data._id));
    } else {
      setIsPublic(false);
      setPublicLink(null);
      // unregister local handler and disconnect
      try { if (wsHandlerUnsub.current) { wsHandlerUnsub.current(); wsHandlerUnsub.current = null; } } catch (e) {}
      disconnect();
    }
  };

  const handleCopyLink = async () => {
    if (!publicLink) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      alert('Link copied to clipboard!');
    } catch {
      showError('Could not copy link. Please copy it manually.');
    }
  };

  // Queue management helpers
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  const makeLocalId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

  const addQuizToQueue = (quiz: QuizLite) => {
    setInterruptQueue((prev) => [
      ...prev,
      { id: makeLocalId(), type: 'quiz', quizId: quiz._id, title: quiz.title } as InterruptItem,
    ]);
  };

  const addLinkToQueue = () => {
    if (!newLinkUrl.trim()) {
      showError('Please enter a URL to add.');
      return;
    }
    setInterruptQueue((prev) => [
      ...prev,
      { id: makeLocalId(), type: 'link', url: newLinkUrl.trim(), title: newLinkTitle.trim() || undefined } as InterruptItem,
    ]);
    setNewLinkUrl('');
    setNewLinkTitle('');
  };

  // No YouTube-specific parsing here; links are treated uniformly.

  const removeFromQueue = (id: string) => {
    setInterruptQueue((prev) => prev.filter((it) => it.id !== id));
  };

  const moveQueueItem = (id: string, direction: 'up' | 'down') => {
    setInterruptQueue((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const newArr = prev.slice();
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= newArr.length) return prev;
      const tmp = newArr[swapIdx];
      newArr[swapIdx] = newArr[idx];
      newArr[idx] = tmp;
      return newArr;
    });
  };

  // Drag and drop handlers
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', id);
    } catch (err) {
      // some browsers may throw; ignore
    }
    setDraggingId(id);
  };

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = (() => {
      try { return e.dataTransfer.getData('text/plain'); } catch { return null; }
    })();
    if (!sourceId) {
      setDraggingId(null);
      return;
    }
    if (sourceId === targetId) {
      setDraggingId(null);
      return;
    }
    setInterruptQueue((prev) => {
      const idx = prev.findIndex((p) => p.id === sourceId);
      const targetIdx = prev.findIndex((p) => p.id === targetId);
      if (idx === -1 || targetIdx === -1) return prev;
      const newArr = prev.slice();
      const [item] = newArr.splice(idx, 1);
      newArr.splice(targetIdx, 0, item);
      return newArr;
    });
    setDraggingId(null);
  };

  const onDragEnd = () => setDraggingId(null);

  return (
    <Container className="mt-4">
      <h2>Create a New Interruption Session</h2>

      <Card className="p-4 mb-4">
        <Form>
          <FloatingLabel controlId="sessionName" label="Session Name" className="mb-3">
            <Form.Control
              type="text"
              placeholder="Enter session name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              required
            />
          </FloatingLabel>

          {/* Interruption Queue: choose quizzes or add links/videos */}
          <Form.Group className="mb-3">
            <Form.Label>Interruption Queue</Form.Label>
            <div className="d-flex gap-3" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <strong>Available Quizzes</strong>
                  <small className="text-muted">Click + to add</small>
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: 6, padding: 8 }}>
                  {loadingQuizzes ? (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : availableQuizzes.length === 0 ? (
                    <div className="text-muted">No quizzes available</div>
                  ) : (
                    availableQuizzes.map((q) => (
                      <div key={q._id} className="d-flex justify-content-between align-items-center mb-2">
                        <div style={{ flex: 1 }}>{q.title}</div>
                        <Button size="sm" variant="outline-primary" onClick={() => addQuizToQueue(q)}>+</Button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3">
                  <strong>Add link / video</strong>
                  <Form.Control
                    size="sm"
                    className="mt-2 mb-2"
                    placeholder="URL (e.g. https://...)"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                  />
                  <Form.Control
                    size="sm"
                    className="mb-2"
                    placeholder="Optional title"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                  />
                  <div className="d-flex gap-2">
                    <Button size="sm" onClick={() => addLinkToQueue()} variant="outline-secondary">Add Link</Button>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <strong>Queue</strong>
                  <small className="text-muted">Reorder or remove</small>
                </div>
                <div
                  style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: 6, padding: 8 }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const sourceId = (() => {
                      try { return e.dataTransfer.getData('text/plain'); } catch { return null; }
                    })();
                    if (!sourceId) return;
                    setInterruptQueue((prev) => {
                      const idx = prev.findIndex((p) => p.id === sourceId);
                      if (idx === -1) return prev;
                      const newArr = prev.slice();
                      const [item] = newArr.splice(idx, 1);
                      newArr.push(item);
                      return newArr;
                    });
                    setDraggingId(null);
                  }}
                >
                  {interruptQueue.length === 0 ? (
                    <div className="text-muted">No interruptions added yet</div>
                  ) : (
                    interruptQueue.map((it, idx) => (
                      <div
                        key={it.id}
                        className="d-flex align-items-center justify-content-between mb-2"
                        draggable
                        onDragStart={(e) => onDragStart(e, it.id)}
                        onDragOver={(e) => onDragOver(e, it.id)}
                        onDrop={(e) => onDrop(e, it.id)}
                        onDragEnd={onDragEnd}
                        style={{
                          background: draggingId === it.id ? '#eef3ff' : 'transparent',
                          borderRadius: 4,
                          padding: 6,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div><strong>{it.type.toUpperCase()}</strong> {it.type === 'quiz' ? `— ${ (it as any).title }` : ''}</div>
                          {it.type !== 'quiz' && (
                            <div className="text-muted" style={{ fontSize: 12 }}>{(it as any).title || (it as any).url}</div>
                          )}
                        </div>
                        <div className="d-flex flex-column align-items-end gap-1">
                          <div className="d-flex gap-1">
                            <Button size="sm" disabled={idx === 0} onClick={() => moveQueueItem(it.id, 'up')}>↑</Button>
                            <Button size="sm" disabled={idx === interruptQueue.length - 1} onClick={() => moveQueueItem(it.id, 'down')}>↓</Button>
                          </div>
                          <Button size="sm" variant="outline-danger" onClick={() => removeFromQueue(it.id)}>Remove</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <Form.Group className="mb-3 mt-3">
              <div className="d-flex gap-3 align-items-end">
                <div style={{ flex: 1 }}>
                  <Form.Label>Start</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                    <Form.Control type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <Form.Label>End</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                    <Form.Control type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                  </div>
                </div>
              </div>
            </Form.Group>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Interrupt Interval</Form.Label>
            <InputGroup>
              <Form.Select
                aria-label="Interrupt interval presets"
                value={intervalChoice}
                onChange={(e) =>
                  setIntervalChoice(e.target.value as '15' | '30' | '45' | '60' | 'custom')
                }
                style={{ maxWidth: 220 }}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="custom">Custom…</option>
              </Form.Select>

              {intervalChoice === 'custom' && (
                <Form.Control
                  type="number"
                  min={1}
                  placeholder="Custom minutes"
                  value={customInterval}
                  onChange={(e) =>
                    setCustomInterval(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  required
                />
              )}
            </InputGroup>
          </Form.Group>

          <FloatingLabel
            controlId="participants"
            label="Participants (comma separated usernames)"
            className="mb-3"
          >
            <Form.Control
              type="text"
              placeholder="e.g. alice, bob, charlie"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />
          </FloatingLabel>

          <div className="d-flex flex-column gap-3 mb-3">
            <div className="d-flex align-items-center gap-2">
              <Button
                variant={isPublic ? 'outline-danger' : 'outline-secondary'}
                onClick={handleMakePublic}
              >
                {isPublic ? 'Disable Public Link' : 'Make Public'}
              </Button>

              {isPublic && publicLink && (
                <InputGroup className="flex-grow-1" style={{ maxWidth: 520 }}>
                  <Form.Control value={publicLink} readOnly />
                  <Button variant="outline-primary" onClick={handleCopyLink}>
                    Copy
                  </Button>
                </InputGroup>
              )}
            </div>
            <small className="text-muted">
              Public mode creates a shareable link that others can use to join.
            </small>
          </div>

          <Button
            variant="primary"
            onClick={handleCreateSession}
            disabled={loadingQuizzes || creating}
          >
            {creating ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Creating…
              </>
            ) : (
              'Create Session'
            )}
          </Button>
        </Form>
      </Card>

      <OopsModal
        show={isErrorModalOpen}
        onHide={() => setIsErrorModalOpen(false)}
        errorMessage={errorMessage}
      />
    </Container>
  );
};

export default CreateSession;
