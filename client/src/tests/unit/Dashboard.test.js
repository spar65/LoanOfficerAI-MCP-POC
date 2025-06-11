import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import Dashboard from '../../components/Dashboard';
import { ThemeProvider } from '@mui/material';
import theme from '../../theme';
import '@testing-library/jest-dom';

// Mock the MCP client directly
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
  getActiveLoans: jest.fn().mockResolvedValue([
    {
      loan_id: 'L001',
      borrower_id: 'B001',
      loan_amount: 50000,
      status: 'Active'
    }
  ])
}));

// Mock MUI components that might cause issues
jest.mock('@mui/x-charts/PieChart', () => {
  return function MockPieChart() {
    return <div data-testid="mock-pie-chart" />;
  };
});

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dashboard with loan data', async () => {
    // Use act to handle async state updates
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      );
    });
    
    // Check if dashboard title is rendered
    expect(screen.getByText(/Loan Officer Dashboard/i)).toBeInTheDocument();
  });

  it('displays loan summary data when loaded', async () => {
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      );
    });
    
    // Wait for data to load and check summary stats
    await waitFor(() => {
      expect(screen.getByText(/Total Loans: 10/i)).toBeInTheDocument();
    });
  });
}); 