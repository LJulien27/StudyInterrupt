import React, { FC } from 'react';
import { ConfirmModalWrapper, ModalContent, ModalOverlay, Button } from './ConfirmModal.styled';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: FC<ConfirmModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ConfirmModalWrapper>
        <ModalContent>
          <h2>Confirm Submission</h2>
          <p>Are you sure you want to submit the form?</p>
          <Button onClick={onConfirm}>Yes</Button>
          <Button onClick={onCancel}>No</Button>
        </ModalContent>
      </ConfirmModalWrapper>
    </ModalOverlay>
  );
};

export default ConfirmModal;
