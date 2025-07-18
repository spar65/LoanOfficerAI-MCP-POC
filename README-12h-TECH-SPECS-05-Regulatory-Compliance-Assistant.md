# HitList-12d-TECH-SPECS-05: Regulatory Compliance Assistant MCP

## Overview

New MCP for AI decision auditing, ensuring FCA/ECOA compliance with bias detection and explainability. Targets 50% compliance cost reduction and $200K fine avoidance.

## Technical Architecture

### 1. Database Schema

```sql
CREATE TABLE ComplianceAudits (
    audit_id NVARCHAR(50) PRIMARY KEY,
    mcp_call_id NVARCHAR(50) NOT NULL,
    function_name NVARCHAR(100) NOT NULL,
    audit_date DATETIME DEFAULT GETDATE(),
    compliance_score DECIMAL(5,4) NOT NULL,
    compliance_status NVARCHAR(20) NOT NULL, -- PASS, FAIL, WARNING
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE ComplianceIssues (
    issue_id NVARCHAR(50) PRIMARY KEY,
    audit_id NVARCHAR(50) NOT NULL,
    issue_type NVARCHAR(100) NOT NULL, -- BIAS, TRANSPARENCY, FAIRNESS, DOCUMENTATION
    severity NVARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    description NVARCHAR(1000),
    regulation_reference NVARCHAR(200), -- ECOA Section X, FCA Rule Y
    FOREIGN KEY (audit_id) REFERENCES ComplianceAudits(audit_id)
);

CREATE TABLE ComplianceRemediations (
    remediation_id NVARCHAR(50) PRIMARY KEY,
    issue_id NVARCHAR(50) NOT NULL,
    action_type NVARCHAR(100) NOT NULL,
    description NVARCHAR(1000),
    implementation_steps NVARCHAR(MAX),
    estimated_effort_hours INT,
    FOREIGN KEY (issue_id) REFERENCES ComplianceIssues(issue_id)
);

CREATE TABLE MCPCallLog (
    call_id NVARCHAR(50) PRIMARY KEY,
    function_name NVARCHAR(100) NOT NULL,
    input_args NVARCHAR(MAX),
    output_result NVARCHAR(MAX),
    user_id NVARCHAR(50),
    call_timestamp DATETIME DEFAULT GETDATE(),
    response_time_ms INT
);
```

### 2. MCP Implementation

```javascript
// server/services/mcpDatabaseService.js
async auditMCPCompliance(mcp_call_id, check_types = ['bias', 'transparency']) {
  try {
    // Get MCP call details
    const callDetails = await this.executeQuery(`
      SELECT * FROM MCPCallLog WHERE call_id = @callId
    `, { callId: mcp_call_id });

    if (!callDetails.recordset.length) {
      throw new Error(`MCP call ${mcp_call_id} not found`);
    }

    const mcpCall = callDetails.recordset[0];
    const issues = [];
    let overallScore = 1.0;

    // Run requested compliance checks
    for (const checkType of check_types) {
      const checkResult = await this.runComplianceCheck(mcpCall, checkType);
      issues.push(...checkResult.issues);
      overallScore *= checkResult.score;
    }

    // Generate remediations for issues
    const remediations = await this.generateRemediations(issues);

    // Store audit results
    const auditId = await this.storeComplianceAudit(
      mcp_call_id,
      mcpCall.function_name,
      overallScore,
      issues,
      remediations
    );

    return {
      mcp_call_id,
      function_name: mcpCall.function_name,
      audit_date: new Date().toISOString(),
      compliance_score: overallScore,
      compliance_status: this.getComplianceStatus(overallScore),
      check_types_performed: check_types,
      issues: issues,
      remediations: remediations,
      audit_id: auditId
    };
  } catch (error) {
    LogService.error('Error in compliance audit', { error: error.message });
    throw error;
  }
}

async runComplianceCheck(mcpCall, checkType) {
  switch (checkType) {
    case 'bias':
      return await this.checkForBias(mcpCall);
    case 'transparency':
      return await this.checkTransparency(mcpCall);
    case 'fairness':
      return await this.checkFairness(mcpCall);
    case 'documentation':
      return await this.checkDocumentation(mcpCall);
    default:
      throw new Error(`Unknown check type: ${checkType}`);
  }
}

async checkForBias(mcpCall) {
  const issues = [];
  let score = 1.0;

  // Parse input/output
  const input = JSON.parse(mcpCall.input_args);
  const output = JSON.parse(mcpCall.output_result);

  // Check for protected class considerations
  if (mcpCall.function_name.includes('DefaultRisk') ||
      mcpCall.function_name.includes('CreditDecision')) {

    // Analyze decision factors
    const factors = output.factors || [];
    const protectedClassFactors = factors.filter(f =>
      this.isProtectedClassFactor(f.factor_type)
    );

    if (protectedClassFactors.length > 0) {
      issues.push({
        type: 'BIAS',
        severity: 'HIGH',
        description: `Decision uses protected class factors: ${protectedClassFactors.map(f => f.factor_type).join(', ')}`,
        regulation: 'ECOA Section 701(a) - Prohibited discrimination'
      });
      score *= 0.3;
    }

    // Check for disparate impact
    const demographicImpact = await this.analyzeDisparateImpact(
      mcpCall.function_name,
      output
    );

    if (demographicImpact.disparity_ratio > 1.2) {
      issues.push({
        type: 'BIAS',
        severity: 'MEDIUM',
        description: `Potential disparate impact detected: ${demographicImpact.disparity_ratio}x difference`,
        regulation: 'ECOA - Disparate impact standard'
      });
      score *= 0.7;
    }
  }

  return { score, issues };
}

async checkTransparency(mcpCall) {
  const issues = [];
  let score = 1.0;

  const output = JSON.parse(mcpCall.output_result);

  // Check for explainability
  if (!output.factors || output.factors.length === 0) {
    issues.push({
      type: 'TRANSPARENCY',
      severity: 'MEDIUM',
      description: 'Decision lacks explanatory factors',
      regulation: 'FCA Principle 6 - Clear information'
    });
    score *= 0.8;
  }

  // Check for confidence scores
  if (output.risk_score !== undefined && output.confidence === undefined) {
    issues.push({
      type: 'TRANSPARENCY',
      severity: 'LOW',
      description: 'Risk score provided without confidence level',
      regulation: 'FCA PRIN 2.1.1 - Act with integrity'
    });
    score *= 0.9;
  }

  return { score, issues };
}
```

### 3. Registry Integration

```javascript
// server/services/mcpFunctionRegistry.js
regulatoryComplianceAssistant: MCPServiceWithLogging.createFunction('regulatoryComplianceAssistant', async (args) => {
  const { mcp_call_id, check_types } = args;

  if (!mcp_call_id) {
    throw new Error('MCP call ID is required');
  }

  try {
    LogService.info(`Running compliance audit for MCP call: ${mcp_call_id}`);
    return await mcpDatabaseService.auditMCPCompliance(
      mcp_call_id,
      check_types || ['bias', 'transparency']
    );
  } catch (error) {
    LogService.error(`Error in compliance audit: ${error.message}`);
    throw error;
  }
}),

// Schema
regulatoryComplianceAssistant: {
  name: 'regulatoryComplianceAssistant',
  description: 'Audit MCP function calls for regulatory compliance including bias and transparency',
  parameters: {
    type: 'object',
    properties: {
      mcp_call_id: {
        type: 'string',
        description: 'ID of the MCP call to audit'
      },
      check_types: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['bias', 'transparency', 'fairness', 'documentation']
        },
        description: 'Types of compliance checks to perform (default: bias, transparency)'
      }
    },
    required: ['mcp_call_id']
  }
}
```

### 4. Compliance Engine

```javascript
// server/services/complianceEngine.js
class ComplianceEngine {
  constructor() {
    this.protectedClasses = [
      "race",
      "color",
      "religion",
      "national_origin",
      "sex",
      "marital_status",
      "age",
    ];

    this.biasDetector = new BiasDetectionModel();
  }

  isProtectedClassFactor(factorName) {
    const normalized = factorName.toLowerCase();
    return this.protectedClasses.some(
      (pc) => normalized.includes(pc) || this.isSynonym(normalized, pc)
    );
  }

  async analyzeDisparateImpact(functionName, output) {
    // Get historical decisions
    const historicalData = await this.getHistoricalDecisions(functionName);

    // Group by demographic (if available)
    const demographicGroups = this.groupByDemographic(historicalData);

    // Calculate acceptance/favorable rates
    const rates = {};
    for (const [group, decisions] of Object.entries(demographicGroups)) {
      const favorable = decisions.filter((d) => d.risk_score < 0.5).length;
      rates[group] = favorable / decisions.length;
    }

    // Find max disparity
    const rateValues = Object.values(rates);
    const maxRate = Math.max(...rateValues);
    const minRate = Math.min(...rateValues);

    return {
      disparity_ratio: maxRate / minRate,
      group_rates: rates,
    };
  }

  generateRemediations(issues) {
    return issues.map((issue) => {
      switch (issue.type) {
        case "BIAS":
          return {
            issue_id: issue.id,
            action_type: "MODEL_ADJUSTMENT",
            description: "Remove or adjust weighting of biased factors",
            steps: [
              "Identify and remove protected class variables",
              "Retrain model without biased features",
              "Validate for disparate impact",
              "Document changes for audit trail",
            ],
            effort_hours: 40,
          };

        case "TRANSPARENCY":
          return {
            issue_id: issue.id,
            action_type: "ADD_EXPLAINABILITY",
            description: "Enhance decision transparency",
            steps: [
              "Add factor importance scores",
              "Include confidence intervals",
              "Provide plain-language explanations",
              "Create decision audit log",
            ],
            effort_hours: 20,
          };

        default:
          return {
            issue_id: issue.id,
            action_type: "REVIEW_REQUIRED",
            description: "Manual review needed",
            steps: ["Consult compliance team"],
            effort_hours: 5,
          };
      }
    });
  }
}
```

### 5. Automated Monitoring

```javascript
// Middleware to log all MCP calls
app.use("/api/mcp/*", async (req, res, next) => {
  const callId = uuidv4();
  const startTime = Date.now();

  // Store request
  req.mcpCallId = callId;

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const responseTime = Date.now() - startTime;

    // Log to compliance database
    mcpDatabaseService.logMCPCall({
      call_id: callId,
      function_name: req.path.split("/").pop(),
      input_args: JSON.stringify(req.body),
      output_result: JSON.stringify(data),
      user_id: req.user?.id,
      response_time_ms: responseTime,
    });

    // Check if auto-audit is needed
    if (shouldAutoAudit(req.path)) {
      setTimeout(() => {
        mcpFunctionRegistry.executeFunction("regulatoryComplianceAssistant", {
          mcp_call_id: callId,
          check_types: ["bias", "transparency"],
        });
      }, 1000);
    }

    originalSend.call(this, data);
  };

  next();
});
```

### 6. Testing

```javascript
describe("Regulatory Compliance Assistant", () => {
  it("should detect bias in credit decisions", async () => {
    // First make a biased decision
    const biasedCall = await mcpFunctionRegistry.executeFunction(
      "getBorrowerDefaultRisk",
      {
        borrower_id: "B001",
        // Inject biased factor for testing
        _test_factors: [{ factor_type: "marital_status", value: "single" }],
      }
    );

    // Audit the call
    const audit = await mcpFunctionRegistry.executeFunction(
      "regulatoryComplianceAssistant",
      {
        mcp_call_id: biasedCall._call_id,
        check_types: ["bias"],
      }
    );

    expect(audit.compliance_score).toBeLessThan(1.0);
    expect(audit.issues).toHaveLength(1);
    expect(audit.issues[0].type).toBe("BIAS");
  });
});
```

## Implementation Checklist

- [ ] Create compliance audit tables
- [ ] Implement bias detection algorithm
- [ ] Add transparency checks
- [ ] Create remediation engine
- [ ] Add MCP call logging middleware
- [ ] Implement auto-audit triggers
- [ ] Create compliance dashboard
- [ ] Add reporting capabilities

## Additional Requirements

### Dashboard Features

- Real-time compliance scores
- Issue trending over time
- Remediation tracking
- Regulatory report generation

### Integration Points

- Connect to model retraining pipeline
- Alert system for critical issues
- Export to GRC platforms
- Audit trail preservation
