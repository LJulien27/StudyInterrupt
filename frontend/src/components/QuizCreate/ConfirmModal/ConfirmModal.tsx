// Importing necessary libraries and styled components
import React, { FC } from 'react';
import { ConfirmModalWrapper, ModalContent, ModalOverlay, Button } from './ConfirmModal.styled';

// Defining the props interface for the ConfirmModal component
interface ConfirmModalProps {
  isOpen: boolean; // Determines whether the modal is visible
  onConfirm: () => void; // Function to handle confirmation action
  onCancel: () => void; // Function to handle cancellation action
}

// Functional component for the Confirm Modal
const ConfirmModal: FC<ConfirmModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  // If the modal is not open, do not render anything
  if (!isOpen) return null;

  return (
    // Modal overlay to darken the background
    <ModalOverlay>
      {/* Wrapper for the modal content */}
      <ConfirmModalWrapper>
        <ModalContent>
          {/* Modal title */}
          <h2>Confirm Submission</h2>
          {/* Modal message */}
          <p>Are you sure you want to submit the form?</p>
          {/* Buttons for confirming or canceling the action */}
          <Button onClick={onConfirm}>Yes</Button>
          <Button onClick={onCancel}>No</Button>
        </ModalContent>
      </ConfirmModalWrapper>
    </ModalOverlay>
  );
};

// Exporting the ConfirmModal component for use in other parts of the application
export default ConfirmModal;