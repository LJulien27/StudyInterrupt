// Importing necessary libraries and components
import React, { useState, useRef, useEffect  } from 'react';
import { Button, Form, FloatingLabel, Card, Container, InputGroup } from 'react-bootstrap';
import OopsModal from '../Default/OopsModal';
import { useAuth } from '../../AuthContext';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../../contexts/WebSocketContext';

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


  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [sessionId, setSessionId] = useState("");
  const [contestId, setContestId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const { connect, disconnect, registerHandler } = useWebSocket();
  const wsHandlerUnsub = useRef<(() => void) | null>(null);

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

    // Use the WebSocket context to connect and register a local message handler
    connect(contestId, user.username, userId);
    wsHandlerUnsub.current = registerHandler((msg: any) => {
      switch (msg.type) {
        case 'game_start':
          setSession(msg.payload.session);
          setQuizzes(msg.payload.quizzes);
          setInterrupts(msg.payload.interrupts);
          setPlayers(msg.payload.players || []);
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
