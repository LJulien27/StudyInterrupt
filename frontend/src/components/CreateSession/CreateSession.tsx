// Importing necessary libraries and components
import React, { useState } from 'react';
import { Button, Form, FloatingLabel, Card, Container, InputGroup } from 'react-bootstrap';
import OopsModal from '../Default/OopsModal';
import User from '../../types/User';

interface CreateSessionProps {
  user: User;
}

// Utility to make a simple fake share URL
const generateFakeShareLink = () => {
  const slug = Math.random().toString(36).slice(2, 10);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
  return `${origin}/sessions/${slug}`;
};

const CreateSession: React.FC<CreateSessionProps> = ({ user }) => {
  const [sessionName, setSessionName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participants, setParticipants] = useState(''); // Comma-separated usernames

  // Interrupt interval: preset or custom
  const [intervalChoice, setIntervalChoice] = useState<'15' | '30' | '45' | '60' | 'custom'>('30');
  const [customInterval, setCustomInterval] = useState<number | ''>('');

  const [isPublic, setIsPublic] = useState(false);
  const [publicLink, setPublicLink] = useState<string | null>(null);

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setIsErrorModalOpen(true);
  };

  const effectiveIntervalMinutes =
    intervalChoice === 'custom' ? Number(customInterval) : Number(intervalChoice);

  const handleCreateSession = async () => {
    // Validate required
    if (!sessionName || !startTime || !endTime) {
      showError('Please fill in all required fields.');
      return;
    }

    // Validate interval
    if (
      !effectiveIntervalMinutes ||
      Number.isNaN(effectiveIntervalMinutes) ||
      effectiveIntervalMinutes <= 0
    ) {
      showError('Please select a valid interrupt interval (minutes).');
      return;
    }

    // Basic time validation
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
      interrupt_interval_minutes: effectiveIntervalMinutes,
      participants: participants
        ? participants.split(',').map((p) => p.trim()).filter(Boolean)
        : [],
      creator_id: user.id,
      is_public: isPublic,
      public_link: isPublic ? publicLink : null,
      created_at: new Date().toISOString(),
    };

    try {
      // await axios.post('http://localhost:8000/sessions/', sessionObject);
      alert('Session created successfully!');
    } catch (error: any) {
      showError(`Error: ${error?.message || 'An unknown error occurred.'}`);
    }
  };

  const handleMakePublic = () => {
    if (!isPublic) {
      setIsPublic(true);
      setPublicLink((prev) => prev ?? generateFakeShareLink());
    } else {
      setIsPublic(false);
      setPublicLink(null);
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

          {/* Interrupt Interval with presets + custom */}
          <Form.Group className="mb-3">
            <Form.Label className="mb-1">Interrupt Interval</Form.Label>
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
                  step={1}
                  placeholder="Custom minutes"
                  value={customInterval}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomInterval(val === '' ? '' : Number(val));
                  }}
                  required
                />
              )}
            </InputGroup>
            <Form.Text className="text-muted">
              Choose a preset or enter your own number of minutes.
            </Form.Text>
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
              Public mode creates a shareable (temporary) link your friends can use to join.
            </small>
          </div>

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

export default CreateSession;
