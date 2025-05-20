import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chatbot from '../../components/Chatbot';
import { ThemeProvider } from '@mui/material';
import farmTheme from '../../theme';
import '@testing-library/jest-dom';

// Mock the API client directly
jest.mock('../../mcp/client', () => ({
  getAllLoans: jest.fn().mockResolvedValue([]),
  getLoanDetails: jest.fn().mockImplementation((loanId) => Promise.resolve({
    loan_id: loanId || 'L001',
    borrower_id: 'B001',
    loan_amount: 50000,
    interest_rate: 3.5,
    status: 'Active',
    borrower: 'John Doe'
  })),
  getActiveLoans: jest.fn().mockResolvedValue([]),
  getBorrowers: jest.fn().mockResolvedValue([])
}));

describe('Chatbot Component', () => {
  beforeEach(() => {
    // Reset mock data before each test
    jest.clearAllMocks();
  });

  it('renders the chatbot interface', () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Check for chatbot elements
    expect(screen.getByText(/AI Farm Loan Assistant/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask about loans/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('displays welcome message on load', () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Check for welcome message
    expect(screen.getByText(/Hello! Ask about loan status/i)).toBeInTheDocument();
  });

  it('sends user message and shows it in the chat', async () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Type a message
    const inputField = screen.getByPlaceholderText(/Ask about loans/i);
    await userEvent.type(inputField, 'Show me loan L001');
    
    // Click send button
    const sendButton = screen.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);
    
    // Check if user message is displayed
    expect(screen.getByText('Show me loan L001')).toBeInTheDocument();
  });
}); 