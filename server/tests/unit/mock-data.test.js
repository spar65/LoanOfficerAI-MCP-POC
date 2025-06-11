/**
 * Mock data tests without auth dependencies
 * These tests validate data structures using mocks
 */

describe('Mock Data Tests', () => {
  const mockLoans = [
    { 
      loan_id: 'L001', 
      borrower_id: 'B001', 
      loan_amount: 50000,
      interest_rate: 3.5,
      term_length: 60,
      status: 'Active'
    },
    { 
      loan_id: 'L002', 
      borrower_id: 'B002', 
      loan_amount: 75000,
      interest_rate: 4.2,
      term_length: 120,
      status: 'Active'
    }
  ];

  const mockBorrowers = [
    {
      borrower_id: 'B001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com'
    },
    {
      borrower_id: 'B002',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com'
    }
  ];

  test('loans have the expected structure', () => {
    expect(mockLoans.length).toBe(2);
    
    // Check structure of first loan
    const loan = mockLoans[0];
    expect(loan).toHaveProperty('loan_id');
    expect(loan).toHaveProperty('borrower_id');
    expect(loan).toHaveProperty('loan_amount');
    expect(loan).toHaveProperty('interest_rate');
    expect(loan).toHaveProperty('term_length');
    expect(loan).toHaveProperty('status');
    
    // Check specific values
    expect(loan.loan_id).toBe('L001');
    expect(loan.borrower_id).toBe('B001');
    expect(loan.loan_amount).toBe(50000);
  });

  test('borrowers have the expected structure', () => {
    expect(mockBorrowers.length).toBe(2);
    
    // Check structure of first borrower
    const borrower = mockBorrowers[0];
    expect(borrower).toHaveProperty('borrower_id');
    expect(borrower).toHaveProperty('first_name');
    expect(borrower).toHaveProperty('last_name');
    expect(borrower).toHaveProperty('email');
    
    // Check specific values
    expect(borrower.borrower_id).toBe('B001');
    expect(borrower.first_name).toBe('John');
    expect(borrower.last_name).toBe('Doe');
  });

  test('can calculate total loan amount', () => {
    const totalAmount = mockLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
    expect(totalAmount).toBe(125000);
  });

  test('can join loan and borrower data', () => {
    const enrichedLoans = mockLoans.map(loan => {
      const borrower = mockBorrowers.find(b => b.borrower_id === loan.borrower_id);
      return {
        ...loan,
        borrower_name: borrower ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown'
      };
    });
    
    expect(enrichedLoans[0].borrower_name).toBe('John Doe');
    expect(enrichedLoans[1].borrower_name).toBe('Jane Smith');
  });
}); 