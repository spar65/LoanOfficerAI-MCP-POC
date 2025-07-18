# HitList-12d-TECH-SPECS-02: Collateral & Land Valuator MCP

## Overview

Enhances `evaluateCollateralSufficiency` with real-time satellite/IoT valuation for Southeast volatility. Targets 20% accuracy improvement and $100K over-lending avoidance.

## Technical Architecture

### 1. Database Schema Extensions

```sql
-- Valuation tracking tables
CREATE TABLE CollateralValuations (
    valuation_id NVARCHAR(50) PRIMARY KEY,
    collateral_id NVARCHAR(50) NOT NULL,
    valuation_date DATETIME DEFAULT GETDATE(),
    valuation_amount DECIMAL(15,2) NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    valuation_method NVARCHAR(50) NOT NULL, -- SATELLITE, MARKET_COMP, HYBRID
    data_sources NVARCHAR(MAX), -- JSON array of sources used
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (collateral_id) REFERENCES Collateral(collateral_id)
);

CREATE TABLE ValuationFactors (
    factor_id NVARCHAR(50) PRIMARY KEY,
    valuation_id NVARCHAR(50) NOT NULL,
    factor_type NVARCHAR(100) NOT NULL, -- CROP_HEALTH, SOIL_QUALITY, MARKET_COMP
    factor_value NVARCHAR(500),
    impact_amount DECIMAL(15,2),
    confidence DECIMAL(5,4),
    FOREIGN KEY (valuation_id) REFERENCES CollateralValuations(valuation_id)
);

-- Satellite data storage
CREATE TABLE SatelliteImagery (
    image_id NVARCHAR(50) PRIMARY KEY,
    collateral_id NVARCHAR(50) NOT NULL,
    capture_date DATETIME NOT NULL,
    provider NVARCHAR(50), -- EOS, SatSure, etc.
    image_url NVARCHAR(500),
    analysis_results NVARCHAR(MAX), -- JSON
    ndvi_score DECIMAL(5,4), -- Vegetation index
    processed_at DATETIME,
    FOREIGN KEY (collateral_id) REFERENCES Collateral(collateral_id)
);
```

### 2. MCP Implementation

```javascript
// server/services/mcpDatabaseService.js
async valuateCollateralWithSatellite(asset_id, valuation_date = null, include_satellite = true) {
  try {
    // Get collateral details
    const collateral = await this.executeQuery(`
      SELECT c.*, l.loan_amount, b.farm_type, b.city, b.state
      FROM Collateral c
      JOIN Loans l ON c.loan_id = l.loan_id
      JOIN Borrowers b ON l.borrower_id = b.borrower_id
      WHERE c.collateral_id = @assetId
    `, { assetId: asset_id });

    if (!collateral.recordset.length) {
      throw new Error(`Collateral ${asset_id} not found`);
    }

    const asset = collateral.recordset[0];
    let valuationData = {
      base_value: asset.value,
      factors: []
    };

    // Get satellite analysis if requested
    if (include_satellite && asset.type === 'Real Estate') {
      const satelliteData = await this.getSatelliteAnalysis(asset);
      valuationData = this.applySatelliteFactors(valuationData, satelliteData);
    }

    // Get market comparables
    const marketComps = await this.getMarketComparables(asset);
    valuationData = this.applyMarketFactors(valuationData, marketComps);

    // Calculate final valuation
    const finalValuation = this.calculateFinalValuation(valuationData);

    // Calculate LTV ratio
    const ltvRatio = asset.loan_amount / finalValuation.amount;

    // Store valuation
    await this.storeValuation(asset_id, finalValuation);

    return {
      asset_id,
      asset_type: asset.type,
      location: `${asset.city}, ${asset.state}`,
      base_value: asset.value,
      current_valuation: finalValuation.amount,
      valuation_date: valuation_date || new Date().toISOString(),
      confidence: finalValuation.confidence,
      ltv_ratio: ltvRatio,
      ltv_status: ltvRatio > 0.8 ? 'HIGH_RISK' : ltvRatio > 0.65 ? 'MODERATE' : 'HEALTHY',
      factors: valuationData.factors,
      recommendations: this.generateValuationRecommendations(ltvRatio, valuationData.factors)
    };
  } catch (error) {
    LogService.error('Error in satellite valuation', { error: error.message, asset_id });
    throw error;
  }
}

// Satellite integration
async getSatelliteAnalysis(asset) {
  const satelliteService = new SatelliteImageryService();

  // Get latest imagery
  const imagery = await satelliteService.getLatestImagery({
    latitude: asset.latitude || this.geocodeAddress(asset),
    longitude: asset.longitude,
    acres: asset.farm_size
  });

  // Analyze imagery for various factors
  const analysis = await satelliteService.analyzeImagery(imagery, {
    ndvi: true, // Vegetation health
    soil_moisture: true,
    flood_risk: true,
    crop_classification: true
  });

  return {
    capture_date: imagery.capture_date,
    ndvi_score: analysis.ndvi,
    crop_health: analysis.crop_health,
    flood_risk: analysis.flood_risk,
    estimated_yield: analysis.estimated_yield
  };
}
```

### 3. Satellite Service Integration

```javascript
// server/services/satelliteImageryService.js
class SatelliteImageryService {
  constructor() {
    this.providers = {
      eos: new EOSDataService(process.env.EOS_API_KEY),
      satsure: new SatSureService(process.env.SATSURE_API_KEY),
    };
  }

  async getLatestImagery(location) {
    try {
      // Try primary provider first
      const imagery = await this.providers.eos.getImagery({
        lat: location.latitude,
        lon: location.longitude,
        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        date_to: new Date(),
        max_cloud_cover: 20,
      });

      if (!imagery || imagery.length === 0) {
        // Fallback to secondary provider
        return await this.providers.satsure.getImagery(location);
      }

      return imagery[0]; // Most recent
    } catch (error) {
      LogService.error("Satellite imagery fetch failed", error);
      throw error;
    }
  }

  async analyzeImagery(imagery, options) {
    const analysis = {};

    if (options.ndvi) {
      analysis.ndvi = await this.calculateNDVI(imagery);
      analysis.crop_health = this.interpretNDVI(analysis.ndvi);
    }

    if (options.soil_moisture) {
      analysis.soil_moisture = await this.analyzeSoilMoisture(imagery);
    }

    if (options.flood_risk) {
      analysis.flood_risk = await this.assessFloodRisk(imagery);
    }

    return analysis;
  }

  calculateNDVI(imagery) {
    // NDVI = (NIR - Red) / (NIR + Red)
    // Returns value between -1 and 1
    const nir = imagery.bands.nir;
    const red = imagery.bands.red;
    return (nir - red) / (nir + red);
  }

  interpretNDVI(ndvi) {
    if (ndvi > 0.6) return "EXCELLENT";
    if (ndvi > 0.4) return "GOOD";
    if (ndvi > 0.2) return "MODERATE";
    return "POOR";
  }
}
```

### 4. Registry Integration

```javascript
// server/services/mcpFunctionRegistry.js
collateralLandValuator: MCPServiceWithLogging.createFunction('collateralLandValuator', async (args) => {
  const { asset_id, valuation_date, include_satellite } = args;

  if (!asset_id) {
    throw new Error('Asset ID is required');
  }

  try {
    LogService.info(`Running satellite valuation for asset: ${asset_id}`);
    return await mcpDatabaseService.valuateCollateralWithSatellite(
      asset_id,
      valuation_date,
      include_satellite !== false
    );
  } catch (error) {
    LogService.error(`Error in collateral valuation: ${error.message}`);
    throw error;
  }
}),

// Schema
collateralLandValuator: {
  name: 'collateralLandValuator',
  description: 'Real-time collateral valuation using satellite imagery, IoT sensors, and market data',
  parameters: {
    type: 'object',
    properties: {
      asset_id: {
        type: 'string',
        description: 'ID of the collateral asset to value'
      },
      valuation_date: {
        type: 'string',
        format: 'date',
        description: 'Date for valuation (default: current date)'
      },
      include_satellite: {
        type: 'boolean',
        description: 'Include satellite imagery analysis (default: true)'
      }
    },
    required: ['asset_id']
  }
}
```

### 5. Performance & Caching

```javascript
// Implement smart caching for satellite data
class ValuationCache {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 86400 }); // 24-hour cache for satellite data
    this.marketCache = new NodeCache({ stdTTL: 3600 }); // 1-hour for market data
  }

  async getCachedSatelliteData(location, maxAge = 7) {
    const key = `sat_${location.latitude}_${location.longitude}`;
    const cached = this.cache.get(key);

    if (
      cached &&
      Date.now() - cached.timestamp < maxAge * 24 * 60 * 60 * 1000
    ) {
      return cached.data;
    }

    return null;
  }
}
```

### 6. Testing Requirements

```javascript
describe("Collateral Land Valuator", () => {
  it("should value farmland with satellite data", async () => {
    const result = await mcpFunctionRegistry.executeFunction(
      "collateralLandValuator",
      {
        asset_id: "C001",
        include_satellite: true,
      }
    );

    expect(result).toHaveProperty("current_valuation");
    expect(result).toHaveProperty("ltv_ratio");
    expect(result).toHaveProperty("factors");
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("should handle weather impact on valuation", async () => {
    // Mock severe weather event
    const preStorm = await mcpFunctionRegistry.executeFunction(
      "collateralLandValuator",
      {
        asset_id: "C002",
        valuation_date: "2024-01-01",
      }
    );

    const postStorm = await mcpFunctionRegistry.executeFunction(
      "collateralLandValuator",
      {
        asset_id: "C002",
        valuation_date: "2024-01-15",
      }
    );

    expect(postStorm.current_valuation).toBeLessThan(
      preStorm.current_valuation
    );
  });
});
```

## Implementation Checklist

- [ ] Database schema creation
- [ ] Satellite service integration (EOS Data)
- [ ] Market comparables API integration
- [ ] Implement valuation algorithms
- [ ] Add caching layer
- [ ] Create visualization dashboard
- [ ] Performance testing
- [ ] Accuracy validation
- [ ] Compliance documentation

## Additional Requirements

### External Integrations

- EOS Data API for satellite imagery
- SatSure as backup provider
- USDA market data for comparables
- Weather data integration

### Dashboard Requirements

- Real-time valuation slider
- Satellite imagery viewer
- Historical valuation trends
- Risk heat maps

### Compliance

- Transparent valuation methodology
- Audit trail for all valuations
- Regular accuracy assessments
- Third-party validation process
