import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../theme';
import '@testing-library/jest-dom';

// Mock MUI components that might cause issues
jest.mock('@mui/x-charts/PieChart', () => {
  return function MockPieChart() {
    return <div data-testid="mock-pie-chart" />;
  };
});

// Define mock functions first to avoid hoisting issues
const mockGetLoanSummary = jest.fn();
const mockGetAllLoans = jest.fn();
const mockGetBorrowers = jest.fn();
const mockGetActiveLoans = jest.fn();

// Mock the MCP client with proper return values
jest.mock('../../mcp/client', () => ({
  getAllLoans: mockGetAllLoans,
  getLoanSummary: mockGetLoanSummary,
  getBorrowers: mockGetBorrowers,
  getActiveLoans: mockGetActiveLoans
}));

// Import Dashboard after mocking
const Dashboard = require('../../components/Dashboard').default;

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock implementations
    mockGetAllLoans.mockResolvedValue([
      {
        loan_id: 'L001',
        borrower_id: 'B001',
        loan_amount: 50000,
        interest_rate: 3.5,
        status: 'Active',
        borrower: 'John Doe'
      }
    ]);
    
    mockGetLoanSummary.mockResolvedValue({
      totalLoans: 10,
      activeLoans: 8,
      totalAmount: 500000,
      delinquencyRate: 5.5
    });
    
    mockGetBorrowers.mockResolvedValue([
      {
        borrower_id: 'B001',
        first_name: 'John',
        last_name: 'Doe'
      }
    ]);
    
    mockGetActiveLoans.mockResolvedValue([
      {
        loan_id: 'L001',
        borrower_id: 'B001',
        loan_amount: 50000,
        status: 'Active'
      }
    ]);
  });

  it('renders the dashboard with loan data', async () => {
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      );
    });

    // Wait for the component to load and display data
    await waitFor(() => {
      expect(screen.getByText('Total Loans')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Wait for the API calls to complete and data to be displayed
    await waitFor(() => {
      expect(mockGetLoanSummary).toHaveBeenCalled();
      expect(mockGetAllLoans).toHaveBeenCalled();
    }, { timeout: 5000 });

    // Check if summary data is displayed
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // totalLoans
    }, { timeout: 5000 });
  });

  it('displays loan summary data when loaded', async () => {
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      );
    });

    // Wait for data to load
    await waitFor(() => {
      expect(mockGetLoanSummary).toHaveBeenCalled();
    }, { timeout: 5000 });

    // Check if summary cards are rendered
    await waitFor(() => {
      expect(screen.getByText('Total Loans')).toBeInTheDocument();
      expect(screen.getByText('Active Loans')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
}); 