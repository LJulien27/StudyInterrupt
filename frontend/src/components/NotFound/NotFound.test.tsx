import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from './NotFound';

describe('NotFound Component', () => {
  describe('Basic Rendering', () => {
    it('renders the component', () => {
      render(<NotFound />);
      
      // Component should be in the document
      expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('displays 404 heading', () => {
      render(<NotFound />);
      
      const heading404 = screen.getByText('404');
      expect(heading404).toBeInTheDocument();
      expect(heading404.tagName).toBe('H1');
    });

    it('displays "Page Not Found" heading', () => {
      render(<NotFound />);
      
      const pageNotFoundHeading = screen.getByText('Page Not Found');
      expect(pageNotFoundHeading).toBeInTheDocument();
      expect(pageNotFoundHeading.tagName).toBe('H3');
    });

    it('displays error message', () => {
      render(<NotFound />);
      
      const errorMessage = screen.getByText(/Sorry, the page you are looking for does not exist/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Structure and Layout', () => {
    it('renders within a Container component', () => {
      const { container } = render(<NotFound />);
      
      // Container should have Bootstrap class
      const containerElement = container.querySelector('.container');
      expect(containerElement).toBeInTheDocument();
    });

    it('has centered text styling', () => {
      const { container } = render(<NotFound />);
      
      // Should have text-center class
      const textCenterElement = container.querySelector('.text-center');
      expect(textCenterElement).toBeInTheDocument();
    });

    it('has top margin styling', () => {
      const { container } = render(<NotFound />);
      
      // Should have mt-5 class (margin-top)
      const marginTopElement = container.querySelector('.mt-5');
      expect(marginTopElement).toBeInTheDocument();
    });
  });

  describe('Content Verification', () => {
    it('displays all expected text elements', () => {
      render(<NotFound />);
      
      // Verify all three text elements are present
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText(/Sorry, the page you are looking for does not exist/i)).toBeInTheDocument();
    });

    it('message text is in a paragraph element', () => {
      render(<NotFound />);
      
      const message = screen.getByText(/Sorry, the page you are looking for does not exist/i);
      expect(message.tagName).toBe('P');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<NotFound />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h3 = screen.getByRole('heading', { level: 3 });
      
      expect(h1).toHaveTextContent('404');
      expect(h3).toHaveTextContent('Page Not Found');
    });

    it('is accessible to screen readers', () => {
      const { container } = render(<NotFound />);
      
      // All text content should be accessible
      const allText = container.textContent;
      expect(allText).toContain('404');
      expect(allText).toContain('Page Not Found');
      expect(allText).toContain('Sorry, the page you are looking for does not exist');
    });
  });

  describe('Snapshot Testing', () => {
    it('matches snapshot', () => {
      const { container } = render(<NotFound />);
      expect(container).toMatchSnapshot();
    });

    it('renders consistently', () => {
      const { container: container1 } = render(<NotFound />);
      const { container: container2 } = render(<NotFound />);
      
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });
  });

  describe('Component Isolation', () => {
    it('does not require any props', () => {
      // Should render without any props
      expect(() => render(<NotFound />)).not.toThrow();
    });

    it('is a functional component', () => {
      // Verify it's a React component
      expect(React.isValidElement(<NotFound />)).toBe(true);
    });

    it('does not have any side effects on mount', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      render(<NotFound />);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Bootstrap Integration', () => {
    it('uses Bootstrap Container component correctly', () => {
      const { container } = render(<NotFound />);
      
      const bootstrapContainer = container.querySelector('.container');
      expect(bootstrapContainer).toHaveClass('text-center');
      expect(bootstrapContainer).toHaveClass('mt-5');
    });

    it('applies Bootstrap utility classes', () => {
      const { container } = render(<NotFound />);
      
      const containerDiv = container.querySelector('.container.text-center.mt-5');
      expect(containerDiv).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('renders correctly multiple times', () => {
      const { rerender } = render(<NotFound />);
      
      expect(screen.getByText('404')).toBeInTheDocument();
      
      rerender(<NotFound />);
      
      expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('cleans up properly on unmount', () => {
      const { unmount } = render(<NotFound />);
      
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Text Content Formatting', () => {
    it('has correct punctuation', () => {
      render(<NotFound />);
      
      const message = screen.getByText(/Sorry, the page you are looking for does not exist\./);
      expect(message).toBeInTheDocument();
    });

    it('uses proper capitalization', () => {
      render(<NotFound />);
      
      // All headings and sentences should be properly capitalized
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText(/^Sorry/)).toBeInTheDocument();
    });
  });
});
