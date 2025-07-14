import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../theme';
import '@testing-library/jest-dom';

// Mock scrollIntoView before any components are loaded
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
});

// Mock the MCP client
jest.mock('../../mcp/client', () => ({
  getAllLoans: jest.fn().mockResolvedValue([
    {
      loan_id: 'L001',
      borrower_id: 'B001',
      loan_amount: 50000,
      interest_rate: 3.5,
      status: 'Active',
      borrower: 'John Doe'
    }
  ]),
  getLoanDetails: jest.fn().mockResolvedValue({
    loan_id: 'L001',
    borrower_id: 'B001',
    loan_amount: 50000,
    interest_rate: 3.5,
    status: 'Active',
    borrower: 'John Doe'
  }),
  getBorrowers: jest.fn().mockResolvedValue([
    {
      borrower_id: 'B001',
      first_name: 'John',
      last_name: 'Doe'
    }
  ]),
  getActiveLoans: jest.fn().mockResolvedValue([])
}));

// Mock axios for OpenAI API calls
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({
    data: {
      choices: [{
        message: {
          content: 'This is a mock response from the AI',
          role: 'assistant'
        }
      }]
    }
  }),
  get: jest.fn().mockResolvedValue({ data: {} })
}));

// Mock Auth Service
jest.mock('../../mcp/authService', () => ({
  getToken: jest.fn().mockReturnValue('fake-token')
}));

// Import Chatbot after mocking
const Chatbot = require('../../components/Chatbot').default;
const { MCP_FUNCTIONS } = require('../../components/Chatbot');

describe('Chatbot Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chatbot interface with correct title', () => {
    render(
      <ThemeProvider theme={theme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    expect(screen.getByText(/AI Farm Loan Assistant/i)).toBeInTheDocument();
  });

  it('displays initial welcome message', () => {
    render(
      <ThemeProvider theme={theme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Match the actual welcome message text
    expect(screen.getByText(/Hello! I'm your Farm Loan Assistant/i)).toBeInTheDocument();
  });

  it('includes quick action buttons for common loan queries', () => {
    render(
      <ThemeProvider theme={theme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Check for actual button text that exists in the component using more specific selectors
    expect(screen.getByRole('button', { name: /Active Loans/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Portfolio Summary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Default Risk/i })).toBeInTheDocument();
  });

  it('properly configures OpenAI function schemas', () => {
    // Verify that function schemas are properly defined
    expect(MCP_FUNCTIONS).toBeDefined();
    
    // Check that essential functions are defined (using actual function names)
    const functionNames = MCP_FUNCTIONS.map(f => f.name);
    expect(functionNames).toContain('getLoanDetails');
    expect(functionNames).toContain('getAllLoans');
    expect(functionNames).toContain('getActiveLoans');
    expect(functionNames).toContain('getLoansByBorrower');
    
    // Verify function schema structure
    const getLoanDetailsSchema = MCP_FUNCTIONS.find(f => f.name === 'getLoanDetails');
    expect(getLoanDetailsSchema).toHaveProperty('description');
    expect(getLoanDetailsSchema).toHaveProperty('parameters');
    expect(getLoanDetailsSchema.parameters).toHaveProperty('properties');
    expect(getLoanDetailsSchema.parameters.properties).toHaveProperty('loan_id');
  });
}); 