// Importing React and necessary components from react-bootstrap
import React from 'react';
import { Modal, Button } from 'react-bootstrap';

// Defining the props interface for the OopsModal component
interface OopsModalProps {
  show: boolean; // Determines whether the modal is visible
  onHide: () => void; // Function to handle closing the modal
  errorMessage: string; // Error message to display in the modal
}

// Functional component to display an error modal
const OopsModal: React.FC<OopsModalProps> = ({ show, onHide, errorMessage }) => {
  return (
    // Modal component from react-bootstrap
    <Modal show={show} onHide={onHide}>
      {/* Modal header with a close button */}
      <Modal.Header closeButton>
        <Modal.Title>Oops! Something went wrong</Modal.Title>
      </Modal.Header>
      {/* Modal body displaying the error message */}
      <Modal.Body>
        <p>{errorMessage}</p>
      </Modal.Body>
      {/* Modal footer with a close button */}
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Exporting the OopsModal component for use in other parts of the application
export default OopsModal;