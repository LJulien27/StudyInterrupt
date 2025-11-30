import React, { useEffect, useState } from 'react';
import { Container, Button, Form, FloatingLabel, InputGroup } from 'react-bootstrap';
import Question, { QuestionType } from '../../types/Question';
import axios from 'axios';
import { Username } from '../../types/Sessions';
import { useAuth } from '../../AuthContext';
import { useSessionBridge } from '../../contexts/SessionBridgeContext';

// ===============================
// ENVIRONMENT + USER LOGIC
// ===============================
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1");

const API_BASE = isLocalhost
  ? "http://localhost:8000"
  : "https://studyinterruptbackend.onrender.com";

const DEV_USER_ID = "68e5959e3a521fb2b1bfb12d";

// ===============================
// TYPES
// ===============================
interface Quiz {
  _id: string;
  title: string;
  creator_id: string;
  session_id: string;
  created_at: string;
}

interface Contest {
  _id: string;
  session_id: string;
  participants: Username[];
  grades: number[]
}

interface ContestNoId {
  session_id: string;
  participants: Username[];
  grades: number[]
}

// ===============================
// COMPONENT
// ===============================
const Quiz: React.FC = () => {

  const { user } = useAuth();
  const activeUserId = isLocalhost ? DEV_USER_ID : user?._id;

  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  const [contestNoId, setContestNoId] = useState<ContestNoId | null>(null);
  const [pendingInterruptId, setPendingInterruptId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [answers, setAnswers] = useState<{ [key: number]: string | string[] }>({});
  const [score, setScore] = useState<number | null>(null);
  const [Quizes, setQuizes] = useState<Quiz[]>([]);
  const [Questions, setQuestions] = useState<Question[]>([]);

  // ===============================
  // LOAD QUIZZES
  // ===============================
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!activeUserId) return;

      try {
        const response = await axios.get(`${API_BASE}/users/${activeUserId}/quizzes`);
        let quizzes = Array.isArray(response.data.quizzes) ? response.data.quizzes : [];

        // Check URL for quizId
        let search = window.location.search || '';
        if ((!search || search === '') && window.location.hash) {
          const idx = window.location.hash.indexOf('?');
          if (idx >= 0) search = window.location.hash.slice(idx);
        }

        if (search) {
          const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
          const quizId = params.get('quizId') || params.get('id');

          if (quizId && !quizzes.find((q: any) => q._id === quizId)) {
            try {
              const r2 = await axios.get(`${API_BASE}/quizzes/${quizId}`);
              const fetched = r2.data.quiz || r2.data;
              if (fetched && fetched._id) quizzes = [...quizzes, fetched];
            } catch (e) {
              console.warn('Failed to fetch quiz by id:', e);
            }
          }
        }

        setQuizes(quizzes);
      } catch (err) {
        console.error('Failed to load quizzes:', err);
        setQuizes([]);
      }
    };

    fetchQuizzes();
  }, [activeUserId]);

  // ===============================
  // AUTO-SELECT QUIZ FROM URL
  // ===============================
  useEffect(() => {
    if (!Quizes.length) return;

    try {
      let search = window.location.search || '';
      if ((!search || search === '') && window.location.hash) {
        const idx = window.location.hash.indexOf('?');
        if (idx >= 0) search = window.location.hash.slice(idx);
      }
      if (!search) return;

      const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
      const quizId = params.get('quizId') || params.get('id');
      const interruptId = params.get('interruptId');

      if (interruptId) setPendingInterruptId(interruptId);
      if (!quizId) return;

      const match = Quizes.find((q) => q._id === quizId);
      if (match) handleQuizSelect(match);
    } catch (e) {
      console.warn('Failed automatic quiz load:', e);
    }
  }, [Quizes]);

  const { send, players: ctxPlayers, connected } = useSessionBridge();

  // ===============================
  // SELECT A QUIZ
  // ===============================
  const handleQuizSelect = async (quiz: Quiz) => {
    if (deleteMode) {
      setSelectedForDeletion((prev) =>
        prev.includes(quiz._id) ? prev.filter((id) => id !== quiz._id) : [...prev, quiz._id]
      );
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/quizzes/${quiz._id}/questions`);
      setQuestions(Array.isArray(response.data.questions) ? response.data.questions : []);
      setSelectedQuiz(quiz);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      alert("Failed to load quiz questions.");
    }
  };

  // ===============================
  // ANSWERS
  // ===============================
  const handleAnswerChange = (index: number, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  // ===============================
  // SUBMIT QUIZ
  // ===============================
  const handleSubmit = async () => {
    let correctAnswers = 0;

    Questions.forEach((question, index) => {
      const userAnswer = answers[index];
      if (!userAnswer) return;

      if (
        question.type === QuestionType.MULTISELECT ||
        question.type === QuestionType.ASSOCIATION
      ) {
        const correctSet = new Set(question.answer.split("&!!&"));
        const userSet = new Set(Array.isArray(userAnswer) ? userAnswer : userAnswer.split("&!!&"));
        if (
          correctSet.size === userSet.size &&
          Array.from(correctSet).every((a) => userSet.has(a))
        ) {
          correctAnswers++;
        }
      } else {
        if (question.answer.toLowerCase() === userAnswer.toString().toLowerCase()) {
          correctAnswers++;
        }
      }
    });

    const finalScore = Math.round((correctAnswers / Questions.length) * 100);
    alert(`Quiz Submitted! You scored ${finalScore}%`);
    setScore(finalScore);

    // Reset UI
    setSelectedQuiz(null);
    setQuestions([]);
    setAnswers({});
    setScore(null);
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <Container className="mt-4">
      <h2>Take a Quiz</h2>

      {/* QUIZ LIST */}
      {!selectedQuiz ? (
        <>
          <div className="d-flex align-items-center justify-content-between">
            <h4>Select a Quiz:</h4>

            <div>
              {!deleteMode ? (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => { setDeleteMode(true); setSelectedForDeletion([]); }}
                >
                  Delete Quizzes
                </Button>
              ) : (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={async () => {
                      if (!selectedForDeletion.length) {
                        alert("Select quizzes to delete.");
                        return;
                      }

                      const ok = window.confirm(`Delete ${selectedForDeletion.length} quiz(es)?`);
                      if (!ok) return;

                      setDeleting(true);
                      try {
                        for (const id of selectedForDeletion) {
                          await axios.delete(`${API_BASE}/quizzes/${id}`);
                        }
                        const refreshed = await axios.get(`${API_BASE}/users/${activeUserId}/quizzes`);
                        setQuizes(refreshed.data.quizzes || []);
                      } catch (e) {
                        alert("Failed to delete quizzes.");
                      } finally {
                        setDeleting(false);
                        setDeleteMode(false);
                        setSelectedForDeletion([]);
                      }
                    }}
                  >
                    {deleting ? "Deleting…" : "Confirm Delete"}
                  </Button>

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => { setDeleteMode(false); setSelectedForDeletion([]); }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-3">
            {Quizes.map((quiz) => (
              <Button
                key={quiz._id}
                variant={selectedForDeletion.includes(quiz._id) ? 'danger' : 'primary'}
                className="m-2"
                onClick={() => handleQuizSelect(quiz)}
              >
                {quiz.title}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* QUIZ QUESTIONS */}
          <h3>{selectedQuiz.title}</h3>

          <Form>
            {Questions.map((question, index) => (
              <div key={index} className="mb-3">
                <strong>Q{index + 1}. {question.text}</strong>

                {question.type === QuestionType.SINGLESELECT && (
                  <Form.Select onChange={(e) => handleAnswerChange(index, e.target.value)}>
                    <option value="">Select an answer</option>
                    {question.body.split("&!!&").map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </Form.Select>
                )}

                {question.type === QuestionType.MULTISELECT && (
                  question.body.split("&!!&").map((opt, i) => (
                    <Form.Check
                      key={i}
                      type="checkbox"
                      label={opt}
                      onChange={(e) => {
                        const prev = (answers[index] || []) as string[];
                        e.target.checked
                          ? handleAnswerChange(index, [...prev, opt])
                          : handleAnswerChange(index, prev.filter((o) => o !== opt));
                      }}
                    />
                  ))
                )}

                {question.type === QuestionType.FILLBLANK && (
                  <FloatingLabel label="Your answer">
                    <Form.Control
                      type="text"
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                    />
                  </FloatingLabel>
                )}

                {question.type === QuestionType.ASSOCIATION && (
                  question.body.split("&!!&").map((leftOpt, i) => (
                    <InputGroup key={i} className="mb-2">
                      <InputGroup.Text>{leftOpt}</InputGroup.Text>
                      <Form.Select
                        onChange={(e) => {
                          const arr = Array.isArray(answers[index]) ? [...answers[index] as string[]] : [];
                          arr[i] = e.target.value;
                          handleAnswerChange(index, arr);
                        }}
                      >
                        <option value="">Select match</option>
                        {question.answer.split("&!!&").map((rightOpt, j) => (
                          <option key={j} value={rightOpt}>
                            {rightOpt}
                          </option>
                        ))}
                      </Form.Select>
                    </InputGroup>
                  ))
                )}
              </div>
            ))}

            <Button variant="success" onClick={handleSubmit}>
              Submit Quiz
            </Button>

            <Button
              variant="secondary"
              className="ms-2"
              onClick={() => setSelectedQuiz(null)}
            >
              Back
            </Button>

            {score !== null && (
              <p className="mt-3">Your Score: {score}%</p>
            )}
          </Form>
        </>
      )}
    </Container>
  );
};

export default Quiz;