# HitList-12d-TECH-SPECS-01: Predictive Default Monitor MCP

## Overview

The Predictive Default Monitor MCP extends existing `getBorrowerDefaultRisk` and `getHighRiskFarmers` functions to provide proactive ML-based default forecasting. Targets 20-30% default reduction in low-default environments like FCBT (0.20% baseline).

## Technical Architecture

### 1. Database Schema Extensions

```sql
-- New tables for ML features and predictions
CREATE TABLE DefaultPredictions (
    prediction_id NVARCHAR(50) PRIMARY KEY,
    borrower_id NVARCHAR(50) NOT NULL,
    prediction_date DATETIME DEFAULT GETDATE(),
    horizon_months INT NOT NULL,
    risk_score DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    confidence_score DECIMAL(5,4) NOT NULL,
    risk_level NVARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (borrower_id) REFERENCES Borrowers(borrower_id)
);

CREATE TABLE DefaultRiskFactors (
    factor_id NVARCHAR(50) PRIMARY KEY,
    prediction_id NVARCHAR(50) NOT NULL,
    factor_type NVARCHAR(100) NOT NULL,
    factor_value NVARCHAR(500),
    impact_score DECIMAL(5,4) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (prediction_id) REFERENCES DefaultPredictions(prediction_id)
);

CREATE TABLE DefaultMitigationActions (
    action_id NVARCHAR(50) PRIMARY KEY,
    prediction_id NVARCHAR(50) NOT NULL,
    action_type NVARCHAR(100) NOT NULL,
    description NVARCHAR(1000),
    priority INT NOT NULL,
    estimated_impact DECIMAL(5,4),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (prediction_id) REFERENCES DefaultPredictions(prediction_id)
);

-- ML feature aggregation view
CREATE VIEW BorrowerMLFeatures AS
SELECT
    b.borrower_id,
    b.credit_score,
    b.debt_to_income_ratio,
    b.years_farming,
    b.farm_type,
    COUNT(DISTINCT l.loan_id) as active_loan_count,
    SUM(l.loan_amount) as total_exposure,
    AVG(l.interest_rate) as avg_interest_rate,
    COUNT(DISTINCT p.payment_id) as total_payments,
    SUM(CASE WHEN p.days_late > 0 THEN 1 ELSE 0 END) as late_payment_count,
    AVG(p.days_late) as avg_days_late,
    MAX(p.days_late) as max_days_late,
    DATEDIFF(MONTH, MIN(l.application_date), GETDATE()) as relationship_months
FROM Borrowers b
LEFT JOIN Loans l ON b.borrower_id = l.borrower_id AND l.status = 'Active'
LEFT JOIN Payments p ON l.loan_id = p.loan_id
GROUP BY b.borrower_id, b.credit_score, b.debt_to_income_ratio,
         b.years_farming, b.farm_type;
```

### 2. MCP Function Implementation

```javascript
// server/services/mcpDatabaseService.js - Add new method
async predictBorrowerDefault(borrower_id, horizon_months = 6, include_externals = true) {
  try {
    // Validate inputs
    if (!borrower_id) throw new Error('Borrower ID required');
    if (horizon_months < 1 || horizon_months > 24) {
      throw new Error('Horizon must be between 1 and 24 months');
    }

    // Get borrower ML features
    const features = await this.executeQuery(`
      SELECT * FROM BorrowerMLFeatures WHERE borrower_id = @borrowerId
    `, { borrowerId: borrower_id });

    if (!features.recordset.length) {
      throw new Error(`Borrower ${borrower_id} not found`);
    }

    const borrowerFeatures = features.recordset[0];

    // Calculate risk score using ML model
    const riskScore = await this.calculateDefaultRisk(borrowerFeatures, horizon_months);

    // Get external risk factors if requested
    let externalFactors = [];
    if (include_externals) {
      externalFactors = await this.getExternalRiskFactors(borrower_id);
    }

    // Determine risk factors
    const riskFactors = await this.analyzeRiskFactors(borrowerFeatures, externalFactors);

    // Generate mitigation recommendations
    const recommendations = await this.generateMitigationActions(riskScore, riskFactors);

    // Store prediction
    const predictionId = uuidv4();
    await this.storePrediction(predictionId, borrower_id, horizon_months, riskScore, riskFactors, recommendations);

    return {
      borrower_id,
      prediction_date: new Date().toISOString(),
      horizon_months,
      risk_score: riskScore.score,
      confidence: riskScore.confidence,
      risk_level: this.getRiskLevel(riskScore.score),
      factors: riskFactors,
      recommendations,
      model_version: '1.0.0'
    };
  } catch (error) {
    LogService.error('Error in predictBorrowerDefault', { error: error.message, borrower_id });
    throw error;
  }
}

// Helper method for ML risk calculation
async calculateDefaultRisk(features, horizon) {
  // In production, this would call the ML model service
  // For now, implement a rule-based scoring system

  let riskScore = 0;
  let confidence = 0.85;

  // Credit score impact (0-300 points)
  if (features.credit_score < 600) riskScore += 0.3;
  else if (features.credit_score < 650) riskScore += 0.2;
  else if (features.credit_score < 700) riskScore += 0.1;

  // Payment history impact (0-400 points)
  const latePaymentRatio = features.late_payment_count / (features.total_payments || 1);
  riskScore += latePaymentRatio * 0.4;

  // Debt-to-income impact (0-200 points)
  if (features.debt_to_income_ratio > 0.5) riskScore += 0.2;
  else if (features.debt_to_income_ratio > 0.4) riskScore += 0.1;

  // Time horizon adjustment
  riskScore *= (1 + (horizon / 24) * 0.2);

  // Normalize to 0-1
  riskScore = Math.min(Math.max(riskScore, 0), 1);

  return { score: riskScore, confidence };
}
```

### 3. Registry Integration

```javascript
// server/services/mcpFunctionRegistry.js - Add to registry
predictiveDefaultMonitor: MCPServiceWithLogging.createFunction('predictiveDefaultMonitor', async (args) => {
  const { borrower_id, horizon_months, include_externals } = args;

  if (!borrower_id) {
    throw new Error('Borrower ID is required');
  }

  try {
    LogService.info(`Running predictive default analysis for borrower: ${borrower_id}`);
    return await mcpDatabaseService.predictBorrowerDefault(
      borrower_id,
      horizon_months || 6,
      include_externals !== false
    );
  } catch (error) {
    LogService.error(`Error in predictive default monitor: ${error.message}`);
    throw error;
  }
}),

// Add to functionSchemas
predictiveDefaultMonitor: {
  name: 'predictiveDefaultMonitor',
  description: 'Predict default probability for a borrower using ML analysis of payment history, financials, and external factors',
  parameters: {
    type: 'object',
    properties: {
      borrower_id: {
        type: 'string',
        description: 'ID of the borrower to analyze'
      },
      horizon_months: {
        type: 'integer',
        description: 'Prediction horizon in months (1-24, default: 6)',
        minimum: 1,
        maximum: 24
      },
      include_externals: {
        type: 'boolean',
        description: 'Include external risk factors like weather and commodity prices (default: true)'
      }
    },
    required: ['borrower_id']
  }
}
```

### 4. External API Integration

```javascript
// server/services/externalDataService.js - New service
class ExternalDataService {
  async getWeatherRisk(location, horizon_days) {
    // Integration with NOAA or weather service
    const apiKey = process.env.WEATHER_API_KEY;
    const response = await axios.get(
      `https://api.weather.gov/forecast/${location}`,
      {
        params: { days: horizon_days },
        headers: { "X-API-Key": apiKey },
      }
    );

    return this.processWeatherData(response.data);
  }

  async getCommodityPrices(commodities) {
    // Integration with commodity price API
    const apiKey = process.env.COMMODITY_API_KEY;
    const response = await axios.get("https://api.commodities.com/prices", {
      params: { symbols: commodities.join(",") },
      headers: { "X-API-Key": apiKey },
    });

    return this.processCommodityData(response.data);
  }
}
```

### 5. Client Integration

```javascript
// client/src/components/Chatbot.js - Add to MCP_FUNCTIONS
{
  name: "predictiveDefaultMonitor",
  description: "Predict the probability of borrower default using ML analysis with configurable time horizon",
  parameters: {
    type: "object",
    properties: {
      borrower_id: {
        type: "string",
        description: "The ID of the borrower to analyze for default risk"
      },
      horizon_months: {
        type: "integer",
        description: "Number of months to forecast (1-24, default: 6)"
      },
      include_externals: {
        type: "boolean",
        description: "Include external factors like weather and commodity prices (default: true)"
      }
    },
    required: ["borrower_id"]
  }
}

// Add to processFunctionCall switch statement
case 'predictiveDefaultMonitor':
  console.log(`Running ML default prediction for borrower ${args.borrower_id}, horizon: ${args.horizon_months || 6} months`);
  result = await mcpClient.predictiveDefaultMonitor(
    args.borrower_id,
    args.horizon_months || 6,
    args.include_externals !== false
  );
  console.log('Predictive default analysis result:', result);
  break;
```

### 6. Testing Requirements

```javascript
// server/tests/mcp-core/test-predictive-default.js
describe("Predictive Default Monitor", () => {
  it("should predict default risk with basic features", async () => {
    const result = await mcpFunctionRegistry.executeFunction(
      "predictiveDefaultMonitor",
      {
        borrower_id: "B001",
        horizon_months: 6,
      }
    );

    expect(result).toHaveProperty("risk_score");
    expect(result.risk_score).toBeGreaterThanOrEqual(0);
    expect(result.risk_score).toBeLessThanOrEqual(1);
    expect(result).toHaveProperty("factors");
    expect(result).toHaveProperty("recommendations");
  });

  it("should handle different time horizons", async () => {
    const shortTerm = await mcpFunctionRegistry.executeFunction(
      "predictiveDefaultMonitor",
      {
        borrower_id: "B001",
        horizon_months: 3,
      }
    );

    const longTerm = await mcpFunctionRegistry.executeFunction(
      "predictiveDefaultMonitor",
      {
        borrower_id: "B001",
        horizon_months: 12,
      }
    );

    // Longer horizons should generally show higher risk
    expect(longTerm.risk_score).toBeGreaterThanOrEqual(shortTerm.risk_score);
  });
});
```

### 7. Performance Optimizations

```javascript
// Implement caching for ML predictions
const NodeCache = require('node-cache');
const predictionCache = new NodeCache({ stdTTL: 300 }); // 5-minute cache

async predictBorrowerDefaultCached(borrower_id, horizon_months, include_externals) {
  const cacheKey = `predict_${borrower_id}_${horizon_months}_${include_externals}`;
  const cached = predictionCache.get(cacheKey);

  if (cached) {
    LogService.debug(`Returning cached prediction for ${borrower_id}`);
    return cached;
  }

  const result = await this.predictBorrowerDefault(borrower_id, horizon_months, include_externals);
  predictionCache.set(cacheKey, result);
  return result;
}
```

## Implementation Checklist

- [ ] Create database tables and views
- [ ] Implement mcpDatabaseService methods
- [ ] Add function to registry with schema
- [ ] Create external data service
- [ ] Update client Chatbot component
- [ ] Add comprehensive tests
- [ ] Implement caching layer
- [ ] Add monitoring/metrics
- [ ] Create API documentation
- [ ] Performance test with 100 concurrent requests
- [ ] Security audit for PII handling
- [ ] Compliance review for ECOA/FCA

## Additional Requirements

### ML Model Integration

- Containerize ML model as microservice
- Implement model versioning
- Add A/B testing capability
- Create model retraining pipeline

### Monitoring & Alerts

- Track prediction accuracy over time
- Alert on high-risk predictions
- Monitor API response times
- Log all predictions for audit

### Compliance

- Ensure model explainability
- Document bias testing results
- Maintain decision audit trail
- Regular fairness assessments
