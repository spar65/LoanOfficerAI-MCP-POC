# Post-Mortem Template

This template provides a standardized format for documenting post-incident reviews in accordance with the [Operations & Incident Management Standards](../../technologies/platforms/210-operations-incidents.mdc).

## Incident Information

**Incident ID:** [Unique identifier, e.g., INC-2023-0042]  
**Date:** [YYYY-MM-DD]  
**Duration:** [HH:MM, e.g., 3:45]  
**Severity:** [P1/P2/P3/P4]

**Incident Commander:** [Name]  
**Technical Lead:** [Name]  
**Communications Lead:** [Name]  
**Additional Responders:** [Names]

## Executive Summary

[2-3 sentence summary of the incident, its impact, and resolution. This should be understandable by non-technical stakeholders.]

## Timeline

| Time (UTC)       | Event               | Actions Taken               |
| ---------------- | ------------------- | --------------------------- |
| YYYY-MM-DD HH:MM | [Event description] | [Actions taken in response] |
| YYYY-MM-DD HH:MM | [Event description] | [Actions taken in response] |
| YYYY-MM-DD HH:MM | [Event description] | [Actions taken in response] |
| YYYY-MM-DD HH:MM | [Event description] | [Actions taken in response] |
| YYYY-MM-DD HH:MM | Resolution          | [Final resolution actions]  |

**Time to Detection:** [HH:MM from start to discovery]  
**Time to Mitigation:** [HH:MM from discovery to mitigation]  
**Time to Resolution:** [HH:MM from discovery to full resolution]

## Impact Assessment

### User Impact

- **Affected Users:** [Number or percentage of users affected]
- **Affected Functionality:** [Specific features or services impacted]
- **User Experience:** [Description of how users experienced the issue]

### Business Impact

- **Revenue Impact:** [Estimated financial impact, if applicable]
- **SLA Violations:** [Any breached service level agreements]
- **Reputation Impact:** [Description of any public or customer-facing impact]

### Technical Impact

- **Systems Affected:** [List of affected systems or components]
- **Data Impact:** [Any data loss, corruption, or integrity issues]
- **Downstream Services:** [Any dependent services affected]

## Root Cause Analysis

### What Happened

[Detailed technical explanation of the incident, including the sequence of events that led to the failure. This should be detailed enough for engineers to understand exactly what went wrong.]

### Why It Happened

[Analysis of the underlying causes that allowed the incident to occur. This should go beyond the technical triggers to identify process, system, or organizational factors.]

### Contributing Factors

1. [Factor 1 with explanation]
2. [Factor 2 with explanation]
3. [Factor 3 with explanation]

### 5 Whys Analysis

**Problem Statement:** [Concise statement of the core issue]

1. **Why?** [First why]

   - **Because:** [Answer]

2. **Why?** [Second why, based on first answer]

   - **Because:** [Answer]

3. **Why?** [Third why, based on second answer]

   - **Because:** [Answer]

4. **Why?** [Fourth why, based on third answer]

   - **Because:** [Answer]

5. **Why?** [Fifth why, based on fourth answer]
   - **Because:** [Root cause]

## Response Assessment

### What Went Well

1. [Positive aspect of the response]
2. [Positive aspect of the response]
3. [Positive aspect of the response]

### What Went Poorly

1. [Area for improvement in the response]
2. [Area for improvement in the response]
3. [Area for improvement in the response]

### Detection Gaps

[Analysis of why the issue wasn't detected earlier or automatically]

### Resolution Challenges

[Description of any obstacles encountered during resolution]

## Action Items

| ID   | Description                        | Owner  | Priority          | Due Date     | Status                                |
| ---- | ---------------------------------- | ------ | ----------------- | ------------ | ------------------------------------- |
| AI-1 | [Specific, measurable action item] | [Name] | [High/Medium/Low] | [YYYY-MM-DD] | [Open/In Progress/Completed/Verified] |
| AI-2 | [Specific, measurable action item] | [Name] | [High/Medium/Low] | [YYYY-MM-DD] | [Open/In Progress/Completed/Verified] |
| AI-3 | [Specific, measurable action item] | [Name] | [High/Medium/Low] | [YYYY-MM-DD] | [Open/In Progress/Completed/Verified] |
| AI-4 | [Specific, measurable action item] | [Name] | [High/Medium/Low] | [YYYY-MM-DD] | [Open/In Progress/Completed/Verified] |

## Preventive Measures

### Technical Improvements

1. [Technical change to prevent recurrence]
2. [Technical change to prevent recurrence]
3. [Technical change to prevent recurrence]

### Process Improvements

1. [Process change to prevent recurrence]
2. [Process change to prevent recurrence]
3. [Process change to prevent recurrence]

### Monitoring Improvements

1. [Monitoring or alerting improvement]
2. [Monitoring or alerting improvement]
3. [Monitoring or alerting improvement]

## Lessons Learned

[Key takeaways and broader lessons that can be applied across the organization]

## Supporting Information

### Metrics and Logs

- [Link to relevant dashboards]
- [Link to log search queries]
- [Link to error reports]

### Communication Artifacts

- [Link to incident communication thread]
- [Link to status page updates]
- [Link to customer communications]

### Related Documentation

- [Link to relevant runbooks]
- [Link to architecture diagrams]
- [Link to previous related incidents]

---

## Example Post-Mortem: Database Outage

**Incident ID:** INC-2023-0042  
**Date:** 2023-06-15  
**Duration:** 3:45 (3 hours, 45 minutes)  
**Severity:** P1

**Incident Commander:** Jane Smith  
**Technical Lead:** John Doe  
**Communications Lead:** Alice Johnson  
**Additional Responders:** Bob Wilson (Database), Carol Brown (Infrastructure)

## Executive Summary

On June 15, 2023, our primary database cluster experienced a complete outage lasting 3 hours and 45 minutes, causing service unavailability for all users. The root cause was identified as a combination of an unexpected increase in write operations and insufficient connection pooling settings. Service was restored by scaling up database resources and optimizing connection management.

## Timeline

| Time (UTC)       | Event                                                | Actions Taken                                    |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------ |
| 2023-06-15 14:02 | Database CPU utilization reached 95%                 | None - No alerts triggered                       |
| 2023-06-15 14:15 | First user reports of slow response times            | Support team began initial investigation         |
| 2023-06-15 14:20 | Error rate exceeded 50%, "Connection refused" errors | Incident declared, response team assembled       |
| 2023-06-15 14:25 | Database connections maxed out at 1000               | DB team began analyzing connection patterns      |
| 2023-06-15 14:40 | Complete service outage                              | Status page updated, incident response activated |
| 2023-06-15 15:10 | Identified connection leak in API service            | Applied temporary fix to close idle connections  |
| 2023-06-15 16:30 | Scaled up database resources                         | Partial service restoration began                |
| 2023-06-15 17:45 | Connection pooling reconfigured                      | Full service functionality restored              |
| 2023-06-15 18:00 | Incident resolved                                    | All-clear communicated to users                  |

**Time to Detection:** 0:18 (from first issue to incident declaration)  
**Time to Mitigation:** 2:15 (from declaration to partial restoration)  
**Time to Resolution:** 3:45 (from declaration to full resolution)

## Impact Assessment

### User Impact

- **Affected Users:** 100% of active users (approximately 45,000)
- **Affected Functionality:** All features requiring database access (search, account management, transactions)
- **User Experience:** Users experienced slow responses followed by complete inability to use the service

### Business Impact

- **Revenue Impact:** Estimated $75,000 in lost transaction processing fees
- **SLA Violations:** 99.9% monthly uptime SLA breached for premium customers
- **Reputation Impact:** Negative social media mentions increased by 300%, NPS decreased by 15 points

### Technical Impact

- **Systems Affected:** Database, API services, web applications, mobile applications
- **Data Impact:** No data loss or corruption, temporary processing delays only
- **Downstream Services:** Partner API integrations experienced cascading failures

## Root Cause Analysis

### What Happened

At approximately 14:00 UTC, database connection counts began to increase rapidly following a new marketing campaign launch that increased user traffic by 40%. The API service was not properly closing database connections due to a code change deployed the previous day that removed connection timeout handling. As new connections were established, old ones remained open, quickly exhausting the available connection pool. The database server reached its connection limit of 1000 connections at 14:25 UTC, after which new connection attempts were refused, resulting in cascading failures across all services.

### Why It Happened

1. A code change deployed on 2023-06-14 removed proper connection handling in the API service, causing connections to remain open indefinitely.
2. The connection leak was not detected during testing because load tests didn't run long enough to trigger the issue.
3. Monitoring alerts for database connection count were set at 90% of maximum (900 connections), but the rate of increase was so rapid that the alert didn't trigger until after impact began.
4. The database connection limit of 1000 was insufficient for the traffic volume generated by the marketing campaign.

### Contributing Factors

1. **Code Review Process**: The PR that introduced the connection leak didn't have sufficient review focus on resource management.
2. **Testing Gaps**: Load tests were not configured to detect slow resource leaks.
3. **Monitoring Limitations**: Alert thresholds were based on static values rather than rate of change.
4. **Capacity Planning**: The marketing campaign launch wasn't communicated to the engineering team for capacity planning.
5. **Documentation Gaps**: Database connection management wasn't adequately documented in the developer guide.

### 5 Whys Analysis

**Problem Statement:** Database connections exhausted, causing service outage

1. **Why?** The database reached its maximum connection limit.

   - **Because:** Too many connections were being created without being closed.

2. **Why?** Connections weren't being closed.

   - **Because:** The connection timeout handling was removed in a recent code change.

3. **Why?** Connection timeout handling was removed.

   - **Because:** A developer mistakenly thought it was redundant with connection pooling.

4. **Why?** The developer misunderstood connection management.

   - **Because:** There was inadequate documentation and knowledge sharing about database connection handling.

5. **Why?** Connection management documentation and training were insufficient.
   - **Because:** We haven't prioritized operational knowledge documentation as a team.

## Response Assessment

### What Went Well

1. Incident response team assembled quickly once the incident was declared.
2. Technical lead identified the connection leak within 50 minutes of incident declaration.
3. Communication with users was clear and regular through multiple channels.
4. On-call database administrator was able to scale resources quickly once the issue was identified.

### What Went Poorly

1. Initial detection relied on user reports rather than automated monitoring.
2. It took too long to identify the connection leak as the root cause.
3. Temporary mitigation of restarting services caused additional user disruption.
4. Post-resolution verification was incomplete, leaving some API endpoints in a degraded state.

### Detection Gaps

Our monitoring system had alerts for high database CPU and memory usage but lacked specific alerts for connection count rate of change. Additionally, the connection count alert threshold was too high to provide advance warning before impact. We also didn't have any alerts for API service connection leak detection.

### Resolution Challenges

1. Initial attempts to restart API services provided only temporary relief as connections quickly built up again.
2. Database scaling required manual intervention as automated scaling was not configured.
3. Connection pooling reconfiguration required code changes that needed emergency deployment.
4. Lack of recent database failure drills meant responders were unfamiliar with recovery procedures.

## Action Items

| ID   | Description                                             | Owner         | Priority | Due Date   | Status      |
| ---- | ------------------------------------------------------- | ------------- | -------- | ---------- | ----------- |
| AI-1 | Implement connection leak detection in API services     | John Doe      | High     | 2023-06-30 | In Progress |
| AI-2 | Create rate-of-change alerts for database connections   | Bob Wilson    | High     | 2023-06-23 | Completed   |
| AI-3 | Update database connection documentation                | Carol Brown   | Medium   | 2023-07-15 | Open        |
| AI-4 | Configure automated database scaling                    | Bob Wilson    | Medium   | 2023-07-30 | Open        |
| AI-5 | Implement connection pooling in all API services        | John Doe      | High     | 2023-07-15 | In Progress |
| AI-6 | Add marketing campaign calendar to engineering planning | Alice Johnson | Medium   | 2023-06-30 | Completed   |
| AI-7 | Conduct database failure simulation drill               | Jane Smith    | Low      | 2023-08-15 | Open        |

## Preventive Measures

### Technical Improvements

1. Implement proper connection pooling with HikariCP in all API services
2. Increase maximum database connections from 1000 to 2000
3. Add circuit breakers to gracefully handle database connection failures
4. Implement database read replicas to distribute query load

### Process Improvements

1. Add resource management checklist to code review process
2. Include operations team in marketing campaign planning
3. Require load tests to run for minimum of 24 hours for critical services
4. Implement quarterly database failure simulation drills

### Monitoring Improvements

1. Add rate-of-change alerts for database connections
2. Implement query performance monitoring
3. Add connection leak detection to API health checks
4. Create consolidated dashboard for database connection metrics

## Lessons Learned

1. **Resource Management Is Critical**: Connection management is a fundamental requirement that needs thorough testing and monitoring.

2. **Cross-Team Communication Is Essential**: Engineering needs to be aware of marketing initiatives that might affect system load.

3. **Alerts Should Predict, Not Just React**: Our monitoring strategy needs to focus more on predictive metrics that provide warning before impact occurs.

4. **Documentation Enables Faster Response**: Better operational documentation would have reduced troubleshooting time significantly.

5. **Regular Drills Build Muscle Memory**: The team would have responded more efficiently if database failure scenarios were practiced regularly.

## Supporting Information

### Metrics and Logs

- [Database Metrics Dashboard](https://grafana.example.com/d/abc123/database-metrics)
- [Connection Count Graph](https://grafana.example.com/d/def456/connection-analysis)
- [Error Rate Dashboard](https://grafana.example.com/d/ghi789/error-rates)

### Communication Artifacts

- [Incident Slack Channel Archive](https://example.slack.com/archives/incidents/p1686838800)
- [Status Page Updates](https://status.example.com/incidents/2023-06-15)
- [Customer Email Communication](https://docs.example.com/customer-comms/2023-06-15)

### Related Documentation

- [Database Connection Management Guide](https://docs.example.com/engineering/database/connections)
- [API Service Architecture](https://docs.example.com/architecture/api-services)
- [Previous Database Incident: INC-2022-0021](https://incidents.example.com/2022/0021)
