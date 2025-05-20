# Logging Implementation Guide

This guide provides practical examples and implementation patterns for the logging standards specified in rule 130-logging-standards.mdc.

## Table of Contents

1. [Setting Up a Logging Framework](#setting-up-a-logging-framework)
2. [Environment-Specific Configuration](#environment-specific-configuration)
3. [Structured Logging Patterns](#structured-logging-patterns)
4. [Request Lifecycle Logging](#request-lifecycle-logging)
5. [Error Handling & Logging](#error-handling--logging)
6. [Performance Considerations](#performance-considerations)
7. [Monitoring and Alerting Integration](#monitoring-and-alerting-integration)

## Setting Up a Logging Framework

### Basic Logger Setup (Node.js with Winston)

```typescript
// src/lib/logging.ts
import winston from "winston";
import { v4 as uuidv4 } from "uuid";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Define sensitive fields that should be redacted
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "credential",
  "apiKey",
  "creditCard",
  "ssn",
  "socialSecurity",
  "dob",
  "authToken",
];

// Create a formatter that redacts sensitive data
const redactSensitiveData = winston.format((info) => {
  const redacted = { ...info };

  function redactObject(obj) {
    if (!obj || typeof obj !== "object") return obj;

    const result = { ...obj };
    for (const key in result) {
      // Check if the key is sensitive
      if (
        SENSITIVE_FIELDS.some((field) =>
          key.toLowerCase().includes(field.toLowerCase())
        )
      ) {
        result[key] = "[REDACTED]";
      } else if (typeof result[key] === "object") {
        // Recursively check nested objects
        result[key] = redactObject(result[key]);
      }
    }
    return result;
  }

  return redactObject(redacted);
});

/**
 * Creates a configured logger instance
 *
 * @param options Configuration options for the logger
 * @returns A configured Winston logger instance
 */
export function createLogger(options: {
  appName: string;
  environment: string;
  logLevel?: string;
  correlationIdKey?: string;
}) {
  const {
    appName,
    environment,
    logLevel = "info",
    correlationIdKey = "x-correlation-id",
  } = options;

  // Create appropriate transports based on environment
  const transports = [];

  // Console transport for all environments
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        environment === "production"
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
      ),
    })
  );

  // Add file transport for non-development environments
  if (environment !== "development") {
    transports.push(
      new winston.transports.File({
        filename: `logs/${appName}.log`,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
      })
    );
  }

  // Create the logger
  const logger = winston.createLogger({
    level: logLevel,
    defaultMeta: {
      service: appName,
      environment,
    },
    format: winston.format.combine(
      redactSensitiveData(),
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports,
  });

  // Add utility to create a child logger with correlation ID
  logger.createChildLogger = function (correlationId = uuidv4()) {
    return logger.child({ correlationId });
  };

  return logger;
}

// Export a default logger for the application
export const logger = createLogger({
  appName: process.env.APP_NAME || "application",
  environment: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
});
```

### Usage in Application Code

```typescript
// Import the logger in your application code
import { logger } from "@/lib/logging";

// Basic usage
logger.info("Application started");

// With context data
logger.info("User logged in", {
  userId: user.id,
  orgId: user.orgId,
  loginMethod: "password",
});

// With correlation ID for request tracing
function handleRequest(req, res) {
  const correlationId = req.headers["x-correlation-id"] || uuidv4();
  const requestLogger = logger.child({
    correlationId,
    requestId: uuidv4(),
    path: req.path,
    method: req.method,
  });

  requestLogger.info("Request received");

  // Use the same logger throughout request handling
  // to maintain the correlation ID
  processRequest(req, requestLogger)
    .then((result) => {
      requestLogger.info("Request processed successfully");
      res.send(result);
    })
    .catch((error) => {
      requestLogger.error("Request processing failed", {
        error: error.message,
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
      });
      res.status(500).send({ error: "Internal Server Error" });
    });
}
```

## Environment-Specific Configuration

### Development Environment

```typescript
// For development - in your .env.development file
LOG_LEVEL = debug;
LOG_FORMAT = pretty;
SHOW_STACK_TRACES = true;
LOG_TO_FILE = false;

// Usage in logger configuration
const isDev = process.env.NODE_ENV === "development";
const config = {
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  format:
    process.env.LOG_FORMAT === "pretty" && isDev
      ? prettyPrintFormat
      : jsonFormat,
  showStackTraces: process.env.SHOW_STACK_TRACES === "true" || isDev,
  logToFile: process.env.LOG_TO_FILE === "true" || !isDev,
};
```

### Production Environment

```typescript
// For production - in your .env.production file
LOG_LEVEL = info;
LOG_FORMAT = json;
SHOW_STACK_TRACES = false;
LOG_TO_FILE = true;
LOG_RETENTION_DAYS = 30;
```

### Testing Environment

```typescript
// For testing - in your test setup
import { createLogger } from "@/lib/logging";

// Create a mock logger for testing
const mockLogger = createLogger({
  appName: "test-app",
  environment: "test",
  logLevel: "debug",
});

// Capture logs for verification in tests
const logCapture = [];
mockLogger.on("logged", (info) => {
  logCapture.push(info);
});

// Reset captured logs between tests
beforeEach(() => {
  logCapture.length = 0;
});

// Verify logs in tests
test("should log error when operation fails", async () => {
  await performOperation();

  // Check that error was logged
  const errorLog = logCapture.find(
    (log) => log.level === "error" && log.message.includes("Operation failed")
  );

  expect(errorLog).toBeDefined();
  expect(errorLog.context.operationId).toEqual("op-123");
});
```

## Structured Logging Patterns

### API Request Logging

```typescript
// Middleware for API request logging
export function requestLoggingMiddleware(req, res, next) {
  const startTime = Date.now();
  const requestId = uuidv4();
  const correlationId = req.headers["x-correlation-id"] || requestId;

  // Store for use in other middleware/handlers
  req.requestId = requestId;
  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);

  // Create context object - don't log body at info level (could be large)
  const logContext = {
    requestId,
    correlationId,
    method: req.method,
    path: req.path,
    query: sanitizeData(req.query),
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId: req.user?.id, // If auth middleware already ran
  };

  // Log request received
  logger.info(`${req.method} ${req.path} request received`, logContext);

  // At debug level, include sanitized body
  if (logger.isLevelEnabled("debug")) {
    logger.debug("Request details", {
      ...logContext,
      body: sanitizeData(req.body),
    });
  }

  // Capture response
  const originalEnd = res.end;
  res.end = function (...args) {
    const responseTime = Date.now() - startTime;

    // Update context with response info
    logContext.statusCode = res.statusCode;
    logContext.responseTime = responseTime;

    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.path} request failed`, logContext);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} request failed`, logContext);
    } else {
      logger.info(`${req.method} ${req.path} request completed`, logContext);
    }

    originalEnd.apply(res, args);
  };

  next();
}
```

### Database Operation Logging

```typescript
// Wrapper for database operations with logging
async function executeDbOperation(operation, params, options = {}) {
  const { name, collection } = options;
  const operationId = uuidv4();
  const correlationId = options.correlationId;

  const logContext = {
    operationId,
    correlationId,
    operation: name || "database_operation",
    collection,
    params: sanitizeData(params),
  };

  logger.debug("Database operation started", logContext);

  const startTime = Date.now();
  try {
    const result = await db[collection][operation](params);

    const duration = Date.now() - startTime;
    logger.debug("Database operation completed", {
      ...logContext,
      duration,
      resultCount: Array.isArray(result) ? result.length : 1,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Database operation failed", {
      ...logContext,
      duration,
      error: error.message,
      code: error.code,
    });

    throw error;
  }
}
```

## Request Lifecycle Logging

### HTTP Request Tracing

```typescript
// Example of trace-level logging throughout a request lifecycle
async function processOrder(req, res) {
  const { correlationId, requestId } = req;
  const { orderId } = req.params;

  const logContext = {
    correlationId,
    requestId,
    orderId,
  };

  logger.info("Order processing started", logContext);

  try {
    // 1. Validate order
    logger.debug("Validating order", logContext);
    const order = await orderService.getOrder(orderId);

    if (!order) {
      logger.warn("Order not found", logContext);
      return res.status(404).json({ error: "Order not found" });
    }

    // 2. Check inventory
    logger.debug("Checking inventory", {
      ...logContext,
      items: order.items.map((i) => i.itemId),
    });
    const inventoryResult = await inventoryService.checkAvailability(
      order.items
    );

    if (!inventoryResult.available) {
      logger.warn("Insufficient inventory", {
        ...logContext,
        unavailableItems: inventoryResult.unavailableItems,
      });
      return res.status(400).json({
        error: "Insufficient inventory",
        items: inventoryResult.unavailableItems,
      });
    }

    // 3. Process payment
    logger.debug("Processing payment", { ...logContext, amount: order.total });
    const paymentResult = await paymentService.processPayment({
      orderId,
      amount: order.total,
      paymentMethod: order.paymentMethod,
    });

    if (!paymentResult.success) {
      logger.warn("Payment failed", {
        ...logContext,
        paymentError: paymentResult.error,
      });
      return res.status(400).json({ error: "Payment failed" });
    }

    // 4. Update order status
    logger.debug("Updating order status", { ...logContext, status: "PAID" });
    await orderService.updateStatus(orderId, "PAID", {
      paymentId: paymentResult.paymentId,
    });

    // 5. Complete order
    logger.info("Order processed successfully", {
      ...logContext,
      paymentId: paymentResult.paymentId,
    });

    return res.status(200).json({
      success: true,
      orderId,
      status: "PAID",
      paymentId: paymentResult.paymentId,
    });
  } catch (error) {
    logger.error("Order processing failed", {
      ...logContext,
      error: error.message,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });

    return res.status(500).json({ error: "Internal server error" });
  }
}
```

## Error Handling & Logging

### Error Classification and Logging

```typescript
// Error types
class AppError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    code = "INTERNAL_ERROR",
    statusCode = 500,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational; // Is this a known/expected error?

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message: string, fields?: string[]) {
    super(message, "VALIDATION_ERROR", 400, true);
    this.fields = fields;
  }
}

class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, "AUTHORIZATION_ERROR", 403, true);
  }
}

// Error logging helper
function logError(error, context = {}) {
  const errorContext = {
    ...context,
    errorName: error.name,
    errorMessage: error.message,
    errorCode: error.code,
    errorStack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    isOperational: error instanceof AppError ? error.isOperational : false,
  };

  if (error instanceof ValidationError) {
    errorContext.validationFields = error.fields;
    logger.warn(`Validation error: ${error.message}`, errorContext);
  } else if (error instanceof AuthorizationError) {
    logger.warn(`Authorization error: ${error.message}`, errorContext);
  } else if (error instanceof AppError && error.isOperational) {
    logger.error(`Operational error: ${error.message}`, errorContext);
  } else {
    // This is an unexpected error - highest severity
    logger.error(`Unexpected error: ${error.message}`, errorContext);

    // For production, you might want to notify on-call staff for unexpected errors
    if (process.env.NODE_ENV === "production") {
      notifyOnCall(error, errorContext);
    }
  }
}
```

## Performance Considerations

### Conditional Logging

```typescript
// Performance optimized logging
function performanceLog(level, message, context = {}) {
  // Skip processing if log level is not enabled
  if (!logger.isLevelEnabled(level)) {
    return;
  }

  // Lazy evaluation of expensive context data
  if (level === "debug" && context.getDetailedData) {
    try {
      const detailedData = context.getDetailedData();
      delete context.getDetailedData;
      context.detailedData = detailedData;
    } catch (error) {
      context.detailedDataError = error.message;
    }
  }

  logger[level](message, context);
}

// Usage
performanceLog("debug", "Processing large dataset", {
  datasetId: dataset.id,
  // Only evaluated if debug is enabled
  getDetailedData: () => {
    // Expensive operation
    return analyzeDataset(dataset);
  },
});
```

### Batched Logging

```typescript
// For high-volume logging scenarios, batch logs
class BatchLogger {
  private queue: any[] = [];
  private timer: NodeJS.Timeout | null = null;
  private batchSize: number;
  private flushInterval: number;

  constructor(options = {}) {
    this.batchSize = options.batchSize || 100;
    this.flushInterval = options.flushInterval || 5000; // 5 seconds
    this.startTimer();
  }

  log(level, message, context = {}) {
    this.queue.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    });

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  flush() {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    // Send in bulk to logging backend
    sendLogBatch(batch).catch((error) => {
      console.error("Failed to send log batch:", error);
      // Add back to queue or write to fallback storage
    });
  }

  startTimer() {
    this.timer = setInterval(() => this.flush(), this.flushInterval);
    this.timer.unref(); // Don't block process exit
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
```

## Monitoring and Alerting Integration

### Datadog Integration

```typescript
// Integration with Datadog for logs and metrics
import { createLogger } from "@/lib/logging";
import { datadogLogs } from "@datadog/browser-logs";

// Initialize Datadog
datadogLogs.init({
  clientToken: process.env.DATADOG_CLIENT_TOKEN,
  site: "datadoghq.com",
  service: process.env.APP_NAME,
  env: process.env.NODE_ENV,
  forwardErrorsToLogs: true,
  sessionSampleRate: 100,
});

// Create custom logger that sends to Datadog
function createDatadogLogger(options) {
  const logger = createLogger(options);

  // Intercept logs and forward to Datadog
  const originalLogger = {};
  ["error", "warn", "info", "debug"].forEach((level) => {
    originalLogger[level] = logger[level];
    logger[level] = function (message, context = {}) {
      // Call original logger
      originalLogger[level].call(logger, message, context);

      // Forward to Datadog
      datadogLogs.logger[level](message, { ...context });
    };
  });

  return logger;
}

export const logger = createDatadogLogger({
  appName: process.env.APP_NAME,
  environment: process.env.NODE_ENV,
});
```

### Log-Based Alerting

```typescript
// Setting up alerts based on log patterns
// In your monitoring configuration (Datadog, New Relic, etc.)

// 1. Critical Error Rate Alert
// Alert when error logs exceed threshold
{
  "name": "High Error Rate",
  "type": "log alert",
  "query": "service:user-service status:error",
  "message": "Error rate exceeded threshold. Investigate immediately.",
  "tags": ["team:authentication", "severity:critical"],
  "thresholds": {
    "critical": 5,  // Alert when 5+ errors in timeframe
    "warning": 2    // Warn when 2+ errors in timeframe
  },
  "timeframe": "5m", // Look at last 5 minutes
  "notify": ["@oncall", "@slack-auth-team"]
}

// 2. Payment Failure Alert
// Alert on specific error types
{
  "name": "Payment Processing Failures",
  "type": "log alert",
  "query": "service:payment-service message:\"Payment processing failed\"",
  "message": "Multiple payment failures detected. Check payment gateway status.",
  "tags": ["team:payments", "severity:critical"],
  "thresholds": {
    "critical": 3
  },
  "timeframe": "10m",
  "notify": ["@oncall", "@slack-payments-team"]
}

// 3. Performance Degradation Alert
// Alert when response times exceed threshold
{
  "name": "API Response Time Degradation",
  "type": "log alert",
  "query": "service:api-gateway responseTime:>500",
  "message": "API response times exceeding 500ms threshold",
  "tags": ["team:platform", "severity:warning"],
  "thresholds": {
    "critical": 10,  // 10+ slow responses
    "warning": 5     // 5+ slow responses
  },
  "timeframe": "5m",
  "notify": ["@slack-platform-team"]
}
```
