/**
 * Client API Tests
 * Tests for the client-side API client with authentication
 */
import axios from 'axios';
import mcpClient from '../../mcp/client';
import authService from '../../mcp/authService';

// Mock axios
jest.mock('axios');

// Mock authService
jest.mock('../../mcp/authService', () => ({
  getToken: jest.fn(),
  logAuthStatus: jest.fn()
}));

describe('Client API', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('API Configuration', () => {
    test('getConfig includes auth token when available', () => {
      // Mock token
      authService.getToken.mockReturnValue('mock-jwt-token');
      
      // Get config
      const config = mcpClient.getConfig();
      
      // Verify config includes authorization header
      expect(config.headers).toBeDefined();
      expect(config.headers.Authorization).toBe('Bearer mock-jwt-token');
      expect(config.withCredentials).toBe(true);
    });

    test('getConfig does not include auth token when not available', () => {
      // Mock no token
      authService.getToken.mockReturnValue(null);
      
      // Get config
      const config = mcpClient.getConfig();
      
      // Verify config doesn't include authorization header
      expect(config.headers).toEqual({});
      expect(config.withCredentials).toBe(true);
    });
  });

  describe('API Requests', () => {
    test('getAllLoans makes authenticated request', async () => {
      // Mock successful response
      const mockLoans = [{ loan_id: 'L001', borrower_id: 'B001' }];
      axios.get.mockResolvedValue({ data: mockLoans });
      
      // Mock token
      authService.getToken.mockReturnValue('mock-jwt-token');
      
      // Call getAllLoans
      const loans = await mcpClient.getAllLoans();
      
      // Verify axios was called with correct params
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/loans',
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock-jwt-token' }
        })
      );
      
      // Verify result
      expect(loans).toEqual(mockLoans);
    });

    test('getLoanSummary makes authenticated request', async () => {
      // Mock successful response
      const mockSummary = { totalLoans: 2, activeLoans: 1, totalAmount: 350000 };
      axios.get.mockResolvedValue({ data: mockSummary });
      
      // Mock token
      authService.getToken.mockReturnValue('mock-jwt-token');
      
      // Call getLoanSummary
      const summary = await mcpClient.getLoanSummary();
      
      // Verify axios was called with correct params
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/loans/summary',
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock-jwt-token' }
        })
      );
      
      // Verify result
      expect(summary).toEqual(mockSummary);
    });

    test('getLoanSummary handles error gracefully', async () => {
      // Mock error response
      axios.get.mockRejectedValue(new Error('Network error'));
      
      // Call getLoanSummary
      const summary = await mcpClient.getLoanSummary();
      
      // Verify default values are returned
      expect(summary).toEqual({
        totalLoans: 0,
        activeLoans: 0,
        totalAmount: 0,
        delinquencyRate: 0
      });
    });

    test('checkHealth makes unauthenticated request', async () => {
      // Mock successful response
      const mockHealth = { status: 'ok', timestamp: '2023-06-01T00:00:00Z' };
      axios.get.mockResolvedValue({ data: mockHealth });
      
      // Call checkHealth
      const health = await mcpClient.checkHealth();
      
      // Verify axios was called with correct params
      expect(axios.get).toHaveBeenCalledWith('http://localhost:3001/api/health');
      
      // Verify result
      expect(health).toEqual(mockHealth);
    });

    test('handleApiError handles different error types', () => {
      // Mock response error
      const responseError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
          headers: {}
        }
      };
      
      mcpClient.handleApiError(responseError, 'testEndpoint');
      
      // Mock request error
      const requestError = {
        request: {}
      };
      
      mcpClient.handleApiError(requestError, 'testEndpoint');
      
      // Mock setup error
      const setupError = {
        message: 'Network Error'
      };
      
      mcpClient.handleApiError(setupError, 'testEndpoint');
      
      // All three types should be handled without throwing
      expect(true).toBe(true);
    });
  });
}); 