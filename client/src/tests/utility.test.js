/**
 * Client Utility Function Tests
 */
import mcpClient from '../mcp/client';

// Manually mock axios instead of using jest.mock
// This avoids issues with hoisting and module resolution
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { success: true } }))
}));

// Get the mocked axios
import axios from 'axios';

describe('MCP Client Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('baseURL is correctly set', () => {
    expect(mcpClient.baseURL).toBe('http://localhost:3001/api');
  });

  test('getAllLoans forms the correct URL', async () => {
    await mcpClient.getAllLoans();
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3001/api/loans');
  });
  
  test('getLoanDetails forms the correct URL', async () => {
    await mcpClient.getLoanDetails('L001');
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3001/api/loan/L001');
  });
  
  test('getBorrowers forms the correct URL', async () => {
    await mcpClient.getBorrowers();
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3001/api/borrowers');
  });
}); 