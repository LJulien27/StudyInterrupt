import React, { useEffect, useState } from 'react';
import { Container, Button, Form, FloatingLabel, InputGroup } from 'react-bootstrap';
import Question, { QuestionType } from '../../types/Question';
import axios from 'axios';
import { Username } from '../../types/Sessions';
import { useAuth } from '../../AuthContext';

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
  const [answers, setAnswers] = useState<{ [key: number]: string | string[] }>({});
  const [score, setScore] = useState<number | null>(null);
  const [Quizes, setQuizes] = useState<Quiz[]>([]);
  const [Questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!user || (!user._id && !user.id)) return;
    
    const userId = (user as any)._id || user.id;
    const fetchQuizzes = async () => {
      const response = await axios.get(`https://studyinterruptbackend.onrender.com/users/${userId}/quizzes`);
      setQuizes(Array.isArray(response.data.quizzes) ? response.data.quizzes : []);
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

  const handleQuizSelect = async (quiz: Quiz) => {
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
  };

  return (
    <Container className="mt-4">
      <h2>Take a Quiz</h2>
      
      {!selectedQuiz ? (
        <>
          <h4>Select a Quiz:</h4>
          {Quizes.map((quiz) => (
          <Button key={quiz._id} variant="primary" className="m-2" onClick={() => handleQuizSelect(quiz)}>
            {quiz.title}
          </Button>
        ))}
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
