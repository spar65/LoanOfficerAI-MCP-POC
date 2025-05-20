/**
 * Test Setup File
 * 
 * This file contains common mocks and setup for React component tests.
 * Import this at the top of your test files.
 */

// Make DOM testing utilities available
import '@testing-library/jest-dom';

// Mock scrollIntoView - properly define as a function
window.HTMLElement.prototype.scrollIntoView = function() {};
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = function() {};
}

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

// Mock the MCP client API
export const createMockClient = () => ({
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
  getLoanDetails: jest.fn().mockResolvedValue({
    loan_id: 'L001',
    borrower_id: 'B001',
    loan_amount: 50000,
    interest_rate: 3.5,
    status: 'Active'
  }),
  getActiveLoans: jest.fn().mockResolvedValue([]),
  getLoanPayments: jest.fn().mockResolvedValue([])
});

// Simple function to create a mock theme provider 
export const withThemeProvider = (Component) => (
  <div data-testid="themed-root">
    {Component}
  </div>
); 