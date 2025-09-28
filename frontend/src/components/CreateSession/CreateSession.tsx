// Importing necessary libraries and components
import React, { useState } from 'react';
import { Button, Form, FloatingLabel, Card, Container } from 'react-bootstrap';
import OopsModal from '../Default/OopsModal';
import User from '../../types/User';

// Defining the props interface for the CreateSession component
interface CreateSessionProps {
  user: User;
}

// Functional component for creating a new session of interruptions
const CreateSession: React.FC<CreateSessionProps> = ({ user }) => {
  // State variables for session details
  const [sessionName, setSessionName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participants, setParticipants] = useState(''); // Comma-separated usernames
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Function to handle session creation
  const handleCreateSession = async () => {
    if (!sessionName || !startTime || !endTime) {
      setErrorMessage('Please fill in all required fields.');
      setIsErrorModalOpen(true);
      return;
    }
    // Prepare session object
    const sessionObject = {
      name: sessionName,
      start_time: startTime,
      end_time: endTime,
      participants: participants.split(',').map(p => p.trim()),
      creator_id: user.id,
      created_at: new Date(),
    };
    try {
      // Replace with your backend endpoint
      // await axios.post('http://localhost:8000/sessions/', sessionObject);
      alert('Session created successfully!');
    } catch (error) {
      setErrorMessage(`Error: ${error || 'An unknown error occurred.'}`);
      setIsErrorModalOpen(true);
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
              onChange={e => setSessionName(e.target.value)}
              required
            />
          </FloatingLabel>
          <FloatingLabel controlId="startTime" label="Start Time" className="mb-3">
            <Form.Control
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
            />
          </FloatingLabel>
          <FloatingLabel controlId="endTime" label="End Time" className="mb-3">
            <Form.Control
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
            />
          </FloatingLabel>
          <FloatingLabel controlId="participants" label="Participants (comma separated usernames)" className="mb-3">
            <Form.Control
              type="text"
              placeholder="e.g. alice, bob, charlie"
              value={participants}
              onChange={e => setParticipants(e.target.value)}
            />
          </FloatingLabel>
          <Button variant="primary" onClick={handleCreateSession}>
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

// Exporting the CreateSession component for use in other parts of the application
export default CreateSession;
