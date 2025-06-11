import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chatbot from '../../components/Chatbot';
import { ThemeProvider } from '@mui/material';
import farmTheme from '../../theme';

// Mock the API client
jest.mock('../../mcp/client', () => ({
  sendChatMessage: jest.fn(),
  getLoans: jest.fn(),
  getBorrowers: jest.fn(),
}));

import { sendChatMessage } from '../../mcp/client';

describe('Chatbot Component', () => {
  beforeEach(() => {
    // Setup mock response for sendChatMessage
    sendChatMessage.mockResolvedValue({
      message: 'This is a response from the AI assistant',
      data: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chatbot interface', () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Check for chatbot elements
    expect(screen.getByText(/Loan Officer AI/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('displays welcome message on load', () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Check for welcome message
    expect(screen.getByText(/Hello! I'm your Loan Officer AI assistant/i)).toBeInTheDocument();
  });

  it('sends user message and displays response', async () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Type a message
    const inputField = screen.getByPlaceholderText(/Type your message/i);
    userEvent.type(inputField, 'Show me loan L001');
    
    // Click send button
    const sendButton = screen.getByRole('button', { name: /send/i });
    userEvent.click(sendButton);
    
    // Check if user message is displayed
    expect(screen.getByText('Show me loan L001')).toBeInTheDocument();
    
    // Check if API was called with correct params
    expect(sendChatMessage).toHaveBeenCalledWith('Show me loan L001');
    
    // Check if bot response is displayed after API call
    await waitFor(() => {
      expect(screen.getByText('This is a response from the AI assistant')).toBeInTheDocument();
    });
  });

  it('allows sending message with Enter key', async () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Type a message
    const inputField = screen.getByPlaceholderText(/Type your message/i);
    userEvent.type(inputField, 'What is the status of loan L002{enter}');
    
    // Check if API was called
    expect(sendChatMessage).toHaveBeenCalledWith('What is the status of loan L002');
    
    // Check if response is displayed
    await waitFor(() => {
      expect(screen.getByText('This is a response from the AI assistant')).toBeInTheDocument();
    });
  });

  it('shows loading state while waiting for response', async () => {
    // Make the mock response take some time
    sendChatMessage.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          message: 'This is a delayed response',
          data: null
        });
      }, 100);
    }));

    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Type and send a message
    const inputField = screen.getByPlaceholderText(/Type your message/i);
    userEvent.type(inputField, 'Hello{enter}');
    
    // Check for loading indicator
    expect(await screen.findByText(/Loading/i)).toBeInTheDocument();
    
    // Check for response after loading
    await waitFor(() => {
      expect(screen.getByText('This is a delayed response')).toBeInTheDocument();
    });
  });

  it('handles error responses gracefully', async () => {
    // Mock an error response
    sendChatMessage.mockRejectedValue(new Error('API error'));

    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Type and send a message
    const inputField = screen.getByPlaceholderText(/Type your message/i);
    userEvent.type(inputField, 'This will error{enter}');
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error/i)).toBeInTheDocument();
    });
  });

  it('displays data visualization when response includes data', async () => {
    // Mock response with data
    sendChatMessage.mockResolvedValue({
      message: 'Here is the loan information',
      data: {
        type: 'loan',
        content: {
          loan_id: 'L001',
          borrower_id: 'B001',
          loan_amount: 50000,
          interest_rate: 3.5,
          term_length: 60,
          status: 'Active'
        }
      }
    });

    render(
      <ThemeProvider theme={farmTheme}>
        <Chatbot onClose={() => {}} />
      </ThemeProvider>
    );

    // Type and send a message
    const inputField = screen.getByPlaceholderText(/Type your message/i);
    userEvent.type(inputField, 'Show details for loan L001{enter}');
    
    // Check for text response
    await waitFor(() => {
      expect(screen.getByText('Here is the loan information')).toBeInTheDocument();
    });
    
    // Check for data visualization
    await waitFor(() => {
      expect(screen.getByText('L001')).toBeInTheDocument();
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      expect(screen.getByText('3.5%')).toBeInTheDocument();
    });
  });
}); 