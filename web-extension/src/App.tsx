import { useState } from "react";
import { Container, Card, Form, Button } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

declare const chrome: any;

function App() {
  const [timerLength, setTimerLength] = useState(5);

  const updateTimer = () => {
    chrome.runtime.sendMessage(
      { type: "SET_TIMER", payload: timerLength },
      (response: { status: string } | undefined) => {
        if (response) {
          console.log("Background response:", response.status);
        } else {
          console.log("No response from background script.");
        }
      }
    );
  };

  return (
    <Container className="d-flex justify-content-center align-items-center app-container">
      <Card className="p-4 shadow">
        <h2 className="text-center mb-4">Study Break</h2>
        <Form>
          <Form.Group controlId="formTimer">
            <Form.Label>Set Timer Length (in seconds)</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={timerLength}
              onChange={(e) => setTimerLength(Number(e.target.value))}
            />
          </Form.Group>
          <div className="d-grid mt-3">
            <Button variant="primary" onClick={updateTimer}>
              Set Timer
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
}

export default App;
