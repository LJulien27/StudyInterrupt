import './MySessions.css';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import User from '../../types/User';

interface MySessionsProps {
  user: User;
}


const MySessions: React.FC<MySessionsProps> = ({ user }) => {
  return (
    <Container fluid className="Wrap">
      <Row>
        <Col className="Left" xs={2}></Col>
        <Col className="Middle" xs={8}>
          {/* Active Session Section */}
          <div className="active-session-grid">
            <div className="active-session-grid-item-1">Active Session</div>
            <div className="active-session-grid-item-2">5 hours 34 minutes remaining</div>
            <div className="active-session-grid-item-3">
              <Button className="button">STOP SESSION</Button>
            </div>
          </div>
          <br /><br />

          {/* Start Session Section */}
          <div className="start-session-grid">
            <div className="start-session-grid-item-1">Start Session</div>
            <div className="start-session-grid-item-2">
              <div className="start-session-flex-container">
                <div className="start-session-flex-item">
                  <Form.Control type="text" placeholder="Hours" />
                </div>
                <div className="start-session-flex-item">hours</div>
                <div className="start-session-flex-item">
                  <Form.Control type="text" placeholder="Minutes" />
                </div>
                <div className="start-session-flex-item">minutes</div>
                <div className="start-session-flex-item">
                  <Button className="button">START</Button>
                </div>
              </div>
            </div>
          </div>
          <br /><br />

          {/* Blocklist Section */}
          <div className="my-blocklist-grid">
            <div className="my-blocklist-grid-item-1">My Blocklist</div>
            <div className="my-blocklist-grid-item-2">
              <Form.Control type="text" placeholder="Enter site URL" />
            </div>
            <div className="my-blocklist-grid-item-3">
              <Button className="button">ADD SITE</Button>
            </div>
          </div>
        </Col>
        <Col className="Right" xs={2}></Col>
      </Row>
    </Container>
  );
};

export default MySessions;