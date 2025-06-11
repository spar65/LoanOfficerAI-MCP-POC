import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// Mock the API client
jest.mock('../../mcp/client', () => ({
  getLoans: jest.fn(),
  getBorrowers: jest.fn(),
  getPayments: jest.fn(),
  getEquipment: jest.fn(),
  sendChatMessage: jest.fn(),
}));

import { getLoans, getBorrowers, getPayments, getEquipment, sendChatMessage } from '../../mcp/client';

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Setup mock responses
    getLoans.mockResolvedValue([
      {
        loan_id: 'L001',
        borrower_id: 'B001',
        loan_amount: 50000,
        interest_rate: 3.5,
        term_length: 60,
        start_date: '2024-01-01',
        end_date: '2029-01-01',
        status: 'Active',
        loan_type: 'Land'
      },
      {
        loan_id: 'L002',
        borrower_id: 'B002',
        loan_amount: 30000,
        interest_rate: 4.0,
        term_length: 36,
        start_date: '2024-06-15',
        end_date: '2027-06-15',
        status: 'Active',
        loan_type: 'Equipment'
      }
    ]);

    getBorrowers.mockResolvedValue([
      {
        borrower_id: 'B001',
        first_name: 'John',
        last_name: 'Doe',
        credit_score: 750
      },
      {
        borrower_id: 'B002',
        first_name: 'Jane',
        last_name: 'Smith',
        credit_score: 720
      }
    ]);

    getPayments.mockResolvedValue([
      {
        payment_id: 'P001',
        loan_id: 'L001',
        payment_date: '2024-02-01',
        amount: 1000,
        status: 'On Time'
      }
    ]);

    getEquipment.mockResolvedValue([
      {
        equipment_id: 'E001',
        borrower_id: 'B001',
        type: 'Tractor'
      }
    ]);

    sendChatMessage.mockResolvedValue({
      message: 'Here is the loan information you requested.',
      data: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders both Dashboard and Chatbot components', async () => {
    render(<App />);

    // Check if Dashboard is rendered
    await waitFor(() => {
      expect(screen.getByText(/Loan Officer Dashboard/i)).toBeInTheDocument();
    });
    
    // Check if ChatBot button is rendered (but not the chatbot itself yet)
    expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
  });

  it('opens and closes the chatbot drawer', async () => {
    render(<App />);
    
    // Initially, chatbot should be closed
    expect(screen.queryByText(/Loan Officer AI/i)).not.toBeInTheDocument();
    
    // Click the chat button to open the chatbot
    const chatButton = screen.getByRole('button', { name: /chat/i });
    userEvent.click(chatButton);
    
    // Chatbot should now be visible
    await waitFor(() => {
      expect(screen.getByText(/Loan Officer AI/i)).toBeInTheDocument();
    });
    
    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    userEvent.click(closeButton);
    
    // Chatbot should be closed again
    await waitFor(() => {
      expect(screen.queryByText(/Loan Officer AI/i)).not.toBeInTheDocument();
    });
  });

  it('allows interaction between dashboard and chatbot', async () => {
    // Setup mock response for a specific loan query
    sendChatMessage.mockImplementation((message) => {
      if (message.includes('L001')) {
        return Promise.resolve({
          message: 'Here is information about loan L001',
          data: {
            type: 'loan',
            content: {
              loan_id: 'L001',
              borrower_id: 'B001',
              loan_amount: 50000,
              status: 'Active'
            }
          }
        });
      }
      return Promise.resolve({
        message: 'I don\'t have information about that.',
        data: null
      });
    });

    render(<App />);
    
    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText(/Loan Officer Dashboard/i)).toBeInTheDocument();
    });
    
    // Open the chatbot
    const chatButton = screen.getByRole('button', { name: /chat/i });
    userEvent.click(chatButton);
    
    // Type a message asking about loan L001
    const inputField = await screen.findByPlaceholderText(/Type your message/i);
    userEvent.type(inputField, 'Tell me about loan L001{enter}');
    
    // Check chatbot response
    await waitFor(() => {
      expect(screen.getByText('Here is information about loan L001')).toBeInTheDocument();
      expect(screen.getAllByText('L001').length).toBeGreaterThan(0);
    });
    
    // Close the chatbot
    const closeButton = screen.getByRole('button', { name: /close/i });
    userEvent.click(closeButton);
    
    // Click on the loan in the dashboard table
    await waitFor(() => {
      const loanRow = screen.getAllByText('L001')[0];
      userEvent.click(loanRow);
    });
    
    // Check if detailed loan view is displayed in dashboard
    await waitFor(() => {
      expect(screen.getByText(/Loan Details/i)).toBeInTheDocument();
    });
  });
}); 