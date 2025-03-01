import React, { useState, FormEvent, useEffect } from 'react';
import { Modal, Button, Form, FloatingLabel, InputGroup } from 'react-bootstrap';
import Associations from '../../../types/Associations';

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

  const [questionEnd, setQuestionEnd] = useState('');
  const [leftOptions, setLeftOptions] = useState(['']);
  const [rightOptions, setRightOptions] = useState(['']);
  const [associations, setAssociations] = useState<Associations>({});

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
    setQuestion(defaultQuestion.text);
    setOptions(defaultQuestion.options);
    setAnswer(defaultQuestion.answer);
    setQuestionEnd('');
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
          {questionType === 'fill-in-the-blank' && (
            <div>
               <FloatingLabel controlId="questionAnswer" label="Answer" className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Enter answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  />
               </FloatingLabel>
               <div/>
               <FloatingLabel controlId="questionEnd" label="Question End" className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Enter question end"
                  value={questionEnd}
                  onChange={(e) => setQuestionEnd(e.target.value)}
                  required
                  />
               </FloatingLabel>
                <div/>
                <FloatingLabel controlId="Preview" label="Preview" className="mb-3">
                <Form.Control
                  type="text"
                  value={question + ' ' + answer + ' ' + questionEnd}
                  required
                  readOnly
                  />
               </FloatingLabel>
            </div>
        )}

        {questionType === 'association' && (
          <div>
            <div>
              <label>Left Options:</label>
              {leftOptions.map((option, index) => (
                <FloatingLabel key={index} controlId={`leftOption-${index}`} label={`Left Option ${index + 1}`} className="mb-3">
                <Form.Control
                  type="text"
                  value={option}
                  onChange={(e) => handleLeftOptionChange(index, e.target.value)}
                  required
                />
              </FloatingLabel>
              ))}
            </div>
            <div>
              <label>Right Options:</label>
              {rightOptions.map((option, index) => (
                <FloatingLabel key={index} controlId={`rightOption-${index}`} label={`Right Option ${index + 1}`} className="mb-3">
                <Form.Control
                  type="text"
                  value={option}
                  onChange={(e) => handleRightOptionChange(index, e.target.value)}
                  required
                />
              </FloatingLabel>
              ))}
              <Button type="button" onClick={handleAddAssociationOption}>
                  Add Association Option
                </Button>
            </div>
            <div>
                <label>Associations:</label>
                {leftOptions.map((leftOption, index) => (
                  <div key={index}>
                    <label>{leftOption}</label>
                    <Form.Select
                      value={associations[leftOption] || ''}
                      onChange={(e) => handleAssociationChange(leftOption, e.target.value)}
                    >
                      <option value="">Select</option>
                      {rightOptions.map((rightOption, idx) => (
                        <option key={idx} value={rightOption}>
                          {rightOption}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                ))}
              </div>
          </div>
        )}

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
                            } else if (questionType === 'multi-select') {
                                setAnswer([...answers, option].join(', ')); // Add to answers
                            }
                            else {
                                setAnswer(option); // Set as the only answer
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
                  <Button variant="danger" onClick={() => setOptions(options.filter((_, i) => i !== index))}>
                      Remove
                  </Button>
                </InputGroup>
                ))}
                <Button variant="secondary" onClick={() => setOptions([...options, ''])}>
                    Add Option
                </Button>
            </div>
          )}
          <div className='mt-3'>
            <Button type="submit" variant="success">
              Save Question
            </Button>
            <Button variant="warning" className="ms-2" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default QuestionModal;
