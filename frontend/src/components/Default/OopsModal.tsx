import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface OopsModalProps {
  show: boolean;
  onHide: () => void;
  errorMessage: string;
}

const OopsModal: React.FC<OopsModalProps> = ({ show, onHide, errorMessage }) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Oops! Something went wrong</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{errorMessage}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OopsModal;