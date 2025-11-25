// Importing necessary libraries and components
import React, { useState, useRef, useEffect  } from 'react';
import { Button, Form, FloatingLabel, Card, Container, InputGroup } from 'react-bootstrap';
import OopsModal from '../Default/OopsModal';
import { useAuth } from '../../AuthContext';
import axios from 'axios';
import { useParams } from 'react-router-dom';

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

  const [players, setPlayers] = useState<{ id: string; username: string }[]>([]);
  const [gameOver, setGameOver] = useState(false);


  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [sessionId, setSessionId] = useState("");
  const [contestId, setContestId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setIsErrorModalOpen(true);
  };

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

    const ws = new WebSocket(`wss://studyinterruptbackend.onrender.com/ws/${contestId}/${user.username}/${userId}`);
    wsRef.current = ws;
  // expose websocket globally so other parts of the app (e.g. Quiz) can send messages
  try { (window as any).__si_ws = ws; } catch (e) { /* ignore */ }

    ws.onopen = () => {
      console.log("Connected!");
      setValidContestID(true);
    };
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      showError(`WebSocket connection failed: ${error}`);
      setValidContestID(false);
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
          console.log(msg);
          console.log("Score update received!");

          setPlayers((prevPlayers) =>
            prevPlayers.map((player) => {
              if (player.username === msg.payload.username) {
                return {
                  ...player,
                  score: msg.payload.score,
                };
              }
              return player;
            })
          );

          break;

        case "game_over":
          console.log(msg);
          console.log("Game over!");
          setGameOver(true);
          break;
        
        case "user_joined":
          console.log("user joined");

          setPlayers((prevPlayers) => {
            const exists = prevPlayers.some(
              (p) => p.username === msg.payload.username
            );

            if (exists) return prevPlayers;

            return [
              ...prevPlayers,
              {
                username: msg.payload.username,
                id: msg.payload.id,
                score: msg.payload.score,
              },
            ];
          });

          break;

        default:
          console.warn("Unknown message type:", msg.type);
          console.log(msg);
      }
    };
    ws.onclose = () => {
      console.log("Disconnected");
      try { if ((window as any).__si_ws === ws) (window as any).__si_ws = null; } catch (e) {}
    };

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
