/**
 * MCPServiceWithLogging
 * 
 * Provides enhanced logging, error handling, and PII redaction for MCP functions.
 * Uses the structured LogService for consistent logging format.
 */
const LogService = require('./logService');
const { normalizeId } = require('../utils/validation');

class MCPServiceWithLogging {
  /**
   * Wraps an MCP function call with enhanced logging and error handling
   * @param {Function} fn - The function to call
   * @param {string} functionName - Name of the MCP function
   * @param {Object} args - Arguments to pass to the function
   * @returns {Promise<any>} - Result of the function call
   */
  static async executeFunction(fn, functionName, args) {
    // Start tracking execution time
    const startTime = Date.now();
    
    // Normalize any IDs in the arguments
    const normalizedArgs = this.normalizeArgs(args);
    
    // Log the function call with redacted PII
    LogService.mcp(`▶ EXECUTING MCP FUNCTION: ${functionName}`, this.redactPII(normalizedArgs));
    
    try {
      // Execute the function
      const result = await fn(normalizedArgs);
      
      // Calculate execution time
      const duration = Date.now() - startTime;
      
      // Log success with timing
      LogService.mcp(`✓ COMPLETED MCP FUNCTION: ${functionName}`, {
        duration: `${duration}ms`,
        resultType: typeof result,
        resultSize: result ? JSON.stringify(result).length : 0
      });
      
      return result;
    } catch (error) {
      // Calculate execution time for errors too
      const duration = Date.now() - startTime;
      
      // Log detailed error information
      LogService.error(`✗ FAILED MCP FUNCTION: ${functionName}`, {
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack,
        args: this.redactPII(normalizedArgs)
      });
      
      // Rethrow with consistent error format
      throw new Error(`MCP function '${functionName}' failed: ${error.message}`);
    }
  }
  
  /**
   * Normalize any ID fields in the arguments
   * @param {Object} args - The arguments object
   * @returns {Object} - Arguments with normalized IDs
   */
  static normalizeArgs(args) {
    if (!args || typeof args !== 'object') {
      return args;
    }
    
    const normalized = { ...args };
    
    // Normalize common ID fields
    const idFields = [
      'loan_id', 'loanId',
      'borrower_id', 'borrowerId',
      'collateral_id', 'collateralId',
      'payment_id', 'paymentId'
    ];
    
    // Normalize each ID field if it exists
    idFields.forEach(field => {
      if (normalized[field]) {
        normalized[field] = normalizeId(normalized[field]);
      }
    });
    
    return normalized;
  }
  
  /**
   * Redact PII from function arguments for logging
   * @param {Object} args - The arguments object
   * @returns {Object} - Arguments with PII redacted
   */
  static redactPII(args) {
    if (!args || typeof args !== 'object') {
      return args;
    }
    
    const redacted = { ...args };
    
    // List of fields that might contain PII
    const piiFields = [
      'ssn', 'social_security_number', 'socialSecurityNumber',
      'phone', 'phone_number', 'phoneNumber',
      'email', 'email_address', 'emailAddress',
      'address', 'street_address', 'streetAddress',
      'dob', 'date_of_birth', 'dateOfBirth',
      'bank_account', 'bankAccount', 'account_number', 'accountNumber',
      'credit_card', 'creditCard'
    ];
    
    // Redact each PII field if it exists
    piiFields.forEach(field => {
      if (redacted[field]) {
        redacted[field] = '[REDACTED]';
      }
    });
    
    return redacted;
  }
  
  /**
   * Create a function that logs and executes an MCP operation
   * @param {string} functionName - Name of the MCP function 
   * @param {Function} implementation - The function implementation
   * @returns {Function} - Wrapped function with logging
   */
  static createFunction(functionName, implementation) {
    return async (args) => {
      return this.executeFunction(
        (normalizedArgs) => implementation(normalizedArgs),
        functionName,
        args
      );
    };
  }
}

module.exports = MCPServiceWithLogging;

// Also create a decorator function for existing MCP functions
function withMCPLogging(functionName) {
  return async function (args) {
    return MCPServiceWithLogging.executeFunction(functionName, args);
  };
}

module.exports.withMCPLogging = withMCPLogging; 