/**
 * Enhanced logging service with Winston integration
 * Provides structured logging with MCP operation highlighting
 */
const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Ensure logs directory exists
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom MCP level
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    mcp: 3, // Custom MCP level
    debug: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    mcp: "magenta", // Special color for MCP operations
    debug: "blue",
  },
};

// Add colors to winston
winston.addColors(customLevels.colors);

class LogService {
  constructor() {
    // Create request context storage
    this.context = {};
    
    // Create winston logger
    this.logger = winston.createLogger({
      levels: customLevels.levels,
      level:
        process.env.LOG_LEVEL ||
        (process.env.NODE_ENV === "production" ? "info" : "debug"),
      format: winston.format.combine(
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss.SSS",
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: "loan-officer-ai",
        version: process.env.npm_package_version || "1.0.0",
      },
      transports: [
        // Console transport (always enabled)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const contextStr =
                Object.keys(meta).length > 0
                  ? JSON.stringify(meta, null, 2)
                  : "";
              return `${timestamp} [${level}]: ${message} ${contextStr}`;
            })
          ),
        }),
      ],
    });

    // Add file transports in production or when explicitly enabled
    if (
      process.env.NODE_ENV === "production" ||
      process.env.ENABLE_FILE_LOGGING === "true"
    ) {
      this.logger.add(
        new winston.transports.File({
          filename: path.join(logDir, "error.log"),
          level: "error",
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );

      this.logger.add(
        new winston.transports.File({
          filename: path.join(logDir, "combined.log"),
          maxsize: 10485760, // 10MB
          maxFiles: 10,
        })
      );

      this.logger.add(
        new winston.transports.File({
          filename: path.join(logDir, "mcp.log"),
          level: "mcp",
          maxsize: 10485760, // 10MB for MCP operations
          maxFiles: 5,
        })
      );
    }
  }

  // Set request context (call this in middleware)
  setContext(context) {
    this.context = { ...this.context, ...context };
  }

  // Clear context (call at end of request)
  clearContext() {
    this.context = {};
  }

  // Set log level
  setLevel(level) {
    if (Object.keys(customLevels.levels).includes(level)) {
      this.logger.level = level;
      this.info(`Log level set to: ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}, must be one of: ${Object.keys(customLevels.levels).join(', ')}`);
    }
  }

  // Get current log level
  getLevel() {
    return this.logger.level;
  }

  // Private method to add context to metadata
  _addContext(meta = {}) {
    return {
      ...meta,
      ...this.context,
      pid: process.pid,
      hostname: require("os").hostname(),
    };
  }

  // Log methods
  error(message, meta = {}) {
    this.logger.error(message, this._addContext(this._sanitizeArgs(meta)));
  }

  warn(message, meta = {}) {
    this.logger.warn(message, this._addContext(this._sanitizeArgs(meta)));
  }

  info(message, meta = {}) {
    this.logger.info(message, this._addContext(this._sanitizeArgs(meta)));
  }

  debug(message, meta = {}) {
    this.logger.debug(message, this._addContext(this._sanitizeArgs(meta)));
  }

  // Special MCP logging method
  mcp(message, meta = {}) {
    this.logger.log(
      "mcp",
      message,
      this._addContext({
        ...this._sanitizeArgs(meta),
        category: "mcp-operation",
      })
    );
  }

  // Convenience methods for common patterns
  apiRequest(method, url, meta = {}) {
    this.info(`🌐 ${method} ${url}`, {
      ...meta,
      category: "api-request",
    });
  }

  apiResponse(method, url, statusCode, duration, meta = {}) {
    const level = statusCode >= 400 ? "warn" : "info";
    this[level](`📤 ${method} ${url} ${statusCode} (${duration}ms)`, {
      ...meta,
      statusCode,
      duration,
      category: "api-response",
    });
  }

  mcpFunction(functionName, args, meta = {}) {
    this.mcp(`🔧 MCP Function: ${functionName}`, {
      ...meta,
      functionName,
      args: this._sanitizeArgs(args),
      category: "mcp-function-start",
    });
  }

  mcpResult(functionName, result, duration, meta = {}) {
    this.mcp(`✅ MCP Function Complete: ${functionName} (${duration}ms)`, {
      ...meta,
      functionName,
      duration,
      resultType: typeof result,
      resultSize: this._getResultSize(result),
      category: "mcp-function-complete",
    });
  }

  mcpError(functionName, error, duration, meta = {}) {
    this.error(`❌ MCP Function Failed: ${functionName} (${duration}ms)`, {
      ...meta,
      functionName,
      duration,
      error: {
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      category: "mcp-function-error",
    });
  }

  // Helper methods
  _sanitizeArgs(args) {
    if (!args) return args;
    
    // Remove sensitive data from args
    const sanitized = JSON.parse(JSON.stringify(args));
    
    // Add patterns for sensitive fields to redact
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "ssn",
      "social",
    ];
    
    const redactSensitive = (obj) => {
      if (typeof obj !== "object" || obj === null) return obj;
      
      for (const key in obj) {
        if (
          sensitiveFields.some((field) => key.toLowerCase().includes(field))
        ) {
          obj[key] = "[REDACTED]";
        } else if (typeof obj[key] === "object") {
          redactSensitive(obj[key]);
        }
      }
      return obj;
    };
    
    return redactSensitive(sanitized);
  }

  _getResultSize(result) {
    try {
      return JSON.stringify(result).length;
    } catch {
      return 0;
    }
  }
}

// Export singleton instance
module.exports = new LogService(); 