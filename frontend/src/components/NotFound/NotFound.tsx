import React from 'react';
import { Container } from 'react-bootstrap';

const NotFound: React.FC = () => {
  return (
    <Container className="text-center mt-5">
      <h1>404</h1>
      <h3>Page Not Found</h3>
      <p>Sorry, the page you are looking for does not exist.</p>
    </Container>
  );
};

export default NotFound;