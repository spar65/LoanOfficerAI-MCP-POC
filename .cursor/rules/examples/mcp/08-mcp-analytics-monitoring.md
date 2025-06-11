# MCP Analytics and Monitoring

This guide demonstrates how to add observability to MCP functions through comprehensive logging, metrics, and monitoring.

## Table of Contents

1. [Introduction](#introduction)
2. [Structured Logging](#structured-logging)
3. [Performance Metrics](#performance-metrics)
4. [Request Tracing](#request-tracing)
5. [Dashboards and Alerts](#dashboards-and-alerts)

## Introduction

Observability is critical for understanding how your MCP functions are performing and identifying issues. A comprehensive approach includes:

- Structured logging for all function executions
- Performance metrics tracking
- Distributed tracing across services
- Real-time dashboards and alerting

## Structured Logging

```javascript
// server/services/mcpMonitoringService.js
const LogService = require("./logService");

class McpMonitoringService {
  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalDuration: 0,
      functionMetrics: new Map(),
    };

    // Reset metrics every hour
    setInterval(() => this.resetHourlyMetrics(), 60 * 60 * 1000);
  }

  // Middleware for MCP function logging and metrics
  createLoggingMiddleware() {
    return async (context, next) => {
      const { functionName, args, requestId } = context;
      const startTime = Date.now();

      // Record start in structured log
      LogService.info(`MCP function started: ${functionName}`, {
        function: functionName,
        requestId,
        args: JSON.stringify(args),
        timestamp: new Date().toISOString(),
        type: "mcp_function_start",
      });

      try {
        // Execute the function
        const result = await next();

        // Calculate duration
        const duration = Date.now() - startTime;

        // Update metrics
        this.updateMetrics(functionName, duration, false);

        // Record success in structured log
        LogService.info(
          `MCP function completed: ${functionName} (${duration}ms)`,
          {
            function: functionName,
            requestId,
            duration,
            resultSize: JSON.stringify(result).length,
            timestamp: new Date().toISOString(),
            type: "mcp_function_success",
          }
        );

        return result;
      } catch (error) {
        // Calculate duration
        const duration = Date.now() - startTime;

        // Update metrics with error
        this.updateMetrics(functionName, duration, true);

        // Record error in structured log
        LogService.error(
          `MCP function failed: ${functionName} (${duration}ms)`,
          {
            function: functionName,
            requestId,
            duration,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            type: "mcp_function_error",
          }
        );

        // Re-throw error
        throw error;
      }
    };
  }

  // Update metrics for a function execution
  updateMetrics(functionName, duration, isError) {
    // Update global metrics
    this.metrics.requestCount++;
    this.metrics.totalDuration += duration;

    if (isError) {
      this.metrics.errorCount++;
    }

    // Update function-specific metrics
    if (!this.metrics.functionMetrics.has(functionName)) {
      this.metrics.functionMetrics.set(functionName, {
        name: functionName,
        count: 0,
        errorCount: 0,
        totalDuration: 0,
        minDuration: duration,
        maxDuration: duration,
      });
    }

    const functionMetrics = this.metrics.functionMetrics.get(functionName);

    functionMetrics.count++;
    functionMetrics.totalDuration += duration;

    if (isError) {
      functionMetrics.errorCount++;
    }

    functionMetrics.minDuration = Math.min(
      functionMetrics.minDuration,
      duration
    );
    functionMetrics.maxDuration = Math.max(
      functionMetrics.maxDuration,
      duration
    );
  }

  // Reset hourly metrics
  resetHourlyMetrics() {
    // Archive current metrics if needed
    this.archiveMetrics();

    // Reset metrics
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalDuration: 0,
      functionMetrics: new Map(),
    };

    LogService.info("MCP metrics reset for new hour");
  }

  // Archive metrics for historical tracking
  archiveMetrics() {
    // Implement archiving to database or metrics system
    const timestamp = new Date().toISOString();
    const metricsSnapshot = {
      timestamp,
      requestCount: this.metrics.requestCount,
      errorCount: this.metrics.errorCount,
      avgDuration:
        this.metrics.requestCount > 0
          ? this.metrics.totalDuration / this.metrics.requestCount
          : 0,
      functions: Array.from(this.metrics.functionMetrics.values()).map(
        (fn) => ({
          name: fn.name,
          count: fn.count,
          errorCount: fn.errorCount,
          errorRate: fn.count > 0 ? (fn.errorCount / fn.count) * 100 : 0,
          avgDuration: fn.count > 0 ? fn.totalDuration / fn.count : 0,
          minDuration: fn.minDuration,
          maxDuration: fn.maxDuration,
        })
      ),
    };

    // Log metrics snapshot
    LogService.info("MCP hourly metrics snapshot", {
      metrics: metricsSnapshot,
      type: "mcp_metrics_snapshot",
    });

    // Here you would typically store these metrics in a database
    // or send them to a monitoring system
  }

  // Get current metrics
  getMetrics() {
    const functionMetricsArray = Array.from(
      this.metrics.functionMetrics.values()
    ).map((fn) => ({
      name: fn.name,
      count: fn.count,
      errorCount: fn.errorCount,
      errorRate: fn.count > 0 ? (fn.errorCount / fn.count) * 100 : 0,
      avgDuration: fn.count > 0 ? fn.totalDuration / fn.count : 0,
      minDuration: fn.minDuration,
      maxDuration: fn.maxDuration,
    }));

    return {
      timestamp: new Date().toISOString(),
      requestCount: this.metrics.requestCount,
      errorCount: this.metrics.errorCount,
      errorRate:
        this.metrics.requestCount > 0
          ? (this.metrics.errorCount / this.metrics.requestCount) * 100
          : 0,
      avgDuration:
        this.metrics.requestCount > 0
          ? this.metrics.totalDuration / this.metrics.requestCount
          : 0,
      functions: functionMetricsArray,
    };
  }
}

module.exports = new McpMonitoringService();
```

## Performance Metrics

```javascript
// Applying the monitoring middleware to MCP router
const mcpRouter = require("./mcpRouter");
const mcpMonitoring = require("./services/mcpMonitoringService");

// Apply monitoring middleware to all MCP function executions
mcpRouter.use(mcpMonitoring.createLoggingMiddleware());

// Add endpoint to expose metrics
app.get("/api/mcp/metrics", (req, res) => {
  // Only allow admin users to access metrics
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied" });
  }

  res.json(mcpMonitoring.getMetrics());
});
```

## Request Tracing

```javascript
// Distributed tracing middleware
function createTracingMiddleware() {
  return async (context, next) => {
    // Generate trace ID if not present
    const traceId = context.traceId || generateTraceId();

    // Generate span ID for this operation
    const spanId = generateSpanId();

    // Create span context
    const span = {
      traceId,
      spanId,
      parentSpanId: context.spanId, // Parent span if this is a child operation
      operation: context.functionName,
      service: "mcp-service",
      startTime: Date.now(),
    };

    // Add trace info to context
    const tracedContext = {
      ...context,
      traceId,
      spanId,
      span,
    };

    // Start span
    LogService.trace("Span started", {
      traceId,
      spanId,
      parentSpanId: context.spanId,
      operation: context.functionName,
      service: "mcp-service",
      type: "span_start",
    });

    try {
      // Execute with tracing context
      const result = await next(tracedContext);

      // End span
      LogService.trace("Span completed", {
        traceId,
        spanId,
        parentSpanId: context.spanId,
        operation: context.functionName,
        service: "mcp-service",
        duration: Date.now() - span.startTime,
        type: "span_end",
      });

      return result;
    } catch (error) {
      // End span with error
      LogService.trace("Span failed", {
        traceId,
        spanId,
        parentSpanId: context.spanId,
        operation: context.functionName,
        service: "mcp-service",
        duration: Date.now() - span.startTime,
        error: error.message,
        type: "span_error",
      });

      throw error;
    }
  };
}

// Generate trace ID
function generateTraceId() {
  return "trace-" + Math.random().toString(36).substring(2, 15);
}

// Generate span ID
function generateSpanId() {
  return "span-" + Math.random().toString(36).substring(2, 15);
}

// Apply tracing middleware
mcpRouter.use(createTracingMiddleware());
```

## Dashboards and Alerts

For analytics visualization and monitoring, you can implement a metrics visualization dashboard using tools like Grafana or a custom UI.

```javascript
// Example React component for MCP metrics dashboard
function McpMetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch metrics periodically
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch("/api/mcp/metrics");

        if (!response.ok) {
          throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }

        const data = await response.json();
        setMetrics(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    // Initial fetch
    fetchMetrics();

    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading metrics...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="metrics-dashboard">
      <h1>MCP Function Metrics</h1>

      <div className="metrics-summary">
        <div className="metric-card">
          <h3>Total Requests</h3>
          <div className="metric-value">{metrics.requestCount}</div>
        </div>

        <div className="metric-card">
          <h3>Error Rate</h3>
          <div className="metric-value">{metrics.errorRate.toFixed(2)}%</div>
        </div>

        <div className="metric-card">
          <h3>Avg Duration</h3>
          <div className="metric-value">{metrics.avgDuration.toFixed(2)}ms</div>
        </div>
      </div>

      <h2>Function Metrics</h2>
      <table className="function-metrics">
        <thead>
          <tr>
            <th>Function</th>
            <th>Calls</th>
            <th>Errors</th>
            <th>Error Rate</th>
            <th>Avg Duration</th>
            <th>Min</th>
            <th>Max</th>
          </tr>
        </thead>
        <tbody>
          {metrics.functions.map((fn) => (
            <tr key={fn.name}>
              <td>{fn.name}</td>
              <td>{fn.count}</td>
              <td>{fn.errorCount}</td>
              <td>{fn.errorRate.toFixed(2)}%</td>
              <td>{fn.avgDuration.toFixed(2)}ms</td>
              <td>{fn.minDuration}ms</td>
              <td>{fn.maxDuration}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

For more comprehensive implementation guidelines on analytics and monitoring, refer to rule [514-mcp-analytics-monitoring.mdc](../../514-mcp-analytics-monitoring.mdc) in the `.cursor/rules` directory.
