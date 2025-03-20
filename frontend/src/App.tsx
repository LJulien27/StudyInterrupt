// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';
import QuizCreate from './components/QuizCreate/QuizCreate';
import UserForm from './components/UserForm/UserForm';
import Quiz from './components/Quiz/Quiz';
import MySessions from './components/MySessions/MySessions';
import MyQuizContent from './components/MyQuizContent/MyQuizContent';

const App: React.FC = () => {
  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">StudyInterrupt</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/quiz">Quizzes</Nav.Link>
              <Nav.Link as={Link} to="/create-quiz">Create Your Own Quiz</Nav.Link>
              <Nav.Link as={Link} to="/user-form">User Parameters</Nav.Link>
              <Nav.Link as={Link} to="/my-sessions">My Sessions</Nav.Link>
              <Nav.Link as={Link} to="/my-quiz-content">My Quiz Content</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Routes>
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/create-quiz" element={<QuizCreate />} />
          <Route path="/user-form" element={<UserForm />} />
          <Route path="/my-sessions" element={<MySessions />} />
          <Route path="/my-quiz-content" element={<MyQuizContent />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
