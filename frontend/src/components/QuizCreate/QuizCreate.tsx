import React, { useState, FormEvent } from 'react';
import { QuizCreateWrapper } from './QuizCreate.styled';
import ConfirmModal from '../ConfirmModal/ConfirmModal';

interface QuizCreateProps {}

type Associations = { [key: string]: string };

const QuizCreate = (props: QuizCreateProps) => {
  const [questionType, setQuestionType] = useState('single-select');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['']);
  const [answer, setAnswer] = useState('');
  const [questionS, setQuestionS] = useState('');
  const [questionE, setQuestionE] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leftOptions, setLeftOptions] = useState(['']);
  const [rightOptions, setRightOptions] = useState(['']);
  const [associations, setAssociations] = useState<Associations>({});


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

 const handleAddAssociationOption = () => {
   setLeftOptions([...leftOptions, '']);
   setRightOptions([...rightOptions, '']);
 };

 const handleLeftOptionChange = (index: number, value: string) => {
   const newLeftOptions = [...leftOptions];
   newLeftOptions[index] = value;
   setLeftOptions(newLeftOptions);
 };

 const handleRightOptionChange = (index: number, value: string) => {
   const newRightOptions = [...rightOptions];
   newRightOptions[index] = value;
   setRightOptions(newRightOptions);
 };

 const handleAssociationChange = (leftOption: string, rightOption: string) => {
   // Create a new associations object without the old association
   const newAssociations = { ...associations };
 
   // Remove any existing association with the right option
   Object.keys(newAssociations).forEach(key => {
     if (newAssociations[key] === rightOption) {
       delete newAssociations[key];
     }
   });
 
   // Set the new association
   newAssociations[leftOption] = rightOption;
 
   setAssociations(newAssociations);
 };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    setIsModalOpen(true);

    // Handle form submission logic here
    console.log({ questionType, question, options, answer });
    // Add an 'Are you sure' Modal here
  };

  const handleConfirm = () => {
      setIsModalOpen(false);
      //submit & reset form
  };

  const handleCancel = () => {
      setIsModalOpen(false);
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

{questionType === 'association' && (
          <div>
            <label>Question:</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
            <div>
              <label>Left Options:</label>
              {leftOptions.map((option, index) => (
                <div key={index}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleLeftOptionChange(index, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
            <div>
              <label>Right Options:</label>
              {rightOptions.map((option, index) => (
                <div key={index}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleRightOptionChange(index, e.target.value)}
                    required
                  />
                </div>
              ))}
              <button type="button" onClick={handleAddAssociationOption}>
                Add Association Option
              </button>
            </div>
            <div>
              <label>Associations:</label>
              {leftOptions.map((leftOption, index) => (
                <div key={index}>
                  <span>{leftOption}</span>
                  <select
                    value={associations[leftOption] || ''}
                    onChange={(e) => handleAssociationChange(leftOption, e.target.value)}
                  >
                    <option value="">Select</option>
                    {rightOptions.map((rightOption, idx) => (
                      <option key={idx} value={rightOption}>
                        {rightOption}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
            

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
      <ConfirmModal isOpen={isModalOpen} onConfirm={handleConfirm} onCancel={handleCancel} />
    </QuizCreateWrapper>
  );
};

export default QuizCreate;