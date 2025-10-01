// MySessions.tsx
import React from 'react';
import { Container, Row, Col, Button, Form, Card } from 'react-bootstrap';
import User from '../../types/User';

interface MySessionsProps {
  user: User;
}

const MySessions: React.FC<MySessionsProps> = ({ user }) => {
  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col xs={12} md={8}>

          {/* Active Session Section */}
          <Card className="mb-4">
            <Card.Header as="h5" className="text-center">Active Session</Card.Header>
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>5 hours 34 minutes remaining</div>
              <Button variant="danger">Stop Session</Button>
            </Card.Body>
          </Card>

          {/* Start Session Section */}
          <Card className="mb-4">
            <Card.Header as="h5" className="text-center">Start Session</Card.Header>
            <Card.Body>
              <Row className="align-items-center g-2">
                <Col xs={4} md={3}>
                  <Form.Control type="number" placeholder="Hours" />
                </Col>
                <Col xs="auto">hours</Col>
                <Col xs={4} md={3}>
                  <Form.Control type="number" placeholder="Minutes" />
                </Col>
                <Col xs="auto">minutes</Col>
                <Col xs="auto">
                  <Button variant="primary">Start</Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Blocklist Section */}
          <Card>
            <Card.Header as="h5" className="text-center">My Blocklist</Card.Header>
            <Card.Body>
              <Row className="align-items-center g-2">
                <Col>
                  <Form.Control type="text" placeholder="Enter site URL" />
                </Col>
                <Col xs="auto">
                  <Button variant="secondary">Add Site</Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

        </Col>
      </Row>
    </Container>
  );
};

export default MySessions;
