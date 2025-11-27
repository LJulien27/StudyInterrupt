// src/App.tsx
import React from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';
import QuizCreate from './components/QuizCreate/QuizCreate';
import UserForm from './components/UserForm/UserForm';
import Quiz from './components/Quiz/Quiz';
import History from './components/History/History';
import MySessions from './components/MySessions/MySessions';
import MyQuizContent from './components/MyQuizContent/MyQuizContent';
import NotFound from './components/NotFound/NotFound';
import CreateSession from './components/CreateSession/CreateSession';
import JoinSession from './components/JoinSession/JoinSession';
import Sidebar from './components/Sidebar/Sidebar';
import { SessionBridgeProvider, useSessionBridge } from './contexts/SessionBridgeContext';
import { SessionQuizProvider, useSessionQuiz } from './contexts/SessionQuizContext';
import { useEffect } from 'react';

const SidebarContainer: React.FC = () => {
  const { connected } = useSessionBridge();
  if (!connected) return null;
  return <Sidebar />;
};

const App: React.FC = () => {
  // Component mounted inside providers to autopickup pending interrupt markers written by the extension popup.
  const SessionQuizAutoOpen: React.FC = () => {
    const { openQuiz } = useSessionQuiz();
    useEffect(() => {
      try {
        // Prefer chrome.storage when available (extension context)
        if ((window as any).chrome && (window as any).chrome.storage && (window as any).chrome.storage.local && typeof (window as any).chrome.storage.local.get === 'function') {
          try {
            (window as any).chrome.storage.local.get(['si_interrupt_pending', 'si_pending_interrupt_quizId', 'si_pending_interrupt_id'], (items: any) => {
              try {
                const pending = items && (items.si_interrupt_pending === true || items.si_interrupt_pending === 'true');
                if (pending) {
                  const quizId = (items && items.si_pending_interrupt_quizId) || null;
                  const interruptId = (items && items.si_pending_interrupt_id) || null;
                  if (quizId) openQuiz(quizId, interruptId || null, null);
                }
              } catch (e) { /* ignore */ }
            });
          } catch (e) { /* ignore */ }
        } else {
          const pending = localStorage.getItem('si_interrupt_pending') === 'true';
          if (pending) {
            const quizId = localStorage.getItem('si_pending_interrupt_quizId') || null;
            const interruptId = localStorage.getItem('si_pending_interrupt_id') || null;
            if (quizId) {
              // call openQuiz to navigate into the app and mark pending in-memory
              openQuiz(quizId, interruptId || null, null);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }, [openQuiz]);
    return null;
  };
  return (
  <SessionBridgeProvider>
    <SessionQuizProvider>
    <Router>
      {/* Navigation bar for various links in the web app */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          {/* Brand name linking to the home page */}
          <Navbar.Brand as={Link} to="/">StudyInterrupt</Navbar.Brand>
          {/* Toggle button for responsive design */}
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {/* Navigation links for different pages */}
              <Nav.Link as={Link} to="/">Quizzes</Nav.Link>
              <Nav.Link as={Link} to="/create-quiz">Create A Quiz</Nav.Link>
              {/* New button to start a session */}
              <Nav.Link as={Link} to="/create-session" style={{ fontWeight: 'bold', color: '#0d6efd' }}>Start a Session</Nav.Link>
              <Nav.Link as={Link} to="/join-session">Join session</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <main style={{ flex: 1 }}>
          <Container>
            {/* Auto-open quiz if popup set a pending interrupt before this tab launched */}
            <SessionQuizAutoOpen />
            {/* Routing configuration: maps paths to their respective components */}
            <Routes>
          {/* Route for the Quiz page */}
          <Route path="/" element={<Quiz />} />
          <Route path="/quiz" element={<Quiz />} />
          {/* Route for the Quiz creation page */}
          <Route path="/create-quiz" element={<QuizCreate />} />
          {/* Route for the User Form page */}
          <Route path="/user-form" element={<UserForm />} />
          {/* Route for the History page */}
          <Route path="/history" element={<History/>} />
          {/* Route for the Sessions page */}
          <Route path="/my-sessions" element={<MySessions />} />
          {/* Route for the Generated Content page */}
          <Route path="/my-quiz-content" element={<MyQuizContent />} />
          {/* Route for creating a new session of interruptions */}
          <Route path="/create-session" element={<CreateSession />} />
          {/* Route for joining someone else's session */}
          <Route path="/join-session/" element={<JoinSession />} />
          <Route path="*" element={<NotFound />} />
            </Routes>
          </Container>
        </main>
  <SidebarContainer />
      </div>
    </Router>
  </SessionQuizProvider>
  </SessionBridgeProvider>
  );
};

export default App;