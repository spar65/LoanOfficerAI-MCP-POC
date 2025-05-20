import { render, screen } from '@testing-library/react';
import App from '../../App';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';

// Mock the MCP client
jest.mock('../../mcp/client', () => ({
  getAllLoans: jest.fn().mockResolvedValue([]),
  getLoanSummary: jest.fn().mockResolvedValue({
    totalLoans: 0,
    activeLoans: 0,
    totalAmount: 0,
    delinquencyRate: 0
  }),
  getBorrowers: jest.fn().mockResolvedValue([]),
  getLoanDetails: jest.fn().mockResolvedValue({}),
  getLoanPayments: jest.fn().mockResolvedValue([]),
  getActiveLoans: jest.fn().mockResolvedValue([])
}));

describe('App Component', () => {
  test('renders the App component correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    );
    
    // Check if the dashboard title is in the document
    expect(screen.getByText(/Loan Officer Dashboard/i)).toBeInTheDocument();
  });
}); 