import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../../App';
import '@testing-library/jest-dom';

// Mock the API client directly
const mockGetLoanDetails = jest.fn().mockResolvedValue({});
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
  getLoanSummary: jest.fn().mockResolvedValue({
    totalLoans: 10,
    activeLoans: 8,
    totalAmount: 500000,
    delinquencyRate: 5.5
  }),
  getBorrowers: jest.fn().mockResolvedValue([
    {
      borrower_id: 'B001',
      first_name: 'John',
      last_name: 'Doe'
    }
  ]),
  getLoanDetails: mockGetLoanDetails,
  getLoanPayments: jest.fn().mockResolvedValue([]),
  getActiveLoans: jest.fn().mockResolvedValue([])
}));

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
};

// Mock MUI components that might cause issues
jest.mock('@mui/x-charts/PieChart', () => {
  return function MockPieChart() {
    return <div data-testid="mock-pie-chart" />;
  };
});

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Reset mock functions before each test
    jest.clearAllMocks();
    
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });
  
  it('renders the Dashboard component', async () => {
    await act(async () => {
      render(<App />);
    });

    // Check if Dashboard is rendered
    await waitFor(() => {
      expect(screen.getByText(/Loan Officer Dashboard/i)).toBeInTheDocument();
    });
  });
  
  it('renders both Dashboard and Chatbot components', async () => {
    render(<App />);

    // Check if Dashboard is rendered
    await waitFor(() => {
      expect(screen.getByText(/Loan Officer Dashboard/i)).toBeTruthy();
    });
    
    // Initially, the chatbot should be hidden, but the FAB should be visible
    expect(screen.getByRole('button', { name: /chat/i })).toBeTruthy();
  });
  
  it('opens and closes the chatbot drawer', async () => {
    render(<App />);
    
    // Initially, chatbot should be closed
    expect(screen.queryByText(/AI Farm Loan Assistant/i)).toBeFalsy();
    
    // Click the chat button to open the chatbot
    const chatButton = screen.getByRole('button', { name: /chat/i });
    fireEvent.click(chatButton);
    
    // Chatbot should now be visible
    await waitFor(() => {
      expect(screen.getByText(/AI Farm Loan Assistant/i)).toBeTruthy();
    });
    
    // Close the chatbot
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Chatbot should be closed
    await waitFor(() => {
      expect(screen.queryByText(/AI Farm Loan Assistant/i)).toBeFalsy();
    });
  });
  
  it('allows interaction between dashboard and chatbot', async () => {
    render(<App />);
    
    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText(/Loan Officer Dashboard/i)).toBeTruthy();
    });
    
    // Open the chatbot
    const chatButton = screen.getByRole('button', { name: /chat/i });
    fireEvent.click(chatButton);
    
    // Verify chatbot is open
    await waitFor(() => {
      expect(screen.getByText(/AI Farm Loan Assistant/i)).toBeTruthy();
    });
    
    // Type a message in the chatbot
    const inputField = screen.getByPlaceholderText(/Ask about loans/i);
    fireEvent.change(inputField, { target: { value: 'Show me loan L001' } });
    
    // Send the message
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    // Verify the message was sent
    await waitFor(() => {
      expect(screen.getByText(/Show me loan L001/i)).toBeTruthy();
    });
    
    // Verify a response is received
    await waitFor(() => {
      expect(jest.mock('../../mcp/client').getLoanDetails).toHaveBeenCalledWith('L001');
    }, { timeout: 2000 });
  });
}); 