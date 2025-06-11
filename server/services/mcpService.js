/**
 * MCP Service
 * Provides logging and metrics for MCP function calls
 */
const LogService = require('./logService');

class McpService {
  /**
   * Wraps an MCP function call with logging and timing
   * @param {Function} fn - The MCP function to call
   * @param {string} functionName - Name of the function
   * @param {...any} args - Arguments to pass to the function
   * @returns {Promise<any>} - Result of the MCP function
   */
  static async call(fn, functionName, ...args) {
    // Log the function call
    LogService.mcp(`▶ STARTING MCP: ${functionName}`, args);
    
    // Record start time
    const startTime = Date.now();
    
    try {
      // Call the MCP function
      const result = await fn(...args);
      
      // Calculate duration
      const duration = Date.now() - startTime;
      
      // Log success with timing
      LogService.mcp(`✓ COMPLETED MCP: ${functionName} (${duration}ms)`, {
        resultSize: result ? JSON.stringify(result).length : 0,
        parameters: args
      });
      
      return result;
    } catch (error) {
      // Calculate duration for errors too
      const duration = Date.now() - startTime;
      
      // Log error with timing
      LogService.error(`✗ FAILED MCP: ${functionName} (${duration}ms)`, {
        error: error.message,
        stack: error.stack,
        parameters: args
      });
      
      // Rethrow the error
      throw error;
    }
  }
  
  /**
   * Wraps all MCP functions in an object with logging
   * @param {Object} mcpClient - The MCP client object
   * @returns {Object} - Wrapped MCP client
   */
  static wrapClient(mcpClient) {
    const wrappedClient = {};
    
    // Get all function properties
    Object.getOwnPropertyNames(mcpClient).forEach(prop => {
      if (typeof mcpClient[prop] === 'function') {
        // Wrap each function with logging
        wrappedClient[prop] = async (...args) => {
          return await McpService.call(mcpClient[prop].bind(mcpClient), prop, ...args);
        };
      } else {
        // Pass through non-function properties
        wrappedClient[prop] = mcpClient[prop];
      }
    });
    
    return wrappedClient;
  }
  
  /**
   * Creates a proxy around an MCP client for auto-logging
   * @param {Object} mcpClient - The MCP client to wrap
   * @returns {Proxy} - Proxied MCP client
   */
  static createProxy(mcpClient) {
    return new Proxy(mcpClient, {
      apply: function(target, thisArg, argumentsList) {
        return McpService.call(target, target.name, ...argumentsList);
      },
      
      get: function(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        
        if (typeof value === 'function') {
          return function(...args) {
            return McpService.call(value.bind(target), prop, ...args);
          };
        }
        
        return value;
      }
    });
  }
}

module.exports = McpService; 