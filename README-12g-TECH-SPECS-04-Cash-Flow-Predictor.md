# HitList-12d-TECH-SPECS-04: Cash Flow Predictor MCP

## Overview

Enhances `analyzePaymentPatterns` for ML-based cash flow forecasting aligned with seasonal farming cycles. Targets 15-25% on-time payment improvement.

## Technical Architecture

### 1. Database Schema

```sql
CREATE TABLE CashFlowPredictions (
    prediction_id NVARCHAR(50) PRIMARY KEY,
    borrower_id NVARCHAR(50) NOT NULL,
    prediction_date DATETIME DEFAULT GETDATE(),
    prediction_horizon_months INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (borrower_id) REFERENCES Borrowers(borrower_id)
);

CREATE TABLE CashFlowMonthly (
    flow_id NVARCHAR(50) PRIMARY KEY,
    prediction_id NVARCHAR(50) NOT NULL,
    month_offset INT NOT NULL,
    expected_revenue DECIMAL(15,2),
    expected_expenses DECIMAL(15,2),
    net_cash_flow DECIMAL(15,2),
    payment_capacity DECIMAL(15,2),
    confidence_score DECIMAL(5,4),
    FOREIGN KEY (prediction_id) REFERENCES CashFlowPredictions(prediction_id)
);

CREATE TABLE SeasonalFactors (
    factor_id NVARCHAR(50) PRIMARY KEY,
    farm_type NVARCHAR(100),
    month INT,
    revenue_multiplier DECIMAL(5,4),
    expense_multiplier DECIMAL(5,4)
);
```

### 2. MCP Implementation

```javascript
// server/services/mcpDatabaseService.js
async predictCashFlow(borrower_id, prediction_horizon = 12, include_seasonal = true) {
  try {
    // Get borrower financial history
    const financialData = await this.executeQuery(`
      SELECT b.*,
             COUNT(DISTINCT p.payment_id) as payment_count,
             AVG(p.amount) as avg_payment,
             SUM(CASE WHEN p.days_late = 0 THEN 1 ELSE 0 END) as on_time_payments,
             MAX(p.payment_date) as last_payment_date
      FROM Borrowers b
      LEFT JOIN Loans l ON b.borrower_id = l.borrower_id
      LEFT JOIN Payments p ON l.loan_id = p.loan_id
      WHERE b.borrower_id = @borrowerId
      GROUP BY b.borrower_id, b.first_name, b.last_name, b.farm_type,
               b.income, b.years_farming
    `, { borrowerId: borrower_id });

    if (!financialData.recordset.length) {
      throw new Error(`Borrower ${borrower_id} not found`);
    }

    const borrower = financialData.recordset[0];

    // Get seasonal patterns
    const seasonalPatterns = include_seasonal ?
      await this.getSeasonalPatterns(borrower.farm_type) : null;

    // Generate monthly predictions
    const monthlyForecasts = [];
    for (let month = 1; month <= prediction_horizon; month++) {
      const forecast = await this.forecastMonth(
        borrower,
        month,
        seasonalPatterns
      );
      monthlyForecasts.push(forecast);
    }

    // Calculate repayment probability
    const repaymentProb = this.calculateRepaymentProbability(
      monthlyForecasts,
      borrower
    );

    // Generate payment adjustments
    const adjustments = this.generatePaymentAdjustments(
      monthlyForecasts,
      repaymentProb
    );

    // Store predictions
    const predictionId = await this.storeCashFlowPrediction(
      borrower_id,
      prediction_horizon,
      monthlyForecasts
    );

    return {
      borrower_id,
      prediction_date: new Date().toISOString(),
      horizon_months: prediction_horizon,
      monthly_forecast: monthlyForecasts,
      repayment_probability: repaymentProb,
      payment_capacity_trend: this.analyzeTrend(monthlyForecasts),
      seasonal_impacts: seasonalPatterns ? 'INCLUDED' : 'EXCLUDED',
      recommended_adjustments: adjustments
    };
  } catch (error) {
    LogService.error('Error in cash flow prediction', { error: error.message });
    throw error;
  }
}

async forecastMonth(borrower, monthOffset, seasonalPatterns) {
  // Base revenue from historical average
  let expectedRevenue = borrower.income / 12;
  let expectedExpenses = expectedRevenue * 0.7; // 70% expense ratio baseline

  // Apply seasonal adjustments
  if (seasonalPatterns) {
    const currentMonth = (new Date().getMonth() + monthOffset) % 12;
    const seasonal = seasonalPatterns.find(s => s.month === currentMonth);

    if (seasonal) {
      expectedRevenue *= seasonal.revenue_multiplier;
      expectedExpenses *= seasonal.expense_multiplier;
    }
  }

  // Apply ML adjustments based on patterns
  const mlAdjustments = await this.getMLAdjustments(borrower, monthOffset);
  expectedRevenue *= mlAdjustments.revenue_factor;
  expectedExpenses *= mlAdjustments.expense_factor;

  const netCashFlow = expectedRevenue - expectedExpenses;
  const paymentCapacity = netCashFlow * 0.3; // 30% of net for loan payments

  return {
    month_offset: monthOffset,
    month_name: this.getMonthName(monthOffset),
    expected_revenue: expectedRevenue,
    expected_expenses: expectedExpenses,
    net_cash_flow: netCashFlow,
    payment_capacity: paymentCapacity,
    confidence: mlAdjustments.confidence
  };
}
```

### 3. Registry Integration

```javascript
// server/services/mcpFunctionRegistry.js
cashFlowPredictor: MCPServiceWithLogging.createFunction('cashFlowPredictor', async (args) => {
  const { borrower_id, prediction_horizon, include_seasonal } = args;

  if (!borrower_id) {
    throw new Error('Borrower ID is required');
  }

  try {
    LogService.info(`Predicting cash flow for borrower: ${borrower_id}`);
    return await mcpDatabaseService.predictCashFlow(
      borrower_id,
      prediction_horizon || 12,
      include_seasonal !== false
    );
  } catch (error) {
    LogService.error(`Error in cash flow prediction: ${error.message}`);
    throw error;
  }
}),

// Schema
cashFlowPredictor: {
  name: 'cashFlowPredictor',
  description: 'Predict borrower cash flows with seasonal adjustments for payment planning',
  parameters: {
    type: 'object',
    properties: {
      borrower_id: {
        type: 'string',
        description: 'ID of the borrower to analyze'
      },
      prediction_horizon: {
        type: 'integer',
        description: 'Months to forecast (1-24, default: 12)',
        minimum: 1,
        maximum: 24
      },
      include_seasonal: {
        type: 'boolean',
        description: 'Include seasonal farming patterns (default: true)'
      }
    },
    required: ['borrower_id']
  }
}
```

### 4. ML Model Integration

```javascript
// server/services/cashFlowMLService.js
class CashFlowMLService {
  async getMLAdjustments(borrower, monthOffset) {
    // Feature engineering
    const features = {
      years_farming: borrower.years_farming,
      payment_history_score: borrower.on_time_payments / borrower.payment_count,
      debt_to_income: borrower.debt_to_income_ratio || 0.3,
      month_offset: monthOffset,
      farm_type_encoded: this.encodeFarmType(borrower.farm_type),
    };

    // Call ML model (placeholder for actual implementation)
    const prediction = await this.callMLModel(features);

    return {
      revenue_factor: prediction.revenue_multiplier,
      expense_factor: prediction.expense_multiplier,
      confidence: prediction.confidence_score,
    };
  }

  async trainModel(historicalData) {
    // ARIMA or LSTM implementation
    // Uses historical payment and revenue data
  }
}
```

### 5. Testing

```javascript
describe("Cash Flow Predictor", () => {
  it("should predict seasonal variations", async () => {
    const result = await mcpFunctionRegistry.executeFunction(
      "cashFlowPredictor",
      {
        borrower_id: "B001",
        prediction_horizon: 12,
        include_seasonal: true,
      }
    );

    expect(result.monthly_forecast).toHaveLength(12);

    // Check for seasonal variation
    const summerMonths = result.monthly_forecast.filter((m) =>
      [5, 6, 7, 8].includes((new Date().getMonth() + m.month_offset) % 12)
    );
    const winterMonths = result.monthly_forecast.filter((m) =>
      [11, 0, 1, 2].includes((new Date().getMonth() + m.month_offset) % 12)
    );

    const avgSummerRevenue =
      summerMonths.reduce((sum, m) => sum + m.expected_revenue, 0) /
      summerMonths.length;
    const avgWinterRevenue =
      winterMonths.reduce((sum, m) => sum + m.expected_revenue, 0) /
      winterMonths.length;

    // Summer should have higher revenue for most crops
    expect(avgSummerRevenue).toBeGreaterThan(avgWinterRevenue);
  });
});
```

## Implementation Checklist

- [ ] Create cash flow tables
- [ ] Implement base prediction logic
- [ ] Add seasonal pattern analysis
- [ ] Integrate ML model service
- [ ] Create payment adjustment algorithm
- [ ] Add visualization components
- [ ] Performance optimization
- [ ] Historical data migration

## Additional Requirements

### Visualization

- Monthly cash flow charts
- Payment capacity timeline
- Seasonal pattern display
- Adjustment recommendations UI

### Integration

- Connect to payment processing
- Automated payment scheduling
- Alert system for low capacity months
- Export to accounting systems
