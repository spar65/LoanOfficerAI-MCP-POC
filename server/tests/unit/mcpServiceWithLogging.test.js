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
  warn: jest.fn()
}));

jest.mock('../../services/mcpService', () => {
  return {
    executeMCPFunction: jest.fn().mockImplementation(async (functionName, args) => {
      if (functionName === 'unknownFunction') {
        throw new Error('Unknown function');
      }
      
      if (functionName === 'getLoanDetails' && args.loan_id === 'L999') {
        const error = new Error('Loan not found');
        error.code = 'ENTITY_NOT_FOUND';
        error.details = { entity_type: 'loan', entity_id: 'L999' };
        throw error;
      }
      
      if (functionName === 'getLoanDetails') {
        return {
          loan_id: args.loan_id || 'L001',
          loan_amount: 50000,
          interest_rate: 3.5,
          term_months: 60,
          status: 'Active',
          loan_type: 'Equipment'
        };
      }
      
      if (functionName === 'getBorrowerDetails') {
        return {
          borrower_id: args.borrower_id || 'B001',
          first_name: 'John',
          last_name: 'Farmer',
          credit_score: 720,
          income: 150000,
          ssn: '123-45-6789', // Sensitive data
          phone: '555-123-4567', // Sensitive data
          email: 'john.farmer@example.com'
        };
      }
      
      return { success: true, function: functionName, args };
    })
  };
});

describe('MCPServiceWithLogging', () => {
  let mcpService;
  
  beforeEach(() => {
    mcpService = new MCPServiceWithLogging();
    // Clear all mock call histories
    jest.clearAllMocks();
  });
  
  test('should successfully execute MCP function and log it', async () => {
    const result = await mcpService.executeMCPFunction('getLoanDetails', { loan_id: 'L001' });
    
    // Check result
    expect(result).toBeDefined();
    expect(result.loan_id).toBe('L001');
    expect(result.loan_amount).toBe(50000);
    
    // Verify logging
    expect(logService.info).toHaveBeenCalledTimes(2); // start and complete logs
    expect(logService.error).not.toHaveBeenCalled();
    
    // Check start log message
    const startLogCall = logService.info.mock.calls[0][0];
    expect(startLogCall).toContain('Starting MCP function');
    expect(startLogCall).toContain('getLoanDetails');
    
    // Check complete log message
    const completeLogCall = logService.info.mock.calls[1][0];
    expect(completeLogCall).toContain('Completed MCP function');
    expect(completeLogCall).toContain('getLoanDetails');
  });
  
  test('should redact PII data in logs', async () => {
    const result = await mcpService.executeMCPFunction('getBorrowerDetails', { borrower_id: 'B001' });
    
    // Check result contains sensitive data (not redacted in response)
    expect(result).toBeDefined();
    expect(result.borrower_id).toBe('B001');
    expect(result.ssn).toBe('123-45-6789');
    expect(result.phone).toBe('555-123-4567');
    
    // Verify logging
    const startLogCall = logService.info.mock.calls[0][0];
    expect(startLogCall).toContain('borrower_id');
    
    // Check response log for redacted fields
    const completeLogCall = logService.info.mock.calls[1][0];
    expect(completeLogCall).not.toContain('123-45-6789'); // SSN should be redacted
    expect(completeLogCall).not.toContain('555-123-4567'); // Phone should be redacted
    expect(completeLogCall).toContain('[REDACTED]'); // Should have redaction marker
    
    // Should still include non-sensitive data
    expect(completeLogCall).toContain('John');
    expect(completeLogCall).toContain('Farmer');
  });
  
  test('should handle and log errors properly', async () => {
    try {
      await mcpService.executeMCPFunction('getLoanDetails', { loan_id: 'L999' });
      fail('Should have thrown an error');
    } catch (error) {
      // Verify error is preserved
      expect(error.message).toContain('Loan not found');
      expect(error.code).toBe('ENTITY_NOT_FOUND');
      expect(error.details.entity_type).toBe('loan');
      
      // Verify error logging
      expect(logService.error).toHaveBeenCalledTimes(1);
      const errorLogCall = logService.error.mock.calls[0][0];
      expect(errorLogCall).toContain('Error in MCP function');
      expect(errorLogCall).toContain('getLoanDetails');
      expect(errorLogCall).toContain('ENTITY_NOT_FOUND');
    }
  });
  
  test('should handle unknown function errors', async () => {
    try {
      await mcpService.executeMCPFunction('unknownFunction', {});
      fail('Should have thrown an error');
    } catch (error) {
      // Verify error is preserved
      expect(error.message).toContain('Unknown function');
      
      // Verify error logging
      expect(logService.error).toHaveBeenCalledTimes(1);
      const errorLogCall = logService.error.mock.calls[0][0];
      expect(errorLogCall).toContain('Error in MCP function');
      expect(errorLogCall).toContain('unknownFunction');
    }
  });
  
  test('should include request ID in logs when provided', async () => {
    const requestId = 'test-request-123';
    const result = await mcpService.executeMCPFunction('getLoanDetails', { loan_id: 'L001' }, { requestId });
    
    // Verify request ID in logs
    const startLogCall = logService.info.mock.calls[0][0];
    expect(startLogCall).toContain(requestId);
    
    const completeLogCall = logService.info.mock.calls[1][0];
    expect(completeLogCall).toContain(requestId);
  });
  
  test('should handle missing arguments gracefully', async () => {
    // Test with undefined args
    const result = await mcpService.executeMCPFunction('getLoanDetails');
    
    // Should still work but log a warning
    expect(result).toBeDefined();
    expect(logService.warn).toHaveBeenCalledTimes(1);
    
    const warnLogCall = logService.warn.mock.calls[0][0];
    expect(warnLogCall).toContain('No arguments provided');
  });
}); 