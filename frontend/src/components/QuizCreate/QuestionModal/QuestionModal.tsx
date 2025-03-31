// Importing necessary libraries and components
import React, { useState, FormEvent, useEffect } from 'react';
import { Modal, Button, Form, FloatingLabel, InputGroup } from 'react-bootstrap';
import Associations from '../../../types/Associations';
import Question, { QuestionType } from '../../../types/Question';

// Defining the props interface for the QuestionModal component
interface QuestionModalProps {
  show: boolean; // Determines whether the modal is visible
  onHide: () => void; // Function to handle closing the modal
  onSave: (question: Question) => void; // Function to save the question
  editingQuestion?: Question | null; // The question being edited (if any)
}

// Functional component for the Question Modal
const QuestionModal: React.FC<QuestionModalProps> = ({ show, onHide, onSave, editingQuestion }) => {
  // Default question structure
  const defaultQuestion = {
    type: QuestionType.SINGLESELECT,
    text: '',
    body: '',
    answer: '',
  };

  // State variables for managing question details
  const [questionType, setQuestionType] = useState(defaultQuestion.type); // Type of the question
  const [question, setQuestion] = useState(defaultQuestion.text); // Question text
  const [body, setBody] = useState(defaultQuestion.body); // Question body (e.g., options)
  const [answer, setAnswer] = useState(defaultQuestion.answer); // Correct answer(s)

  // Additional state variables for specific question types
  const [questionEnd, setQuestionEnd] = useState(''); // Suffix for fill-in-the-blank questions
  const [leftOptions, setLeftOptions] = useState(['']); // Left options for association questions
  const [rightOptions, setRightOptions] = useState(['']); // Right options for association questions
  const [associations, setAssociations] = useState<Associations>({}); // Associations for matching questions

  // Validation state
  const [validated, setValidated] = useState(false); // Form validation state
  const [invalidAssociations, setInvalidAssociations] = useState<string[]>([]); // Invalid associations

  // Load data when editing an existing question
  useEffect(() => {
    if (editingQuestion) {
      // Populate state with the existing question's data
      setQuestionType(editingQuestion.type);
      setQuestion(editingQuestion.text);
      setBody(editingQuestion.body);
      setAnswer(editingQuestion.answer);

      if (editingQuestion.type === QuestionType.ASSOCIATION) {
        // Parse associations for association questions
        setLeftOptions(editingQuestion.body.split('&!!&'));
        setRightOptions(editingQuestion.answer.split('&!!&'));
        setAssociations(
          Object.fromEntries(
            editingQuestion.body.split('&!!&').map((key, i) => [key, editingQuestion.answer.split('&!!&')[i]])
          )
        );
      } else if (editingQuestion.type === QuestionType.FILLBLANK) {
        setQuestionEnd(editingQuestion.body);
      }
      setValidated(true);
    } else {
      // Reset to default when adding a new question
      setQuestionType(defaultQuestion.type);
      setQuestion(defaultQuestion.text);
      setBody(defaultQuestion.body);
      setAnswer(defaultQuestion.answer);
      setQuestionEnd('');
      setAssociations({});
      setLeftOptions(['']);
      setRightOptions(['']);
      setValidated(false);
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
      const invalidAssociationsTemp: string[] = [];
      // Validate associations
      for (const option in leftOptions) {
        if (!associations[leftOptions[option]]) {
          invalidAssociationsTemp.push(leftOptions[option]);
        }
      }

      setInvalidAssociations(invalidAssociationsTemp);

      if (invalidAssociationsTemp.length > 0) {
        return;
      }

      setValidated(true);
      const leftOptionsSave = Object.keys(associations);
      const rightOptionsSave = Object.values(associations);
      onSave({
        type: questionType,
        text: question,
        body: leftOptionsSave.join('&!!&'),
        answer: rightOptionsSave.join('&!!&'),
      });
    } else if (questionType === QuestionType.FILLBLANK) {
      setValidated(true);
      onSave({ type: questionType, text: question, body: questionEnd, answer });
    } else {
      // Validate multiple-choice questions
      const options = body.split('&!!&');
      if (options.length < 2) {
        alert('Please add at least two options');
        return;
      }

      const answers = answer.split('&!!&');
      const validAnswers = answers.filter((ans) => options.includes(ans));
      if (validAnswers.length < 1) {
        alert('Please select at least one valid answer');
        return;
      }

      setValidated(true);
      onSave({ type: questionType, text: question, body, answer });
    }
  };

  /**
   * Resets the form to its default state.
   */
  const handleReset = () => {
    setQuestion(defaultQuestion.text);
    setBody(defaultQuestion.body);
    setAnswer(defaultQuestion.answer);
    setQuestionEnd('');
    setAssociations({});
    setLeftOptions(['']);
    setRightOptions(['']);
  };

  /**
   * Adds a new association option for association questions.
   */
  const handleAddAssociationOption = () => {
    setLeftOptions([...leftOptions, '']);
    setRightOptions([...rightOptions, '']);
  };

  /**
   * Handles changes to left options for association questions.
   */
  const handleLeftOptionChange = (index: number, value: string) => {
    const newLeftOptions = [...leftOptions];
    newLeftOptions[index] = value;
    setLeftOptions(newLeftOptions);
  };

  /**
   * Handles changes to right options for association questions.
   */
  const handleRightOptionChange = (index: number, value: string) => {
    const newRightOptions = [...rightOptions];
    newRightOptions[index] = value;
    setRightOptions(newRightOptions);
  };

  /**
   * Handles changes to associations for association questions.
   */
  const handleAssociationChange = (leftOption: string, rightOption: string) => {
    const newAssociations = { ...associations };

    // Remove any existing association with the right option
    Object.keys(newAssociations).forEach((key) => {
      if (newAssociations[key] === rightOption) {
        delete newAssociations[key];
      }
    });

    // Set the new association
    newAssociations[leftOption] = rightOption;

    setAssociations(newAssociations);
    setInvalidAssociations(invalidAssociations.filter((option) => option !== leftOption));
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Question</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          {/* Question type selector */}
          <Form.Select
            className="mb-2"
            value={questionType}
            onChange={(e) => {
              setQuestionType(Number(e.target.value));
              if (questionType < 3) {
                setAnswer('');
              }
            }}
          >
            <option value={QuestionType.SINGLESELECT}>Single Select Multiple Choice</option>
            <option value={QuestionType.MULTISELECT}>Multi Select Multiple Choice</option>
            <option value={QuestionType.FILLBLANK}>Fill in the Blank</option>
            <option value={QuestionType.ASSOCIATION}>Association Question</option>
          </Form.Select>

          {/* Question text input */}
          <FloatingLabel controlId="questionText" label="Question" className="mb-3">
            <Form.Control
              type="text"
              placeholder="Enter prefix statement"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
            <Form.Control.Feedback type="invalid">Please provide a valid question.</Form.Control.Feedback>
          </FloatingLabel>

          {/* Additional inputs for specific question types */}
          {questionType === QuestionType.FILLBLANK && (
            <div>
              {/* Fill-in-the-blank inputs */}
              <FloatingLabel controlId="questionAnswer" label="Answer" className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Enter answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                />
                <Form.Control.Feedback type="invalid">Please provide a valid answer.</Form.Control.Feedback>
              </FloatingLabel>
              <FloatingLabel controlId="questionEnd" label="Question End" className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Enter suffix statement"
                  value={questionEnd}
                  onChange={(e) => setQuestionEnd(e.target.value)}
                  required
                />
                <Form.Control.Feedback type="invalid">Please provide a valid end to your question.</Form.Control.Feedback>
              </FloatingLabel>
              <FloatingLabel controlId="Preview" label="Preview" className="mb-3">
                <Form.Control type="text" value={question + ' ' + answer + ' ' + questionEnd} required readOnly />
              </FloatingLabel>
            </div>
          )}

          {questionType === QuestionType.ASSOCIATION && (
            <div>
              {/* Association inputs */}
              <label>Left Options:</label>
              {leftOptions.map((option, index) => (
                <FloatingLabel key={index} controlId={`leftOption-${index}`} label={`Left Option ${index + 1}`} className="mb-3">
                  <Form.Control
                    type="text"
                    value={option}
                    onChange={(e) => handleLeftOptionChange(index, e.target.value)}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please provide a valid lefthand option.</Form.Control.Feedback>
                </FloatingLabel>
              ))}
              <label>Right Options:</label>
              {rightOptions.map((option, index) => (
                <FloatingLabel key={index} controlId={`rightOption-${index}`} label={`Right Option ${index + 1}`} className="mb-3">
                  <Form.Control
                    type="text"
                    value={option}
                    onChange={(e) => handleRightOptionChange(index, e.target.value)}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please provide a valid righthand option.</Form.Control.Feedback>
                </FloatingLabel>
              ))}
              <Button type="button" onClick={handleAddAssociationOption}>
                Add Association Option
              </Button>
              <label>Associations:</label>
              {leftOptions.map((leftOption, index) => (
                <div key={index}>
                  <label>{leftOption}</label>
                  <Form.Select
                    value={associations[leftOption] || ''}
                    onChange={(e) => handleAssociationChange(leftOption, e.target.value)}
                    isInvalid={invalidAssociations.includes(leftOption)}
                  >
                    <option value="">Select</option>
                    {rightOptions.map((rightOption, idx) => (
                      <option key={idx} value={rightOption}>
                        {rightOption}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">Please select a valid association.</Form.Control.Feedback>
                </div>
              ))}
            </div>
          )}

          {(questionType === QuestionType.SINGLESELECT || questionType === QuestionType.MULTISELECT) && (
            <div>
              {/* Multiple-choice inputs */}
              <label>Options:</label>
              {body.split('&!!&').map((option, index) => (
                <InputGroup key={index} className="mb-2">
                  <InputGroup.Checkbox
                    checked={answer.split('&!!&').map((a) => a.trim()).includes(option)}
                    onChange={() => {
                      const answers = answer.split('&!!&').map((a) => a.trim()).filter((a) => a !== '');
                      if (questionType === QuestionType.SINGLESELECT) {
                        setAnswer(option);
                      } else if (answers.includes(option)) {
                        setAnswer(answers.filter((a) => a !== option).join('&!!&'));
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
                  <Button
                    variant="danger"
                    onClick={() => setBody(body.split('&!!&').filter((_, i) => i !== index).join('&!!&'))}
                  >
                    Remove
                  </Button>
                </InputGroup>
              ))}
              <Button variant="secondary" onClick={() => setBody(body + '&!!&')}>
                Add Option
              </Button>
            </div>
          )}

          {/* Save and reset buttons */}
          <div className="mt-3">
            <Button type="submit" variant="success">
              Save Question
            </Button>
            <Button variant="warning" className="ms-2" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// Exporting the QuestionModal component for use in other parts of the application
export default QuestionModal;
