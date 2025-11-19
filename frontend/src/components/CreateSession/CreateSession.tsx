// Importing necessary libraries and components

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Button, Form, FloatingLabel, Card, Container, InputGroup } from 'react-bootstrap';
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
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://example.com";
  return `${origin}/join-session/${contest_id}`;
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

    const sessionObject = {
      name: sessionName,
      start_time: startTime,
      end_time: endTime,
      duration: 30,
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

    try {
      await axios.post('https://studyinterruptbackend.onrender.com/sessions', sessionObject);
      alert('Session created successfully!');

    } catch (error: any) {
      showError(`Error: ${error?.message || 'An unknown error occurred.'}`);
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
      setPublicLink((prev) => prev ?? generateShareLink(contestId));
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
            <Form.Text className="text-muted">
              Hold Ctrl/Cmd to select multiple quizzes.
            </Form.Text>

            {selectedQuizIds.length > 0 && (
              <div className="mt-2 d-flex flex-wrap gap-2">
                {selectedQuizIds.map((id) => (
                  <span key={id} className="badge rounded-pill text-bg-secondary">
                    {quizById[id]?.title ?? id}
                    <Button
                      size="sm"
                      variant="link"
                      className="ms-1 p-0 text-white"
                      onClick={() =>
                        setSelectedQuizIds((prev) => prev.filter((x) => x !== id))
                      }
                    >
                      ×
                    </Button>
                  </span>
                ))}
              </div>
            )}
          </Form.Group>

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
            disabled={loadingQuizzes}
          >
            Create Session
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
