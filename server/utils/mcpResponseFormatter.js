/**
 * MCP Response Formatter
 * 
 * Standardizes response formats for MCP functions to ensure consistent
 * structure, error handling, and content type.
 */
const LogService = require('../services/logService');

/**
 * Format a successful MCP function response
 * @param {Object} data - The data to include in the response
 * @param {string} functionName - The name of the MCP function (for logging)
 * @returns {Object} - Standardized response object
 */
function formatSuccess(data, functionName) {
  try {
    // Clone the data to avoid modifying the original
    const responseData = data ? JSON.parse(JSON.stringify(data)) : {};
    
    // Add standard response metadata
    const response = {
      ...responseData,
      _metadata: {
        success: true,
        timestamp: new Date().toISOString(),
        function: functionName
      }
    };
    
    // Log the formatted response size
    const responseSize = JSON.stringify(response).length;
    LogService.debug(`Formatted ${functionName} response: ${responseSize} bytes`);
    
    return response;
  } catch (error) {
    LogService.error(`Error formatting success response for ${functionName}:`, error);
    
    // Fallback response with original data
    return {
      ...data,
      _metadata: {
        success: true,
        timestamp: new Date().toISOString(),
        function: functionName,
        formatting_error: true
      }
    };
  }
}

/**
 * Format an error response for MCP functions
 * @param {Error|string} error - The error object or message
 * @param {string} functionName - The name of the MCP function
 * @param {Object} context - Additional context for the error
 * @returns {Object} - Standardized error response
 */
function formatError(error, functionName, context = {}) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : null;
  
  // Log the error
  LogService.error(`Error in MCP function ${functionName}:`, {
    message: errorMessage,
    stack: errorStack,
    context
  });
  
  // Build base error response
  const baseResponse = {
    error: true,
    message: errorMessage,
    function: functionName,
    timestamp: new Date().toISOString(),
    context: Object.keys(context).length > 0 ? context : undefined
  };
  
  // Handle specific error types with additional properties
  if (error instanceof Error && error.code) {
    baseResponse.code = error.code;
    
    // Handle entity not found errors
    if (error.code === 'ENTITY_NOT_FOUND' && error.details) {
      if (error.details.entity_type) baseResponse.entity_type = error.details.entity_type;
      if (error.details.entity_id) baseResponse.entity_id = error.details.entity_id;
    }
    
    // Handle validation errors
    if (error.code === 'VALIDATION_ERROR' && error.details) {
      if (error.details.validation_errors) baseResponse.validation_errors = error.details.validation_errors;
    }
  }
  
  return baseResponse;
}

/**
 * Format MCP response for entity not found errors
 * @param {string} entityType - Type of entity (e.g., 'loan', 'borrower')
 * @param {string} entityId - ID of the entity
 * @param {string} functionName - The name of the MCP function
 * @returns {Object} - Standardized not found error response
 */
function formatNotFound(entityType, entityId, functionName) {
  const message = `${entityType} with ID '${entityId}' not found`;
  
  LogService.warn(`MCP function ${functionName}: ${message}`);
  
  return {
    error: true,
    message,
    code: 'ENTITY_NOT_FOUND',
    entity_type: entityType,
    entity_id: entityId,
    function: functionName,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format validation error response
 * @param {Array} validationErrors - Array of validation error objects
 * @param {string} functionName - The name of the MCP function
 * @returns {Object} - Standardized validation error response
 */
function formatValidationError(validationErrors, functionName) {
  const errors = Array.isArray(validationErrors) ? validationErrors : [{ message: String(validationErrors) }];
  
  LogService.warn(`MCP function ${functionName} validation errors:`, errors);
  
  return {
    error: true,
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    validation_errors: errors,
    function: functionName,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  formatSuccess,
  formatError,
  formatNotFound,
  formatValidationError
}; 