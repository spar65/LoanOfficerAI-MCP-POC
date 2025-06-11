# Technical Debt Impact Matrix

This document provides a standardized approach for evaluating the impact and severity of technical debt items. It helps teams prioritize debt remediation by considering multiple dimensions of impact.

## Impact Dimensions

Technical debt can affect different aspects of a system and its development. Each dimension should be scored independently:

### 1. Maintainability Impact (1-10)

| Score | Description                                     | Examples                                          |
| ----- | ----------------------------------------------- | ------------------------------------------------- |
| 1-2   | Minimal impact on code maintainability          | Comments slightly outdated                        |
| 3-4   | Minor impact, affecting isolated components     | Duplicated code in single file                    |
| 5-6   | Moderate impact, affecting module maintenance   | Complex method, unclear naming patterns           |
| 7-8   | Significant impact on system maintenance        | Architectural inconsistencies, tight coupling     |
| 9-10  | Severe impact, critically hampering maintenance | "Big ball of mud" code, no separation of concerns |

### 2. Performance Impact (1-10)

| Score | Description                                        | Examples                                                  |
| ----- | -------------------------------------------------- | --------------------------------------------------------- |
| 1-2   | Negligible performance impact                      | Unoptimized code with insignificant load                  |
| 3-4   | Minor performance issues under specific conditions | Occasional UI lag, slow non-critical operations           |
| 5-6   | Noticeable performance degradation                 | Regular timeouts in moderate load                         |
| 7-8   | Significant performance problems                   | Consistent slowdowns affecting user experience            |
| 9-10  | Critical performance failures                      | System crashes under expected load, unresponsive services |

### 3. Reliability Impact (1-10)

| Score | Description                   | Examples                                                |
| ----- | ----------------------------- | ------------------------------------------------------- |
| 1-2   | Minimal reliability concerns  | Error handling edge cases missed                        |
| 3-4   | Occasional minor failures     | Rare non-critical exceptions                            |
| 5-6   | Periodic reliability issues   | Weekly restarts needed, occasional data inconsistencies |
| 7-8   | Frequent reliability problems | Daily issues requiring intervention                     |
| 9-10  | Severe reliability failures   | System cannot operate without constant oversight        |

### 4. Security Impact (1-10)

| Score | Description                                         | Examples                                           |
| ----- | --------------------------------------------------- | -------------------------------------------------- |
| 1-2   | No direct security implications                     | Code style issues in secure area                   |
| 3-4   | Security concerns in non-sensitive areas            | Logging excessive information in dev environment   |
| 5-6   | Moderate security issues in controlled environments | Input validation weaknesses behind authentication  |
| 7-8   | Significant security vulnerabilities                | Improper encryption, authentication weaknesses     |
| 9-10  | Critical security flaws                             | Exposed credentials, SQL injection vulnerabilities |

### 5. Developer Productivity Impact (1-10)

| Score | Description                          | Examples                                          |
| ----- | ------------------------------------ | ------------------------------------------------- |
| 1-2   | Minimal impact on developer workflow | Slightly confusing naming                         |
| 3-4   | Minor irritations during development | Slow test suite, occasional build issues          |
| 5-6   | Noticeable productivity drains       | Regular build failures, difficult debugging       |
| 7-8   | Significant development obstacles    | Complex onboarding, tribal knowledge dependencies |
| 9-10  | Development severely hampered        | Unable to run locally, days to understand changes |

### 6. Business Impact (1-10)

| Score | Description                       | Examples                                   |
| ----- | --------------------------------- | ------------------------------------------ |
| 1-2   | Minimal business implication      | Internal tooling inefficiencies            |
| 3-4   | Minor business concerns           | Occasional customer complaints             |
| 5-6   | Moderate business impact          | Feature delays, support burden             |
| 7-8   | Significant business consequences | Revenue impact, reputation damage          |
| 9-10  | Catastrophic business risk        | Regulatory violations, major customer loss |

## Overall Impact Score Calculation

The final impact score can be calculated using a weighted average based on the specific context:

```
Impact = (Maintainability × W₁) + (Performance × W₂) + (Reliability × W₃) +
         (Security × W₄) + (Developer Productivity × W₅) + (Business × W₆)
```

Where:

- Each factor is rated 1-10
- Weights (W₁...W₆) should sum to 1.0 and reflect organizational priorities

### Default Weights

| Dimension              | Default Weight | Adjust When                                     |
| ---------------------- | -------------- | ----------------------------------------------- |
| Maintainability        | 0.20           | Higher for legacy systems, lower for prototypes |
| Performance            | 0.15           | Higher for user-facing or real-time systems     |
| Reliability            | 0.20           | Higher for mission-critical systems             |
| Security               | 0.20           | Higher for systems with sensitive data          |
| Developer Productivity | 0.10           | Higher during rapid development phases          |
| Business               | 0.15           | Higher for core business capabilities           |

## Impact Classification

The calculated impact score translates to these categories:

| Score Range | Classification  | Remediation Guidance                                |
| ----------- | --------------- | --------------------------------------------------- |
| 1.0 - 3.0   | Low Impact      | Address opportunistically during normal development |
| 3.1 - 5.0   | Moderate Impact | Plan remediation within 3-6 months                  |
| 5.1 - 7.0   | High Impact     | Plan remediation within 1-3 months                  |
| 7.1 - 8.5   | Severe Impact   | Plan immediate remediation (1-2 sprints)            |
| 8.6 - 10.0  | Critical Impact | Stop feature development until addressed            |

## Implementation Example

```
Technical Debt Item: Authentication Timeout Hardcoding

Dimension Scores:
- Maintainability: 6 (Makes configuration changes require code changes)
- Performance: 3 (Minimal performance impact)
- Reliability: 7 (Can cause authentication failures in some environments)
- Security: 5 (May expose timeout settings unnecessarily)
- Developer Productivity: 4 (Causes confusion when debugging environment issues)
- Business: 6 (Affects customer experience during peak hours)

Weights (security-sensitive system):
- Maintainability: 0.15
- Performance: 0.10
- Reliability: 0.25
- Security: 0.25
- Developer Productivity: 0.05
- Business: 0.20

Calculation:
Impact = (6 × 0.15) + (3 × 0.10) + (7 × 0.25) + (5 × 0.25) + (4 × 0.05) + (6 × 0.20)
Impact = 0.9 + 0.3 + 1.75 + 1.25 + 0.2 + 1.2
Impact = 5.6

Classification: High Impact
Remediation: Plan to address within 1-3 months
```

## Integration with the Technical Debt Inventory

When using this matrix with the [Technical Debt Inventory](TechnicalDebtInventoryTemplate.md):

1. Document the individual dimension scores for transparency
2. Include the calculation method and weights used
3. Use the final impact score in the priority formula:
   ```
   Priority = Impact × Effort⁻¹ × Strategic Alignment
   ```

---

_This assessment matrix adheres to the Technical Debt Prevention & Management rule ([mdc:150-technical-debt-prevention.mdc])._
