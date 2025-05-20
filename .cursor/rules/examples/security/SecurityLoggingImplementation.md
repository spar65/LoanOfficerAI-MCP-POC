# Security Logging Implementation Guide

This guide provides practical implementation guidance for security logging in accordance with the [Security Monitoring Standards](../../technologies/platforms/220-security-monitoring.mdc).

## Key Security Logging Principles

1. **Completeness**: Capture all security-relevant events
2. **Integrity**: Ensure logs cannot be tampered with
3. **Performance**: Balance logging detail with system performance
4. **Privacy**: Protect sensitive information in logs
5. **Usability**: Structure logs for efficient analysis

## Structured Logging Implementation

### JSON Logging Format

```json
{
  "timestamp": "2023-07-15T08:42:15.332Z",
  "level": "WARN",
  "event_type": "AUTHENTICATION_FAILURE",
  "service": "user-auth-service",
  "instance_id": "auth-svc-prod-3",
  "user_id": "user-12345", // Masked or anonymized for PII
  "source_ip": "198.51.100.234",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "location": {
    "country": "US",
    "region": "California"
  },
  "details": {
    "reason": "invalid_credentials",
    "attempt_count": 3,
    "auth_method": "password"
  },
  "correlation_id": "req-abc-123-xyz-789",
  "trace_id": "trace-def-456"
}
```

### Log Fields Explanation

| Field          | Description                        | Example                                   |
| -------------- | ---------------------------------- | ----------------------------------------- |
| timestamp      | ISO 8601 formatted time in UTC     | "2023-07-15T08:42:15.332Z"                |
| level          | Severity level                     | "INFO", "WARN", "ERROR"                   |
| event_type     | Security event category            | "AUTHENTICATION_FAILURE", "ACCESS_DENIED" |
| service        | Service/application name           | "user-auth-service"                       |
| instance_id    | Specific instance identifier       | "auth-svc-prod-3"                         |
| user_id        | User identifier (masked if needed) | "user-12345"                              |
| source_ip      | Origin IP address                  | "198.51.100.234"                          |
| details        | Event-specific details             | {"reason": "invalid_credentials"}         |
| correlation_id | Request identifier                 | "req-abc-123-xyz-789"                     |
| trace_id       | Distributed tracing identifier     | "trace-def-456"                           |

## Language-Specific Implementation Examples

### Java (with Log4j2)

```java
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.ThreadContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;

public class SecurityLogger {
    private static final Logger securityLogger = LogManager.getLogger("SECURITY_LOGGER");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void logSecurityEvent(String eventType, String userId, Map<String, Object> details) {
        try {
            Map<String, Object> securityEvent = new HashMap<>();

            // Add common fields
            securityEvent.put("timestamp", java.time.Instant.now().toString());
            securityEvent.put("event_type", eventType);
            securityEvent.put("service", System.getProperty("service.name"));
            securityEvent.put("instance_id", System.getProperty("instance.id"));
            securityEvent.put("user_id", maskPii(userId));
            securityEvent.put("source_ip", ThreadContext.get("remote_ip"));
            securityEvent.put("user_agent", ThreadContext.get("user_agent"));
            securityEvent.put("correlation_id", ThreadContext.get("correlation_id"));
            securityEvent.put("trace_id", ThreadContext.get("trace_id"));

            // Add event-specific details
            securityEvent.put("details", details);

            // Log as JSON
            securityLogger.info(mapper.writeValueAsString(securityEvent));
        } catch (Exception e) {
            // Fallback in case of serialization error
            securityLogger.error("Failed to log security event: " + eventType, e);
        }
    }

    private static String maskPii(String value) {
        // Implementation of PII masking logic
        if (value == null || value.length() < 8) return value;
        return value.substring(0, 3) + "..." + value.substring(value.length() - 3);
    }

    // Example usage
    public void exampleAuthentication() {
        // During login attempt handling
        Map<String, Object> details = new HashMap<>();
        details.put("reason", "invalid_credentials");
        details.put("attempt_count", 3);
        details.put("auth_method", "password");

        logSecurityEvent("AUTHENTICATION_FAILURE", "user123456", details);
    }
}
```

### Node.js (with Winston)

```javascript
const winston = require("winston");
const { createLogger, format, transports } = winston;
const { combine, timestamp, json } = format;

// Create security logger
const securityLogger = createLogger({
  level: "info",
  format: combine(
    timestamp({
      format: () => new Date().toISOString(),
    }),
    json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME,
    instance_id: process.env.INSTANCE_ID,
  },
  transports: [
    new transports.Console(),
    new transports.File({ filename: "security-events.log" }),
  ],
});

// Middleware to add request context
function addSecurityContext(req, res, next) {
  req.securityContext = {
    source_ip: req.ip || req.connection.remoteAddress,
    user_agent: req.headers["user-agent"],
    correlation_id: req.headers["x-correlation-id"] || generateId(),
    trace_id: req.headers["x-trace-id"] || generateId(),
  };
  next();
}

// Helper function to mask PII
function maskPii(value) {
  if (!value || typeof value !== "string" || value.length < 8) return value;
  return `${value.substring(0, 3)}...${value.substring(value.length - 3)}`;
}

// Security logging function
function logSecurityEvent(req, eventType, userId, details) {
  const context = req.securityContext || {};

  securityLogger.info({
    event_type: eventType,
    user_id: maskPii(userId),
    source_ip: context.source_ip,
    user_agent: context.user_agent,
    correlation_id: context.correlation_id,
    trace_id: context.trace_id,
    details,
  });
}

// Example usage
app.post("/login", addSecurityContext, (req, res) => {
  // Authentication logic
  const authenticated = authenticateUser(req.body.username, req.body.password);

  if (!authenticated) {
    logSecurityEvent(req, "AUTHENTICATION_FAILURE", req.body.username, {
      reason: "invalid_credentials",
      attempt_count: getAttemptCount(req.body.username),
      auth_method: "password",
    });

    return res.status(401).json({ error: "Authentication failed" });
  }

  // Successful authentication logic...
});
```

### Python (with structlog)

```python
import structlog
import time
import uuid
import json
from flask import request, g
from datetime import datetime

# Configure structlog
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

security_logger = structlog.get_logger("security")

# Middleware to add security context
def security_context_middleware():
    g.security_context = {
        "correlation_id": request.headers.get("X-Correlation-ID", str(uuid.uuid4())),
        "trace_id": request.headers.get("X-Trace-ID", str(uuid.uuid4())),
        "source_ip": request.remote_addr,
        "user_agent": request.user_agent.string if request.user_agent else None,
        "service": "user-auth-service",
        "instance_id": "auth-svc-prod-1"
    }

# Helper function to mask PII
def mask_pii(value):
    if not value or len(value) < 8:
        return value
    return value[:3] + "..." + value[-3:]

# Security logging function
def log_security_event(event_type, user_id=None, details=None):
    context = getattr(g, "security_context", {})

    log_data = {
        "event_type": event_type,
        "user_id": mask_pii(user_id) if user_id else None,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "details": details or {}
    }

    # Add context data
    log_data.update(context)

    security_logger.info(event_type, **log_data)

# Example usage in a Flask route
@app.route('/login', methods=['POST'])
def login():
    security_context_middleware()

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Authentication logic
    authenticated = authenticate_user(username, password)

    if not authenticated:
        log_security_event(
            event_type="AUTHENTICATION_FAILURE",
            user_id=username,
            details={
                "reason": "invalid_credentials",
                "attempt_count": get_attempt_count(username),
                "auth_method": "password"
            }
        )
        return jsonify({"error": "Authentication failed"}), 401

    # Successful authentication logic...
```

## Centralized Logging Integration

### ELK Stack Integration

```yaml
# Filebeat configuration example (filebeat.yml)
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /path/to/security-events.log
    json.keys_under_root: true
    json.add_error_key: true
    fields:
      log_type: security_event
    fields_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "security-events-%{+yyyy.MM.dd}"

setup.template.name: "security-events"
setup.template.pattern: "security-events-*"
setup.ilm.enabled: true
setup.ilm.policy_name: "security-events-policy"
```

### AWS CloudWatch Integration

```yaml
# CloudWatch agent configuration
{
  "agent": { "metrics_collection_interval": 60, "run_as_user": "cwagent" },
  "logs":
    {
      "logs_collected":
        {
          "files":
            {
              "collect_list":
                [
                  {
                    "file_path": "/path/to/security-events.log",
                    "log_group_name": "security-events",
                    "log_stream_name": "{instance_id}-security-events",
                    "timezone": "UTC",
                    "timestamp_format": "%Y-%m-%dT%H:%M:%S.%fZ",
                    "multi_line_start_pattern": "^\\{\"timestamp\":",
                    "encoding": "utf-8",
                  },
                ],
            },
        },
    },
}
```

## Security Events to Log

### Authentication Events

| Event Type             | When to Log         | Key Details to Include                        |
| ---------------------- | ------------------- | --------------------------------------------- |
| AUTHENTICATION_SUCCESS | Successful login    | auth_method, user_location, device_info       |
| AUTHENTICATION_FAILURE | Failed login        | reason, attempt_count, auth_method            |
| PASSWORD_CHANGE        | Password changed    | method (self-service/admin), force_reset      |
| PASSWORD_RESET_REQUEST | Password reset      | method, reset_token_id (not the token itself) |
| MFA_ENROLLMENT         | MFA method added    | mfa_type, method (app/SMS/email)              |
| MFA_CHALLENGE          | MFA verification    | mfa_type, success (true/false)                |
| SESSION_CREATION       | New session created | session_id (reference, not token), expiry     |
| SESSION_TERMINATION    | Session ended       | session_id, reason (logout/expiry/forced)     |

### Authorization Events

| Event Type            | When to Log             | Key Details to Include                 |
| --------------------- | ----------------------- | -------------------------------------- |
| AUTHORIZATION_SUCCESS | Access granted          | resource, action, permission_level     |
| AUTHORIZATION_FAILURE | Access denied           | resource, action, reason               |
| PRIVILEGE_CHANGE      | Role/permission change  | previous_roles, new_roles, modifier_id |
| PRIVILEGE_ESCALATION  | Temp privilege increase | reason, expiry, approver_id            |

### Data Access Events

| Event Type            | When to Log               | Key Details to Include                       |
| --------------------- | ------------------------- | -------------------------------------------- |
| SENSITIVE_DATA_ACCESS | PII/sensitive data access | data_type, record_count, purpose             |
| BULK_DATA_EXPORT      | Large data export         | record_count, data_types, format             |
| DATA_MODIFICATION     | Critical data changed     | data_type, change_type, previous_value_hash  |
| UNUSUAL_DATA_ACCESS   | Access pattern anomaly    | normal_pattern, detected_pattern, risk_score |

## Privacy and Compliance Considerations

1. **PII Handling in Logs**

   - Never log plain passwords, tokens, or encryption keys
   - Mask or hash sensitive identifiers (SSN, credit card numbers)
   - Check if IP addresses need anonymization for GDPR compliance
   - Consider legal requirements for data minimization

2. **Log Retention and Deletion**

   - Establish retention policies based on compliance requirements
   - Implement automated log deletion after retention period
   - Ensure secure deletion methods for sensitive logs
   - Document retention periods and justification

3. **Access Controls for Logs**
   - Implement strict access controls to security logs
   - Log all access to the security logs themselves
   - Use role-based access control for log viewing
   - Consider encryption for logs at rest

## Common Implementation Pitfalls

1. **Logging Too Much**

   - Generates noise that obscures important events
   - Impacts system performance
   - Creates unnecessary privacy exposure
   - Solution: Focus on quality over quantity, review and prune log events

2. **Logging Too Little**

   - Misses critical security events
   - Creates blind spots in security monitoring
   - Makes investigation difficult after incidents
   - Solution: Map logging to security use cases and compliance requirements

3. **Inconsistent Formats**

   - Complicates log aggregation and analysis
   - Requires complex parsing rules
   - Reduces search and correlation capabilities
   - Solution: Standardize log formats across all applications

4. **Inadequate Context**

   - Reduces usefulness for investigations
   - Requires correlation across multiple log sources
   - May miss critical relationship between events
   - Solution: Include relevant context in each log event

5. **Missing Timestamps or Poor Time Synchronization**
   - Disrupts event sequencing
   - Complicates correlation across systems
   - Creates confusion during investigations
   - Solution: Use precise UTC timestamps and implement NTP

## Security Logging Maturity Model

### Level 1: Basic Compliance

- Logs authentication events only
- Simple log format with minimal details
- Limited log storage and basic security
- Manual review processes

### Level 2: Standard Security

- Logs authentication and authorization events
- Structured log format with moderate detail
- Centralized log collection with basic search
- Regular log review processes

### Level 3: Advanced Monitoring

- Comprehensive event logging across all systems
- Enriched logs with full context information
- SIEM integration with basic correlation
- Automated alerting for known patterns

### Level 4: Proactive Security

- Complete coverage with business context
- Real-time log analysis and correlation
- Machine learning for anomaly detection
- Automated response capabilities

### Level 5: Intelligence-Driven

- Predictive security event identification
- Threat intelligence integration
- Advanced behavioral analytics
- Continuous improvement based on findings
