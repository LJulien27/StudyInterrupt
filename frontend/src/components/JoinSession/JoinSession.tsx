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
  const { contest_id } = useParams(); // extract from path like /contest/:contest_id
  const [participants, setParticipants] = useState(''); // Comma-separated usernames


  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [username, setUsername] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [contestId, setContestId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setIsErrorModalOpen(true);
  };

useEffect(() => {
  if (!user || (!user._id && !user.id) || !contest_id) return;
  
  const userId = (user as any)._id || user.id;
// this runs when component loads (like onload)
console.log("Page loaded for contest:", contest_id);
//here we need to create the websocket

  const userNameObject = {
      id: userId,
      username: user.username
    };

    const ws = new WebSocket(`ws://localhost:8000/ws/${contestId}/${userId}`);
    wsRef.current = ws;

    ws.onopen = () => console.log("Connected!");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    };
    ws.onclose = () => console.log("Disconnected");

}, [contest_id, user, contestId]);


  
  return (
    <Container className="mt-4">
      <h2>Waiting for session to start</h2>
      
    </Container>
  );
};

export default JoinSession;
