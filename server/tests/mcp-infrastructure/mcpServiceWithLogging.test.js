/**
 * Unit Tests for MCPServiceWithLogging
 * 
 * Tests the functionality of the MCPServiceWithLogging class, including:
 * - PII redaction
 * - Error handling
 * - Function execution wrapping
 */

const MCPServiceWithLogging = require('../../services/mcpServiceWithLogging');
const logService = require('../../services/logService');

// Mock dependencies
jest.mock('../../services/logService', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  mcp: jest.fn() // Add the mcp method that's actually used
}));

// Mock the actual function implementations
const mockGetLoanDetails = jest.fn();
const mockGetBorrowerDetails = jest.fn();
const mockUnknownFunction = jest.fn();

describe('MCPServiceWithLogging', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockGetLoanDetails.mockReset();
    mockGetBorrowerDetails.mockReset();
    mockUnknownFunction.mockReset();
    
    // Set up default mock responses
    mockGetLoanDetails.mockImplementation(async (args) => {
      if (!args || args.loan_id === undefined) {
        // Handle missing args gracefully
        args = args || {};
        return {
          loan_id: 'DEFAULT',
          loan_amount: 0,
          borrower_id: 'DEFAULT',
          status: 'Unknown'
        };
      }
      
      if (args.loan_id === 'L999') {
        const error = new Error('Loan not found');
        error.code = 'ENTITY_NOT_FOUND';
        error.details = { entity_type: 'loan', entity_id: 'L999' };
        throw error;
      }
      return {
        loan_id: args.loan_id,
        loan_amount: 50000,
        borrower_id: 'B001',
        status: 'Active'
      };
    });
    
    mockGetBorrowerDetails.mockImplementation(async (args) => {
      return {
        borrower_id: args.borrower_id,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-123-4567'
      };
    });
    
    mockUnknownFunction.mockImplementation(async () => {
      throw new Error('Unknown function');
    });
  });
  
  test('should successfully execute MCP function and log it', async () => {
    const result = await MCPServiceWithLogging.executeFunction(mockGetLoanDetails, 'getLoanDetails', { loan_id: 'L001' });
    
    // Check result
    expect(result).toBeDefined();
    expect(result).toHaveProperty('loan_id', 'L001');
    
    // Verify logging
    expect(logService.mcp).toHaveBeenCalledWith(
      expect.stringContaining('▶ EXECUTING MCP FUNCTION: getLoanDetails'),
      expect.objectContaining({ loan_id: 'L001' })
    );
    
    expect(logService.mcp).toHaveBeenCalledWith(
      expect.stringContaining('✓ COMPLETED MCP FUNCTION: getLoanDetails'),
      expect.objectContaining({
        duration: expect.stringMatching(/\d+ms/),
        resultType: 'object'
      })
    );
  });
  
  test('should redact PII data in logs', async () => {
    const result = await MCPServiceWithLogging.executeFunction(mockGetBorrowerDetails, 'getBorrowerDetails', { borrower_id: 'B001' });
    
    // Check result contains sensitive data (not redacted in response)
    expect(result).toBeDefined();
    expect(result).toHaveProperty('borrower_id', 'B001');
    expect(result).toHaveProperty('email', 'john.doe@example.com');
    
    // Verify PII redaction in logs - check that sensitive data was redacted
    const logCalls = logService.mcp.mock.calls.flat();
    const logStrings = logCalls.filter(call => typeof call === 'string').join(' ');
    
    // The actual email should not appear in logs (should be redacted)
    expect(logStrings).not.toContain('john.doe@example.com');
  });
  
  test('should handle and log errors properly', async () => {
    try {
      await MCPServiceWithLogging.executeFunction(mockGetLoanDetails, 'getLoanDetails', { loan_id: 'L999' });
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      // Verify error is preserved
      expect(error.message).toContain('Loan not found');
      expect(error.code).toBe('ENTITY_NOT_FOUND');
      expect(error.details.entity_type).toBe('loan');
      
      // Verify error logging
      expect(logService.error).toHaveBeenCalledTimes(1);
      expect(logService.error).toHaveBeenCalledWith(
        expect.stringContaining('✗ FAILED MCP FUNCTION: getLoanDetails'),
        expect.objectContaining({
          error: expect.stringContaining('Loan not found'),
          duration: expect.stringMatching(/\d+ms/)
        })
      );
    }
  });
  
  test('should handle unknown function errors', async () => {
    try {
      await MCPServiceWithLogging.executeFunction(mockUnknownFunction, 'unknownFunction', { some: 'args' });
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      // Verify error is preserved
      expect(error.message).toContain('Unknown function');
      
      // Verify error logging
      expect(logService.error).toHaveBeenCalledTimes(1);
    }
  });
  
  test('should include request ID in logs when provided', async () => {
    const requestId = 'test-request-123';
    const result = await MCPServiceWithLogging.executeFunction(mockGetLoanDetails, 'getLoanDetails', { loan_id: 'L001', requestId });
    
    // Verify function executed successfully
    expect(result).toBeDefined();
    
    // Verify request ID in logs (would be included in the args that get logged)
    expect(logService.mcp).toHaveBeenCalledWith(
      expect.stringContaining('▶ EXECUTING MCP FUNCTION: getLoanDetails'),
      expect.objectContaining({ requestId })
    );
  });
  
  test('should handle missing arguments gracefully', async () => {
    // Test with undefined args
    const result = await MCPServiceWithLogging.executeFunction(mockGetLoanDetails, 'getLoanDetails', undefined);
    
    // Should still work but log a warning (the function will handle validation)
    expect(result).toBeDefined();
    
    // Check that the function was called with undefined (which our mock handles gracefully)
    expect(mockGetLoanDetails).toHaveBeenCalledWith(undefined);
  });
}); 