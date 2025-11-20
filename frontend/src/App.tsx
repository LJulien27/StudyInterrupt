// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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

const App: React.FC = () => {
  return (
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
              <Nav.Link as={Link} to="/quiz">Quizzes</Nav.Link>
              <Nav.Link as={Link} to="/create-quiz">Create A Quiz</Nav.Link>
              <Nav.Link as={Link} to="/user-form">Parameters</Nav.Link>
              <Nav.Link as={Link} to="/my-sessions">Sessions</Nav.Link>
              <Nav.Link as={Link} to="/my-quiz-content">Generated Content</Nav.Link>
              {/* New button to start a session */}
              <Nav.Link as={Link} to="/create-session" style={{ fontWeight: 'bold', color: '#0d6efd' }}>Start a Session</Nav.Link>
              <Nav.Link as={Link} to="/join-session">Join session</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        {/* Routing configuration: maps paths to their respective components */}
        <Routes>
          {/* Route for the Quiz page */}
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
    </Router>
  );
};

export default App;