# On-Call Handover Guide

This guide provides a structured approach to on-call shift handovers in accordance with the [Operations & Incident Management Standards](../../technologies/platforms/210-operations-incidents.mdc).

## Purpose

Effective on-call handovers ensure:

1. **Continuity of Incident Response**: Ongoing incidents are transitioned smoothly
2. **Knowledge Transfer**: Context and situational awareness is preserved
3. **Clear Ownership**: Responsibilities are explicitly transferred
4. **Risk Reduction**: Potential issues are communicated proactively
5. **Operational Awareness**: Current system state is understood by the incoming engineer

## Handover Process

### 1. Pre-Handover Preparation (Outgoing Engineer)

- Review and update status of all open incidents
- Document temporary fixes or workarounds in place
- Note any upcoming maintenance or deployments
- List known issues that may escalate during the next shift
- Gather metrics on system health and performance
- Update runbooks based on recent experiences

### 2. Handover Meeting (15-30 minutes)

- Walk through the handover document together
- Discuss active incidents in detail
- Review system health dashboards
- Highlight any concerning trends
- Answer questions from the incoming engineer
- Ensure access to all necessary systems
- Verify communication channels are working

### 3. Post-Handover Actions (Incoming Engineer)

- Confirm receipt of on-call responsibilities
- Verify access to monitoring systems
- Check alerting configurations
- Review incident response procedures
- Perform system health check
- Update status in on-call tracking system

## Handover Template

```markdown
# On-Call Handover: [Date]

## Handover Information

- **Outgoing Engineer:** [Name]
- **Incoming Engineer:** [Name]
- **Handover Time:** [Time in UTC]
- **Handover Method:** [Video call / In-person / Phone]
- **Next Handover:** [Date and Time in UTC]

## Active Incidents

### [Incident ID] - [Severity] - [Brief Description]

- **Status:** [Investigating / Mitigated / Monitoring]
- **Started:** [Time]
- **Impact:** [User/Business Impact]
- **Current Actions:** [What's being done now]
- **Next Steps:** [What needs to be done next]
- **Stakeholders:** [Who has been notified]
- **Slack Channel:** [Link to incident channel]
- **Runbook:** [Link to relevant runbook]
- **Notes:** [Additional context, workarounds, etc.]

### [Repeat for each active incident]

## Recent Incidents (Last 24 Hours)

### [Incident ID] - [Severity] - [Brief Description]

- **Status:** Resolved at [Time]
- **Duration:** [Length of incident]
- **Root Cause:** [Brief explanation]
- **Follow-up Actions:** [Any pending items]
- **Post-Mortem:** [Link if available]

### [Repeat for each recent incident]

## Known Issues

### [Issue ID/Description]

- **Potential Impact:** [What might happen]
- **Current Status:** [What we know]
- **Workaround:** [If applicable]
- **Monitoring:** [What to watch for]
- **Escalation Criteria:** [When to escalate]
- **Related Ticket:** [Link to ticket]

### [Repeat for each known issue]

## Planned Changes

### [Change ID] - [Brief Description]

- **Scheduled Time:** [Time in UTC]
- **Expected Duration:** [How long]
- **Impact:** [Expected impact]
- **Rollback Plan:** [How to revert if needed]
- **Change Owner:** [Name and contact]
- **Communication Plan:** [Who will be notified]

### [Repeat for each planned change]

## System Status

### Key Metrics

- **Overall System Health:** [Green/Yellow/Red]
- **API Error Rate:** [Current rate]
- **P95 Latency:** [Current value]
- **Active Users:** [Current count]
- **Unusual Patterns:** [Any anomalies]

### Infrastructure Status

- **Compute Resources:** [Status]
- **Database Systems:** [Status]
- **Network Systems:** [Status]
- **Storage Systems:** [Status]
- **Third-Party Dependencies:** [Status]

## Special Instructions

- [Any specific instructions for the incoming engineer]
- [Areas requiring extra attention]
- [Temporary procedures in place]
- [Recent changes to watch]

## Questions and Clarifications

- [Record any questions raised during handover]
- [Record answers and follow-ups]

## Acknowledgment

- **Incoming Engineer:** I acknowledge receipt of this handover and take responsibility for on-call duties.
- **Outgoing Engineer:** I confirm all relevant information has been communicated to the best of my knowledge.
```

## Best Practices

### Documentation

- Use a shared document, ticket, or specialized tool for handovers
- Keep a history of handovers for reference and pattern analysis
- Update runbooks and knowledge base based on handover insights
- Document recurring issues for permanent resolution

### Communication

- Perform handovers via video or voice call whenever possible
- Follow up with written information (Slack, email, etc.)
- Maintain a dedicated handover channel for asynchronous updates
- Provide contact information for emergencies after handover

### Schedule Management

- Allow 30-minute overlap between shifts for proper handover
- Consider timezone differences when scheduling handovers
- Block calendar time specifically for handover meetings
- Ensure backup contacts are available in case of missed handovers

### Continuous Improvement

- Review handover process quarterly
- Collect feedback from team members
- Identify patterns in incidents across handovers
- Improve templates based on real-world use

## Specific Scenario Guidance

### High-Severity Incident in Progress

When handing over during an active high-severity incident:

1. **Document Current Understanding**:
   - Latest root cause hypothesis
   - Mitigation attempts made and results
   - Current investigation paths
2. **Review Incident Timeline**:
   - Key developments since incident started
   - Who has been involved
   - What has been tried
3. **Introduce to Stakeholders**:
   - Perform a "warm handoff" with stakeholders
   - Explicitly transfer incident command role if applicable
   - Ensure all parties acknowledge the handover
4. **Stay Available**:
   - Provide backup contact method
   - Consider remaining available for questions
   - Set clear expectations about post-handover involvement

### Multiple Known Issues

When handing over with several known issues:

1. **Prioritize Issues**:
   - Rank by potential impact
   - Highlight time-sensitive concerns
   - Indicate which require immediate attention
2. **Provide Context**:
   - History of each issue
   - Past occurrences and resolutions
   - Stakeholder sensitivities
3. **Document Detection Methods**:
   - How to identify if an issue is escalating
   - Dashboards or alerts to monitor
   - Warning signs to watch for

### Complex System Changes

When major changes are planned or in progress:

1. **Review Change Documentation**:
   - Change plan and timeline
   - Rollback procedures
   - Success criteria
2. **Identify Dependencies**:
   - Systems affected by the change
   - Teams involved
   - External dependencies
3. **Map Decision Points**:
   - Criteria for proceeding with each step
   - Go/no-go decision process
   - Escalation paths for issues

## Example Handover

```markdown
# On-Call Handover: 2023-07-15

## Handover Information

- **Outgoing Engineer:** Alex Chen
- **Incoming Engineer:** Sam Taylor
- **Handover Time:** 2023-07-15 16:00 UTC
- **Handover Method:** Video call with screen sharing
- **Next Handover:** 2023-07-16 16:00 UTC

## Active Incidents

### INC-2023-0053 - P2 - Payment Processing Delays

- **Status:** Mitigated, monitoring
- **Started:** 2023-07-15 12:30 UTC
- **Impact:** ~15% of payment transactions experiencing 30+ second delays
- **Current Actions:** Applied config change to increase payment processor timeout
- **Next Steps:** Monitor for recurrence; payment team deploying permanent fix at 22:00 UTC
- **Stakeholders:** Payment team, Support team, Finance team informed
- **Slack Channel:** #incident-payment-delays-0715
- **Runbook:** https://runbooks.example.com/payment-processor-issues
- **Notes:** Issue appears to be caused by third-party API slowness. Their status page shows degraded performance in EU region. If delays return before fix deployment, contact John from payment team at +1-555-123-4567.

## Recent Incidents (Last 24 Hours)

### INC-2023-0052 - P3 - Search Indexing Failures

- **Status:** Resolved at 2023-07-15 08:45 UTC
- **Duration:** 3 hours 15 minutes
- **Root Cause:** Elastic Search cluster ran out of disk space due to log rotation failure
- **Follow-up Actions:** Adding disk space monitoring with earlier alerts; DE-4567
- **Post-Mortem:** Scheduled for 2023-07-17

## Known Issues

### Increased Database CPU Usage During Batch Jobs

- **Potential Impact:** Could cause general slowness if it coincides with peak traffic
- **Current Status:** CPU usage reaching 75% during nightly batch processing (up from typical 45%)
- **Workaround:** None needed yet, but be ready to pause batch jobs if CPU exceeds 85%
- **Monitoring:** Dashboard: https://grafana.example.com/d/abc123/database-health (CPU Usage panel)
- **Escalation Criteria:** Escalate to DB team if CPU exceeds 85% for >10 minutes
- **Related Ticket:** DE-4570 (Database team investigating)

### Intermittent 502 Errors on Media Upload API

- **Potential Impact:** Users occasionally unable to upload images or videos
- **Current Status:** Occurring ~0.5% of requests, no pattern identified yet
- **Workaround:** Users can retry uploads; most succeed on second attempt
- **Monitoring:** Dashboard: https://grafana.example.com/d/def456/api-status (Error Rate panel)
- **Escalation Criteria:** Escalate if error rate exceeds 2% for >5 minutes
- **Related Ticket:** DE-4565 (API team investigating)

## Planned Changes

### CHG-2023-0095 - Database Index Optimization

- **Scheduled Time:** 2023-07-16 02:00 UTC
- **Expected Duration:** 30 minutes
- **Impact:** Read-only mode for user settings for ~15 minutes
- **Rollback Plan:** Revert index changes using backup script at /scripts/revert-indexes.sh
- **Change Owner:** Maria Lopez (Database Team) - +1-555-987-6543
- **Communication Plan:** Status page update 15 minutes before and after

### CHG-2023-0097 - CDN Provider Migration (Phase 1)

- **Scheduled Time:** 2023-07-16 07:00 UTC
- **Expected Duration:** 2 hours
- **Impact:** Potential image loading slowness for ~5% of users
- **Rollback Plan:** DNS fallback to original CDN configured and tested
- **Change Owner:** Patrick Kim (Infrastructure Team) - Available in #infra Slack
- **Communication Plan:** Internal only; user impact expected to be minimal

## System Status

### Key Metrics

- **Overall System Health:** Yellow (due to payment delays)
- **API Error Rate:** 0.4% (within normal range)
- **P95 Latency:** 350ms (within normal range)
- **Active Users:** 42,300 (normal for Saturday)
- **Unusual Patterns:** Slight increase in traffic from APAC region (+15%)

### Infrastructure Status

- **Compute Resources:** All normal
- **Database Systems:** Primary DB showing increased CPU (see Known Issues)
- **Network Systems:** All normal
- **Storage Systems:** All normal
- **Third-Party Dependencies:** Payment processor degraded (see Active Incidents)

## Special Instructions

- The marketing team is launching a new campaign on Sunday that may increase traffic by 20-30%. They've added details to #marketing-launches.
- We're testing a new alerting system in parallel with the existing one. If you get duplicate alerts, please note which system was faster in #alerts-testing.
- The EU region failover test was completed successfully yesterday. Results documented in confluence.

## Questions and Clarifications

- Q: Should we proceed with the CDN migration if the payment issues aren't fully resolved?
- A: Yes, these systems are independent. Only abort if we have a new P1/P2 incident.

- Q: Who's the escalation contact for the payment processor issue overnight?
- A: Jennifer from the payment team is on-call. Her number is in PagerDuty.

## Acknowledgment

- **Incoming Engineer:** I acknowledge receipt of this handover and take responsibility for on-call duties.
- **Outgoing Engineer:** I confirm all relevant information has been communicated to the best of my knowledge.
```

## Tools and Resources

### Recommended Handover Tools

1. **PagerDuty** - For on-call scheduling and incident management
2. **Slack** - For communication channels and handover threads
3. **Confluence/Notion** - For handover documentation templates
4. **Jira/Linear** - For tracking issues and follow-up actions
5. **Google Docs** - For collaborative handover notes
6. **Zoom/Teams** - For handover calls with screen sharing

### Integration Options

1. **Automated Handover Reminders**:
   - Calendar notifications
   - Slack bots to remind on-call engineers
   - PagerDuty automated handover workflow
2. **Status Collection Automation**:
   - Scripts to collect system metrics
   - Incident summary generators
   - Known issue aggregators
3. **Handover Verification**:
   - Digital sign-off workflows
   - Checklist completion tracking
   - Post-handover verification questions

## Conclusion

A structured on-call handover process is crucial for maintaining operational continuity and reducing risk during shift transitions. By following this guide, teams can ensure that critical knowledge is transferred effectively, and on-call engineers are fully prepared to respond to incidents and issues.
