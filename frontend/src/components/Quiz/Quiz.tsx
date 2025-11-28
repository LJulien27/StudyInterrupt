import React, { useEffect, useState } from 'react';
import { Container, Button, Form, FloatingLabel, InputGroup } from 'react-bootstrap';
import Question, { QuestionType } from '../../types/Question';
import axios from 'axios';
import { Username } from '../../types/Sessions';
import { useAuth } from '../../AuthContext';
import { useSessionBridge } from '../../contexts/SessionBridgeContext';

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


// Dummy quiz data
// let quizzes: Quiz[] = [
//   {
//     id: 1,
//     name: "Math Quiz",
//     className: "Math 101",
//     questions: [
//       { type: QuestionType.SINGLESELECT, text: "What is 2+2?", body: "3&!!&4&!!&5", answer: "4" },
//       { type: QuestionType.MULTISELECT, text: "Select even numbers:", body: "1&!!&2&!!&3&!!&4", answer: "2&!!&4" },
//       { type: QuestionType.FILLBLANK, text: "The capital of France is _____", body: "", answer: "Paris" },
//       { type: QuestionType.ASSOCIATION, text: "Match countries to capitals", body: "France&!!&USA", answer: "Paris&!!&Washington" },
//     ],
//   },
//   {
//     id: 2,
//     name: "Math Quiz 2",
//     className: "Math 101",
//     questions: [
//       { type: QuestionType.SINGLESELECT, text: "What is 2+2?", body: "3&!!&4&!!&5", answer: "4" },
//       { type: QuestionType.MULTISELECT, text: "Select even numbers:", body: "1&!!&2&!!&3&!!&4", answer: "2&!!&4" },
//       { type: QuestionType.FILLBLANK, text: "The capital of France is", body: "", answer: "Paris" },
//       { type: QuestionType.ASSOCIATION, text: "Match countries to capitals", body: "France&!!&USA", answer: "Paris&!!&Washington" },
//     ],
//   },
// ];



const Quiz: React.FC = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    if (!user || (!user._id && !user.id)) return;

    const userId = (user as any)._id || user.id;
    const fetchQuizzes = async () => {
      try {
        const response = await axios.get(`https://studyinterruptbackend.onrender.com/users/${userId}/quizzes`);
        let quizzes = Array.isArray(response.data.quizzes) ? response.data.quizzes : [];

        // If the route contains a quizId (e.g. from an interrupt) and that quiz
        // isn't in the user's quizzes, try fetching the quiz directly by id.
        try {
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
                const r2 = await axios.get(`https://studyinterruptbackend.onrender.com/quizzes/${quizId}`);
                // backend may return { quiz: {...} } or quiz object directly
                const fetched = r2.data && (r2.data.quiz || r2.data);
                if (fetched && fetched._id) {
                  quizzes = [...quizzes, fetched];
                }
              } catch (e) {
                console.warn('Failed to fetch quiz by id:', e);
              }
            }
          }
        } catch (e) {
          // ignore URL parsing errors
        }

        setQuizes(quizzes);
      } catch (err) {
        console.error('Failed to load quizzes for user:', err);
        setQuizes([]);
      }
    };

    fetchQuizzes();
  }, [user]);

  // If the route/query contains a quizId param (or hash with params), auto-select that quiz when quizzes are loaded
  useEffect(() => {
    if (!Quizes || Quizes.length === 0) return;
    try {
      let search = window.location.search || '';
      if ((!search || search === '') && window.location.hash) {
        // hash may contain a route and query like #/quiz?quizId=...
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
      if (match) {
        // auto-select
        handleQuizSelect(match);
      }
    } catch (e) {
      console.warn('Failed to auto-load quiz from URL', e);
    }
  }, [Quizes]);

  const { send, players: ctxPlayers, connected } = useSessionBridge();

  const handleQuizSelect = async (quiz: Quiz) => {
    if (deleteMode) {
      // toggle selection for deletion
      setSelectedForDeletion((prev) => {
        if (prev.includes(quiz._id)) return prev.filter((id) => id !== quiz._id);
        return [...prev, quiz._id];
      });
      return;
    }
    try {
      const response = await axios.get(`https://studyinterruptbackend.onrender.com/quizzes/${quiz._id}/questions`); // Fetch full quiz details
      setQuestions(Array.isArray(response.data.questions) ? response.data.questions : []); // Update state with fetched quiz
      setSelectedQuiz(quiz)
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      alert("Failed to load quiz questions. Please try again.");
    }
  };

  const handleAnswerChange = (index: number, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = async () => {
    const unansweredQuestions = Questions
      .map((question, index) => {
        if (!answers[index]) return `Q${index + 1}`;
        if (question.type === QuestionType.ASSOCIATION) {
          const selectedMatches = (answers[index] as string[]) || [];
          if (selectedMatches.some(match => match === "")) return `Q${index + 1}`;
        }
        return null;
      })
      .filter(Boolean);

    if (unansweredQuestions?.length) {
      alert(`You didn't answer: ${unansweredQuestions.join(", ")}`);
      return;
    }

    let correctAnswers = 0;
    Questions.forEach((question, index) => {
      const userAnswer = answers[index];
      if (!userAnswer) return;

      if (question.type === QuestionType.MULTISELECT || question.type === QuestionType.ASSOCIATION) {
        const correctAnswerSet = new Set(question.answer.split("&!!&"));
        const userAnswerSet = new Set(Array.isArray(userAnswer) ? userAnswer : userAnswer.split("&!!&"));
        if (correctAnswerSet.size === userAnswerSet.size && Array.from(correctAnswerSet).every(a => userAnswerSet.has(a))
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
  // Points: 10 points per correct answer (used for interrupt scoring)
  const pointsScore = correctAnswers * 10;
    //update contest grade

    /*
    const contest_response = await axios.get(`https://studyinterruptbackend.onrender.com/sessions/67d4ab26a97b4f67f45759c0/contests`);
    setContest(contest_response.data.contest)
    console.log(contest)
    
    if (contest && contest.grades) {

      let participantIndex = contest.participants.findIndex(
        (participant: Username) => participant.id == "67d4aafda97b4f67f45759bf"
      );
      console.log(finalScore)
      contest.grades[participantIndex] = finalScore;

      const contestToSend: ContestNoId = {
        "grades": contest.grades,
      "participants": contest.participants,
      "session_id": contest.session_id
      }

      
        
        console.log(contestToSend)
        const update_contest = await axios.put(`https://studyinterruptbackend.onrender.com/contests/${contest._id}`, contestToSend);
    }
    */

    

    
    setScore(finalScore);
    alert(`Quiz Submitted! You scored ${finalScore}%`);

    // If this quiz was launched as an interrupt, persist a pending submission locally so the backend
    // can be updated later when you add the server endpoint. This is frontend-only and safe to keep.
        try {
          if (pendingInterruptId) {
            try {
              const userId = (user as any)?._id || (user as any)?.id || null;
              // determine current score from context (if available)
              let currentScore = 0;
              try {
                const me = (ctxPlayers || []).find((p: any) => (p.id && String(p.id) === String(userId)) || p.username === (user as any)?.username);
                if (me && typeof me.score === 'number') currentScore = me.score;
              } catch (e) {
                currentScore = 0;
              }
              const newScore = currentScore + pointsScore;
              // Broadcast a score_update so the server will forward to other participants.
              // Include both the delta (points earned) and the new total to be robust.
              const scoreMsg = {
                type: 'score_update',
                payload: {
                  username: (user as any)?.username,
                  user_id: userId,
                  delta: pointsScore,
                  score: newScore,
                  interrupt_id: pendingInterruptId,
                  submitted_at: new Date().toISOString(),
                }
              };
              // Only attempt to send if WebSocket connection is active
              let sent = false;
              try {
                if (connected) {
                  sent = (send as any)(scoreMsg);
                } else {
                  sent = false;
                }
              } catch (e) {
                sent = false;
              }
              if (sent) console.log('Sent interrupt score update via WebSocket context:', scoreMsg);
              else console.log('No active WebSocket found via context; will save submission locally');
            } catch (e) {
              console.warn('Error while attempting to send score update via websocket context', e);
            }

        const userId = (user as any)?._id || (user as any)?.id || null;
        const submission = {
          interrupt_id: pendingInterruptId,
          user_id: userId,
          // points earned for this interrupt
          points_earned: pointsScore,
          // total score after this submission (best effort, may be stale)
          total_score: (ctxPlayers || []).find((p: any) => (p.id && String(p.id) === String(userId)) || p.username === (user as any)?.username)?.score ?? null,
          submitted_at: new Date().toISOString(),
        };
        try {
          localStorage.setItem(`si_pending_interrupt_submission_${pendingInterruptId}`, JSON.stringify(submission));
        } catch (e) {
          console.warn('Failed to save pending interrupt submission to localStorage', e);
        }
        console.log('Saved pending interrupt submission (frontend only):', submission);
      }
    } catch (e) {
      console.warn('Error handling pending interrupt submission', e);
    }
    // Return to quiz list view after submission
    setSelectedQuiz(null);
    setQuestions([]);
    setAnswers({});
    setScore(null);
  };

  return (
    <Container className="mt-4">
      <h2>Take a Quiz</h2>
      
      {!selectedQuiz ? (
        <>
          <div className="d-flex align-items-center justify-content-between">
            <h4>Select a Quiz:</h4>
            <div>
              {!deleteMode ? (
                <Button variant="outline-danger" size="sm" onClick={() => { setDeleteMode(true); setSelectedForDeletion([]); }} className="me-2">Delete Quizzes</Button>
              ) : (
                <>
                  <Button variant="danger" size="sm" onClick={async () => {
                    if (selectedForDeletion.length === 0) {
                      alert('No quizzes selected for deletion. Click quizzes to select them.');
                      return;
                    }
                    const ok = window.confirm(`Are you sure you want to delete ${selectedForDeletion.length} quiz(es)? This will also delete their questions.`);
                    if (!ok) return;
                    setDeleting(true);
                    try {
                      for (const id of selectedForDeletion) {
                        await axios.delete(`https://studyinterruptbackend.onrender.com/quizzes/${id}`);
                      }
                      // refresh quizzes list
                      const userId = (user as any)?._id || (user as any)?.id;
                      const response = await axios.get(`https://studyinterruptbackend.onrender.com/users/${userId}/quizzes`);
                      setQuizes(Array.isArray(response.data.quizzes) ? response.data.quizzes : []);
                      setSelectedForDeletion([]);
                      setDeleteMode(false);
                    } catch (e) {
                      console.error('Failed to delete quizzes', e);
                      alert('Failed to delete quizzes. See console for details.');
                    } finally {
                      setDeleting(false);
                    }
                  }} className="me-2" disabled={deleting}>{deleting ? 'Deleting…' : 'Confirm Delete'}</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => { setDeleteMode(false); setSelectedForDeletion([]); }}>Cancel</Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-3">
            {Quizes.map((quiz) => (
              <Button key={quiz._id} variant={selectedForDeletion.includes(quiz._id) ? 'danger' : 'primary'} className="m-2" onClick={() => handleQuizSelect(quiz)}>
                {quiz.title}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h3>{selectedQuiz.title}</h3>
          <Form>
            {Questions.map((question, index) => (
              <div key={index} className="mb-3">
                {question.type !== QuestionType.FILLBLANK && (
                  <strong>Q{index + 1}. {question.text}</strong>
                )}
                
                {question.type === QuestionType.SINGLESELECT && (
                  <Form.Select onChange={(e) => handleAnswerChange(index, e.target.value)}>
                    <option value="">Select an answer</option>
                    {question.body.split("&!!&").map((option, idx) => (
                      <option key={idx} value={option}>{option}</option>
                    ))}
                  </Form.Select>
                )}

                {question.type === QuestionType.MULTISELECT && (
                  question.body.split("&!!&").map((option, idx) => (
                    <Form.Check
                      key={idx}
                      type="checkbox"
                      label={option}
                      onChange={(e) => {
                        const checkedOptions = (answers[index] || []) as string[];
                        if (e.target.checked) {
                          handleAnswerChange(index, [...checkedOptions, option]);
                        } else {
                          handleAnswerChange(index, checkedOptions.filter((o) => o !== option));
                        }
                      }}
                    />
                  ))
                )}

                {question.type === QuestionType.FILLBLANK && (
                  <div>
                    <strong>Q{index + 1}. {question.text} ______ {question.body}</strong>
                    <FloatingLabel controlId={`fillblank-${index}`} label="Your Answer">
                      <Form.Control type="text" onChange={(e) => handleAnswerChange(index, e.target.value)} />
                    </FloatingLabel>
                  </div>
                )}

                {question.type === QuestionType.ASSOCIATION && (
                  question.body.split("&!!&").map((leftOption, idx) => (
                    <InputGroup key={idx} className="mb-2">
                      <InputGroup.Text>{leftOption}</InputGroup.Text>
                      <Form.Select onChange={(e) => {
                        const assocAnswers = Array.isArray(answers[index]) ? [...(answers[index] as string[])] : [];
                        assocAnswers[idx] = e.target.value;
                        handleAnswerChange(index, assocAnswers);
                      }}>
                        <option value="">Select match</option>
                        {question.answer.split("&!!&").map((rightOption, rIdx) => (
                          <option key={rIdx} value={rightOption}>{rightOption}</option>
                        ))}
                      </Form.Select>
                    </InputGroup>
                  ))
                )}
              </div>
            ))}

            <Button variant="success" onClick={handleSubmit}>Submit Quiz</Button>
            <Button variant="secondary" className="ms-2" onClick={() => setSelectedQuiz(null)}>Back</Button>
            {score !== null && <p className="mt-3">Your Score: {score}%</p>}
          </Form>
        </>
      )}
    </Container>
  );
};

export default Quiz;
