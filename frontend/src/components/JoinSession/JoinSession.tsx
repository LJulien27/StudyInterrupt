// Importing necessary libraries and components
import React, { useState, useRef, useEffect  } from 'react';
import { Button, Form, FloatingLabel, Card, Container, InputGroup } from 'react-bootstrap';
import OopsModal from '../Default/OopsModal';
import { useAuth } from '../../AuthContext';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useSessionBridge } from '../../contexts/SessionBridgeContext';

interface Message {
  type: string;
  username?: string;
  from?: string;
  data?: any;
}


const JoinSession: React.FC = () => {
  const { user } = useAuth();

  const [session, setSession] = useState("");
  const [quizzes, setQuizzes] = useState("");
  const [interrupts, setInterrupts] = useState("");

  const [validContestID, setValidContestID] = useState(false);

  const [players, setPlayers] = useState<{ username: string; id: string; score: number}[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [inSession, setInSession] = useState(false);


  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [sessionId, setSessionId] = useState("");
  const [contestId, setContestId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { connect, disconnect, registerHandler } = useSessionBridge();
  const wsHandlerUnsub = useRef<(() => void) | null>(null);

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setIsErrorModalOpen(true);
  };

  // Ensure any registered handler is unregistered when the component unmounts
  useEffect(() => {
    return () => {
      try {
        if (wsHandlerUnsub.current) {
          wsHandlerUnsub.current();
          wsHandlerUnsub.current = null;
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // Listen for messages from the extension (e.g. SESSION_STOPPED from popup)
  useEffect(() => {
    const runtime = (window as any).chrome && (window as any).chrome.runtime;
    const listener = (msg: any) => {
      if (!msg || !msg.type) return;
      if (msg.type === 'SESSION_STOPPED') {
        try {
          if (wsHandlerUnsub.current) {
            wsHandlerUnsub.current();
            wsHandlerUnsub.current = null;
          }
          if (typeof disconnect === 'function') disconnect();
        } catch (e) {
          console.warn('Error during disconnect on SESSION_STOPPED', e);
        }
        setPlayers([]);
        setSession('');
        setQuizzes('');
        setInterrupts('');
        setValidContestID(false);
        setInSession(false);
      }
    };

    if (runtime && runtime.onMessage && typeof runtime.onMessage.addListener === 'function') {
      runtime.onMessage.addListener(listener);
    }

    return () => {
      if (runtime && runtime.onMessage && typeof runtime.onMessage.removeListener === 'function') {
        try { runtime.onMessage.removeListener(listener); } catch (e) {}
      }
    };
  }, [disconnect]);

const handleJoinSession = async () => {
  if (!user || (!user._id && !user.id)) {
    showError("You must be logged in to join a session.");
    return;
  }

  if (!contestId.trim()) {
    showError("Please enter a contest code.");
    return;
  }

  const userId = (user as any)._id || user.id;

  console.log("Attempting to join contest:", contestId);

  try {
    // Validate contest exists before connecting
    await axios.get(`https://studyinterruptbackend.onrender.com/contests/${contestId}`);

    // Use the WebSocket context (HTTP-based) to connect and register a local message handler
    connect(contestId, user.username, userId);
    wsHandlerUnsub.current = registerHandler((msg: any) => {
      switch (msg.type) {
        case 'game_start':
          setSession(msg.payload.session);
          setQuizzes(msg.payload.quizzes);
          setInterrupts(msg.payload.interrupts);
          setPlayers(msg.payload.players || []);
          setInSession(true);
          // Notify extension background so popup can pick up the active session
          try {
            const runtime = (window as any).chrome && (window as any).chrome.runtime;
            if (runtime && typeof runtime.sendMessage === 'function') {
              const sess = msg.payload.session || {};
              const sessionId = sess._id || sess.id || sess.session_id || null;
              const interval = sess.interrupt_interval_minutes || sess.interrupt_interval || sess.interval || null;
              const end_time = sess.end_time || sess.endTime || null;
              const start_time = sess.start_time || sess.startTime || null;

              const message: any = {
                type: 'SESSION_STARTED',
                sessionId,
                contest_id: msg.payload && msg.payload.contest_id ? msg.payload.contest_id : null,
                interrupt_interval_minutes: interval,
                end_time,
                start_time,
                participant_id: userId,
              };

              if (Array.isArray(msg.payload.interrupts) && msg.payload.interrupts.length > 0) {
                message.session_interrupts = msg.payload.interrupts.map((it: any) => ({
                  _id: it._id || it.id || null,
                  type: it.type,
                  link: it.link || it.url || null,
                  quiz_id: it.quiz_id || it.quizId || null,
                  interrupt_time: it.interrupt_time || it.time || null,
                  title: it.title || it.name || null,
                }));
              }

              runtime.sendMessage(message, (resp: any) => {
                // optional: log acknowledgement
                try { console.log('SESSION_STARTED sent to extension background', resp); } catch (e) {}
              });
            }
          } catch (e) {
            console.warn('Failed to notify extension background of game_start', e);
          }
          break;
        case 'score_update':
          setPlayers((prevPlayers) => prevPlayers.map((player) => (player.username === msg.payload.username ? { ...player, score: msg.payload.score } : player)));
          break;
        default:
          break;
      }
    });
    setValidContestID(true);


  } catch(err){
    console.error("Failed to join contest:", err);
    showError("Failed to join contest. Please check the code and try again.");
    setValidContestID(false)
  }

};


  
  return (
    <Container className="mt-4">
      

      { validContestID && contestId && (
        <h2>Waiting for session to start</h2>
      )}
      { !validContestID && (
        <>
        <Form onSubmit={(e) => { e.preventDefault(); handleJoinSession(); }}>
            <FloatingLabel controlId="contestID" label="Contest Code" className="mb-3">
              <Form.Control
                type="text"
                placeholder="Please enter a valid contest code to join a session"
                value={contestId}
                onChange={(e) => setContestId(e.target.value)}
                required
              />
            </FloatingLabel>
            <Button
              variant="primary"
              className="mt-2"
              onClick={handleJoinSession}
              disabled={!contestId.trim()}
            >
              Join Session
            </Button>
     </Form>
     </>
      )}
      <OopsModal
        show={isErrorModalOpen}
        onHide={() => setIsErrorModalOpen(false)}
        errorMessage={errorMessage}
      />
      
    </Container>
  );
};

export default JoinSession;
