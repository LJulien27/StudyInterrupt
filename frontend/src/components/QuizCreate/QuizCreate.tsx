import React, { useState, FormEvent } from 'react';
import { QuizCreateWrapper } from './QuizCreate.styled';

interface QuizCreateProps {}

const QuizCreate = (props: QuizCreateProps) => {
  const [questionType, setQuestionType] = useState('single-select');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['']);
  const [answer, setAnswer] = useState('');

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log({ questionType, question, options, answer });
  };

  return (
    <QuizCreateWrapper>
      <h2>Create Quiz Question</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Question Type:</label>
          <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
            <option value="single-select">Single Select Multiple Choice</option>
            <option value="multi-select">Multi Select Multiple Choice</option>
            <option value="fill-in-the-blank">Fill in the Blank</option>
            <option value="association">Association Question</option>
          </select>
        </div>
        <div>
          <label>Question:</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
        </div>
        {(questionType === 'single-select' || questionType === 'multi-select') && (
          <div>
            <label>Options:</label>
            {options.map((option, index) => (
              <div key={index}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                />
              </div>
            ))}
            <button type="button" onClick={handleAddOption}>
              Add Option
            </button>
          </div>
        )}
        <div>
          <label>Answer:</label>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Question</button>
      </form>
    </QuizCreateWrapper>
  );
};

export default QuizCreate;