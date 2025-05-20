import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../../components/Dashboard';
import { ThemeProvider } from '@mui/material';
import farmTheme from '../../theme';

// Mock the API client
jest.mock('../../mcp/client', () => ({
  getAllLoans: jest.fn(),
  getBorrowers: jest.fn(),
  getLoanDetails: jest.fn(),
  getLoanPayments: jest.fn(),
  getActiveLoans: jest.fn(),
  getLoanSummary: jest.fn(),
  getBorrowerDetails: jest.fn(),
  getLoanCollateral: jest.fn(),
}));

import mcpClient from '../../mcp/client';

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Setup mock responses
    mcpClient.getAllLoans.mockResolvedValue([
      {
        loan_id: 'L001',
        borrower_id: 'B001',
        loan_amount: 50000,
        interest_rate: 3.5,
        term_length: 60,
        start_date: '2024-01-01',
        end_date: '2029-01-01',
        status: 'Active',
        loan_type: 'Land',
        borrower: 'John Doe',
        borrower_details: {
          first_name: 'John',
          last_name: 'Doe'
        }
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
        loan_type: 'Equipment',
        borrower: 'Jane Smith',
        borrower_details: {
          first_name: 'Jane',
          last_name: 'Smith'
        }
      }
    ]);

    mcpClient.getBorrowers.mockResolvedValue([
      {
        borrower_id: 'B001',
        first_name: 'John',
        last_name: 'Doe',
        address: '123 Farm Rd, Smalltown, USA',
        phone: '555-1234',
        email: 'john@example.com',
        credit_score: 750,
        income: 100000,
        farm_size: 500,
        farm_type: 'Crop'
      },
      {
        borrower_id: 'B002',
        first_name: 'Jane',
        last_name: 'Smith',
        address: '456 Barn Ave, Smalltown, USA',
        phone: '555-5678',
        email: 'jane@example.com',
        credit_score: 720,
        income: 80000,
        farm_size: 300,
        farm_type: 'Livestock'
      }
    ]);

    mcpClient.getLoanPayments.mockResolvedValue([
      {
        payment_id: 'P001',
        loan_id: 'L001',
        payment_date: '2024-02-01',
        amount: 1000,
        status: 'On Time'
      },
      {
        payment_id: 'P002',
        loan_id: 'L001',
        payment_date: '2024-03-01',
        amount: 1000,
        status: 'On Time'
      }
    ]);

    mcpClient.getLoanDetails.mockResolvedValue({
      loan_id: 'L001',
      borrower_id: 'B001',
      loan_amount: 50000,
      interest_rate: 3.5,
      term_length: 60,
      start_date: '2024-01-01',
      end_date: '2029-01-01',
      status: 'Active',
      loan_type: 'Land',
      borrower: 'John Doe',
      borrower_details: {
        first_name: 'John',
        last_name: 'Doe'
      },
      payments: [
        {
          payment_id: 'P001',
          loan_id: 'L001',
          payment_date: '2024-02-01',
          amount: 1000,
          status: 'On Time'
        }
      ],
      collateral: [
        {
          collateral_id: 'C001',
          loan_id: 'L001',
          description: '100 acres of farmland',
          value: 75000.0
        }
      ]
    });

    mcpClient.getLoanSummary.mockResolvedValue({
      totalLoans: 2,
      activeLoans: 2,
      totalAmount: 80000,
      delinquencyRate: 0
    });

    mcpClient.getActiveLoans.mockResolvedValue([
      {
        loan_id: 'L001',
        borrower_id: 'B001',
        loan_amount: 50000,
        status: 'Active',
        borrower: 'John Doe'
      }
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dashboard with loan data', async () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Dashboard />
      </ThemeProvider>
    );

    // Wait for API calls to resolve
    await waitFor(() => expect(mcpClient.getAllLoans).toHaveBeenCalled());
    
    // Check if dashboard title is rendered
    expect(screen.getByText(/Loan Officer Dashboard/i)).toBeInTheDocument();
  });

  it('makes API calls to get necessary data', async () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Dashboard />
      </ThemeProvider>
    );

    // Verify that the necessary API calls were made
    await waitFor(() => {
      expect(mcpClient.getAllLoans).toHaveBeenCalled();
      expect(mcpClient.getLoanSummary).toHaveBeenCalled();
    });
  });
}); 