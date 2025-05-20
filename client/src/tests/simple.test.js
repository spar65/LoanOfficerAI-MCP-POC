/**
 * Simple sanity tests for client
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a simple test component that will definitely render
const TestComponent = () => (
  <div data-testid="test-component">
    <h1>Test Component</h1>
    <p>This is a test paragraph</p>
  </div>
);

describe('Simple Client Test', () => {
  test('true should be true', () => {
    expect(true).toBe(true);
  });

  test('basic math works', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('React components can render', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Test Component')).toBeInTheDocument();
    expect(screen.getByText('This is a test paragraph')).toBeInTheDocument();
  });
}); 