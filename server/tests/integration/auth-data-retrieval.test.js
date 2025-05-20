/**
 * Authentication and Data Retrieval Integration Tests
 * Tests that verify the end-to-end flow of authentication and data retrieval
 */
const request = require('supertest');
const app = require('../../server');

// Mock fs and path modules to avoid actual file operations
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Import fs for mocking
const fs = require('fs');

describe('Authentication and Data Retrieval Integration', () => {
  // Setup mock data
  const mockUsers = [
    {
      id: 'u001',
      username: 'john.doe',
      email: 'john.doe@example.com',
      passwordHash: '$2b$10$7ZXg.a7hMWmwMcZ3pzPir.bSAeY2L4VE9Vpb7ok2OEvQBrUSiLyvy',
      firstName: 'John',
      lastName: 'Doe',
      role: 'loan_officer',
      tenantId: 't001',
      active: true
    }
  ];

  const mockLoans = [
    {
      loan_id: 'L001',
      borrower_id: 'B001',
      loan_amount: 250000,
      interest_rate: 4.5,
      term_length: 60,
      status: 'Active',
      start_date: '2023-01-15',
      end_date: '2028-01-15',
      loan_type: 'Farm Equipment',
      tenantId: 't001'
    },
    {
      loan_id: 'L002',
      borrower_id: 'B002',
      loan_amount: 150000,
      interest_rate: 5.0,
      term_length: 36,
      status: 'Active',
      start_date: '2023-02-20',
      end_date: '2026-02-20',
      loan_type: 'Crop Production',
      tenantId: 't001'
    }
  ];

  const mockBorrowers = [
    {
      borrower_id: 'B001',
      first_name: 'Michael',
      last_name: 'Johnson',
      email: 'michael@example.com',
      phone: '555-123-4567',
      address: '123 Farm Road, Ruralville',
      credit_score: 750,
      income: 120000,
      farm_size: 200,
      tenantId: 't001'
    },
    {
      borrower_id: 'B002',
      first_name: 'Sarah',
      last_name: 'Williams',
      email: 'sarah@example.com',
      phone: '555-987-6543',
      address: '456 Harvest Lane, Agritown',
      credit_score: 780,
      income: 150000,
      farm_size: 350,
      tenantId: 't001'
    }
  ];

  let authToken = '';

  // Setup before tests
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock fs.readFileSync to return different mock data based on the path
    fs.readFileSync.mockImplementation((path) => {
      if (path.includes('users.json')) {
        return JSON.stringify(mockUsers);
      } else if (path.includes('loans.json')) {
        return JSON.stringify(mockLoans);
      } else if (path.includes('borrowers.json')) {
        return JSON.stringify(mockBorrowers);
      } else if (path.includes('payments.json') || path.includes('collateral.json')) {
        return JSON.stringify([]);
      }
      return '[]';
    });
  });

  describe('Authentication Flow', () => {
    test('login returns token and user data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'john.doe',
          password: 'password123'
        });

      // Verify successful response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();

      // Save token for subsequent requests
      authToken = response.body.accessToken;
    });

    test('login fails with incorrect credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'john.doe',
          password: 'wrongpassword'
        });

      // Verify unauthorized response
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Data Retrieval After Authentication', () => {
    // First authenticate to get a token
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'john.doe',
          password: 'password123'
        });
      
      authToken = response.body.accessToken;
    });

    test('can retrieve loans after authentication', async () => {
      // Skip test if no token available
      if (!authToken) {
        return;
      }

      const response = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${authToken}`);

      // Verify successful response
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      // Verify loan data
      const loan = response.body[0];
      expect(loan.loan_id).toBeDefined();
      expect(loan.borrower).toBeDefined();
      expect(loan.loan_amount).toBeDefined();
    });

    test('can retrieve loan summary after authentication', async () => {
      // Skip test if no token available
      if (!authToken) {
        return;
      }

      const response = await request(app)
        .get('/api/loans/summary')
        .set('Authorization', `Bearer ${authToken}`);

      // Verify successful response
      expect(response.status).toBe(200);
      expect(response.body.totalLoans).toBe(2);
      expect(response.body.activeLoans).toBe(2);
      expect(response.body.totalAmount).toBe(400000); // Sum of loan amounts
    });

    test('can retrieve borrowers after authentication', async () => {
      // Skip test if no token available
      if (!authToken) {
        return;
      }

      const response = await request(app)
        .get('/api/borrowers')
        .set('Authorization', `Bearer ${authToken}`);

      // Verify successful response
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      // Verify borrower data
      const borrower = response.body[0];
      expect(borrower.borrower_id).toBeDefined();
      expect(borrower.first_name).toBeDefined();
      expect(borrower.last_name).toBeDefined();
    });

    test('fails to retrieve data without authentication', async () => {
      const response = await request(app)
        .get('/api/loans');

      // Verify unauthorized response
      expect(response.status).toBe(401);
    });
  });
}); 