import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../../components/Dashboard';
import { ThemeProvider } from '@mui/material';
import farmTheme from '../../theme';

// Mock the API client
jest.mock('../../mcp/client', () => ({
  getLoans: jest.fn(),
  getBorrowers: jest.fn(),
  getPayments: jest.fn(),
  getEquipment: jest.fn(),
}));

import { getLoans, getBorrowers, getPayments, getEquipment } from '../../mcp/client';

describe('Dashboard Component', () => {
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

    getPayments.mockResolvedValue([
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

    getEquipment.mockResolvedValue([
      {
        equipment_id: 'E001',
        borrower_id: 'B001',
        type: 'Tractor',
        purchase_date: '2019-06-01',
        condition: 'Good',
        maintenance_records: []
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
    await waitFor(() => expect(getLoans).toHaveBeenCalled());
    
    // Check if dashboard title is rendered
    expect(screen.getByText(/Loan Officer Dashboard/i)).toBeInTheDocument();
    
    // Check if loan data is displayed
    await waitFor(() => {
      expect(screen.getByText('L001')).toBeInTheDocument();
      expect(screen.getByText('50,000')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('filters loans by status', async () => {
    // Set up additional mock data for filtering
    getLoans.mockResolvedValue([
      {
        loan_id: 'L001',
        borrower_id: 'B001',
        loan_amount: 50000,
        status: 'Active',
        loan_type: 'Land'
      },
      {
        loan_id: 'L003',
        borrower_id: 'B003',
        loan_amount: 20000,
        status: 'Pending',
        loan_type: 'Short-term'
      }
    ]);

    render(
      <ThemeProvider theme={farmTheme}>
        <Dashboard />
      </ThemeProvider>
    );

    // Wait for API calls to resolve
    await waitFor(() => expect(getLoans).toHaveBeenCalled());
    
    // Check that both loans are initially displayed
    await waitFor(() => {
      expect(screen.getByText('L001')).toBeInTheDocument();
      expect(screen.getByText('L003')).toBeInTheDocument();
    });
    
    // Click on status filter
    const filterButton = screen.getByText(/Status/i);
    userEvent.click(filterButton);
    
    // Select "Active" filter option
    const activeFilter = screen.getByText(/Active/i);
    userEvent.click(activeFilter);
    
    // Check that only the Active loan is displayed
    await waitFor(() => {
      expect(screen.getByText('L001')).toBeInTheDocument();
      expect(screen.queryByText('L003')).not.toBeInTheDocument();
    });
  });

  it('displays loan details when a loan is selected', async () => {
    render(
      <ThemeProvider theme={farmTheme}>
        <Dashboard />
      </ThemeProvider>
    );

    // Wait for API calls to resolve
    await waitFor(() => expect(getLoans).toHaveBeenCalled());
    
    // Find and click the first loan row
    const loanRow = await screen.findByText('L001');
    userEvent.click(loanRow);
    
    // Check if detailed view is displayed
    await waitFor(() => {
      expect(screen.getByText(/Loan Details/i)).toBeInTheDocument();
      expect(screen.getByText(/Loan ID: L001/i)).toBeInTheDocument();
      expect(screen.getByText(/Loan Amount: \$50,000/i)).toBeInTheDocument();
      expect(screen.getByText(/Interest Rate: 3.5%/i)).toBeInTheDocument();
    });
  });
}); 