import React, { useState } from 'react';
import { QuizCreateWrapper } from './QuizCreate.styled';
import QuestionModal from './QuestionModal/QuestionModal';
import { Button, Form, FloatingLabel } from 'react-bootstrap';
import Question, {QuestionType} from '../../types/Question';


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

  const renderQuestion = (question: Question, index: number) => {
    switch (question.type) {
      case QuestionType.SINGLESELECT:
         return (
           <div>
             <strong>Single Select:</strong> {question.text}
             <ul>
               {question.body.split('&!!&').map((option, idx) => (
                 <li key={idx}>{option}</li>
               ))}
             </ul>
             <p><strong>Answer:</strong> {question.answer}</p>
           </div>
         );
       case QuestionType.MULTISELECT:
         return (
           <div>
             <strong>Multi Select:</strong> {question.text}
             <ul>
               {question.body.split('&!!&').map((option, idx) => (
                 <li key={idx}>{option}</li>
               ))}
             </ul>
             <p><strong>Answers:</strong> {question.answer.split('&!!&').join(', ')}</p>
           </div>
         );
       case QuestionType.FILLBLANK:
         return (
           <div>
             <strong>Fill in the Blank:</strong> {question.text} ______ {question.body}
             <p><strong>Answer:</strong> {question.answer}</p>
           </div>
         );
       case QuestionType.ASSOCIATION:
         return (
           <div>
             <strong>Association:</strong> {question.text}
             <ul>
               {question.body.split('&!!&').map((leftOption, idx) => (
                 <li key={idx}>{leftOption} - {question.answer.split('&!!&')[idx]}</li>
               ))}
             </ul>
           </div>
         );
       default:
         return null;
     }
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
          <li key={index} className="mb-2">
            {renderQuestion(q, index)}
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
