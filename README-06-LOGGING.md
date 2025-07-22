# README-06-LOGGING.md

# LoanOfficerAI MCP - Logging Implementation & Strategy

## ✅ Current Status: PRODUCTION-READY LOGGING SYSTEM

**Implementation Status**: **FULLY IMPLEMENTED** ✅  
**Winston Integration**: **COMPLETE** ✅  
**MCP Operation Tracking**: **COMPLETE** ✅  
**Request Context**: **COMPLETE** ✅  
**Error Handling**: **COMPLETE** ✅

> **UPDATE:** Logging now assumes a mandatory SQL DB; fallback logging paths removed.

## 🏗️ Current Architecture

### Core Components

1. **Enhanced LogService** (`server/services/logService.js`)

   - Winston-based structured logging
   - Custom MCP log level for protocol operations
   - Automatic file rotation (5MB/10MB limits)
   - PII sanitization built-in
   - Request context correlation

2. **Request Context Middleware** (`server/middleware/requestContext.js`)

   - UUID-based request tracking
   - AsyncLocalStorage for context propagation
   - MCP function correlation
   - Request timing and performance tracking

3. **Specialized Middleware Stack**:
   - `requestLogger.js` - HTTP request/response logging
   - `errorHandler.js` - Global error capture and logging
   - `authMiddleware.js` - Authentication event logging
   - `tenantMiddleware.js` - Tenant access logging

## 📊 Log Levels & Usage

| Level   | Priority | Usage                                | File Output  |
| ------- | -------- | ------------------------------------ | ------------ |
| `error` | 0        | Critical failures, exceptions        | error.log    |
| `warn`  | 1        | Potential issues, auth failures      | combined.log |
| `info`  | 2        | General operations, API requests     | combined.log |
| `mcp`   | 3        | **MCP protocol operations** (custom) | mcp.log      |
| `debug` | 4        | Detailed debugging information       | combined.log |

### Log Level Configuration

```bash
# Development (default)
LOG_LEVEL=debug

# Production (recommended)
LOG_LEVEL=info

# Enable file logging in development
ENABLE_FILE_LOGGING=true
```

## 🚀 Current Features

### ✅ Implemented Features

- **Structured JSON Logging**: All logs in consistent format
- **Request Correlation**: UUID tracking across entire request lifecycle
- **MCP Operation Highlighting**: Special logging for protocol operations
- **Automatic File Rotation**: 5MB error logs, 10MB combined logs
- **PII Sanitization**: Automatic redaction of sensitive data
- **Environment-Aware**: Different behavior for dev/prod
- **Performance Tracking**: Request timing and duration
- **Error Context**: Full stack traces in development
- **Colorized Console**: Enhanced readability in development

### 🎯 MCP-Specific Logging

```javascript
// Automatic MCP function logging
LogService.mcpFunction("getLoanDetails", { loanId: "L001" });
// Output: 🔧 MCP Function: getLoanDetails

LogService.mcpResult("getLoanDetails", result, 145);
// Output: ✅ MCP Function Complete: getLoanDetails (145ms)

LogService.mcpError("getLoanDetails", error, 89);
// Output: ❌ MCP Function Failed: getLoanDetails (89ms)
```

## 📝 Usage Examples

### Basic Logging

```javascript
const LogService = require("./services/logService");

// Standard logging
LogService.info("User authenticated", { userId: "U123", method: "jwt" });
LogService.warn("Rate limit approaching", { userId: "U123", requests: 95 });
LogService.error("Database connection failed", { error: error.message });

// MCP operations
LogService.mcp("Executing risk assessment", { borrowerId: "B001" });
```

### Request Context Logging

```javascript
// Automatic request correlation
app.use(requestContextMiddleware);

// All logs within request automatically include:
// - requestId
// - userId
// - method/path
// - timing information
```

### Error Handling

```javascript
// Global error handler captures all errors
app.use(errorHandler);

// Logs include:
// - Full error details
// - Request context
// - Stack traces (dev only)
// - Request body/params
```

## 📁 Log File Structure

```
server/logs/
├── error.log       # Error level only (5MB rotation)
├── combined.log    # All levels (10MB rotation)
└── mcp.log         # MCP operations only (10MB rotation)
```

### Log Retention

- **Error logs**: 5 files × 5MB = 25MB total
- **Combined logs**: 10 files × 10MB = 100MB total
- **MCP logs**: 5 files × 10MB = 50MB total

## 🔍 Log Output Examples

### Console Output (Development)

```
2025-07-09 14:23:15.123 [info]: 🌐 POST /api/openai {
  "category": "api-request",
  "requestId": "req-123-456",
  "userId": "user-789"
}

2025-07-09 14:23:15.145 [mcp]: 🔧 MCP Function: getLoanDetails {
  "category": "mcp-function-start",
  "functionName": "getLoanDetails",
  "args": { "loanId": "L001" }
}

2025-07-09 14:23:15.267 [mcp]: ✅ MCP Function Complete: getLoanDetails (122ms) {
  "category": "mcp-function-complete",
  "duration": 122,
  "resultType": "object",
  "resultSize": 1247
}
```

### JSON Output (Production)

```json
{
  "timestamp": "2025-07-09T14:23:15.123Z",
  "level": "info",
  "message": "🌐 POST /api/openai",
  "service": "loan-officer-ai",
  "version": "1.0.0",
  "category": "api-request",
  "requestId": "req-123-456",
  "userId": "user-789",
  "pid": 12345,
  "hostname": "loan-server-01"
}
```

## 🔒 Security & Compliance

### PII Protection

```javascript
// Automatic redaction of sensitive fields
const sensitiveFields = ["password", "token", "secret", "key", "ssn", "social"];

// Input: { password: "secret123", userId: "U123" }
// Logged: { password: "[REDACTED]", userId: "U123" }
```

### Audit Trail

- **Authentication Events**: Login/logout, token validation
- **Authorization Events**: Access denials, tenant violations
- **Data Access**: MCP function calls with parameters
- **Error Events**: All exceptions with context

## 🚀 Recommendations

### Current State Assessment

**✅ STRENGTHS:**

- Production-ready Winston implementation
- Comprehensive MCP operation tracking
- Request correlation and context
- Automatic PII sanitization
- Environment-aware configuration

**⚠️ POTENTIAL IMPROVEMENTS:**

### Phase 1: Immediate Enhancements (2-4 hours)

1. **Log Aggregation Setup**

   ```bash
   # Add ELK stack or similar for production
   npm install winston-elasticsearch
   ```

2. **Performance Monitoring**

   ```javascript
   // Add performance thresholds
   if (duration > 1000) {
     LogService.warn("Slow MCP function", { functionName, duration });
   }
   ```

3. **Health Check Logging**
   ```javascript
   // Add system health logging
   LogService.info("System health check", {
     memory: process.memoryUsage(),
     uptime: process.uptime(),
   });
   ```

### Phase 2: Advanced Features (4-8 hours)

1. **Metrics Integration**

   - Add Prometheus metrics export
   - Create dashboards for MCP operations
   - Set up alerting for error rates

2. **Distributed Tracing**

   - Add OpenTelemetry integration
   - Trace requests across services
   - Correlate logs with traces

3. **Advanced Filtering**
   - Add log sampling for high-volume events
   - Implement log level per module
   - Create business-specific log categories

## 📈 Monitoring & Alerting

### Key Metrics to Monitor

1. **Error Rates**

   ```javascript
   // Current: Logged to files
   // Recommended: Export to monitoring system
   ```

2. **MCP Performance**

   ```javascript
   // Track function execution times
   // Alert on functions > 5 seconds
   // Monitor success/failure rates
   ```

3. **Authentication Events**
   ```javascript
   // Monitor failed login attempts
   // Track token validation failures
   // Alert on suspicious patterns
   ```

### Alerting Thresholds

- **Error Rate**: > 5% of requests in 5 minutes
- **Response Time**: > 2 seconds average
- **Authentication Failures**: > 10 failures/minute
- **MCP Function Failures**: > 3 failures/minute

## 🧪 Testing Logging

### Enable File Logging for Testing

```bash
# Test file logging locally
export ENABLE_FILE_LOGGING=true
cd server && npm start

# Check logs
tail -f logs/mcp.log
tail -f logs/combined.log
```

### Test MCP Logging

```bash
# Make a request that triggers MCP functions
curl -X POST http://localhost:3001/api/openai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"message": "Show me loan L001"}'

# Check MCP-specific logs
grep "MCP Function" logs/mcp.log
```
