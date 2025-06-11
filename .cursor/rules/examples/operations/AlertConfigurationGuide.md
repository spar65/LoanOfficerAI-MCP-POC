# Alert Configuration Guide

This guide provides best practices and implementation examples for configuring effective alerts in accordance with the [Operations & Incident Management Standards](../../technologies/platforms/210-operations-incidents.mdc).

## Alert Design Principles

### Core Principles

1. **Actionable**: Every alert should require human action
2. **Relevant**: Alerts should correlate directly with user impact
3. **Context-Rich**: Include sufficient information to begin troubleshooting
4. **Appropriate Urgency**: Severity should match the actual impact
5. **Minimal Noise**: Reduce false positives and duplicate alerts

### Alert Hierarchy

Structure alerts in a hierarchical manner:

1. **High-Level Service Alerts**: Overall service health
2. **Component-Level Alerts**: Individual component health
3. **Resource-Level Alerts**: System resource issues
4. **Dependency Alerts**: External dependency problems

## Alert Severity Levels

### Severity Classification

| Severity          | Impact                                        | Response Time     | Example                             |
| ----------------- | --------------------------------------------- | ----------------- | ----------------------------------- |
| **Critical (P1)** | Severe user impact, service down              | 15 min            | Payment service unavailable         |
| **Major (P2)**    | Significant impact, major feature affected    | 30 min            | Checkout process slow for all users |
| **Minor (P3)**    | Limited impact, non-critical feature affected | 4 hours           | Image upload feature failing        |
| **Low (P4)**      | Minimal impact, cosmetic issues               | Next business day | UI element misaligned               |

### Alert Routing by Severity

| Severity          | Notification Channel        | Escalation Path                      |
| ----------------- | --------------------------- | ------------------------------------ |
| **Critical (P1)** | Phone + SMS + Email + Slack | 15 min → Manager, 30 min → Director  |
| **Major (P2)**    | SMS + Email + Slack         | 1 hour → Manager                     |
| **Minor (P3)**    | Email + Slack               | None unless unaddressed for 24 hours |
| **Low (P4)**      | Email or Ticket             | None                                 |

## Alert Configuration Examples

### Prometheus AlertManager Example

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: "https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXX"

route:
  receiver: "default-receiver"
  group_by: ["alertname", "job", "severity"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 3h

  routes:
    - match:
        severity: critical
      receiver: "critical-alerts"
      continue: true
      group_wait: 0s # No delay for critical alerts
      repeat_interval: 30m

    - match:
        severity: major
      receiver: "major-alerts"
      continue: true
      repeat_interval: 1h

    - match:
        severity: minor
      receiver: "minor-alerts"
      continue: true
      repeat_interval: 6h

    - match:
        severity: low
      receiver: "low-alerts"
      continue: true
      repeat_interval: 24h

receivers:
  - name: "default-receiver"
    slack_configs:
      - channel: "#alerts"
        send_resolved: true
        title: "{{ .GroupLabels.alertname }}"
        text: >-
          {{ range .Alerts }}
            *Alert:* {{ .Annotations.summary }}
            *Description:* {{ .Annotations.description }}
            *Severity:* {{ .Labels.severity }}
            *Start Time:* {{ .StartsAt.Format "2006-01-02T15:04:05Z07:00" }}
            {{ if ne .Annotations.runbook "" }}*Runbook:* {{ .Annotations.runbook }}{{ end }}
            {{ if ne .Annotations.dashboard "" }}*Dashboard:* {{ .Annotations.dashboard }}{{ end }}
          {{ end }}

  - name: "critical-alerts"
    pagerduty_configs:
      - service_key: "<pagerduty-service-key>"
        description: "{{ .CommonAnnotations.summary }}"
        details:
          firing: "{{ .Alerts.Firing | len }}"
          resolved: "{{ .Alerts.Resolved | len }}"
          instance: "{{ .CommonLabels.instance }}"
          service: "{{ .CommonLabels.service }}"
          description: "{{ .CommonAnnotations.description }}"
    slack_configs:
      - channel: "#alerts-critical"
        send_resolved: true
        color: "#ff0000"
        title: "🔴 CRITICAL ALERT: {{ .GroupLabels.alertname }}"
        text: >-
          {{ range .Alerts }}
            *Alert:* {{ .Annotations.summary }}
            *Description:* {{ .Annotations.description }}
            *Severity:* {{ .Labels.severity }}
            *Start Time:* {{ .StartsAt.Format "2006-01-02T15:04:05Z07:00" }}
            {{ if ne .Annotations.runbook "" }}*Runbook:* {{ .Annotations.runbook }}{{ end }}
            {{ if ne .Annotations.dashboard "" }}*Dashboard:* {{ .Annotations.dashboard }}{{ end }}
          {{ end }}

# Additional receiver configurations for major, minor, and low alerts...
```

### Prometheus Alert Rules

```yaml
# alert_rules.yml
groups:
  - name: service_alerts
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 2m
        labels:
          severity: critical
          service: "api"
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for the last 2 minutes. Current value: {{ $value | humanizePercentage }}"
          runbook: "https://runbooks.example.com/high-error-rate"
          dashboard: "https://grafana.example.com/d/abc123/api-dashboard"

      - alert: HighLatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 2
        for: 5m
        labels:
          severity: major
          service: "api"
        annotations:
          summary: "High API latency detected"
          description: "95th percentile latency is above 2 seconds for the last 5 minutes. Current value: {{ $value | humanizeDuration }}"
          runbook: "https://runbooks.example.com/high-latency"
          dashboard: "https://grafana.example.com/d/abc123/api-dashboard"

      - alert: ServiceDown
        expr: up{job="api"} == 0
        for: 1m
        labels:
          severity: critical
          service: "api"
        annotations:
          summary: "Service is down"
          description: "API service has been down for more than 1 minute."
          runbook: "https://runbooks.example.com/service-down"
```

### Datadog Alert Configuration

```yaml
# Datadog API endpoint: https://api.datadoghq.com/api/v1/monitor
{
  "name": "High API Error Rate",
  "type": "metric alert",
  "query": "sum(last_5m):sum:http.requests.error{service:api}.as_count() / sum:http.requests.total{service:api}.as_count() > 0.05",
  "message": "@pagerduty-critical @slack-alerts-critical\n\nHigh API error rate detected.\n\nCurrent error rate: {{value}}%\n\nRunbook: https://runbooks.example.com/high-error-rate\nDashboard: https://app.datadoghq.com/dashboard/abc123\n\n{{#is_alert}}Alert: Error rate exceeded threshold.{{/is_alert}}\n{{#is_recovery}}Recovery: Error rate returned to normal.{{/is_recovery}}",
  "tags": ["service:api", "team:backend", "severity:critical"],
  "options":
    {
      "thresholds": { "critical": 0.05, "warning": 0.03 },
      "notify_audit": true,
      "require_full_window": false,
      "notify_no_data": false,
      "renotify_interval": 30,
      "include_tags": true,
      "evaluation_delay": 60,
      "new_host_delay": 300,
      "silenced": {},
    },
  "priority": 1,
}
```

## Alert Content Guidelines

### Effective Alert Messages

Every alert should include:

1. **Clear Title**: What is happening?
2. **Impact Statement**: Who is affected and how?
3. **Contextual Data**: Current metrics and thresholds
4. **Troubleshooting Links**: Runbooks and dashboards
5. **Action Items**: Suggested initial steps
6. **Timeline**: When did it start?

### Example Alert Message Structure

```
[SEVERITY] Service/Component Alert: Specific Issue

Impact: [Description of user/business impact]
Started: [Timestamp]
Current Value: [Metric] = [Value] (Threshold: [Threshold])

Potential Causes:
- [Cause 1]
- [Cause 2]

Suggested Actions:
1. [First step]
2. [Second step]

Resources:
- Runbook: [Link]
- Dashboard: [Link]
- Related Incidents: [Links]
```

## Alert Reduction Strategies

### Reducing Alert Noise

1. **Group Related Alerts**: Combine alerts from the same source

   ```yaml
   # Prometheus AlertManager example
   route:
     group_by: ["alertname", "job", "service"]
     group_wait: 30s
     group_interval: 5m
   ```

2. **Add Thresholds and Duration**: Ensure issues persist before alerting

   ```yaml
   # Prometheus Rule example
   - alert: HighCPUUsage
     expr: avg(node_cpu_seconds_total{mode!="idle"}) by (instance) > 0.85
     for: 10m # Only alert if high for 10 minutes
   ```

3. **Implement Alert Suppression**: Silence downstream alerts

   ```yaml
   # AlertManager inhibit rules
   inhibit_rules:
     - source_match:
         severity: "critical"
         alertname: "ServiceDown"
       target_match:
         severity: "major"
       equal: ["service"]
   ```

4. **Intelligent Routing**: Route to the right team

   ```yaml
   # AlertManager routing
   routes:
     - match:
         service: "api"
         team: "backend"
       receiver: "backend-team"
   ```

5. **Define Maintenance Windows**: Silence during planned maintenance
   ```bash
   # AlertManager CLI
   amtool silence add --start=2023-01-01T10:00:00Z --end=2023-01-01T14:00:00Z \
     --comment="Scheduled maintenance" service="api"
   ```

## Correlation Rules

### Alert Correlation Examples

1. **Parent-Child Relationships**:

   ```yaml
   # Service (parent) and its components (children)
   - alert: PaymentServiceDegraded
     expr: sum(payment_service_errors_total) / sum(payment_service_requests_total) > 0.05

   # Suppress component alerts when service alert is firing
   inhibit_rules:
   - source_match:
       alertname: 'PaymentServiceDegraded'
     target_match_re:
       alertname: 'PaymentDatabase.*|PaymentAPI.*'
     equal: ['service']
   ```

2. **Dependency Correlation**:

   ```yaml
   # If database is down, don't alert on services that depend on it
   inhibit_rules:
     - source_match:
         alertname: "DatabaseDown"
       target_match_re:
         alertname: ".*ServiceDegraded"
       equal: ["env"]
   ```

3. **Intelligent Aggregation**:
   ```yaml
   # Instead of alerting on individual instances
   - alert: HighErrorRateCluster
     expr: sum(rate(errors_total[5m])) by (service) / sum(rate(requests_total[5m])) by (service) > 0.05
     # This alerts on service level, not per instance
   ```

## Testing Alert Configurations

### Alert Testing Methods

1. **Synthetic Test Alerts**:

   ```yaml
   # Prometheus test rule
   - alert: TestAlert
     expr: vector(1) # Always fires
     labels:
       severity: test
     annotations:
       summary: "Test alert"
       description: "This is a test alert to verify notification pipelines."
   ```

2. **Silence Testing**:

   ```yaml
   # Test silences to ensure they work as expected
   amtool silence add --start=`date +%Y-%m-%dT%H:%M:%SZ` --end=`date -d "+1 hour" +%Y-%m-%dT%H:%M:%SZ` \
   --comment="Testing silence" service="api" severity="critical"
   ```

3. **Alert Timing Tests**:

   ```yaml
   # Test different "for" durations
   - alert: QuickAlert
     expr: test_metric > 0
     for: 10s

   - alert: DelayedAlert
     expr: test_metric > 0
     for: 1m
   ```

4. **Notification Channel Testing**:
   ```bash
   # Test Slack integration
   curl -X POST -H "Content-type: application/json" \
     --data '{"text":"This is a test alert message"}' \
     https://hooks.slack.com/services/TXXXXX/BXXXXX/XXXXXXX
   ```

## Alert Implementation Checklist

### Before Deploying Alerts

- [ ] **Verify metrics collection** is working correctly
- [ ] **Test alert expressions** to ensure they fire as expected
- [ ] **Confirm notification channels** are properly configured
- [ ] **Document alert meaning** in runbooks
- [ ] **Set appropriate thresholds** based on historical data
- [ ] **Implement proper grouping** to reduce noise
- [ ] **Define escalation paths** for each severity level
- [ ] **Create dashboards** that complement alerts
- [ ] **Test end-to-end notification flow**
- [ ] **Set up alert maintenance procedures**

## Alert Lifecycle Management

### Continuous Improvement

1. **Regular Review**:

   - Schedule quarterly alert review sessions
   - Check for alerts that frequently fire but don't require action
   - Identify gaps in monitoring coverage

2. **Alert Metrics to Track**:

   - Alert frequency by type and service
   - Time to acknowledge and resolve
   - False positive rate
   - Alert noise ratio (alerts requiring no action / total alerts)

3. **Tuning Process**:
   - Document all alert changes
   - Test alert modifications in staging environment
   - Use A/B testing for critical alert modifications
   - Collect feedback from on-call engineers

## System-Specific Alert Examples

### Web Application Alerts

```yaml
# HTTP Error Rates
- alert: HTTPErrorRate
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service) > 0.05
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High HTTP error rate for {{ $labels.service }}"

# Slow Response Time
- alert: SlowResponseTime
  expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)) > 2
  for: 5m
  labels:
    severity: major
  annotations:
    summary: "Slow response time for {{ $labels.service }}"

# Low Traffic Alert
- alert: LowTraffic
  expr: sum(rate(http_requests_total[30m])) by (service) < 1 and sum(rate(http_requests_total[30m] offset 1d)) by (service) > 10
  for: 15m
  labels:
    severity: minor
  annotations:
    summary: "Unusually low traffic for {{ $labels.service }}"
```

### Database Alerts

```yaml
# High Database Connections
- alert: HighDatabaseConnections
  expr: sum(pg_stat_activity_count) by (datname) > 150
  for: 5m
  labels:
    severity: major
  annotations:
    summary: "High connection count for {{ $labels.datname }}"

# Slow Queries
- alert: SlowQueries
  expr: pg_stat_activity_max_tx_duration{datname!~"template.*|postgres"} > 300
  for: 2m
  labels:
    severity: major
  annotations:
    summary: "Long-running queries in {{ $labels.datname }}"

# Replica Lag
- alert: ReplicaLag
  expr: pg_replication_lag_seconds > 300
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Database replica lagging by {{ $value | humanizeDuration }}"
```

### Infrastructure Alerts

```yaml
# Disk Space Running Out
- alert: DiskSpaceLow
  expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
  for: 5m
  labels:
    severity: major
  annotations:
    summary: "Low disk space on {{ $labels.instance }} {{ $labels.mountpoint }}"

# High CPU Usage
- alert: HighCPUUsage
  expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
  for: 10m
  labels:
    severity: major
  annotations:
    summary: "High CPU usage on {{ $labels.instance }}"

# Memory Pressure
- alert: MemoryPressure
  expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 < 10
  for: 5m
  labels:
    severity: major
  annotations:
    summary: "Memory pressure on {{ $labels.instance }}"
```

## Conclusion

Effective alert configuration is a balance between providing timely notifications about important issues and avoiding alert fatigue. By following these guidelines, you can create alerting systems that help your teams respond quickly to real problems while minimizing disruption from false or low-value alerts.

Remember that alert configuration is not a one-time task but an ongoing process of refinement. Regularly review and adjust your alerts based on feedback from on-call engineers and changing system behaviors.
