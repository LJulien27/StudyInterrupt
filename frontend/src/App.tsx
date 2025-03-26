// src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';
import QuizCreate from './components/QuizCreate/QuizCreate';
import UserForm from './components/UserForm/UserForm';
import Quiz from './components/Quiz/Quiz';
import History from './components/History/History';
import MySessions from './components/MySessions/MySessions';
import MyQuizContent from './components/MyQuizContent/MyQuizContent';
import User from './types/User';
import axios from 'axios';

const App: React.FC = () => {

  const [user, setUser] = useState<User>({
    id: '67e1c77552f341264138101b'
  });

  useEffect(() => {
    axios
      .get('http://localhost:8000/users/')
      .then(response => {
        setUser(Array.isArray(response.data.users) ? response.data.users[0] : {id: '67e1c77552f341264138101b'});
      });
  }, []);

  

  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">StudyInterrupt</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/quiz">Quizzes</Nav.Link>
              <Nav.Link as={Link} to="/create-quiz">Create A Quiz</Nav.Link>
              <Nav.Link as={Link} to="/user-form">Parameters</Nav.Link>
              <Nav.Link as={Link} to="/my-sessions">Sessions</Nav.Link>
              <Nav.Link as={Link} to="/my-quiz-content">Generated Content</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Routes>
          <Route path="/quiz" element={<Quiz user={user}/>} />
          <Route path="/create-quiz" element={<QuizCreate user={user}/>} />
          <Route path="/user-form" element={<UserForm />} />
          <Route path="/history" element={<History user={user}/>} />
          <Route path="/my-sessions" element={<MySessions user={user}/>} />
          <Route path="/my-quiz-content" element={<MyQuizContent user={user}/>} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
