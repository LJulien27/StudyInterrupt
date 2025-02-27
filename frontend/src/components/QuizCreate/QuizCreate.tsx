import React, { useState } from 'react';
import { QuizCreateWrapper } from './QuizCreate.styled';
import QuestionModal from './QuestionModal/QuestionModal';
import { Button, Form, FloatingLabel } from 'react-bootstrap';

interface Question {
  type: string;
  text: string;
  options?: string[];
  answer: string;
}

const QuizCreate = () => {
  const [quizName, setQuizName] = useState('');
  const [quizClass, setQuizClass] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddQuestion = (newQuestion: Question) => {
    if (editingIndex !== null) {
      // Update an existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = newQuestion;
      setQuestions(updatedQuestions);
    } else {
      // Add new question
      setQuestions([...questions, newQuestion]);
    }
    setIsModalOpen(false);
    setEditingIndex(null); // Reset after saving
  };

  const handleEditQuestion = (index: number) => {
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <QuizCreateWrapper>
      <h2>Create a Quiz</h2>
      <form>
        <FloatingLabel controlId="quizName" label="Quiz Name" className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter quiz name"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            required
          />
        </FloatingLabel>

        <FloatingLabel controlId="quizClass" label="Class" className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter class name"
            value={quizClass}
            onChange={(e) => setQuizClass(e.target.value)}
            required
          />
        </FloatingLabel>
      </form>

      <h3>Questions</h3>
      <ul>
        {questions.map((q, index) => (
          <li key={index}>
            {q.text} ({q.type})
            <Button variant="warning" size="sm" onClick={() => handleEditQuestion(index)} className="ms-2">
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDeleteQuestion(index)} className="ms-2">
              Delete
            </Button>
          </li>
        ))}
      </ul>

      <Button variant="primary" onClick={() => { setEditingIndex(null); setIsModalOpen(true); }}>
        Add Question
      </Button>

      <QuestionModal
        show={isModalOpen}
        onHide={() => { setIsModalOpen(false); setEditingIndex(null); }}
        onSave={handleAddQuestion}
        editingQuestion={editingIndex !== null ? questions[editingIndex] : null}
      />
    </QuizCreateWrapper>
  );
};

export default QuizCreate;
