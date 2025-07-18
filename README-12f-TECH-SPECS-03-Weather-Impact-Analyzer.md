# HitList-12d-TECH-SPECS-03: Weather Impact Analyzer MCP

## Overview

Extends planned `assessCropYieldRisk` for comprehensive weather risk assessment. Critical for Southeast volatility (hurricanes, droughts). Targets 20-40% exposure reduction.

## Technical Architecture

### 1. Database Schema Extensions

```sql
-- Weather tracking and impact tables
CREATE TABLE WeatherEvents (
    event_id NVARCHAR(50) PRIMARY KEY,
    event_type NVARCHAR(50) NOT NULL, -- HURRICANE, DROUGHT, FLOOD, FREEZE
    event_name NVARCHAR(100),
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    severity_level INT NOT NULL, -- 1-5 scale
    affected_regions NVARCHAR(MAX), -- JSON array of counties/states
    data_source NVARCHAR(100),
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE WeatherImpactAssessments (
    assessment_id NVARCHAR(50) PRIMARY KEY,
    loan_id NVARCHAR(50) NOT NULL,
    event_id NVARCHAR(50),
    assessment_date DATETIME DEFAULT GETDATE(),
    impact_score DECIMAL(5,4) NOT NULL, -- 0-1 scale
    yield_impact_percent DECIMAL(5,2),
    revenue_impact_amount DECIMAL(15,2),
    recovery_time_days INT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (loan_id) REFERENCES Loans(loan_id),
    FOREIGN KEY (event_id) REFERENCES WeatherEvents(event_id)
);

CREATE TABLE WeatherMitigations (
    mitigation_id NVARCHAR(50) PRIMARY KEY,
    assessment_id NVARCHAR(50) NOT NULL,
    mitigation_type NVARCHAR(100) NOT NULL,
    description NVARCHAR(1000),
    cost_estimate DECIMAL(15,2),
    effectiveness_score DECIMAL(5,4),
    implementation_days INT,
    FOREIGN KEY (assessment_id) REFERENCES WeatherImpactAssessments(assessment_id)
);

-- Weather forecast integration
CREATE TABLE WeatherForecasts (
    forecast_id NVARCHAR(50) PRIMARY KEY,
    location_lat DECIMAL(10,7),
    location_lon DECIMAL(10,7),
    forecast_date DATETIME NOT NULL,
    forecast_horizon_days INT NOT NULL,
    temperature_high DECIMAL(5,2),
    temperature_low DECIMAL(5,2),
    precipitation_mm DECIMAL(10,2),
    wind_speed_mph DECIMAL(5,2),
    severe_weather_prob DECIMAL(5,4),
    data_provider NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE()
);
```

### 2. MCP Implementation

```javascript
// server/services/mcpDatabaseService.js
async analyzeWeatherImpact(loan_id, forecast_horizon = 90, severity_threshold = 0.5) {
  try {
    // Get loan and farm details
    const loanData = await this.executeQuery(`
      SELECT l.*, b.farm_type, b.city, b.state, b.zip_code,
             c.type as crop_type, c.description as farm_description
      FROM Loans l
      JOIN Borrowers b ON l.borrower_id = b.borrower_id
      LEFT JOIN Collateral c ON l.loan_id = c.loan_id AND c.type = 'Crops'
      WHERE l.loan_id = @loanId
    `, { loanId: loan_id });

    if (!loanData.recordset.length) {
      throw new Error(`Loan ${loan_id} not found`);
    }

    const loan = loanData.recordset[0];

    // Get weather forecast for location
    const forecast = await this.getWeatherForecast(
      loan.city,
      loan.state,
      loan.zip_code,
      forecast_horizon
    );

    // Analyze historical weather patterns
    const historicalRisk = await this.analyzeHistoricalWeather(
      loan.state,
      loan.farm_type
    );

    // Run impact scenarios
    const scenarios = await this.runWeatherScenarios(loan, forecast, severity_threshold);

    // Generate mitigation strategies
    const mitigations = await this.generateWeatherMitigations(
      loan,
      scenarios,
      forecast
    );

    // Calculate overall impact score
    const impactScore = this.calculateWeatherImpactScore(scenarios, historicalRisk);

    // Store assessment
    await this.storeWeatherAssessment(loan_id, impactScore, scenarios, mitigations);

    return {
      loan_id,
      location: `${loan.city}, ${loan.state}`,
      farm_type: loan.farm_type,
      assessment_date: new Date().toISOString(),
      forecast_horizon_days: forecast_horizon,
      impact_score: impactScore,
      risk_level: this.getWeatherRiskLevel(impactScore),
      current_conditions: forecast.current,
      forecast_summary: forecast.summary,
      scenarios: scenarios,
      mitigations: mitigations,
      historical_context: historicalRisk
    };
  } catch (error) {
    LogService.error('Error in weather impact analysis', { error: error.message, loan_id });
    throw error;
  }
}

// Weather forecast integration
async getWeatherForecast(city, state, zipCode, horizonDays) {
  const weatherService = new WeatherDataService();

  // Get NOAA forecast
  const noaaForecast = await weatherService.getNOAAForecast({
    location: `${city}, ${state}`,
    zipCode: zipCode,
    days: horizonDays
  });

  // Get severe weather alerts
  const alerts = await weatherService.getSevereWeatherAlerts({
    state: state,
    alertTypes: ['hurricane', 'tornado', 'flood', 'drought']
  });

  // Analyze forecast for agricultural impacts
  return {
    current: {
      temperature: noaaForecast.current.temp,
      precipitation: noaaForecast.current.precip,
      conditions: noaaForecast.current.conditions
    },
    summary: {
      avg_temp: noaaForecast.periods.reduce((sum, p) => sum + p.temp, 0) / noaaForecast.periods.length,
      total_precip: noaaForecast.periods.reduce((sum, p) => sum + p.precip, 0),
      drought_risk: this.calculateDroughtRisk(noaaForecast),
      flood_risk: this.calculateFloodRisk(noaaForecast),
      freeze_risk: this.calculateFreezeRisk(noaaForecast),
      severe_weather_prob: alerts.length > 0 ? 0.8 : 0.2
    },
    alerts: alerts,
    periods: noaaForecast.periods
  };
}

// Scenario simulation
async runWeatherScenarios(loan, forecast, severityThreshold) {
  const scenarios = [];

  // Drought scenario
  if (forecast.summary.drought_risk > severityThreshold) {
    scenarios.push({
      type: 'DROUGHT',
      probability: forecast.summary.drought_risk,
      impact: await this.simulateDroughtImpact(loan, forecast),
      timeline: '3-6 months'
    });
  }

  // Flood scenario
  if (forecast.summary.flood_risk > severityThreshold) {
    scenarios.push({
      type: 'FLOOD',
      probability: forecast.summary.flood_risk,
      impact: await this.simulateFloodImpact(loan, forecast),
      timeline: '1-2 weeks'
    });
  }

  // Hurricane scenario (Southeast specific)
  if (loan.state in ['FL', 'GA', 'SC', 'NC', 'AL', 'MS', 'LA']) {
    const hurricaneRisk = await this.getHurricaneRisk(loan.state);
    if (hurricaneRisk > severityThreshold) {
      scenarios.push({
        type: 'HURRICANE',
        probability: hurricaneRisk,
        impact: await this.simulateHurricaneImpact(loan, forecast),
        timeline: 'Seasonal (Jun-Nov)'
      });
    }
  }

  return scenarios.sort((a, b) => b.impact.severity - a.impact.severity);
}
```

### 3. Weather Service Integration

```javascript
// server/services/weatherDataService.js
class WeatherDataService {
  constructor() {
    this.noaaClient = new NOAAClient(process.env.NOAA_API_KEY);
    this.dtnClient = new DTNClient(process.env.DTN_API_KEY);
  }

  async getNOAAForecast(options) {
    try {
      // Get grid point for location
      const point = await this.noaaClient.getGridPoint(
        options.location,
        options.zipCode
      );

      // Get forecast for grid
      const forecast = await this.noaaClient.getForecast(
        point.gridId,
        point.gridX,
        point.gridY
      );

      // Process for agricultural relevance
      return this.processNOAAForecast(forecast, options.days);
    } catch (error) {
      // Fallback to DTN if NOAA fails
      LogService.warn("NOAA forecast failed, using DTN", error);
      return await this.dtnClient.getForecast(options);
    }
  }

  async getSevereWeatherAlerts(options) {
    const alerts = await this.noaaClient.getActiveAlerts({
      area: options.state,
      urgency: "Expected,Immediate",
      severity: "Severe,Extreme",
    });

    return alerts.filter((alert) =>
      options.alertTypes.some((type) =>
        alert.event.toLowerCase().includes(type)
      )
    );
  }

  calculateDroughtRisk(forecast) {
    const dryDays = forecast.periods.filter((p) => p.precip < 0.1).length;
    const totalDays = forecast.periods.length;
    const highTempDays = forecast.periods.filter((p) => p.temp > 90).length;

    // Weighted calculation
    return (dryDays / totalDays) * 0.6 + (highTempDays / totalDays) * 0.4;
  }
}
```

### 4. Registry Integration

```javascript
// server/services/mcpFunctionRegistry.js
weatherImpactAnalyzer: MCPServiceWithLogging.createFunction('weatherImpactAnalyzer', async (args) => {
  const { loan_id, forecast_horizon, severity_threshold } = args;

  if (!loan_id) {
    throw new Error('Loan ID is required');
  }

  try {
    LogService.info(`Analyzing weather impact for loan: ${loan_id}`);
    return await mcpDatabaseService.analyzeWeatherImpact(
      loan_id,
      forecast_horizon || 90,
      severity_threshold || 0.5
    );
  } catch (error) {
    LogService.error(`Error in weather impact analysis: ${error.message}`);
    throw error;
  }
}),

// Schema
weatherImpactAnalyzer: {
  name: 'weatherImpactAnalyzer',
  description: 'Analyze weather forecast impacts on agricultural loans with scenario planning',
  parameters: {
    type: 'object',
    properties: {
      loan_id: {
        type: 'string',
        description: 'ID of the loan to analyze for weather impact'
      },
      forecast_horizon: {
        type: 'integer',
        description: 'Days to forecast (default: 90)',
        minimum: 7,
        maximum: 365
      },
      severity_threshold: {
        type: 'number',
        description: 'Minimum severity to include scenarios (0-1, default: 0.5)',
        minimum: 0,
        maximum: 1
      }
    },
    required: ['loan_id']
  }
}
```

### 5. Hurricane-Specific Implementation

```javascript
// Special handling for Southeast hurricane risk
async simulateHurricaneImpact(loan, forecast) {
  // Use historical hurricane data
  const historicalDamage = await this.getHistoricalHurricaneDamage(
    loan.state,
    loan.farm_type
  );

  // Factor in current conditions
  const vulnerabilityFactors = {
    location_risk: await this.getCoastalProximity(loan.zip_code),
    crop_stage: await this.getCurrentCropStage(loan.borrower_id),
    infrastructure: await this.assessInfrastructureResilience(loan.loan_id)
  };

  // Calculate potential impact
  const yieldLoss = historicalDamage.avg_yield_loss * vulnerabilityFactors.location_risk;
  const infrastructureDamage = historicalDamage.avg_property_damage * vulnerabilityFactors.infrastructure;

  return {
    severity: 0.8, // Hurricanes are high severity
    yield_loss_percent: yieldLoss,
    revenue_impact: loan.loan_amount * (yieldLoss / 100),
    recovery_time_days: 180,
    insurance_coverage: await this.checkInsuranceCoverage(loan.loan_id),
    mitigation_cost: infrastructureDamage * 0.2 // Prevention costs ~20% of potential damage
  };
}
```

### 6. Testing Requirements

```javascript
describe("Weather Impact Analyzer", () => {
  it("should analyze drought risk correctly", async () => {
    const result = await mcpFunctionRegistry.executeFunction(
      "weatherImpactAnalyzer",
      {
        loan_id: "L001",
        forecast_horizon: 90,
      }
    );

    expect(result).toHaveProperty("scenarios");
    const droughtScenario = result.scenarios.find((s) => s.type === "DROUGHT");
    if (droughtScenario) {
      expect(droughtScenario).toHaveProperty("probability");
      expect(droughtScenario).toHaveProperty("impact");
    }
  });

  it("should provide hurricane analysis for Southeast loans", async () => {
    const result = await mcpFunctionRegistry.executeFunction(
      "weatherImpactAnalyzer",
      {
        loan_id: "L_FL_001", // Florida loan
        forecast_horizon: 180, // Cover hurricane season
      }
    );

    const hurricaneScenario = result.scenarios.find(
      (s) => s.type === "HURRICANE"
    );
    expect(hurricaneScenario).toBeDefined();
    expect(hurricaneScenario.impact.severity).toBeGreaterThan(0.7);
  });
});
```

## Implementation Checklist

- [ ] Create weather tracking tables
- [ ] NOAA API integration
- [ ] DTN backup integration
- [ ] Scenario simulation engine
- [ ] Hurricane risk modeling
- [ ] Drought analysis algorithm
- [ ] Mitigation recommendation engine
- [ ] Real-time alert system
- [ ] Historical data import
- [ ] Performance optimization

## Additional Requirements

### Alert System

- Real-time severe weather notifications
- SMS/Email alerts for high-risk events
- Automated mitigation triggers
- Integration with loan servicing

### Visualization

- Weather risk dashboard
- Scenario impact charts
- Geographic risk heat maps
- Historical trend analysis

### Compliance

- Document all risk assessments
- Maintain prediction accuracy logs
- Regular model validation
- Insurance coordination
