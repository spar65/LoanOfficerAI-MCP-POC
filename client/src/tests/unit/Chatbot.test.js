import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chatbot from '../../components/Chatbot';
import { ThemeProvider } from '@mui/material';
import farmTheme from '../../theme';

// Import axios mock
const axios = require('../../tests/mocks/axiosMock');

// Mock useRef and useEffect to avoid scrollIntoView errors
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useRef: jest.fn(() => ({ current: { scrollIntoView: jest.fn() } })),
  };
});

// Mock the API client
jest.mock('../../mcp/client', () => ({
  baseURL: 'http://localhost:3001/api',
  getAllLoans: jest.fn().mockResolvedValue([]),
  getLoanDetails: jest.fn().mockResolvedValue({
    loan_id: 'L001',
    borrower_id: 'B001',
    loan_amount: 50000,
    interest_rate: 3.5,
    status: 'Active',
    borrower: 'John Doe'
  }),
  getActiveLoans: jest.fn().mockResolvedValue([]),
  getLoanSummary: jest.fn().mockResolvedValue({
    totalLoans: 10,
    activeLoans: 5,
    totalAmount: 320000,
    delinquencyRate: 10
  })
}));

// Mock axios for OpenAI API calls
jest.mock('axios', () => require('../../tests/mocks/axiosMock'));

// Mock Auth Service
jest.mock('../../mcp/authService', () => ({
  getToken: jest.fn().mockReturnValue('fake-token')
}));

describe('Chatbot Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chatbot interface with correct title', () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Verify the title renders correctly
    expect(screen.getByText('AI Farm Loan Assistant')).toBeInTheDocument();
  });

  it('displays initial welcome message', () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Verify the welcome message is displayed
    expect(screen.getByText(/Hello! I'm your Farm Loan Assistant/i)).toBeInTheDocument();
  });

  it('includes quick action buttons for common loan queries', () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Verify quick action buttons are present
    expect(screen.getByText('Active Loans')).toBeInTheDocument();
    expect(screen.getByText('Portfolio Summary')).toBeInTheDocument();
    expect(screen.getByText('Loan Status')).toBeInTheDocument();
  });

  // Testing that OpenAI integration functions are properly defined
  it('properly configures OpenAI function schemas', () => {
    // Import the MCP_FUNCTIONS constant from Chatbot.js
    const { MCP_FUNCTIONS } = jest.requireActual('../../components/Chatbot');
    
    // Verify that function schemas are properly defined
    expect(MCP_FUNCTIONS).toBeDefined();
    
    // Check that essential functions are defined
    const functionNames = MCP_FUNCTIONS.map(f => f.name);
    expect(functionNames).toContain('getLoanDetails');
    expect(functionNames).toContain('getActiveLoans');
    expect(functionNames).toContain('getLoanSummary');
    
    // Verify a specific function schema has the correct structure
    const getLoanDetailsFunction = MCP_FUNCTIONS.find(f => f.name === 'getLoanDetails');
    expect(getLoanDetailsFunction).toHaveProperty('parameters.properties.loan_id');
    expect(getLoanDetailsFunction.parameters.required).toContain('loan_id');
  });
}); 