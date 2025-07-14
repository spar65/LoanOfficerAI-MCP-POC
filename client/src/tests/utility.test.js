/**
 * MCP Client Utilities Test
 * Tests the utility functions used by the MCP client
 */
import axios from 'axios';
import mcpClient from '../mcp/client';

// Mock axios
jest.mock('axios');

describe('MCP Client Utilities', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup axios mock to return proper responses
    axios.get.mockResolvedValue({ 
      data: {
        loans: [],
        borrowers: [],
        message: 'Mock data response'
      }
    });
  });

  test('baseURL is correctly set', () => {
    expect(mcpClient.baseURL).toBe('http://localhost:3001/api');
  });

  test('getAllLoans forms the correct URL', async () => {
    await mcpClient.getAllLoans();
    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3001/api/loans',
      expect.objectContaining({
        headers: expect.any(Object),
        withCredentials: true
      })
    );
  });
  
  test('getLoanDetails forms the correct URL', async () => {
    await mcpClient.getLoanDetails('L001');
    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3001/api/loan/L001',
      expect.objectContaining({
        headers: expect.any(Object),
        withCredentials: true
      })
    );
  });
  
  test('getBorrowers forms the correct URL', async () => {
    await mcpClient.getBorrowers();
    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3001/api/borrowers',
      expect.objectContaining({
        headers: expect.any(Object),
        withCredentials: true
      })
    );
  });
}); 