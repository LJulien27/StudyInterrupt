// Importing necessary libraries and components
import React, { useState } from 'react';
import axios from 'axios';
import { QuizCreateWrapper } from './QuizCreate.styled'; // Styled wrapper for the component
import QuestionModal from './QuestionModal/QuestionModal'; // Modal for adding/editing questions
import OopsModal from '../Default/OopsModal'; // Modal for displaying errors
import { Button, Form, FloatingLabel, Card } from 'react-bootstrap'; // Bootstrap components for UI
import Question, { QuestionType } from '../../types/Question'; // Question type definitions
import User from '../../types/User'; // User type definition

// Defining the props interface for the QuizCreate component
interface QuizCreateProps {
  user: User; // The current user object
}

// Functional component to create a quiz
const QuizCreate: React.FC<QuizCreateProps> = ({ user }) => {
  // State variables for managing quiz details
  const [quizName, setQuizName] = useState(''); // Quiz name
  const [quizClass, setQuizClass] = useState(''); // Class name
  const [questions, setQuestions] = useState<Question[]>([]); // List of questions
  const [isModalOpen, setIsModalOpen] = useState(false); // State for question modal visibility
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // Index of the question being edited
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false); // State for error modal visibility
  const [errorMessage, setErrorMessage] = useState(''); // Error message to display

  // Function to handle adding or editing a question
  const handleAddQuestion = (newQuestion: Question) => {
    if (editingIndex !== null) {
      // Update an existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = newQuestion;
      setQuestions(updatedQuestions);
    } else {
      // Add a new question
      setQuestions([...questions, newQuestion]);
    }
    setIsModalOpen(false); // Close the modal
    setEditingIndex(null); // Reset editing index
  };

  // Function to handle editing a question
  const handleEditQuestion = (index: number) => {
    setEditingIndex(index); // Set the index of the question being edited
    setIsModalOpen(true); // Open the modal
  };

  // Function to handle deleting a question
  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index)); // Remove the question from the list
  };

  // Function to handle submitting the quiz
  const handleSubmitQuiz = async () => {
    const quizObject = {
      title: quizName, // Quiz title
      creator_id: "67d4aafda97b4f67f45759bf", // User ID of the quiz creator
      session_id: null, // Placeholder for session ID
      created_at: new Date(), // Current timestamp
    };

    try {
      // Submit the quiz to the backend
      const QuizResponse = await axios.post('http://localhost:8000/quizzes/', quizObject);
      console.log(QuizResponse.data);
      const quizId = QuizResponse.data._id;

      // Submit each question associated with the quiz
      for (let i = 0; i < questions.length; i++) {
        console.log("Submitting question: ", questions[i]);
        let question = questions[i];
        let questionObject = {
          quiz_id: quizId, // ID of the quiz
          type: question.type, // Question type
          text: question.text, // Question text
          body: question.body, // Question body (e.g., options)
          answer: question.answer, // Correct answer(s)
        };
        console.log(questionObject); // Debugging purposes
        let response = await axios.post('http://localhost:8000/questions/', questionObject);
        console.log(response.data);
      }

      alert("Your quiz has been submitted"); // Notify the user of successful submission
    } catch (error) {
      console.error("Error submitting quiz: ", error);
      setErrorMessage(`Error: ${error || 'An unknown error occurred.'}`); // Set error message
      setIsErrorModalOpen(true); // Open the error modal
    }
  };

  // Function to render a question based on its type
  const renderQuestion = (question: Question, index: number) => {
    switch (question.type) {
      case QuestionType.SINGLESELECT:
        return (
          <div>
            <strong>{index + 1}. Single Select:</strong> {question.text}
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
            <strong>{index + 1}. Multi Select:</strong> {question.text}
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
            <strong>{index + 1}. Fill in the Blank:</strong> {question.text} ______ {question.body}
            <p><strong>Answer:</strong> {question.answer}</p>
          </div>
        );
      case QuestionType.ASSOCIATION:
        return (
          <div>
            <strong>{index + 1}. Association:</strong> {question.text}
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
      {/* Quiz creation form */}
      <h2>Create a Quiz</h2>
      <form>
        {/* Input for quiz name */}
        <FloatingLabel controlId="quizName" label="Quiz Name" className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter quiz name"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            required
          />
        </FloatingLabel>

        {/* Input for class name */}
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

      {/* List of questions */}
      <h3>Questions</h3>
      <ul>
        {questions.map((q, index) => (
          <li key={index} className="mb-2">
            <Card>
              <Card.Body>{renderQuestion(q, index)}</Card.Body>
            </Card>
            <Button variant="warning" size="sm" onClick={() => handleEditQuestion(index)} className="ms-2">
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDeleteQuestion(index)} className="ms-2">
              Delete
            </Button>
          </li>
        ))}
      </ul>

      {/* Buttons to add a question or submit the quiz */}
      <Button variant="primary" onClick={() => { setEditingIndex(null); setIsModalOpen(true); }}>
        Add Question
      </Button>
      <Button variant="success" className="ms-2" onClick={handleSubmitQuiz}>
        Submit Quiz
      </Button>

      {/* Modal for adding/editing questions */}
      <QuestionModal
        show={isModalOpen}
        onHide={() => { setIsModalOpen(false); setEditingIndex(null); }}
        onSave={handleAddQuestion}
        editingQuestion={editingIndex !== null ? questions[editingIndex] : null}
      />

      {/* Modal for displaying errors */}
      <OopsModal
        show={isErrorModalOpen}
        onHide={() => setIsErrorModalOpen(false)}
        errorMessage={errorMessage}
      />
    </QuizCreateWrapper>
  );
};

// Exporting the QuizCreate component for use in other parts of the application
export default QuizCreate;