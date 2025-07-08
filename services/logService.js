/**
 * Log Service
 * 
 * Centralized logging utility for consistent log handling across the application.
 */
class LogService {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }

  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {object} meta - Additional metadata
   */
  error(message, meta = {}) {
    this._log('error', message, meta);
  }

  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    this._log('warn', message, meta);
  }

  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {object} meta - Additional metadata
   */
  info(message, meta = {}) {
    this._log('info', message, meta);
  }

  /**
   * Log a debug message
   * @param {string} message - Message to log
   * @param {object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    this._log('debug', message, meta);
  }

  /**
   * Log an MCP-related message
   * @param {string} message - Message to log
   * @param {object} meta - Additional metadata
   */
  mcp(message, meta = {}) {
    this._log('info', `[MCP] ${message}`, meta);
  }

  /**
   * Internal logging implementation
   * @private
   */
  _log(level, message, meta) {
    // Skip if level is higher than configured log level
    if (this.levels[level] > this.levels[this.logLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const metadata = Object.keys(meta).length ? JSON.stringify(meta) : '';
    
    // Format log output
    const formattedMessage = `${timestamp} [${level.toUpperCase()}]: ${message} ${metadata}`;
    
    // Output to appropriate console method
    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }
}

// Export a singleton instance
module.exports = new LogService(); 