import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizCreate from './QuizCreate';
import axios from 'axios';

// Mock axios to prevent actual API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the User type
const mockUser = {
  id: '67e1c77552f341264138101b'
};

describe('QuizCreate Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders the component with initial empty state', () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      
      expect(screen.getByText('Create a Quiz')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter quiz name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter class name')).toBeInTheDocument();
      expect(screen.getByText('Questions')).toBeInTheDocument();
      expect(screen.getByText('Add Question')).toBeInTheDocument();
      expect(screen.getByText('Submit Quiz')).toBeInTheDocument();
    });

    it('starts with empty questions array', () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      
      // Questions list should be empty (just the ul with no li items)
      const questionsList = screen.getByRole('list');
      expect(questionsList.children.length).toBe(0);
    });

    it('has controlled form inputs', () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      const quizNameInput = screen.getByPlaceholderText('Enter quiz name') as HTMLInputElement;
      const quizClassInput = screen.getByPlaceholderText('Enter class name') as HTMLInputElement;
      
      expect(quizNameInput.value).toBe('');
      expect(quizClassInput.value).toBe('');
    });
  });

  describe('Quiz Form State Management', () => {
    it('updates quiz name when user types', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      const quizNameInput = screen.getByPlaceholderText('Enter quiz name');
      await userEvent.type(quizNameInput, 'Math Quiz');
      
      expect(quizNameInput).toHaveValue('Math Quiz');
    });

    it('updates class name when user types', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      const quizClassInput = screen.getByPlaceholderText('Enter class name');
      await userEvent.type(quizClassInput, 'Math 101');
      
      expect(quizClassInput).toHaveValue('Math 101');
    });
  });

  describe('Question Modal Interaction', () => {
    it('opens modal when "Add Question" button is clicked', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      const addButton = screen.getByText('Add Question');
      await userEvent.click(addButton);
      
      // Modal should open (look for modal title by role)
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Question Management', () => {
    it('adds question to list after modal save', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      // Open modal
      await userEvent.click(screen.getByText('Add Question'));
      
      // Fill in question
      const questionInput = screen.getByPlaceholderText('Enter prefix statement');
      await userEvent.type(questionInput, 'What is 2+2?');
      
      // The question modal starts with options, we need to add at least 2 options
      // Click "Add Option" to ensure we have 2 options
      const addOptionButton = screen.getByText('Add Option');
      await userEvent.click(addOptionButton);
      
      // Save question
      await userEvent.click(screen.getByText('Save Question'));
      
      // Question should appear in the list
      await waitFor(() => {
        expect(screen.getByText(/What is 2\+2\?/)).toBeInTheDocument();
      });
    });

    it('increases question count when questions are added', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      const questionsList = screen.getByRole('list');
      expect(questionsList.children.length).toBe(0);
      
      // Add first question
      await userEvent.click(screen.getByText('Add Question'));
      const questionInput1 = screen.getByPlaceholderText('Enter prefix statement');
      await userEvent.type(questionInput1, 'Question 1');
      await userEvent.click(screen.getByText('Add Option'));
      await userEvent.click(screen.getByText('Save Question'));
      
      await waitFor(() => {
        expect(questionsList.children.length).toBe(1);
      });
      
      // Add second question
      await userEvent.click(screen.getByText('Add Question'));
      const questionInput2 = screen.getByPlaceholderText('Enter prefix statement');
      await userEvent.type(questionInput2, 'Question 2');
      await userEvent.click(screen.getByText('Add Option'));
      await userEvent.click(screen.getByText('Save Question'));
      
      await waitFor(() => {
        expect(questionsList.children.length).toBe(2);
      });
    });

    it('displays single select question correctly', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      await userEvent.click(screen.getByText('Add Question'));
      
      // Fill in question
      await userEvent.type(screen.getByPlaceholderText('Enter prefix statement'), 'Pick one');
      
      // Add options - we need at least 2 with proper values
      const addOptionButton = screen.getByText('Add Option');
      await userEvent.click(addOptionButton); // Now we have 2 option fields
      
      // Fill in options
      const textboxes = screen.getAllByRole('textbox');
      const optionFields = textboxes.filter(input => 
        input.getAttribute('id')?.startsWith('option-')
      );
      
      if (optionFields.length >= 2) {
        await userEvent.clear(optionFields[0]);
        await userEvent.type(optionFields[0], 'Option A');
        await userEvent.clear(optionFields[1]);
        await userEvent.type(optionFields[1], 'Option B');
      }
      
      await userEvent.click(screen.getByText('Save Question'));
      
      await waitFor(() => {
        expect(screen.getByText(/Pick one/)).toBeInTheDocument();
      });
    });

    it('deletes question when delete button clicked', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      // Add a question
      await userEvent.click(screen.getByText('Add Question'));
      await userEvent.type(screen.getByPlaceholderText('Enter prefix statement'), 'Delete me');
      await userEvent.click(screen.getByText('Add Option'));
      await userEvent.click(screen.getByText('Save Question'));
      
      await waitFor(() => {
        expect(screen.getByText(/Delete me/)).toBeInTheDocument();
      });
      
      // Delete the question
      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/Delete me/)).not.toBeInTheDocument();
      });
    });

    it('opens modal with question data when edit button clicked', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      // Add a question
      await userEvent.click(screen.getByText('Add Question'));
      await userEvent.type(screen.getByPlaceholderText('Enter prefix statement'), 'Edit me');
      await userEvent.click(screen.getByText('Add Option'));
      await userEvent.click(screen.getByText('Save Question'));
      
      await waitFor(() => {
        expect(screen.getByText(/Edit me/)).toBeInTheDocument();
      });
      
      // Click edit
      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);
      
      // Modal should open with the question text
      await waitFor(() => {
        const questionInput = screen.getByPlaceholderText('Enter prefix statement') as HTMLInputElement;
        expect(questionInput.value).toBe('Edit me');
      });
    });

    it('updates question when edited and saved', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      // Add a question
      await userEvent.click(screen.getByText('Add Question'));
      await userEvent.type(screen.getByPlaceholderText('Enter prefix statement'), 'Original');
      await userEvent.click(screen.getByText('Add Option'));
      await userEvent.click(screen.getByText('Save Question'));
      
      await waitFor(() => {
        expect(screen.getByText(/Original/)).toBeInTheDocument();
      });
      
      // Edit it
      await userEvent.click(screen.getByText('Edit'));
      
      const questionInput = screen.getByPlaceholderText('Enter prefix statement');
      await userEvent.clear(questionInput);
      await userEvent.type(questionInput, 'Updated');
      await userEvent.click(screen.getByText('Save Question'));
      
      await waitFor(() => {
        expect(screen.getByText(/Updated/)).toBeInTheDocument();
        expect(screen.queryByText(/Original/)).not.toBeInTheDocument();
      });
    });

    it('does not duplicate question when editing', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      // Add a question
      await userEvent.click(screen.getByText('Add Question'));
      await userEvent.type(screen.getByPlaceholderText('Enter prefix statement'), 'Unique');
      await userEvent.click(screen.getByText('Add Option'));
      await userEvent.click(screen.getByText('Save Question'));
      
      // Get all list items to count questions
      const questionsContainer = screen.getByText('Questions').parentElement;
      const questionItems = questionsContainer?.querySelectorAll('li');
      expect(questionItems?.length).toBe(1);
      
      // Edit it
      await userEvent.click(screen.getByText('Edit'));
      await userEvent.click(screen.getByText('Save Question'));
      
      // Should still be 1 question
      const questionItemsAfter = questionsContainer?.querySelectorAll('li');
      expect(questionItemsAfter?.length).toBe(1);
    });

    it('updates array indices correctly after delete', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      // Add 3 questions
      for (let i = 1; i <= 3; i++) {
        await userEvent.click(screen.getByText('Add Question'));
        await userEvent.type(screen.getByPlaceholderText('Enter prefix statement'), `Question ${i}`);
        await userEvent.click(screen.getByText('Add Option'));
        await userEvent.click(screen.getByText('Save Question'));
      }
      
      await waitFor(() => {
        expect(screen.getByText('1. Single Select:')).toBeInTheDocument();
        expect(screen.getByText('2. Single Select:')).toBeInTheDocument();
        expect(screen.getByText('3. Single Select:')).toBeInTheDocument();
      });
      
      // Delete the middle question (Question 2)
      const deleteButtons = screen.getAllByText('Delete');
      await userEvent.click(deleteButtons[1]);
      
      await waitFor(() => {
        expect(screen.queryByText(/Question 2/)).not.toBeInTheDocument();
        // Remaining questions should be renumbered
        expect(screen.getByText('1. Single Select:')).toBeInTheDocument();
        expect(screen.getByText('2. Single Select:')).toBeInTheDocument();
        expect(screen.queryByText('3. Single Select:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Question Display Rendering', () => {
    it('displays multi-select question with multiple answers', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      await userEvent.click(screen.getByText('Add Question'));
      
      // Change to multi-select
      const typeSelect = screen.getByRole('combobox', { name: '' });
      await userEvent.selectOptions(typeSelect, '2'); // Multi-select value
      
      await userEvent.type(screen.getByPlaceholderText('Enter prefix statement'), 'Select all');
      
      // Add multiple options
      await userEvent.click(screen.getByText('Add Option'));
      await userEvent.click(screen.getByText('Add Option'));
      
      await userEvent.click(screen.getByText('Save Question'));
      
      await waitFor(() => {
        expect(screen.getByText(/Select all/)).toBeInTheDocument();
      });
    });

    it('displays fill-in-the-blank question format', async () => {
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      await userEvent.click(screen.getByText('Add Question'));
      
      // Change to fill blank
      const typeSelect = screen.getByRole('combobox', { name: '' });
      await userEvent.selectOptions(typeSelect, '3'); // Fill blank value
      
      await userEvent.type(screen.getByPlaceholderText('Enter prefix statement'), 'The capital is');
      
      // Wait for fill blank fields to appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter answer')).toBeInTheDocument();
      });
      
      await userEvent.type(screen.getByPlaceholderText('Enter answer'), 'Paris');
      await userEvent.type(screen.getByPlaceholderText('Enter suffix statement'), 'of France');
      
      await userEvent.click(screen.getByText('Save Question'));
      
      await waitFor(() => {
        expect(screen.getByText(/The capital is ______ of France/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Modal', () => {
    it('shows error modal when API call fails', async () => {
      // Mock axios to reject
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));
      
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      // Fill in quiz details
      await userEvent.type(screen.getByPlaceholderText('Enter quiz name'), 'Test Quiz');
      
      // Add a question
      await userEvent.click(screen.getByText('Add Question'));
      await userEvent.type(screen.getByPlaceholderText('Enter prefix statement'), 'Question?');
      await userEvent.click(screen.getByText('Add Option'));
      await userEvent.click(screen.getByText('Save Question'));
      
      // Submit quiz
      await userEvent.click(screen.getByText('Submit Quiz'));
      
      // Error modal should appear
      await waitFor(() => {
        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      });
    });

    it('closes error modal when close button clicked', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));
      
      //render(<QuizCreate user={mockUser} />);
      render(<QuizCreate />);

      
      await userEvent.type(screen.getByPlaceholderText('Enter quiz name'), 'Test Quiz');
      await userEvent.click(screen.getByText('Add Question'));
      await userEvent.type(screen.getByPlaceholderText('Enter prefix statement'), 'Question?');
      await userEvent.click(screen.getByText('Add Option'));
      await userEvent.click(screen.getByText('Save Question'));
      await userEvent.click(screen.getByText('Submit Quiz'));
      
      await waitFor(() => {
        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getByText('Close');
      await userEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
      });
    });
  });
});
