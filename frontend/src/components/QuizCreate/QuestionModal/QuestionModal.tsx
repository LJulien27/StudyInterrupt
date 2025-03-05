import React, { useState, FormEvent, useEffect } from 'react';
import { Modal, Button, Form, FloatingLabel, InputGroup } from 'react-bootstrap';
import Associations from '../../../types/Associations';
import Question, { QuestionType } from '../../../types/Question';


interface QuestionModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (question: Question) => void;
  editingQuestion?: Question | null;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ show, onHide, onSave, editingQuestion }) => {
  const defaultQuestion = {
    type: QuestionType.SINGLESELECT,
    text: '',
    body: '',
    answer: '',
  };

  const [questionType, setQuestionType] = useState(defaultQuestion.type);
  const [question, setQuestion] = useState(defaultQuestion.text);
  const [body, setBody] = useState(defaultQuestion.body);
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
      setBody(editingQuestion.body);
      setAnswer(editingQuestion.answer);
    } else {
      // Reset to default when adding a new question
      setQuestionType(defaultQuestion.type);
      setQuestion(defaultQuestion.text);
      setBody(defaultQuestion.body);
      setAnswer(defaultQuestion.answer);
    }
  }, [editingQuestion, show]);


  /* Save the question according to the following format
  *
  * Multiple Choice:
  * QuestionType: 1 or 2
  * Text: Question text
  * Body: Option1&!!&Option2&!!&Option3
  * Answer: Option1&!!&Option2 (or Option1 for single select)
  * 
  * Fill in the Blank:
  * QuestionType: 3
  * Text: Question text before the blank
  * Body: Question text after the blank
  * Answer: Answer to the blank
  * 
  * Association:
  * QuestionType: 4
  * Text: Question text
  * Body: LeftOption1&!!&LeftOption2&!!&LeftOption3
  * Answer: RightOption1&!!&RightOption2&!!&RightOption3
  * 
  */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    
    if (questionType === QuestionType.ASSOCIATION) {

      // Check if the associations are complete
      for(const option in leftOptions) {
        if (!associations[leftOptions[option]]) {
          alert('Please select an association for each option');
          console.log("Associations are incomplete");
          return;
        }
      }

      onSave({ type: questionType, text: question, body: leftOptions.join('&!!&'), answer: rightOptions.join('&!!&') });
    }
    else if (questionType === QuestionType.FILLBLANK) {
      onSave({ type: questionType, text: question, body: questionEnd, answer });
    }
    else {
      // Ensure the body has at least two options
    const options = body.split('&!!&');
    if (options.length < 2) {
      alert('Please add at least two options');
      return;
    }

    // Ensure an answer exists among the options
    const answers = answer.split('&!!&');
    const validAnswers = answers.filter(ans => options.includes(ans));
    if (validAnswers.length < 1) {
      alert('Please select at least one valid answer');
      return;
    }

      onSave({ type: questionType, text: question, body, answer });
    }
  };

  const handleReset = () => {
    setQuestion(defaultQuestion.text);
    setBody(defaultQuestion.body);
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
        <Form.Select className="mb-2" value={questionType} onChange={(e) => {
          setQuestionType(Number(e.target.value));
          if (questionType < 3){
            setAnswer('');
          }}}>
            <option value={QuestionType.SINGLESELECT}>Single Select Multiple Choice</option>
            <option value={QuestionType.MULTISELECT}>Multi Select Multiple Choice</option>
            <option value={QuestionType.FILLBLANK}>Fill in the Blank</option>
            <option value={QuestionType.ASSOCIATION}>Association Question</option>
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
          {questionType === QuestionType.FILLBLANK && (
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

        {questionType === QuestionType.ASSOCIATION && (
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

          {(questionType === QuestionType.SINGLESELECT || questionType === QuestionType.MULTISELECT) && (
            <div>
                <label>Options:</label>
                {body.split('&!!&').map((option, index) => (
                <InputGroup key={index} className="mb-2">
                    <InputGroup.Checkbox
                        checked={answer.split('&!!&').map(a => a.trim()).includes(option)}
                        onChange={() => {
                          const answers = answer.split('&!!&').map(a => a.trim()).filter(a => a !== '');
                          if (questionType === QuestionType.SINGLESELECT) {
                            setAnswer(option);
                          } else if (answers.includes(option)) {
                            setAnswer(answers.filter(a => a !== option).join('&!!&'));
                          } else {
                            setAnswer([...answers, option].join('&!!&'));
                          }
                        }}
                    />
                    <FloatingLabel controlId={`option-${index}`} label={`Option ${index + 1}`}>
                        <Form.Control
                            type="text"
                            value={option}
                            onChange={(e) => {
                                const newOptions = [...body.split('&!!&')];
                                newOptions[index] = e.target.value;
                                setBody(newOptions.join('&!!&'));
                            }}
                            required
                        />
                    </FloatingLabel>
                  <Button variant="danger" onClick={() => setBody(body.split('&!!&').filter((_, i) => i !== index).join('&!!&'))}>
                      Remove
                  </Button>
                </InputGroup>
                ))}
                <Button variant="secondary" onClick={() => setBody(body + '&!!&')}>
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
