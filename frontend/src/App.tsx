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
  // State to store the current user
  const [user, setUser] = useState<User>({
    id: '67e1c77552f341264138101b' // Default user ID
  });

  // Fetch user data from the backend API on component mount
  useEffect(() => {
    axios
      .get('http://localhost:8000/users/') // API endpoint to fetch users
      .then(response => {
        // Set the user to the first user in the response or a default user if the response is invalid
        setUser(Array.isArray(response.data.users) ? response.data.users[0] : {id: '67e1c77552f341264138101b'});
      });
  }, []); // Empty dependency array ensures this runs only once

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
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        {/* Routing configuration: maps paths to their respective components */}
        <Routes>
          {/* Route for the Quiz page, passing the user as a prop */}
          <Route path="/quiz" element={<Quiz user={user}/>} />
          {/* Route for the Quiz creation page */}
          <Route path="/create-quiz" element={<QuizCreate user={user}/>} />
          {/* Route for the User Form page */}
          <Route path="/user-form" element={<UserForm />} />
          {/* Route for the History page, passing the user as a prop */}
          <Route path="/history" element={<History user={user}/>} />
          {/* Route for the Sessions page, passing the user as a prop */}
          <Route path="/my-sessions" element={<MySessions user={user}/>} />
          {/* Route for the Generated Content page, passing the user as a prop */}
          <Route path="/my-quiz-content" element={<MyQuizContent user={user}/>} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
