# SLI/SLO Implementation Guide

This guide provides practical guidance for implementing Service Level Indicators (SLIs) and Service Level Objectives (SLOs) in accordance with the [Operations & Incident Management Standards](../../technologies/platforms/210-operations-incidents.mdc).

## Introduction to SLIs and SLOs

### Key Definitions

- **Service Level Indicator (SLI)**: A quantitative measure of service quality (e.g., availability, latency, throughput)
- **Service Level Objective (SLO)**: A target value for an SLI over a specified time period
- **Service Level Agreement (SLA)**: A contract with users that includes consequences of not meeting service level objectives
- **Error Budget**: The allowed amount of error within an SLO (e.g., 99.9% availability means a 0.1% error budget)

### Why Implement SLIs/SLOs?

SLIs and SLOs provide:

1. **Objective Measurement**: Quantifiable metrics to assess service quality
2. **Common Language**: Standardized way to discuss service health
3. **Decision Framework**: Clear thresholds for when to prioritize reliability work
4. **Balance Innovation and Stability**: Error budgets help balance feature development with reliability
5. **Proactive Management**: Early indicators of service degradation

## Selecting Effective SLIs

### Core SLI Categories

1. **Availability**: Is the service responding to requests?

   - **Example**: Percentage of successful HTTP requests
   - **Formula**: `(total_requests - error_requests) / total_requests`

2. **Latency**: How long does it take to respond?

   - **Example**: 95th percentile request latency
   - **Formula**: `request_latency{quantile="0.95"}`

3. **Throughput**: How many requests can be handled?

   - **Example**: Requests per second
   - **Formula**: `sum(rate(http_requests_total[5m]))`

4. **Error Rate**: How many errors are occurring?

   - **Example**: Percentage of 5xx responses
   - **Formula**: `sum(rate(http_responses_total{status=~"5.."}[5m])) / sum(rate(http_responses_total[5m]))`

5. **Saturation**: How close to capacity is the system?
   - **Example**: CPU utilization
   - **Formula**: `avg(node_cpu_usage_percent)`

### SLI Selection Criteria

Good SLIs should be:

1. **User-Centric**: Measure what users care about
2. **Directly Measurable**: Must be quantifiable
3. **Reliably Collected**: Data collection must be consistent
4. **Sensitive to Problems**: Should detect actual issues
5. **Simple to Understand**: Easily explained to stakeholders

### SLI Implementation Examples

#### Availability SLI for Web Service:

```yaml
name: api_availability
description: "API availability rate"
metric_implementation:
  provider: prometheus
  query: 'sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))'
  labels:
    service: api
    environment: production
```

#### Latency SLI for Database Queries:

```yaml
name: database_query_latency
description: "Database query latency (95th percentile)"
metric_implementation:
  provider: prometheus
  query: "histogram_quantile(0.95, sum(rate(database_query_duration_seconds_bucket[5m])) by (le))"
  labels:
    service: database
    environment: production
```

## Setting Appropriate SLOs

### SLO Principles

1. **Aspirational Yet Achievable**: Set targets that are challenging but attainable
2. **Based on User Expectations**: Align with what users need from the service
3. **Informed by Historical Data**: Use past performance as a baseline
4. **Service-Appropriate**: Different services require different reliability levels
5. **Time-Bound**: Specify the measurement window (e.g., 30 days, quarterly)

### SLO Development Process

1. **Gather Stakeholder Requirements**:

   - Identify key stakeholders (users, product managers, executives)
   - Understand their reliability expectations
   - Document business impact of reliability failures

2. **Analyze Historical Performance**:

   - Collect 3-6 months of historical data
   - Identify performance patterns and anomalies
   - Establish baseline performance

3. **Define Initial SLOs**:

   - Set SLOs slightly above current performance
   - Consider different SLOs for different service tiers
   - Document assumptions and constraints

4. **Validate SLOs**:

   - Review with operations teams for feasibility
   - Validate with stakeholders for alignment with needs
   - Confirm measurement capability

5. **Implement Measurement**:
   - Set up monitoring and dashboards
   - Implement alerting for SLO violations
   - Create error budget tracking

### Example SLO Definitions

#### Basic SLO for API Service:

```yaml
service: payment-api
slos:
  - name: availability
    target: 99.95%
    window: 30d
    sli:
      metric_name: api_availability

  - name: latency
    target: 99.0%
    threshold: 300ms
    window: 30d
    sli:
      metric_name: api_request_latency
```

#### Tiered SLO Example:

```yaml
service: user-authentication
slos:
  - name: availability_login
    description: "Login API availability"
    target: 99.99%
    window: 30d
    sli:
      metric_name: login_api_availability

  - name: availability_profile
    description: "User profile API availability"
    target: 99.9%
    window: 30d
    sli:
      metric_name: profile_api_availability

  - name: availability_preferences
    description: "User preferences API availability"
    target: 99.5%
    window: 30d
    sli:
      metric_name: preferences_api_availability
```

## Managing Error Budgets

### Error Budget Concept

An error budget is the allowed amount of failure within your SLO. For example:

- 99.9% availability SLO = 0.1% error budget
- For a 30-day month: 0.1% of 43,200 minutes ≈ 43.2 minutes of allowed downtime

### Error Budget Policies

1. **Define Consumption Rules**:

   - What happens when 50% of the error budget is consumed?
   - What happens when 75% is consumed?
   - What happens when 100% is consumed?

2. **Balance Feature Development and Reliability**:

   - If significant error budget remains: focus on feature development
   - If error budget is depleted: focus on reliability improvements
   - If error budget is critically low: freeze non-essential changes

3. **Provide Visibility**:
   - Create dashboards showing error budget consumption
   - Include error budget status in regular reporting
   - Alert on significant error budget consumption

### Example Error Budget Policy

```markdown
# Error Budget Policy for Payment Service

## Monitoring

- Error budget consumption is tracked daily
- Weekly reports are distributed to the team
- Alerting thresholds are set at 50%, 75%, and 90% consumption

## Response Thresholds

### 0-50% Budget Consumed

- Normal operations
- Feature development proceeds as planned

### 50-75% Budget Consumed

- Engineering leads review upcoming feature work
- Non-critical deployments may proceed with additional testing
- Reliability improvements are prioritized in backlog

### 75-90% Budget Consumed

- Feature deployments require approval from SRE team
- At least 25% of sprint capacity allocated to reliability improvements
- Daily monitoring of error budget consumption

### 90-100% Budget Consumed

- Feature freeze implemented
- Only reliability improvements and critical bug fixes deployed
- Incident review scheduled to analyze consumption causes

### >100% Budget Consumed

- Complete change freeze except for reliability fixes
- Incident commander designated to manage recovery
- Executive stakeholders notified
- Post-incident review mandatory with action plan
```

## Implementation with Prometheus and Grafana

### Prometheus Configuration

#### SLI Query Examples

```yaml
# Availability SLI
- record: sli:availability:ratio_5m
  expr: sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# Latency SLI - Success rate within threshold
- record: sli:latency:ratio_5m
  expr: sum(rate(http_request_duration_seconds_bucket{le="0.3"}[5m])) / sum(rate(http_request_duration_seconds_count[5m]))

# Error rate SLI
- record: sli:errors:ratio_5m
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# Saturation SLI
- record: sli:cpu:ratio_5m
  expr: 1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))
```

#### SLO Alerting Rules

```yaml
groups:
  - name: slo_alerts
    rules:
      - alert: SLOAvailabilityBudgetBurning
        expr: |
          (
            1 - sli:availability:ratio_5m
          ) > (1 - 0.9995) * 14.4  # 3x faster than allowed burn rate for 99.95% SLO
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Availability SLO error budget burning too fast"
          description: "Error budget is being consumed {{ $value | humanizePercentage }} faster than the target burn rate."

      - alert: SLOLatencyBudgetBurning
        expr: |
          (
            1 - sli:latency:ratio_5m
          ) > (1 - 0.99) * 14.4  # 3x faster than allowed burn rate for 99% SLO
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Latency SLO error budget burning too fast"
          description: "Error budget is being consumed {{ $value | humanizePercentage }} faster than the target burn rate."
```

### Grafana Dashboard Example

Create a dashboard with the following panels:

1. **SLO Overview Panel**:

   - Current SLI value vs. SLO target
   - 7-day trend graph
   - 30-day trend graph
   - Error budget consumption

2. **Error Budget Status**:

   - Percentage of error budget remaining
   - Burn rate (how quickly budget is being consumed)
   - Projected exhaustion date at current burn rate

3. **SLI Detail Panels**:
   - Breakdown of SLI by component
   - Comparison across environments
   - Correlation with deploys or changes

#### Grafana Dashboard Query Examples:

```
# SLI current value and target
sli:availability:ratio_5m * 100

# Error budget consumption
(1 - sli:availability:ratio_5m) / (1 - 0.9995) * 100

# Burn rate (compared to expected)
(1 - sli:availability:ratio_5m) / (1 - 0.9995) / (1 / $days_in_window)
```

## Evolving Your SLOs

### Continuous Improvement Process

1. **Regular Review Cadence**:

   - Review SLOs quarterly
   - Adjust based on actual performance
   - Incorporate customer feedback

2. **Maturity Evolution**:

   - Start with basic availability and latency SLOs
   - Add more sophisticated SLIs over time
   - Increase SLO targets as capabilities improve

3. **Handling SLO Changes**:
   - Document changes and rationale
   - Communicate changes to stakeholders
   - Provide transition period for significant changes

### Adjusting SLOs Based on Data

1. **Too Strict**:

   - Symptoms: Constant firefighting, excessive alerts, team burnout
   - Action: Gradually reduce SLO target while improving reliability
   - Example: Adjust from 99.99% to 99.9% while implementing improvements

2. **Too Lenient**:

   - Symptoms: Poor user experience despite meeting SLOs
   - Action: Tighten SLOs or add new SLIs that better reflect user experience
   - Example: Add p95 latency SLI if users complain about response times

3. **Wrong Focus**:
   - Symptoms: Meeting SLOs but still receiving user complaints
   - Action: Add or modify SLIs to better capture what users care about
   - Example: Add an SLI for specific critical user journeys

## Common Pitfalls and Solutions

### Implementation Challenges

1. **Too Many SLOs**:
   - **Problem**: Overwhelming, difficult to prioritize
   - **Solution**: Start with 2-3 critical SLIs per service
2. **Wrong Measurement Window**:

   - **Problem**: Too short (noisy) or too long (slow feedback)
   - **Solution**: Use rolling windows (28-30 days) for most services

3. **Lack of Ownership**:

   - **Problem**: Unclear responsibility for meeting SLOs
   - **Solution**: Assign clear ownership in service documentation

4. **Unrealistic Targets**:

   - **Problem**: Setting "perfect" SLOs (e.g., 100%)
   - **Solution**: Understand that 100% is impossible and expensive

5. **Alert Fatigue**:
   - **Problem**: Too many SLO-based alerts
   - **Solution**: Alert on budget burn rate, not individual violations

## Real-World SLO Examples

### Web Application

```yaml
service: e-commerce-frontend
slos:
  - name: homepage_availability
    target: 99.95%
    window: 30d

  - name: homepage_latency
    description: "Homepage loads in under 2 seconds"
    target: 95%
    threshold: 2s
    window: 30d

  - name: checkout_availability
    target: 99.99%
    window: 30d

  - name: checkout_success_rate
    description: "Successful checkout completion rate"
    target: 99.5%
    window: 30d
```

### API Service

```yaml
service: payment-api
slos:
  - name: api_availability
    target: 99.95%
    window: 30d

  - name: api_latency_p50
    description: "50% of requests complete within 150ms"
    target: 99.9%
    threshold: 150ms
    window: 30d

  - name: api_latency_p95
    description: "95% of requests complete within 500ms"
    target: 99.0%
    threshold: 500ms
    window: 30d

  - name: successful_payment_rate
    description: "Percentage of payment attempts that succeed (excluding declined cards)"
    target: 99.9%
    window: 30d
```

### Database Service

```yaml
service: primary-database
slos:
  - name: database_availability
    target: 99.99%
    window: 30d

  - name: read_latency
    description: "Read operations complete within 50ms"
    target: 99.9%
    threshold: 50ms
    window: 30d

  - name: write_latency
    description: "Write operations complete within 100ms"
    target: 99.5%
    threshold: 100ms
    window: 30d

  - name: data_integrity
    description: "No data corruption or loss"
    target: 100%
    window: 30d
```

## Conclusion

Implementing SLIs and SLOs provides a data-driven approach to service reliability. By measuring what matters to users, setting appropriate targets, and managing error budgets effectively, teams can balance innovation with stability and continuously improve service quality.

Remember that SLOs are a journey, not a destination. Start simple, iterate based on data and feedback, and gradually increase sophistication as your organization's SRE practices mature.
