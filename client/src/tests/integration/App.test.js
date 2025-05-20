import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';
import mcpClientMock from '../mocks/mcpClientMock';

// Mock the API client
jest.mock('../../mcp/client', () => {
  return {
    __esModule: true,
    default: mcpClientMock
  };
});

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

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Reset mock functions before each test
    jest.clearAllMocks();
    
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
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
      expect(mcpClientMock.getLoanDetails).toHaveBeenCalledWith('L001');
    }, { timeout: 2000 });
  });
}); 