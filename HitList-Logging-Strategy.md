# HitList Logging Strategy

## 1. Overview

This document outlines a comprehensive logging strategy for the LoanOfficerAI-MCP-POC project, providing a structured approach to logging that enhances debugging, monitoring, and security compliance. The strategy aligns with the project's cursor rules, particularly rule `130-logging-standards`.

## 2. Current Logging Implementation

Based on the code review, the current logging implementation has several strengths and weaknesses:

### Strengths

- Custom `LogService` class with different log levels
- Special MCP operation logging for highlighting important MCP calls
- Request/response logging middleware
- Colorized console output

### Weaknesses

- Logs only go to console, not persisted to files
- No log rotation or archiving
- Inconsistent use across the codebase
- Limited structured logging (some logs are structured, others are plain text)
- No clear distinction between development and production logging
- No integration with external logging services

## 3. Logging Strategy

### 3.1 Core Principles

1. **Structured Logging**: All logs should be in a structured format (JSON) for easier parsing, filtering, and analysis
2. **Appropriate Detail**: Include contextual information without exposing sensitive data
3. **Consistent Levels**: Clear guidelines for when to use each log level
4. **Comprehensive Coverage**: Log important events across all system components
5. **Performance Consideration**: Efficient logging that doesn't impact system performance
6. **Environment Awareness**: Different logging behavior for development vs. production

### 3.2 Log Levels and Usage Guidelines

| Level     | Usage                                                             | Examples                                                |
| --------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| **ERROR** | Critical issues that require immediate attention                  | Authentication failures, API errors, data corruption    |
| **WARN**  | Potential issues that don't stop execution but may need attention | Deprecated API usage, approaching resource limits       |
| **INFO**  | General operational information                                   | Application startup, shutdown, configuration changes    |
| **DEBUG** | Detailed information for debugging                                | Function entry/exit, variable values                    |
| **MCP**   | MCP-specific operations (special level)                           | MCP function calls, responses, protocol-specific events |

### 3.3 Enhanced LogService Implementation

The current `LogService` should be extended to:

1. **Support Multiple Outputs**:

   - Console (development-focused)
   - File (with rotation)
   - External service (optional)

2. **Structured JSON Format**:

   ```json
   {
     "timestamp": "2023-06-04T14:31:26.123Z",
     "level": "INFO",
     "message": "User authenticated",
     "context": {
       "userId": "user123",
       "requestId": "req-456",
       "service": "authentication"
     },
     "metrics": {
       "duration": 45
     }
   }
   ```

3. **Correlation IDs**:

   - Assign a unique request ID to each incoming request
   - Include this ID in all logs related to the request
   - Propagate the ID across service boundaries

4. **Sensitive Data Handling**:
   - Never log passwords, tokens, or PII
   - Hash or mask sensitive data when needed
   - Implement redaction for sensitive fields

### 3.4 Environment-Specific Settings

| Setting           | Development         | Production               |
| ----------------- | ------------------- | ------------------------ |
| **Log Level**     | DEBUG               | INFO                     |
| **Outputs**       | Console (colorized) | Console + File + Service |
| **Format**        | Pretty-printed JSON | Compact JSON             |
| **Stack Traces**  | Full                | Limited                  |
| **Sampling Rate** | 100%                | Configurable             |

## 4. Implementation Plan

### 4.1 Enhanced LogService Implementation

```javascript
// server/services/logService.js
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
    this.logger.error(message, this._addContext(meta));
  }

  warn(message, meta = {}) {
    this.logger.warn(message, this._addContext(meta));
  }

  info(message, meta = {}) {
    this.logger.info(message, this._addContext(meta));
  }

  debug(message, meta = {}) {
    this.logger.debug(message, this._addContext(meta));
  }

  // Special MCP logging method
  mcp(message, meta = {}) {
    this.logger.log(
      "mcp",
      message,
      this._addContext({
        ...meta,
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
```

### 4.2 Request Context Middleware

```javascript
// server/middleware/requestContext.js
const { v4: uuidv4 } = require("uuid");
const LogService = require("../services/logService");

module.exports = (req, res, next) => {
  const startTime = Date.now();

  // Generate or extract request ID
  const requestId = req.headers["x-request-id"] || uuidv4();

  // Set response header
  res.setHeader("x-request-id", requestId);

  // Create request context
  const context = {
    requestId,
    userId: req.user?.id || "anonymous",
    userRole: req.user?.role || "unknown",
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent")?.substring(0, 100), // Truncate long user agents
    method: req.method,
    url: req.url,
    startTime,
  };

  // Set context in LogService
  LogService.setContext(context);

  // Log incoming request
  LogService.apiRequest(req.method, req.url, {
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    contentType: req.get("Content-Type"),
    contentLength: req.get("Content-Length"),
    acceptLanguage: req.get("Accept-Language"),
  });

  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function (body) {
    logResponse(body);
    return originalSend.call(this, body);
  };

  res.json = function (body) {
    logResponse(body);
    return originalJson.call(this, body);
  };

  function logResponse(body) {
    const duration = Date.now() - startTime;
    const contentLength = Buffer.isBuffer(body)
      ? body.length
      : typeof body === "string"
      ? Buffer.byteLength(body)
      : typeof body === "object"
      ? JSON.stringify(body).length
      : 0;

    LogService.apiResponse(req.method, req.url, res.statusCode, duration, {
      contentLength,
      contentType: res.get("Content-Type"),
    });

    // Clear context after response
    LogService.clearContext();
  }

  // Handle cases where response doesn't use send/json
  res.on("finish", () => {
    if (!res.headersSent) return;

    const duration = Date.now() - startTime;
    LogService.apiResponse(req.method, req.url, res.statusCode, duration);
    LogService.clearContext();
  });

  next();
};
```

### 4.3 MCP Function Logging Wrapper

```javascript
// server/services/mcpServiceWithLogging.js
const LogService = require("./logService");

class MCPServiceWithLogging {
  // Wrapper for MCP function calls with comprehensive logging
  static async executeFunction(functionName, args = {}) {
    const startTime = Date.now();

    // Log function start
    LogService.mcpFunction(functionName, args, {
      timestamp: new Date().toISOString(),
    });

    try {
      // Get the actual MCP service (your existing implementation)
      const mcpService = require("./mcpService"); // Your existing MCP service

      // Execute the function
      let result;
      if (typeof mcpService[functionName] === "function") {
        result = await mcpService[functionName](args);
      } else if (typeof mcpService.executeFunction === "function") {
        result = await mcpService.executeFunction(functionName, args);
      } else {
        throw new Error(`MCP function ${functionName} not found`);
      }

      const duration = Date.now() - startTime;

      // Log successful completion
      LogService.mcpResult(functionName, result, duration, {
        success: true,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      LogService.mcpError(functionName, error, duration, {
        timestamp: new Date().toISOString(),
        args: args, // Include args in error for debugging
      });

      // Re-throw the error
      throw error;
    }
  }

  // Specific logging for OpenAI integration
  static async logOpenAIInteraction(type, data) {
    LogService.info(`🤖 OpenAI ${type}`, {
      category: "openai-interaction",
      type,
      ...data,
    });
  }

  // Log authentication events
  static logAuthEvent(event, userId, success, details = {}) {
    const level = success ? "info" : "warn";
    LogService[level](`🔐 Auth: ${event}`, {
      category: "authentication",
      event,
      userId,
      success,
      ...details,
    });
  }

  // Log data access events
  static logDataAccess(resource, action, userId, success, details = {}) {
    const level = success ? "info" : "warn";
    LogService[level](`📊 Data Access: ${action} ${resource}`, {
      category: "data-access",
      resource,
      action,
      userId,
      success,
      ...details,
    });
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
```

## 5. Implementation Recommendations

### 5.1 Phase 1: Quick Setup (1-2 hours)

- Install winston: `npm install winston`
- Replace your existing LogService with the enhanced version above
- Add the request context middleware to your server.js
- Test basic logging functionality

### 5.2 Phase 2: MCP Integration (2-3 hours)

- Implement the MCP logging wrapper
- Update your OpenAI route to use the logging wrapper
- Add structured logging to your existing MCP functions

### 5.3 Phase 3: Fine-tuning (ongoing)

- Adjust log levels based on what you actually need
- Add business-specific logging (loan operations, risk assessments)
- Set up log rotation for production

## 6. Key Benefits

- **Debugging OpenAI Issues**: Visualize exactly what's happening with MCP function calls
- **Performance Monitoring**: Track which functions are slow
- **Request Tracing**: Follow a request through the entire system
- **Production Readiness**: Professional logging for when you deploy

## 7. Testing the Implementation

After implementing, you can test with:

```bash
# Enable file logging for testing
export ENABLE_FILE_LOGGING=true

# Try a query in your app, then check:
tail -f server/logs/mcp.log
```

## 8. Monitoring and Analysis

### 8.1 Log Aggregation

For production deployments, logs should be aggregated using a system like:

- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog
- New Relic
- AWS CloudWatch Logs

### 8.2 Key Metrics to Monitor

1. **Error Rates**:

   - Error count by type
   - Error count by endpoint
   - Error trends over time

2. **Performance Metrics**:

   - API response times
   - MCP function execution times
   - Database query times

3. **Business Metrics**:
   - Loan creation rate
   - Risk assessment counts
   - User activity patterns

### 8.3 Alerting

Configure alerts for:

- Sudden increase in error rates
- Authentication failures
- API endpoints with consistently high response times
- Failed MCP operations

## 9. Security and Compliance

### 9.1 Sensitive Data Handling

- **PII Redaction**: Automatically redact or mask PII in logs
- **Tokenization**: Replace sensitive identifiers with tokens in logs
- **Access Control**: Restrict access to raw logs containing sensitive information

### 9.2 Log Retention

- **Error Logs**: Retain for 90 days
- **Access Logs**: Retain for 30 days
- **Debug Logs**: Retain for 7 days
- **Archive Policy**: Archive older logs to cold storage for compliance requirements

### 9.3 Audit Logging

Implement separate audit logs for:

- Authentication events
- Authorization decisions
- Data access events
- Configuration changes

## 10. Implementation Checklist

- [ ] Install winston and uuid packages
- [ ] Create logs directory
- [ ] Implement enhanced LogService
- [ ] Implement request context middleware
- [ ] Implement MCP logging wrapper
- [ ] Update OpenAI routes with new logging
- [ ] Test MCP function logging
- [ ] Configure log rotation
- [ ] Implement PII redaction
- [ ] Document logging practices for developers

## 11. Best Practices for Developers

1. **Always use the LogService**, not console.log
2. **Include relevant context** in every log
3. **Use the correct log level** based on severity
4. **Never log sensitive information**
5. **Structure log messages** consistently
6. **Include metrics** when logging performance-related events
7. **Log both successes and failures** for important operations
8. **Be concise but descriptive** in log messages
9. **Include correlation IDs** for request tracing
10. **Log at service boundaries** (API entry/exit points)

## Conclusion

This logging strategy provides a comprehensive approach to logging in the LoanOfficerAI-MCP-POC project. By implementing these recommendations, the project will benefit from improved debugging capabilities, enhanced monitoring, and better security compliance, all while maintaining system performance.
