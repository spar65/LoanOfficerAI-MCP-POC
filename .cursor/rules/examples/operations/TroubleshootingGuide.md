# Troubleshooting Implementation Guide

This guide provides practical examples and implementation patterns for the troubleshooting standards specified in rule 140-troubleshooting-standards.mdc.

## Table of Contents

1. [Systematic Approach to Troubleshooting](#systematic-approach-to-troubleshooting)
2. [Diagnostic Code Management](#diagnostic-code-management)
3. [Diagnostic File Handling](#diagnostic-file-handling)
4. [Root Cause Analysis Templates](#root-cause-analysis-templates)
5. [Troubleshooting Toolbox](#troubleshooting-toolbox)
6. [Environment-Specific Practices](#environment-specific-practices)
7. [Post-Incident Documentation](#post-incident-documentation)

## Systematic Approach to Troubleshooting

### Troubleshooting Workflow Example

Here's a practical example of applying the systematic troubleshooting methodology:

#### 1. Issue: "API requests time out intermittently"

**Observation Phase:**

```
ISSUE: API requests to /users endpoint timeout intermittently with 504 errors
FREQUENCY: ~5% of requests, more common during peak hours
FIRST OCCURRENCE: Started Tuesday after deployment of v2.14.0
AFFECTED USERS: All users making requests to this endpoint
ENVIRONMENTS: Production only (not reproducible in staging)
```

**Data Gathering:**

```
1. Collected relevant logs showing timeouts
2. Analyzed APM metrics showing increased latency
3. Checked recent deployments and configuration changes
4. Confirmed database connection pool metrics
5. Reviewed network logs between services
```

#### 2. Hypothesis Formation

```
POSSIBLE CAUSES (prioritized):
1. Database connection pool exhaustion (EVIDENCE: Pool metrics show 90%+ utilization during incidents)
2. Slow database query (EVIDENCE: Some queries take 3-5s during peak load)
3. External API rate limiting (EVIDENCE: None, integration logs show normal responses)
4. Network latency (EVIDENCE: None, network metrics stable)
5. Memory leak (EVIDENCE: None, memory usage stable over time)
```

#### 3. Testing & Diagnostic Implementation

**Diagnostic Code Added (with proper marking):**

```javascript
// DIAGNOSTIC CODE - TEMPORARY
// PURPOSE: Track database connection pool metrics
// EXPIRY: 2023-07-28
// TICKET: JIRA-2341 - API request timeouts
app.use("/users", (req, res, next) => {
  if (process.env.ENABLE_DB_DIAGNOSTICS === "true") {
    const poolMetrics = db.getConnectionPool().getMetrics();
    logger.debug("Connection pool metrics", {
      correlationId: req.headers["x-correlation-id"],
      path: req.path,
      activeConnections: poolMetrics.active,
      idleConnections: poolMetrics.idle,
      pendingRequests: poolMetrics.pending,
      timestamp: new Date().toISOString(),
    });

    // Time the database operation
    const startTime = process.hrtime();
    res.on("finish", () => {
      const elapsed = process.hrtime(startTime);
      const elapsedMs = elapsed[0] * 1000 + elapsed[1] / 1000000;

      if (elapsedMs > 1000) {
        logger.warn("Slow database operation detected", {
          correlationId: req.headers["x-correlation-id"],
          path: req.path,
          durationMs: elapsedMs,
          statusCode: res.statusCode,
        });
      }
    });
  }
  next();
});
```

**Load Testing:**

```bash
# Created diagnostic load test specifically targeting the problematic endpoint
./load-test.sh --endpoint /users --rate 100 --duration 5m
```

#### 4. Analysis & Root Cause

```
ROOT CAUSE: Database connection pool size (30) insufficient for peak load
EVIDENCE:
- Diagnostic logs show 100% pool utilization during timeout events
- Connection acquisition wait time increases to >3s during incidents
- Database CPU and memory usage remain within normal range
- No slow queries identified in database logs
```

#### 5. Solution Implementation

```
SOLUTION:
1. Increased connection pool size from 30 to 60
2. Implemented connection pool monitoring with alerts
3. Added retry logic for connection timeouts
4. Created load tests to validate connection pool sizing

VERIFICATION:
- Load testing with 150% of peak production load shows no timeouts
- Connection wait time reduced to <50ms in peak load simulation
- No customer-reported timeouts for 72 hours after implementation
```

#### 6. Knowledge Sharing

```
DOCUMENTATION UPDATES:
1. Updated database configuration guide with connection pool sizing guidelines
2. Added new monitoring dashboard for database connection metrics
3. Created runbook for handling similar issues in future
4. Documented connection pool sizing formula based on observed request patterns
```

## Diagnostic Code Management

### Feature Flag Implementation for Diagnostics

Here's an implementation of a feature flag system for managing diagnostic code safely:

```typescript
// src/utils/diagnostics.ts
import { getFeatureFlag } from "./feature-flags";
import { logger } from "./logging";

/**
 * Utility for wrapping diagnostic code in feature flags
 * @param flagName Name of the feature flag that enables this diagnostic
 * @param diagnosticFn Function containing the diagnostic code
 * @param expiryDate Date when this diagnostic code should be removed
 * @param ticketId Associated ticket ID for tracking
 */
export function withDiagnostics<T>(
  flagName: string,
  diagnosticFn: () => T,
  expiryDate?: Date,
  ticketId?: string
): T | undefined {
  const isDiagnosticEnabled = getFeatureFlag(flagName);

  // Log usage of this diagnostic code (for audit purposes)
  if (isDiagnosticEnabled) {
    const now = new Date();

    // Check if the diagnostic has expired
    if (expiryDate && now > expiryDate) {
      logger.warn("Using expired diagnostic code", {
        flagName,
        expiryDate: expiryDate.toISOString(),
        ticketId,
      });
    }

    logger.debug("Executing diagnostic code", {
      flagName,
      expiryDate: expiryDate?.toISOString(),
      ticketId,
    });
  }

  // Execute the diagnostic code only if the flag is enabled
  return isDiagnosticEnabled ? diagnosticFn() : undefined;
}

// Usage example
export function getUserProfile(userId: string) {
  withDiagnostics(
    "ENABLE_PROFILE_TIMING",
    () => {
      console.time(`getUserProfile-${userId}`);
      return (cleanup = () => console.timeEnd(`getUserProfile-${userId}`));
    },
    new Date("2023-08-15"),
    "JIRA-5678"
  );

  try {
    // Normal function logic
    const user = database.getUser(userId);

    withDiagnostics("LOG_PROFILE_DB_CALLS", () => {
      logger.debug("Database call result for user profile", {
        userId,
        queryTimeMs: user._diagnostic?.queryTimeMs,
        cacheHit: user._diagnostic?.cacheHit,
      });
    });

    return user;
  } finally {
    // Execute the cleanup function if it exists
    cleanup?.();
  }
}
```

### Diagnostic Code Review Checklist

```markdown
## Diagnostic Code Review Checklist

- [ ] Is the diagnostic code properly marked with standard comments?
- [ ] Does the code include an expiration date?
- [ ] Is the code wrapped in a feature flag or environment variable check?
- [ ] Is the diagnostic code minimally invasive to normal operation?
- [ ] Does the code avoid exposing sensitive information?
- [ ] Is there a cleanup method to remove side effects?
- [ ] Is there a ticket or issue tracking the removal of this code?
- [ ] Has the diagnostic code been tested in lower environments?
- [ ] Does the code have appropriate error handling?
- [ ] Is the performance impact acceptable for the target environment?
```

## Diagnostic File Handling

### Setting Up Diagnostic Directories

```bash
# Create diagnostic directories for different environments
mkdir -p ./diagnostics/{dev,staging,prod}

# Set proper permissions (restrictive for production diagnostics)
chmod 755 ./diagnostics/dev ./diagnostics/staging
chmod 700 ./diagnostics/prod

# Add to .gitignore
echo "# Diagnostic files" >> .gitignore
echo "diagnostics/*/*.log" >> .gitignore
echo "diagnostics/*/*.dump" >> .gitignore
echo "diagnostics/*/*.trace" >> .gitignore

# Create README in each directory
for env in dev staging prod; do
  cat > ./diagnostics/$env/README.md << EOF
# $env Diagnostic Files

Files in this directory are temporary diagnostic artifacts.
Do not commit these files to version control.

## File Naming Convention
- Use prefix \`diag_\` for all files
- Include date in format YYYYMMDD
- Include brief description of purpose
- Example: \`diag_20230615_memory_leak_investigation.log\`

## Required Metadata
All diagnostic files should begin with metadata comments:
\`\`\`
# DIAGNOSTIC FILE - TEMPORARY
# Owner: [Your Name]
# Purpose: [Brief description]
# Created: [YYYY-MM-DD]
# Expiry: [YYYY-MM-DD]
# Ticket: [JIRA-XXX]
\`\`\`
EOF
done
```

### Automated Cleanup Script

```bash
#!/bin/bash
# diagnostic_cleanup.sh - Purge expired diagnostic files

set -e

# Check each diagnostic file for expiry date and delete if expired
find ./diagnostics -type f -name "diag_*" | while read file; do
  if [[ "$file" == *.md ]]; then
    continue
  fi

  # Extract expiry date from file header
  expiry_date=$(grep -i "# Expiry:" "$file" | awk '{print $3}')

  # Skip files without expiry date
  if [[ -z "$expiry_date" ]]; then
    echo "WARNING: No expiry date found in $file"
    continue
  fi

  # Convert dates to seconds since epoch for comparison
  expiry_seconds=$(date -d "$expiry_date" +%s)
  current_seconds=$(date +%s)

  # Delete expired files
  if (( current_seconds > expiry_seconds )); then
    owner=$(grep -i "# Owner:" "$file" | cut -d: -f2- | xargs)
    ticket=$(grep -i "# Ticket:" "$file" | cut -d: -f2- | xargs)
    echo "Removing expired diagnostic file: $file (Owner: $owner, Ticket: $ticket)"
    rm "$file"
  fi
done

echo "Diagnostic file cleanup completed"
```

## Root Cause Analysis Templates

### Template for Troubleshooting Report

```markdown
# Troubleshooting Report

## Issue Summary

**Description:** [Brief description of the issue]
**Reported By:** [Who reported the issue]
**Date/Time:** [When the issue was reported]
**Severity:** [Critical/High/Medium/Low]
**Status:** [Open/In Progress/Resolved]

## Issue Details

**Affected Systems:** [List of affected systems/components]
**Affected Users:** [Number and type of users affected]
**Symptoms:** [Observable symptoms]
**Frequency:** [How often issue occurs]
**Reproduction Steps:** [Steps to reproduce if available]

## Investigation

**Data Gathered:**

- [Log files]
- [Metrics]
- [User reports]
- [Screenshots/Videos]

**Hypotheses:**

1. [Hypothesis 1] - **Priority:** [High/Medium/Low] - **Evidence:** [Supporting evidence]
2. [Hypothesis 2] - **Priority:** [High/Medium/Low] - **Evidence:** [Supporting evidence]
3. [Hypothesis 3] - **Priority:** [High/Medium/Low] - **Evidence:** [Supporting evidence]

**Tests Performed:**

1. [Test 1] - **Result:** [Result] - **Conclusion:** [What this tells us]
2. [Test 2] - **Result:** [Result] - **Conclusion:** [What this tells us]
3. [Test 3] - **Result:** [Result] - **Conclusion:** [What this tells us]

**Diagnostic Code/Tools:**

- [List diagnostic code or tools used]
- [Where they were deployed]
- [How they were configured]

## Root Cause

**Primary Cause:** [The identified root cause]
**Contributing Factors:**

- [Factor 1]
- [Factor 2]

## Resolution

**Solution Implemented:** [Description of the solution]
**Verification Method:** [How solution was verified]
**Deployment Time:** [When solution was deployed]
**Resolution Time:** [Total time to resolve]

## Prevention

**Long-term Fixes:**

- [Long-term fix 1]
- [Long-term fix 2]

**Monitoring Improvements:**

- [New monitoring 1]
- [New monitoring 2]

**Documentation Updates:**

- [Documentation 1]
- [Documentation 2]

## Lessons Learned

**What Went Well:**

- [Positive aspect 1]
- [Positive aspect 2]

**What Could Be Improved:**

- [Area for improvement 1]
- [Area for improvement 2]

## Related Items

**Tickets:** [List of related tickets]
**Pull Requests:** [List of related PRs]
**Diagnostic Files:** [List of diagnostic files generated]
```

## Troubleshooting Toolbox

### System-Level Diagnostic Tools

Here are common diagnostic tools and their safe usage patterns:

#### Memory and Performance Analysis

```bash
# Node.js memory snapshot
node --inspect-brk app.js
# Then connect Chrome devtools and capture heap snapshot

# System-wide memory analysis
# Safe for production (minimal overhead)
vmstat 5 10  # Get 10 memory samples at 5 second intervals

# CPU usage by process (safe for production)
ps aux --sort=-%cpu | head -10

# Thread analysis (moderate overhead, use carefully in production)
pstack <pid>
```

#### Network Diagnostics

```bash
# Safe network monitoring (packet headers only)
sudo tcpdump -i any host example.com -n

# API request/response capture (with sensitive data filtering)
# Add to API middleware temporarily
app.use((req, res, next) => {
  if (process.env.API_DIAGNOSTICS === 'true') {
    const oldWrite = res.write;
    const oldEnd = res.end;
    const chunks = [];

    // Capture response body chunks
    res.write = function(chunk, ...args) {
      chunks.push(chunk);
      return oldWrite.apply(res, [chunk, ...args]);
    };

    res.end = function(chunk, ...args) {
      if (chunk) chunks.push(chunk);

      // Log request and response with redacted sensitive fields
      const reqBody = sanitizeData(req.body);
      let resBody = '';

      try {
        resBody = Buffer.concat(chunks).toString('utf8');
        // Try to parse as JSON for better sanitization
        resBody = JSON.parse(resBody);
        resBody = sanitizeData(resBody);
      } catch (e) {
        // If not JSON, just use string representation
        resBody = '[Non-JSON response]';
      }

      logger.debug('API Request/Response', {
        correlationId: req.headers['x-correlation-id'],
        method: req.method,
        path: req.path,
        requestBody: reqBody,
        responseBody: resBody,
        statusCode: res.statusCode,
        responseTime: Date.now() - req._startTime
      });

      return oldEnd.apply(res, [chunk, ...args]);
    };
  }

  req._startTime = Date.now();
  next();
});
```

#### Database Diagnostics

```sql
-- Safe query analysis (EXPLAIN instead of execute)
EXPLAIN ANALYZE SELECT * FROM users WHERE last_login > current_date - interval '30 days';

-- Connection pool monitoring query (safe, low overhead)
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- Identifying slow queries (safe query on monitoring tables)
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Web Application Diagnostics

```javascript
// Temporary diagnostic endpoint (must be secured and feature-flagged)
if (
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_DIAGNOSTICS === "true"
) {
  app.get("/diagnostic/request-stats", authenticateAdmin, (req, res) => {
    const stats = {
      uptime: process.uptime(),
      requestCount: global._requestStats.total,
      errorCount: global._requestStats.errors,
      averageResponseTime:
        global._requestStats.totalTime / global._requestStats.total,
      memoryUsage: process.memoryUsage(),
      activeConnections: server.getConnections(),
    };

    res.json(stats);
  });
}

// Feature flag configuration for diagnostics
const DIAGNOSTIC_FLAGS = {
  REQUEST_TIMING: process.env.DIAG_REQUEST_TIMING === "true",
  DB_QUERY_LOGGING: process.env.DIAG_DB_LOGGING === "true",
  MEMORY_USAGE_TRACKING: process.env.DIAG_MEMORY_TRACKING === "true",
  CACHE_STATS: process.env.DIAG_CACHE_STATS === "true",
};
```

## Environment-Specific Practices

### Development Environment

```javascript
// Development-specific diagnostic configuration
if (process.env.NODE_ENV === "development") {
  app.use(require("express-status-monitor")()); // Request monitoring UI
  app.use(require("morgan")("dev")); // HTTP request logging

  // Enable more verbose logging
  logger.level = "debug";

  // Load development diagnostic routes
  app.use("/dev-tools", require("./dev-diagnostic-routes"));
}
```

### Staging Environment

```javascript
// Staging environment diagnostics with conditional enabling
if (process.env.NODE_ENV === "staging") {
  // Enable diagnostic routes only for internal IPs or with diagnostic token
  app.use(
    "/diagnostics",
    (req, res, next) => {
      const isInternalIP =
        ["127.0.0.1", "::1"].includes(req.ip) ||
        req.ip.startsWith("10.") ||
        req.ip.startsWith("172.16.") ||
        req.ip.startsWith("192.168.");

      const hasValidToken =
        req.query.diagnostic_token === process.env.DIAGNOSTIC_TOKEN;

      if (isInternalIP || hasValidToken) {
        next();
      } else {
        res.status(403).json({ error: "Unauthorized access to diagnostics" });
      }
    },
    require("./staging-diagnostic-routes")
  );

  // Conditional request sampling for performance analysis
  const SAMPLE_RATE = 0.05; // 5% of requests
  app.use((req, res, next) => {
    if (Math.random() < SAMPLE_RATE) {
      req._shouldProfile = true;
      const startTime = process.hrtime();

      res.on("finish", () => {
        const endTime = process.hrtime(startTime);
        const duration = endTime[0] * 1000 + endTime[1] / 1000000;

        logger.debug("Request performance sample", {
          path: req.path,
          method: req.method,
          duration,
          statusCode: res.statusCode,
          contentLength: res.get("Content-Length"),
        });
      });
    }
    next();
  });
}
```

### Production Environment

```javascript
// Production-safe diagnostics with minimal overhead
if (process.env.NODE_ENV === "production") {
  // Capture request metrics without logging full details
  app.use((req, res, next) => {
    // Increment counters for monitoring
    const countKey = req.method + req.route?.path || "unknown";
    if (!global._requestStats) {
      global._requestStats = {
        routes: {},
        startTime: Date.now(),
      };
    }

    global._requestStats.routes[countKey] =
      (global._requestStats.routes[countKey] || 0) + 1;

    // Sample slow requests only
    const startTime = process.hrtime();

    res.on("finish", () => {
      const endTime = process.hrtime(startTime);
      const duration = endTime[0] * 1000 + endTime[1] / 1000000;

      // Only log if request is slow (>500ms)
      if (duration > 500) {
        logger.warn("Slow request detected", {
          path: req.path,
          method: req.method,
          duration,
          statusCode: res.statusCode,
        });
      }
    });

    next();
  });

  // Admin diagnostic endpoint - secured with JWT auth for admins only
  app.get(
    "/admin/diagnostics",
    authenticateAdmin,
    requirePermission("admin:diagnostics"),
    (req, res) => {
      // Only return safe diagnostic data, never internal details
      res.json({
        uptime: process.uptime(),
        version: process.env.APP_VERSION || "unknown",
        requestStats: {
          totalSince: new Date(global._requestStats.startTime).toISOString(),
          totalCount: Object.values(global._requestStats.routes).reduce(
            (a, b) => a + b,
            0
          ),
          // Don't include exact route information for security
          statusGroups: {
            "2xx": global._requestStats.statusGroups?.["2xx"] || 0,
            "3xx": global._requestStats.statusGroups?.["3xx"] || 0,
            "4xx": global._requestStats.statusGroups?.["4xx"] || 0,
            "5xx": global._requestStats.statusGroups?.["5xx"] || 0,
          },
        },
        // Provide minimal health information
        health: {
          databaseConnected: global._healthStatus?.dbConnected || false,
          cacheConnected: global._healthStatus?.cacheConnected || false,
          serviceStatus: global._healthStatus?.status || "unknown",
        },
      });
    }
  );
}
```

## Post-Incident Documentation

### Issue Postmortem Template

```markdown
# Post-Incident Review

## Incident Summary

**Incident ID:** [Unique identifier]
**Date:** [Date of incident]
**Duration:** [How long the incident lasted]
**Severity:** [P0/P1/P2/P3]
**Incident Commander:** [Name of person who led response]

## Impact

**User Impact:** [Description of user-facing effects]
**Business Impact:** [Revenue, reputation, etc.]
**Metrics:**

- [x] users affected
- [Y]% error rate
- [Z] minutes of degraded service

## Timeline

| Time  | Event                       | Actions                            |
| ----- | --------------------------- | ---------------------------------- |
| 10:00 | First error alert triggered | Team notified                      |
| 10:05 | Investigation started       | Reviewing logs and metrics         |
| 10:15 | Root cause identified       | Database connection pool exhausted |
| 10:20 | Mitigating action taken     | Increased connection pool size     |
| 10:25 | Service stabilizing         | Error rates dropping               |
| 10:30 | Incident resolved           | Service fully restored             |

## Root Cause Analysis

**Primary Cause:** [Technical explanation of what happened]
**Contributing Factors:**

1. [Factor 1]
2. [Factor 2]

**Trigger:** [What specifically triggered the incident]

## Detection

**How Detected:** [Monitoring alert, customer report, etc.]
**Detection Delay:** [Time between start and detection]
**Improvement Opportunities:**

- [How detection could be improved]

## Resolution

**Resolution Actions:**

1. [Action 1]
2. [Action 2]

**Effectiveness:** [How well the resolution worked]
**Resolution Delay:** [Time between detection and resolution]
**Improvement Opportunities:**

- [How resolution could be improved]

## Prevention

**Immediate Actions:**

1. [Action 1 with owner and due date]
2. [Action 2 with owner and due date]

**Long-Term Improvements:**

1. [Improvement 1 with owner and due date]
2. [Improvement 2 with owner and due date]

**Monitoring Improvements:**

1. [New/improved monitoring with owner]

## Communication

**Internal Communication:**

- [When/how team was notified]
- [When/how management was notified]

**External Communication:**

- [When/how customers were notified]
- [Content of communication]

## Lessons Learned

**What Went Well:**

- [Positive aspect 1]
- [Positive aspect 2]

**What Went Poorly:**

- [Negative aspect 1]
- [Negative aspect 2]

**Actionable Takeaways:**

1. [Lesson 1]
2. [Lesson 2]

## Additional Resources

- [Link to incident ticket]
- [Link to chat logs]
- [Link to dashboards]
- [Link to code changes]
```

### Playbook Creation Guidelines

After troubleshooting similar issues multiple times, create a playbook to standardize investigation and resolution:

```markdown
# [Issue Type] Troubleshooting Playbook

## Issue Identification

**Symptoms:**

- [Observable symptom 1]
- [Observable symptom 2]

**Alerts:**

- [Associated monitoring alerts]

**Initial Assessment Questions:**

1. [Question to determine scope]
2. [Question to determine severity]

## Diagnostic Procedure

### Step 1: Verify the Issue

- [ ] Check [specific dashboard]
- [ ] Run [specific diagnostic command]
- [ ] Expected result: [what you should see]

### Step 2: Gather Information

- [ ] Collect logs from [location] with command: `[command]`
- [ ] Check metrics on [dashboard]
- [ ] Review recent deployments with command: `[command]`

### Step 3: Common Causes and Solutions

#### Cause A: [Common cause #1]

**Diagnostic:**

- [ ] Check [specific indicator]
- [ ] Run [specific command]
- [ ] Look for pattern: [specific pattern]

**Resolution:**

- [ ] Execute: `[specific command]`
- [ ] Verify by: [verification method]

#### Cause B: [Common cause #2]

**Diagnostic:**

- [ ] Check [specific indicator]
- [ ] Run [specific command]
- [ ] Look for pattern: [specific pattern]

**Resolution:**

- [ ] Execute: `[specific command]`
- [ ] Verify by: [verification method]

## Escalation Procedure

- If issue persists after trying all solutions, escalate to [team/person]
- Required information for escalation:
  - [Information to provide]
  - [Logs to attach]
  - [Attempted solutions]

## Preventative Measures

- Regular maintenance: [Scheduled task to prevent issue]
- Monitoring: [Specific monitoring to detect early signs]
- Automation: [Automated solution to implement]
```
