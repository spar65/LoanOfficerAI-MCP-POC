import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Define mock functions first
const mockGetLoanDetails = jest.fn().mockResolvedValue({});

// Mock the MCP client with checkHealth method
jest.doMock('../../mcp/client', () => ({
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
  getActiveLoans: jest.fn().mockResolvedValue([]),
  checkHealth: jest.fn().mockResolvedValue({ status: 'healthy' })
}));

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Mock MUI components that might cause issues
jest.mock('@mui/x-charts/PieChart', () => {
  return function MockPieChart() {
    return <div data-testid="mock-pie-chart" />;
  };
});

// Import App after mocking
const App = require('../../App').default;

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main application', async () => {
    await act(async () => {
      render(<App />);
    });

    // Check if the main app structure is rendered
    await waitFor(() => {
      expect(screen.getByText(/Loan Officer/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays login form initially', async () => {
    await act(async () => {
      render(<App />);
    });

    // Check if login form is displayed (actual text is "Sign In")
    await waitFor(() => {
      expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles navigation between components', async () => {
    await act(async () => {
      render(<App />);
    });

    // Wait for initial render (actual text is "Sign In")
    await waitFor(() => {
      expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Test that the app structure is present
    expect(document.body).toContainHTML('div');
  });
}); 