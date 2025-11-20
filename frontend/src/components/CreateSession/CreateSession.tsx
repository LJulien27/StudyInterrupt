// Importing necessary libraries and components

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Form, FloatingLabel, Card, Container, InputGroup, Spinner } from 'react-bootstrap';
import axios from 'axios';
import OopsModal from '../Default/OopsModal';
import { useAuth } from '../../AuthContext';



// Lightweight quiz type
type QuizLite = { _id: string; title: string; created_at?: string | null };

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
  const [startTime, setStartTime] = useState('');
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

  const [session, setSession] = useState("");
  const [quizzes, setQuizzes] = useState("");
  const [interrupts, setInterrupts] = useState("");

  const [scores, setScores] = useState<{ username: string; score: number }[]>([]);
  const [players, setPlayers] = useState<{ id: string; username: string }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [finalScores, setFinalScores] = useState<{ username: string; score: number }[]>([]);
  // Quiz selection states
  const [availableQuizzes, setAvailableQuizzes] = useState<QuizLite[]>([]);
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setIsErrorModalOpen(true);
  };

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

      if (startParam && !startTime) {
        const val = toDateTimeLocal(startParam);
        if (val) setStartTime(val);
      }
      if (endParam && !endTime) {
        const val = toDateTimeLocal(endParam);
        if (val) setEndTime(val);
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

  const handleCreateSession = async () => {
    if (!sessionName || !startTime || !endTime) {
      showError('Please fill in all required fields.');
      return;
    }

    if (selectedQuizIds.length === 0) {
      showError('Please select at least one quiz to include in this session.');
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

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (isNaN(start) || isNaN(end) || start >= end) {
      showError('Start time must be before end time.');
      return;
    }

    const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

    const sessionObject = {
      name: sessionName,
      start_time: startTime,
      end_time: endTime,
      duration: durationMinutes,
      interrupt_interval_minutes: effectiveIntervalMinutes,
      participants: participants
        ? participants.split(',').map((p) => p.trim()).filter(Boolean)
        : [],
      creator_id: (user as any)._id || user.id,
      contest_id: contestId ? contestId : null,
      is_public: isPublic,
      quizz_ids: selectedQuizIds,
      interrupt_ids: [],
      public_link: isPublic ? publicLink : null,
      created_at: new Date().toISOString(),
    };
    console.log(sessionObject)

    setCreating(true);
    try {
      const { data } = await axios.post('https://studyinterruptbackend.onrender.com/sessions', sessionObject);

      // If this session is not public, notify the extension background immediately so the creator
      // gets scheduled interrupts right away (background will dedupe if it's already scheduled).
      if (!sessionObject.is_public) {
          try {
            const runtime = (window as any).chrome && (window as any).chrome.runtime;
            const newSessionId = data && (data._id || data.id || data.session_id || null);
            if (runtime && typeof runtime.sendMessage === 'function') {
              try {
                runtime.sendMessage({
                  type: 'SESSION_STARTED',
                  sessionId: newSessionId,
                  interrupt_interval_minutes: sessionObject.interrupt_interval_minutes,
                  // include end_time so background can store session end for countdowns
                  end_time: sessionObject.end_time || null,
                  // include duration (minutes) as a fallback if end_time is not present
                  duration: sessionObject.duration || null,
                  // include start_time when available
                  start_time: sessionObject.start_time || null
                }, (resp: any) => {
                  // optional: log response
                  console.log('SESSION_STARTED message sent to extension background', resp);
                });
              } catch (err) {
                // sendMessage can throw in some contexts; swallow non-fatal errors
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
    const ws = new WebSocket(`wss://studyinterruptbackend.onrender.com/ws/${contest.data._id}/${user.username}/${user._id}`);
    wsRef.current = ws;

    ws.onopen = () => console.log("Connected!");
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      showError(`WebSocket connection failed: ${error}`);
    };
    ws.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      if (event.code !== 1000) { // 1000 is normal closure
        showError(`WebSocket closed unexpectedly: ${event.code} ${event.reason}`);
      }
    };
    ws.onmessage = (e: MessageEvent) => {
      const msg = JSON.parse(e.data);
      console.log("received message")
      console.log(msg)
       switch (msg.type) {
        case "game_start":
          console.log("Game started!");
          // msg.payload contains session, quizzes, interrupts
          setSession(msg.payload.session);
          setQuizzes(msg.payload.quizzes);
          setInterrupts(msg.payload.interrupts);
          setPlayers(msg.payload.players)
          console.log(msg)
          break;

        case "score_update":
          console.log("Score update received!");
          setPlayers(msg.payload.players); // { username: score, ... }
          break;

        case "player_disconnected":
          console.log(`${msg.payload.username} disconnected`);
          setPlayers((prev) =>
            prev.filter((p) => p.username !== msg.payload.username)
          );
          break;

        case "game_over":
          console.log("Game over!");
          setGameOver(true);
          setFinalScores(scores);
          break;
        
        case "user_joined":
          console.log("user joined");
          setPlayers(msg.payload.players);
          break;

        default:
          console.warn("Unknown message type:", msg.type);
      }
    };
    ws.onclose = () => console.log("Disconnected");


      setIsPublic(true);
      setPublicLink(generateShareLink(contest.data._id));
    } else {
      setIsPublic(false);
      setPublicLink(null);
      if (wsRef.current) {
        wsRef.current.close();   // 👈 closes the WebSocket connection
        wsRef.current = null;    // optional, clears the ref
      }
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

          {/* Quizzes Multi-Select */}
          <Form.Group className="mb-3">
            <Form.Label>Your Quizzes (select one or more)</Form.Label>
            <Form.Select
              multiple
              aria-label="Select one or more quizzes"
              disabled={loadingQuizzes || !availableQuizzes.length}
              value={selectedQuizIds}
              onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                setSelectedQuizIds(opts);
              }}
              style={{ minHeight: 140 }}
            >
              {availableQuizzes.map((q) => (
                <option key={q._id} value={q._id}>
                  {q.title}
                </option>
              ))}
          </Form.Select>

          <FloatingLabel controlId="startTime" label="Start Time" className="mb-3">
            <Form.Control
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </FloatingLabel>

          <FloatingLabel controlId="endTime" label="End Time" className="mb-3">
            <Form.Control
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </FloatingLabel>

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
