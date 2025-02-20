import React, { useState, FormEvent } from 'react';
import { QuizCreateWrapper } from './QuizCreate.styled';

interface QuizCreateProps {}

const QuizCreate = (props: QuizCreateProps) => {
  const [questionType, setQuestionType] = useState('single-select');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['']);
  const [answer, setAnswer] = useState('');
  const [questionS, setQuestionS] = useState('');
  const [questionE, setQuestionE] = useState('');

  const handleFillInTheBlank = (qstart: string, qend: string) => {
      if (questionType === 'fill-in-the-blank') {
         setQuestion(qstart + ' &&& ' + qend);
      }
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    // Filer out answers not in the new options
    const validAnswers = answer.split(',').map(a => a.trim()).filter(a => newOptions.includes(a));
    setAnswer(validAnswers.join(', '));
  };

  const handleCheckboxChange = (option: string) => {
   const answers = answer.split(',').map(a => a.trim()).filter(a => a !== '');
   if (answers.includes(option)) {
     setAnswer(answers.filter(a => a !== option).join(', '));
   } else {
     setAnswer([...answers, option].join(', '));
   }
 };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Handle form submission logic here
    console.log({ questionType, question, options, answer });
    // Add an 'Are you sure' Modal here
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
        {questionType === 'fill-in-the-blank' && (
            <div>
               <label>Question Start:</label>
               <input
               type="text"
               value={questionS}
               onChange={(e) => setQuestionS(e.target.value)}
               required
               />
               <div/>
               <label>Answer:</label>
               <input
               type="text"
               value={answer}
               onChange={(e) => setAnswer(e.target.value)}
               required
               />
               <div/>
               <label>Question End:</label>
               <input 
               type="text" 
               value={questionE}
               onChange={(e) => setQuestionE(e.target.value)}
               required
               />
               <div/>
               <label>Preview:</label>
               <input
               type="text"
               value={questionS + ' ' + answer + ' ' + questionE}
               required
               readOnly
               />
            </div>
        )}

        {questionType === 'association' && (<div>
            <label>Question:</label>
            <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            />

            // Add association question logic here
        </div>)}
            

        {(questionType === 'single-select' || questionType === 'multi-select') && (
          <div>
          <label>Question:</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
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
                {questionType === 'single-select' ? (
                <input
                  type="radio"
                  name="answer"
                  checked={answer === option}
                  onChange={() => setAnswer(option)}
                />
                )
                : (
                  <input
                     type="checkbox"
                     name="answer"
                     checked={answer.split(',').map(a => a.trim()).includes(option)}
                     onChange={() => handleCheckboxChange(option)}
                  />
                )
               }
              </div>
            ))}
            <button type="button" onClick={handleAddOption}>
              Add Option
            </button>
          </div>
         </div>
        )}

        <button type="submit">Create Question</button>
      </form>
    </QuizCreateWrapper>
  );
};

export default QuizCreate;