/**
 * Enhanced logging service
 * Provides detailed logging with MCP operation highlighting
 */

// Import chalk (v4 supports CommonJS)
const chalk = require('chalk');

class LogService {
  // Log levels
  static LEVELS = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    MCP: 'MCP'  // Special level for MCP operations
  };

  /**
   * Log a message with timestamp and optional metadata
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} metadata - Optional metadata
   */
  static log(level, message, metadata = null) {
    const timestamp = new Date().toISOString();
    let formattedMessage = "";
    let consoleMethod = console.log; // Default method
    
    // Format based on log level
    switch(level) {
      case LogService.LEVELS.MCP:
        // Highlight MCP operations with blue background
        formattedMessage = chalk.bgBlue.white.bold(`[${timestamp}] [MCP] ${message}`);
        console.log("\n" + chalk.blue("=".repeat(100))); // Add separator line for MCP calls
        break;
      case LogService.LEVELS.ERROR:
        formattedMessage = chalk.bgRed.white(`[${timestamp}] [ERROR] ${message}`);
        consoleMethod = console.error; // Use error output for errors
        break;
      case LogService.LEVELS.WARN:
        formattedMessage = chalk.yellow(`[${timestamp}] [WARN] ${message}`);
        consoleMethod = console.warn; // Use warning output for warnings
        break;
      case LogService.LEVELS.INFO:
        formattedMessage = chalk.green(`[${timestamp}] [INFO] ${message}`);
        break;
      case LogService.LEVELS.DEBUG:
        formattedMessage = chalk.gray(`[${timestamp}] [DEBUG] ${message}`);
        break;
    }
    
    // Log the message
    consoleMethod(formattedMessage);
    
    // Log metadata if provided
    if (metadata) {
      if (typeof metadata === 'object') {
        console.log(chalk.cyan(JSON.stringify(metadata, null, 2)));
      } else {
        console.log(chalk.cyan(metadata));
      }
    }
    
    // Add closing separator for MCP calls
    if (level === LogService.LEVELS.MCP) {
      console.log(chalk.blue("=".repeat(100)) + "\n");
    }
  }

  // Convenience methods for different log levels
  static debug(message, metadata = null) {
    LogService.log(LogService.LEVELS.DEBUG, message, metadata);
  }

  static info(message, metadata = null) {
    LogService.log(LogService.LEVELS.INFO, message, metadata);
  }

  static warn(message, metadata = null) {
    LogService.log(LogService.LEVELS.WARN, message, metadata);
  }

  static error(message, metadata = null) {
    LogService.log(LogService.LEVELS.ERROR, message, metadata);
  }

  /**
   * Special MCP operation logger
   * Use this for highlighting MCP protocol operations
   */
  static mcp(message, metadata = null) {
    LogService.log(LogService.LEVELS.MCP, message, metadata);
  }

  /**
   * Log request details
   * @param {Object} req - Express request object
   */
  static logRequest(req) {
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.get('user-agent') || 'unknown';
    const contentType = req.get('content-type') || 'unknown';
    const userId = req.user ? req.user.id : 'unauthenticated';
    
    // Highlight MCP-related endpoints with special formatting
    if (url.includes('/api/openai') || url.includes('/api/predict') || 
        url.includes('/api/risk') || url.includes('/api/analytics')) {
      LogService.mcp(`🔄 ${method} ${url} - MCP REQUEST`, {
        userId,
        query: req.query,
        params: req.params,
        body: method !== 'GET' ? req.body : undefined
      });
    } else {
      LogService.info(`${method} ${url}`, {
        userId,
        contentType,
        query: req.query,
        params: req.params
      });
    }
  }

  /**
   * Log response details
   * @param {Object} res - Express response object
   * @param {number} startTime - Request start time
   */
  static logResponse(req, res, startTime) {
    const method = req.method;
    const url = req.originalUrl || req.url;
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Color status code based on value
    let coloredStatus;
    if (statusCode < 300) {
      coloredStatus = chalk.bgGreen.black(` ${statusCode} `);
    } else if (statusCode < 400) {
      coloredStatus = chalk.bgYellow.black(` ${statusCode} `);
    } else {
      coloredStatus = chalk.bgRed.white(` ${statusCode} `);
    }
    
    // Highlight MCP-related endpoints with special formatting
    if (url.includes('/api/openai') || url.includes('/api/predict') || 
        url.includes('/api/risk') || url.includes('/api/analytics')) {
      LogService.mcp(`✅ ${method} ${url} ${coloredStatus} - ${duration}ms - MCP RESPONSE`);
    } else {
      LogService.info(`${method} ${url} ${coloredStatus} - ${duration}ms`);
    }
  }

  /**
   * Log MCP function call with detailed metrics
   * @param {string} functionName - Name of MCP function
   * @param {Object} params - Function parameters
   * @param {Object} result - Function result
   * @param {number} duration - Call duration in ms
   */
  static logMcpCall(functionName, params, result, duration) {
    console.log("\n" + chalk.bgBlue.white("★".repeat(25) + " MCP CALL: " + functionName + " " + "★".repeat(25)));
    LogService.mcp(`⚡ MCP CALL: ${functionName} - ${duration}ms`, {
      function: functionName,
      parameters: params,
      resultSize: result ? JSON.stringify(result).length : 0,
      duration: `${duration}ms`
    });
    console.log(chalk.bgBlue.white("★".repeat(60)) + "\n");
  }
}

module.exports = LogService; 