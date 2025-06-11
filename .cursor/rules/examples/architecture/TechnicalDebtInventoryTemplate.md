# Technical Debt Inventory Template

This template provides a standardized format for tracking technical debt across projects. It should be maintained in a central location accessible to all development teams.

## Inventory Fields

Each technical debt item should be documented with the following information:

| Field                  | Description                                                                         | Required         |
| ---------------------- | ----------------------------------------------------------------------------------- | ---------------- |
| ID                     | Unique identifier (e.g., TD-123)                                                    | Yes              |
| Title                  | Brief descriptive title                                                             | Yes              |
| Status                 | Current status (Identified, Planned, In Progress, Resolved, Deferred)               | Yes              |
| Type                   | Category (Code, Architecture, Dependencies, Documentation, Testing, Infrastructure) | Yes              |
| Planned                | Yes/No - Whether this was intentionally created technical debt                      | Yes              |
| Description            | Detailed description of the debt                                                    | Yes              |
| Location               | File paths, modules, or components affected                                         | Yes              |
| Creation Date          | When the debt was identified or created                                             | Yes              |
| Author                 | Who identified or created the debt                                                  | Yes              |
| Business Justification | Reason for creating planned debt (business value, time constraints, etc.)           | For planned debt |
| Impact                 | Assessment of the debt's impact (see Impact Matrix)                                 | Yes              |
| Effort                 | Estimated effort to resolve (T-shirt size or story points)                          | Yes              |
| Priority               | Calculated priority using the formula                                               | Yes              |
| Remediation Plan       | Steps required to resolve the debt                                                  | Yes              |
| Timeline               | Target sprint/quarter for addressing the debt                                       | Yes              |
| Owner                  | Team or individual responsible for remediation                                      | Yes              |
| Related Issues         | Links to issues in issue tracking system                                            | If applicable    |
| Dependencies           | Other systems or debt items that affect this item                                   | If applicable    |

## Sample Inventory Entry

```
ID: TD-157
Title: Hardcoded Configuration Values in Authentication Service
Status: Identified
Type: Code
Planned: Yes
Description: Authentication service has hardcoded timeout and retry values.
   These should be moved to configuration files for easier maintenance and
   environment-specific settings.
Location:
   - src/services/auth/AuthenticationManager.ts
   - src/services/auth/SessionValidator.ts
Creation Date: 2025-03-15
Author: Jane Developer
Business Justification: Expedited implementation for critical security release 1.5.0
Impact: Medium (6/10) - Reduces maintainability and makes environment-specific configs difficult
Effort: Low (3/10) - Relatively straightforward refactoring
Strategic Alignment: Medium (1.2/2.0) - Aligns with architectural principles but not a current business priority
Priority: 2.4 (6 × 3⁻¹ × 1.2)
Remediation Plan:
   1. Extract all hardcoded values to constants
   2. Move constants to configuration files
   3. Add environment-specific overrides
   4. Update documentation
Timeline: Q3 2025 (Sprint 45)
Owner: Authentication Team
Related Issues: JIRA-4532, JIRA-4560
Dependencies: None
```

## Implementation Guide

1. **Format**: Implement this inventory as:

   - A YAML/JSON file in the repository
   - A shared spreadsheet
   - A project management tool with custom fields
   - A dedicated technical debt tracking system

2. **Reporting**: Generate regular (bi-weekly or monthly) reports showing:

   - New debt items
   - Items scheduled for the upcoming sprints
   - Items past their target timeline
   - Debt distribution by type and priority

3. **Integration**: Link the inventory to:
   - Sprint planning tools
   - Architecture documentation
   - Code annotations (via the ID field)

## Best Practices

1. **Discoverability**: All team members should know how to find and update the inventory
2. **Regular Review**: Schedule dedicated time for debt inventory reviews
3. **Fresh Data**: Outdated inventory entries are themselves a form of technical debt
4. **Visualization**: Use charts and dashboards to visualize the debt landscape

## Automation Options

1. Static code analysis integration to auto-populate new potential debt items
2. CI/CD checks for code with debt annotations that aren't in the inventory
3. Automated reports and dashboards for management visibility

---

_This template adheres to the Technical Debt Prevention & Management rule ([mdc:150-technical-debt-prevention.mdc])._
