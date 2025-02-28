import React, { useState, FormEvent, useEffect } from 'react';
import { Modal, Button, Form, FloatingLabel, InputGroup } from 'react-bootstrap';

interface Question {
  type: string;
  text: string;
  options?: string[];
  answer: string;
}

interface QuestionModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (question: Question) => void;
  editingQuestion?: Question | null;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ show, onHide, onSave, editingQuestion }) => {
  const defaultQuestion = {
    type: 'single-select',
    text: '',
    options: [''],
    answer: '',
  };

  const [questionType, setQuestionType] = useState(defaultQuestion.type);
  const [question, setQuestion] = useState(defaultQuestion.text);
  const [options, setOptions] = useState(defaultQuestion.options);
  const [answer, setAnswer] = useState(defaultQuestion.answer);

  // Load data when editing an existing question
  useEffect(() => {
    if (editingQuestion) {
      setQuestionType(editingQuestion.type);
      setQuestion(editingQuestion.text);
      setOptions(editingQuestion.options || ['']);
      setAnswer(editingQuestion.answer);
    } else {
      // Reset to default when adding a new question
      setQuestionType(defaultQuestion.type);
      setQuestion(defaultQuestion.text);
      setOptions(defaultQuestion.options);
      setAnswer(defaultQuestion.answer);
    }
  }, [editingQuestion, show]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ type: questionType, text: question, options, answer });
  };

  const handleReset = () => {
    setQuestionType(defaultQuestion.type);
    setQuestion(defaultQuestion.text);
    setOptions(defaultQuestion.options);
    setAnswer(defaultQuestion.answer);
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Question</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit}>
        <Form.Select className="mb-2" value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
            <option value="single-select">Single Select Multiple Choice</option>
            <option value="multi-select">Multi Select Multiple Choice</option>
            <option value="fill-in-the-blank">Fill in the Blank</option>
            <option value="association">Association Question</option>
        </Form.Select>

          <FloatingLabel controlId="questionText" label="Question" className="mb-3">
            <Form.Control
              type="text"
              placeholder="Enter question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </FloatingLabel>

          {(questionType === 'single-select' || questionType === 'multi-select') && (
            <div>
                <label>Options:</label>
                {options.map((option, index) => (
                <InputGroup key={index} className="mb-2">
                    <InputGroup.Checkbox
                        checked={answer.split(',').map(a => a.trim()).includes(option)}
                        onChange={() => {
                            const answers = answer.split(',').map(a => a.trim()).filter(a => a !== '');

                            // THIS NEEDS TO BE FIXED, SetAnswer MIGHT JUST BE FOR ONE ANSWER BUT HERE IT SHOULD BE ABLE TO HANDLE MULTIPLE

                            if (answers.includes(option)) {
                                setAnswer(answers.filter(a => a !== option).join(', ')); // Remove from answers
                            } else {
                                setAnswer([...answers, option].join(', ')); // Add to answers
                            }
                        }}
                    />
                    <FloatingLabel controlId={`option-${index}`} label={`Option ${index + 1}`}>
                        <Form.Control
                            type="text"
                            value={option}
                            onChange={(e) => {
                                const newOptions = [...options];
                                newOptions[index] = e.target.value;
                                setOptions(newOptions);
                            }}
                            required
                        />
                    </FloatingLabel>
                </InputGroup>
                ))}
                <Button variant="secondary" onClick={() => setOptions([...options, ''])}>
                    Add Option
                </Button>
            </div>
          )}

          <FloatingLabel controlId="questionAnswer" label="Answer" className="mb-2">
            <Form.Control
              type="text"
              placeholder="Enter answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
            />
          </FloatingLabel>

          <Button type="submit" variant="success">
            Save Question
          </Button>
          <Button variant="warning" className="ms-2" onClick={handleReset}>
            Reset
          </Button>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default QuestionModal;
