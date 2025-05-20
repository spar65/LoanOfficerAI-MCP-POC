// Mock implementation of the MCP client for tests
const mcpClientMock = {
  getAllLoans: jest.fn().mockImplementation(() => Promise.resolve([
    {
      loan_id: 'L001',
      borrower_id: 'B001',
      loan_amount: 50000,
      interest_rate: 3.5,
      status: 'Active',
      borrower: 'John Doe'
    }
  ])),

  getLoanDetails: jest.fn().mockImplementation((loanId) => Promise.resolve({
    loan_id: loanId || 'L001',
    borrower_id: 'B001',
    loan_amount: 50000,
    interest_rate: 3.5,
    term_length: 60,
    status: 'Active',
    borrower: 'John Doe',
    borrower_details: {
      first_name: 'John',
      last_name: 'Doe'
    },
    payments: [
      {
        payment_id: 'P001',
        loan_id: loanId || 'L001',
        amount: 1000,
        status: 'On Time'
      }
    ],
    collateral: [
      {
        collateral_id: 'C001',
        loan_id: loanId || 'L001',
        type: 'Land',
        value: 75000,
        description: 'Farm land, 50 acres'
      }
    ]
  })),

  getLoanStatus: jest.fn().mockImplementation(() => Promise.resolve('Active')),
  
  getActiveLoans: jest.fn().mockImplementation(() => Promise.resolve([
    {
      loan_id: 'L001',
      borrower_id: 'B001',
      loan_amount: 50000,
      interest_rate: 3.5,
      status: 'Active',
      borrower: 'John Doe'
    }
  ])),
  
  getLoansByBorrower: jest.fn().mockImplementation(() => Promise.resolve([
    {
      loan_id: 'L001',
      borrower_id: 'B001',
      loan_amount: 50000,
      interest_rate: 3.5,
      status: 'Active',
      borrower: 'John Doe'
    }
  ])),
  
  getLoanPayments: jest.fn().mockImplementation(() => Promise.resolve([
    {
      payment_id: 'P001',
      loan_id: 'L001',
      amount: 1000,
      status: 'On Time'
    }
  ])),
  
  getLoanCollateral: jest.fn().mockImplementation(() => Promise.resolve([
    {
      collateral_id: 'C001',
      loan_id: 'L001',
      type: 'Land',
      value: 75000,
      description: 'Farm land, 50 acres'
    }
  ])),
  
  getLoanSummary: jest.fn().mockImplementation(() => Promise.resolve({
    totalLoans: 10,
    activeLoans: 8,
    totalAmount: 500000,
    delinquencyRate: 5.5
  })),
  
  getBorrowers: jest.fn().mockImplementation(() => Promise.resolve([
    {
      borrower_id: 'B001',
      first_name: 'John',
      last_name: 'Doe',
      credit_score: 720,
      farm_size: 100,
      farm_type: 'Crop'
    }
  ])),
  
  getBorrowerDetails: jest.fn().mockImplementation(() => Promise.resolve({
    borrower_id: 'B001',
    first_name: 'John',
    last_name: 'Doe',
    credit_score: 720,
    farm_size: 100,
    farm_type: 'Crop'
  }))
};

export default mcpClientMock; 