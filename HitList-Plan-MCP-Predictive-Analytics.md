# Predictive Analytics MCP Implementation Plan

## Part 1: Overview and Current State Analysis

### 1.1 Introduction

This document outlines the implementation plan for adding three Predictive Analytics functions to the LoanOfficerAI-MCP-POC application:

1. **Crop Yield Risk** - Assessing the risk to crop yields based on agricultural and environmental factors
2. **Market Price Impact** - Evaluating how market price changes affect loan portfolios and borrower viability
3. **Loan Restructuring** - Providing recommendations for loan restructuring based on borrower data and market conditions

These functions will follow the same MCP implementation pattern as the existing functions for Basic Loan Information and Risk Assessment that are already working successfully.

### 1.2 Current MCP Architecture

The current implementation uses a hybrid approach:

1. **Client-side Components:**

   - `Chatbot.js` - Implements OpenAI function calling with defined MCP function schemas
   - `mcpClient.js` - Client-side wrapper for MCP functions that communicates with the server

2. **Server-side Components:**
   - `mcpFunctionRegistry.js` - Registry of MCP functions with implementations
   - `mcpServiceWithLogging.js` - Wrapper that adds logging and error handling to MCP functions
   - API routes in various files (e.g., `risk.js`, `loans.js`)
   - Data access through `dataService.js`

### 1.3 Function Requirements

#### 1.3.1 Crop Yield Risk Function

**Purpose:** Assess the risk to crop yields for a specific borrower or loan.

**Inputs:**

- Borrower ID or Loan ID
- Crop type (optional)
- Season/year (optional)

**Expected Output:**

```json
{
  "borrower_id": "B001",
  "borrower_name": "John Doe",
  "crop_type": "corn",
  "yield_risk_score": 65,
  "risk_level": "medium",
  "risk_factors": [
    "Historical drought patterns",
    "Insect pressure in region",
    "Below average rainfall forecast"
  ],
  "yield_impact_percent": "-15%",
  "recommendations": [
    "Consider crop insurance adjustment",
    "Evaluate irrigation options"
  ]
}
```

#### 1.3.2 Market Price Impact Function

**Purpose:** Evaluate how market price changes affect loan viability.

**Inputs:**

- Commodity type (e.g., "corn", "wheat", "livestock")
- Price change percentage (optional, default: current market projections)

**Expected Output:**

```json
{
  "commodity": "corn",
  "price_change_percent": "-10%",
  "affected_loans_count": 3,
  "affected_loans": [
    {
      "loan_id": "L001",
      "borrower_name": "John Doe",
      "impact_level": "high",
      "revenue_impact": "-$45,000",
      "debt_coverage_ratio": "0.85"
    }
  ],
  "portfolio_impact_summary": "A 10% decrease in corn prices would significantly affect 3 loans with a total portfolio impact of $120,000",
  "recommendations": [
    "Review hedging strategies with affected borrowers",
    "Consider loan restructuring for severely impacted borrowers"
  ]
}
```

#### 1.3.3 Loan Restructuring Function

**Purpose:** Provide recommendations for restructuring a loan.

**Inputs:**

- Loan ID
- Restructuring goal (optional, e.g., "reduce_payments", "extend_term", "address_hardship")

**Expected Output:**

```json
{
  "loan_id": "L001",
  "borrower_name": "John Doe",
  "current_structure": {
    "principal": 250000,
    "rate": "5.75%",
    "term_remaining": 84,
    "monthly_payment": 3500
  },
  "restructuring_options": [
    {
      "option_name": "Term extension",
      "new_term": 120,
      "new_payment": 2800,
      "payment_reduction": "20%",
      "pros": ["Immediate payment relief", "No change in interest rate"],
      "cons": ["Longer payoff period", "More interest paid overall"]
    },
    {
      "option_name": "Rate reduction",
      "new_rate": "4.75%",
      "new_payment": 3100,
      "payment_reduction": "11.4%",
      "pros": ["Lower total interest", "Moderate payment relief"],
      "cons": ["May require additional collateral", "Subject to approval"]
    }
  ],
  "recommendation": "Term extension option provides the most significant payment relief and is recommended based on borrower's cash flow constraints."
}
```

### 1.4 Current Gaps

1. **Missing OpenAI Function Definitions:** The Predictive Analytics functions are not defined in the MCP_FUNCTIONS array in Chatbot.js.

2. **Missing Client Implementation:** The mcpClient.js file does not contain methods for the Predictive Analytics functions.

3. **Missing Server Implementation:** The server does not have endpoints or MCP function implementations for these features.

4. **Missing Data Models:** The simulated data layers need to be extended to support these advanced analytics functions.

In the next sections, we will detail the implementation required for each component.

## Part 2: Client-Side Implementation

### 2.1 Chatbot.js Updates

We need to add the three new Predictive Analytics functions to the `MCP_FUNCTIONS` array in `client/src/components/Chatbot.js`:

```javascript
// Add these new function definitions to the MCP_FUNCTIONS array in Chatbot.js

// Crop Yield Risk Function
{
  name: "assessCropYieldRisk",
  description: "Evaluate agricultural risk factors affecting crop yields for a specific borrower, including weather patterns, pest risks, and forecasted yields. Returns risk assessment and mitigation recommendations.",
  parameters: {
    type: "object",
    properties: {
      borrower_id: {
        type: "string",
        description: "The ID of the borrower whose crop yield risk to assess"
      },
      crop_type: {
        type: "string",
        description: "Optional: The specific crop type to evaluate (e.g., corn, wheat, soybeans)",
      },
      season: {
        type: "string",
        description: "Optional: The growing season to evaluate (e.g., '2025', 'current')"
      }
    },
    required: ["borrower_id"]
  }
},

// Market Price Impact Function
{
  name: "analyzeMarketPriceImpact",
  description: "Analyze how changes in agricultural commodity prices would impact loans and borrowers. Identifies vulnerable loans and quantifies potential financial impacts.",
  parameters: {
    type: "object",
    properties: {
      commodity: {
        type: "string",
        description: "The agricultural commodity to analyze (e.g., corn, wheat, livestock)"
      },
      price_change_percent: {
        type: "string",
        description: "Optional: The percentage price change to analyze (e.g., '-10%', '+15%'). If not provided, current market projections will be used."
      }
    },
    required: ["commodity"]
  }
},

// Loan Restructuring Function
{
  name: "recommendLoanRestructuring",
  description: "Generate loan restructuring options for a specific loan based on borrower financial situation, market conditions, and loan performance. Provides various restructuring scenarios with pros and cons.",
  parameters: {
    type: "object",
    properties: {
      loan_id: {
        type: "string",
        description: "The ID of the loan to generate restructuring recommendations for"
      },
      restructuring_goal: {
        type: "string",
        description: "Optional: The primary goal of restructuring (e.g., 'reduce_payments', 'extend_term', 'address_hardship')"
      }
    },
    required: ["loan_id"]
  }
}
```

### 2.2 Update processFunctionCall Method

Next, we need to update the `processFunctionCall` method in `Chatbot.js` to handle our new functions:

```javascript
// Add these cases to the switch statement in processFunctionCall method

case 'assessCropYieldRisk':
  console.log(`Assessing crop yield risk for borrower ${args.borrower_id}, crop: ${args.crop_type || 'all crops'}`);
  result = await mcpClient.assessCropYieldRisk(
    args.borrower_id,
    args.crop_type || null,
    args.season || 'current'
  );
  console.log('Crop yield risk assessment result:', result);
  break;

case 'analyzeMarketPriceImpact':
  console.log(`Analyzing market price impact for ${args.commodity}, change: ${args.price_change_percent || 'current projections'}`);
  result = await mcpClient.analyzeMarketPriceImpact(
    args.commodity,
    args.price_change_percent || null
  );
  console.log('Market price impact analysis result:', result);
  break;

case 'recommendLoanRestructuring':
  console.log(`Generating loan restructuring recommendations for loan ${args.loan_id}, goal: ${args.restructuring_goal || 'general'}`);
  result = await mcpClient.recommendLoanRestructuring(
    args.loan_id,
    args.restructuring_goal || null
  );
  console.log('Loan restructuring recommendations:', result);
  break;
```

### 2.3 Client.js Implementation

Add the corresponding MCP client methods to `client/src/mcp/client.js`:

```javascript
// Add these methods to the mcpClient object in client.js

/**
 * Assess the risk to crop yields for a specific borrower
 * @param {string} borrowerId - The ID of the borrower to assess
 * @param {string|null} cropType - Optional crop type to focus on
 * @param {string} season - The growing season to evaluate
 * @returns {Promise<Object>} - Crop yield risk assessment data
 */
async assessCropYieldRisk(borrowerId, cropType = null, season = 'current') {
  return this.retryRequestWithRefresh(async function(borrowerId, cropType, season) {
    try {
      console.log(`Assessing crop yield risk for borrower ${borrowerId}, crop: ${cropType || 'all crops'}, season: ${season}`);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (cropType) queryParams.append('crop_type', cropType);
      if (season) queryParams.append('season', season);

      const response = await axios.get(
        `${this.baseURL}/analytics/crop-yield-risk/${borrowerId}?${queryParams.toString()}`,
        this.getConfig()
      );

      console.log('Crop yield risk assessment result:', response.data);
      return response.data;
    } catch (error) {
      const processedError = this.handleApiError(error, 'assessCropYieldRisk');

      // If an auth error that needs token refresh, the calling function will handle it
      if (processedError.tokenExpired) throw processedError;

      // Otherwise return graceful fallback
      return {
        borrower_id: borrowerId,
        error: true,
        message: `Unable to assess crop yield risk: ${error.message}`,
        risk_level: "unknown",
        risk_factors: ["Assessment unavailable due to data limitations or connectivity issues"],
        recommendations: ["Contact agricultural specialist for manual assessment"]
      };
    }
  }, borrowerId, cropType, season);
},

/**
 * Analyze impact of market price changes on loan portfolio
 * @param {string} commodity - The commodity to analyze
 * @param {string|null} priceChangePercent - Optional price change percentage
 * @returns {Promise<Object>} - Market price impact analysis
 */
async analyzeMarketPriceImpact(commodity, priceChangePercent = null) {
  return this.retryRequestWithRefresh(async function(commodity, priceChangePercent) {
    try {
      console.log(`Analyzing market price impact for ${commodity}, change: ${priceChangePercent || 'current projections'}`);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (priceChangePercent) queryParams.append('price_change_percent', priceChangePercent);

      const response = await axios.get(
        `${this.baseURL}/analytics/market-price-impact/${commodity}?${queryParams.toString()}`,
        this.getConfig()
      );

      console.log('Market price impact analysis result:', response.data);
      return response.data;
    } catch (error) {
      const processedError = this.handleApiError(error, 'analyzeMarketPriceImpact');

      // If an auth error that needs token refresh, the calling function will handle it
      if (processedError.tokenExpired) throw processedError;

      // Otherwise return graceful fallback
      return {
        commodity: commodity,
        error: true,
        message: `Unable to analyze market price impact: ${error.message}`,
        affected_loans_count: 0,
        affected_loans: [],
        portfolio_impact_summary: "Analysis unavailable due to data limitations or connectivity issues"
      };
    }
  }, commodity, priceChangePercent);
},

/**
 * Generate loan restructuring recommendations
 * @param {string} loanId - The ID of the loan to restructure
 * @param {string|null} restructuringGoal - Optional primary goal for restructuring
 * @returns {Promise<Object>} - Loan restructuring options and recommendations
 */
async recommendLoanRestructuring(loanId, restructuringGoal = null) {
  return this.retryRequestWithRefresh(async function(loanId, restructuringGoal) {
    try {
      console.log(`Generating loan restructuring recommendations for loan ${loanId}, goal: ${restructuringGoal || 'general'}`);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (restructuringGoal) queryParams.append('goal', restructuringGoal);

      const response = await axios.get(
        `${this.baseURL}/analytics/loan-restructuring/${loanId}?${queryParams.toString()}`,
        this.getConfig()
      );

      console.log('Loan restructuring recommendations:', response.data);
      return response.data;
    } catch (error) {
      const processedError = this.handleApiError(error, 'recommendLoanRestructuring');

      // If an auth error that needs token refresh, the calling function will handle it
      if (processedError.tokenExpired) throw processedError;

      // Otherwise return graceful fallback
      return {
        loan_id: loanId,
        error: true,
        message: `Unable to generate loan restructuring recommendations: ${error.message}`,
        current_structure: {},
        restructuring_options: [],
        recommendation: "Unable to generate recommendations due to data limitations or connectivity issues"
      };
    }
  }, loanId, restructuringGoal);
}
```

## Part 3: Server-Side Implementation

### 3.1 MCP Function Registry Updates

We need to register the new MCP functions in `server/services/mcpFunctionRegistry.js`:

```javascript
// Add these MCP functions to the registry in mcpFunctionRegistry.js

// Crop Yield Risk Function
assessCropYieldRisk: MCPServiceWithLogging.createFunction(
  "assessCropYieldRisk",
  async (args) => {
    const { borrower_id, crop_type, season } = args;

    if (!borrower_id) {
      throw new Error("Borrower ID is required");
    }

    try {
      // Build query parameters
      let endpoint = `/api/analytics/crop-yield-risk/${borrower_id}`;
      const queryParams = [];

      if (crop_type) queryParams.push(`crop_type=${encodeURIComponent(crop_type)}`);
      if (season) queryParams.push(`season=${encodeURIComponent(season)}`);

      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }

      const result = await callInternalApi(endpoint);

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      return {
        error: true,
        message: `Could not assess crop yield risk: ${error.message}`,
        borrower_id
      };
    }
  }
),

// Market Price Impact Function
analyzeMarketPriceImpact: MCPServiceWithLogging.createFunction(
  "analyzeMarketPriceImpact",
  async (args) => {
    const { commodity, price_change_percent } = args;

    if (!commodity) {
      throw new Error("Commodity is required");
    }

    try {
      // Build query parameters
      let endpoint = `/api/analytics/market-price-impact/${commodity}`;

      if (price_change_percent) {
        endpoint += `?price_change_percent=${encodeURIComponent(price_change_percent)}`;
      }

      const result = await callInternalApi(endpoint);

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      return {
        error: true,
        message: `Could not analyze market price impact: ${error.message}`,
        commodity
      };
    }
  }
),

// Loan Restructuring Function
recommendLoanRestructuring: MCPServiceWithLogging.createFunction(
  "recommendLoanRestructuring",
  async (args) => {
    const { loan_id, restructuring_goal } = args;

    if (!loan_id) {
      throw new Error("Loan ID is required");
    }

    try {
      // Build query parameters
      let endpoint = `/api/analytics/loan-restructuring/${loan_id}`;

      if (restructuring_goal) {
        endpoint += `?goal=${encodeURIComponent(restructuring_goal)}`;
      }

      const result = await callInternalApi(endpoint);

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      return {
        error: true,
        message: `Could not generate loan restructuring recommendations: ${error.message}`,
        loan_id
      };
    }
  }
)
```

### 3.2 Add Function Schemas

We also need to add schema definitions for these functions in the `functionSchemas` object:

```javascript
// Add these to the functionSchemas object in mcpFunctionRegistry.js

assessCropYieldRisk: {
  name: "assessCropYieldRisk",
  description: "Evaluate agricultural risk factors affecting crop yields for a specific borrower, including weather patterns, pest risks, and forecasted yields. Returns risk assessment and mitigation recommendations.",
  parameters: {
    type: "object",
    properties: {
      borrower_id: {
        type: "string",
        description: "The ID of the borrower whose crop yield risk to assess"
      },
      crop_type: {
        type: "string",
        description: "Optional: The specific crop type to evaluate (e.g., corn, wheat, soybeans)",
      },
      season: {
        type: "string",
        description: "Optional: The growing season to evaluate (e.g., '2025', 'current')"
      }
    },
    required: ["borrower_id"]
  }
},

analyzeMarketPriceImpact: {
  name: "analyzeMarketPriceImpact",
  description: "Analyze how changes in agricultural commodity prices would impact loans and borrowers. Identifies vulnerable loans and quantifies potential financial impacts.",
  parameters: {
    type: "object",
    properties: {
      commodity: {
        type: "string",
        description: "The agricultural commodity to analyze (e.g., corn, wheat, livestock)"
      },
      price_change_percent: {
        type: "string",
        description: "Optional: The percentage price change to analyze (e.g., '-10%', '+15%'). If not provided, current market projections will be used."
      }
    },
    required: ["commodity"]
  }
},

recommendLoanRestructuring: {
  name: "recommendLoanRestructuring",
  description: "Generate loan restructuring options for a specific loan based on borrower financial situation, market conditions, and loan performance. Provides various restructuring scenarios with pros and cons.",
  parameters: {
    type: "object",
    properties: {
      loan_id: {
        type: "string",
        description: "The ID of the loan to generate restructuring recommendations for"
      },
      restructuring_goal: {
        type: "string",
        description: "Optional: The primary goal of restructuring (e.g., 'reduce_payments', 'extend_term', 'address_hardship')"
      }
    },
    required: ["loan_id"]
  }
}
```

### 3.3 Create Analytics Routes

Create a new file `server/routes/analytics.js` to handle our predictive analytics routes:

```javascript
// server/routes/analytics.js
const express = require("express");
const router = express.Router();
const dataService = require("../services/dataService");
const LogService = require("../services/logService");

/**
 * Assess crop yield risk for a specific borrower
 */
router.get("/crop-yield-risk/:borrower_id", (req, res) => {
  try {
    const borrowerId = req.params.borrower_id.toUpperCase();
    const cropType = req.query.crop_type || null;
    const season = req.query.season || "current";

    LogService.info(`Assessing crop yield risk for borrower ${borrowerId}`, {
      crop_type: cropType,
      season: season,
    });

    // Load required data
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    const loans = dataService.loadData(dataService.paths.loans);

    // Find the borrower
    const borrower = borrowers.find((b) => b.borrower_id === borrowerId);
    if (!borrower) {
      return res.status(404).json({
        error: "Borrower not found",
        borrower_id: borrowerId,
      });
    }

    // Determine crops grown by borrower (simulated data)
    const farmerCrops = {
      B001: { crops: ["corn", "soybeans"], region: "midwest" },
      B002: { crops: ["wheat", "barley"], region: "plains" },
      B003: { crops: ["cotton", "peanuts"], region: "southeast" },
      B004: { crops: ["rice", "sugarcane"], region: "south" },
      B005: { crops: ["potatoes", "onions"], region: "northwest" },
    };

    // If we don't have specific crop data for this borrower, create some
    if (!farmerCrops[borrowerId]) {
      farmerCrops[borrowerId] = { crops: ["corn"], region: "midwest" };
    }

    // Target specific crop if provided, otherwise use primary crop
    const targetCrop =
      cropType && farmerCrops[borrowerId].crops.includes(cropType)
        ? cropType
        : farmerCrops[borrowerId].crops[0];

    // Simulate crop risk factors by region and crop
    const cropRiskFactors = {
      midwest: {
        corn: [
          "Drought susceptibility",
          "Early frost risk",
          "Corn rootworm pressure",
        ],
        soybeans: [
          "Soybean cyst nematode",
          "White mold risk",
          "Herbicide resistance",
        ],
      },
      plains: {
        wheat: [
          "Drought conditions",
          "Wheat streak mosaic virus",
          "Stem rust risk",
        ],
        barley: [
          "Fusarium head blight",
          "Low winter snowpack",
          "Barley yellow dwarf virus",
        ],
      },
      southeast: {
        cotton: [
          "Boll weevil pressure",
          "Hurricane risk",
          "Irregular rainfall patterns",
        ],
        peanuts: [
          "Late leaf spot",
          "White mold",
          "Aflatoxin risk due to drought",
        ],
      },
      south: {
        rice: [
          "Blast disease pressure",
          "Water availability concerns",
          "Heat stress during flowering",
        ],
        sugarcane: [
          "Borer infestations",
          "Flood risk",
          "Freeze damage to ratoon crop",
        ],
      },
      northwest: {
        potatoes: [
          "Late blight pressure",
          "Colorado potato beetle",
          "Early frost risk",
        ],
        onions: ["Pink root", "Thrips pressure", "Water restrictions"],
      },
    };

    // Get risk factors for the farmer's region and crop
    const region = farmerCrops[borrowerId].region;
    const riskFactors = cropRiskFactors[region][targetCrop] || [
      "Weather variability",
      "Pest pressure",
      "Market volatility",
    ];

    // Generate synthetic risk score (50-85 range)
    const riskScore = Math.floor(Math.random() * 35) + 50;

    // Determine risk level based on score
    let riskLevel = "medium";
    if (riskScore < 60) riskLevel = "low";
    else if (riskScore > 75) riskLevel = "high";

    // Generate yield impact based on risk score
    const yieldImpactPercent = `${-(riskScore - 50) / 2}%`;

    // Generate appropriate recommendations based on risk factors
    const recommendations = [];

    if (
      riskFactors.some(
        (f) =>
          f.toLowerCase().includes("drought") ||
          f.toLowerCase().includes("water")
      )
    ) {
      recommendations.push(
        "Review irrigation infrastructure and water availability"
      );
    }

    if (
      riskFactors.some(
        (f) =>
          f.toLowerCase().includes("pest") ||
          f.toLowerCase().includes("beetle") ||
          f.toLowerCase().includes("weevil")
      )
    ) {
      recommendations.push("Consider adjusting pest management program");
    }

    if (
      riskFactors.some(
        (f) =>
          f.toLowerCase().includes("disease") ||
          f.toLowerCase().includes("blight") ||
          f.toLowerCase().includes("rust")
      )
    ) {
      recommendations.push(
        "Implement disease resistant varieties if available"
      );
    }

    if (riskScore > 70) {
      recommendations.push("Evaluate crop insurance coverage levels");
    }

    // Ensure we have at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push(
        "Monitor field conditions closely throughout the season"
      );
    }

    // Construct response object
    const cropYieldRiskAssessment = {
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      crop_type: targetCrop,
      yield_risk_score: riskScore,
      risk_level: riskLevel,
      risk_factors: riskFactors,
      yield_impact_percent: yieldImpactPercent,
      recommendations: recommendations,
      assessment_date: new Date().toISOString().split("T")[0],
      region: region,
    };

    LogService.info(
      `Completed crop yield risk assessment for borrower ${borrowerId}`,
      {
        result: { risk_level: riskLevel, risk_score: riskScore },
      }
    );

    res.json(cropYieldRiskAssessment);
  } catch (error) {
    LogService.error(`Error in crop yield risk assessment: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({
      error: "Failed to assess crop yield risk",
      details: error.message,
    });
  }
});

/**
 * Analyze market price impact on loans
 */
router.get("/market-price-impact/:commodity", (req, res) => {
  try {
    const commodity = req.params.commodity.toLowerCase();
    const priceChangePercent = req.query.price_change_percent || null;

    LogService.info(`Analyzing market price impact for ${commodity}`, {
      price_change_percent: priceChangePercent,
    });

    // Load required data
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    const loans = dataService.loadData(dataService.paths.loans);

    // Validate commodity
    const validCommodities = [
      "corn",
      "wheat",
      "soybeans",
      "cotton",
      "rice",
      "livestock",
      "dairy",
    ];
    if (!validCommodities.includes(commodity)) {
      return res.status(400).json({
        error: "Invalid commodity specified",
        valid_commodities: validCommodities,
      });
    }

    // Parse price change percentage or use default
    let priceChange = -10; // Default to 10% decrease
    if (priceChangePercent) {
      const match = priceChangePercent.match(/([+-]?\d+)%/);
      if (match) {
        priceChange = parseInt(match[1]);
      }
    }

    // Simulate commodity dependence for borrowers (which borrowers are affected by this commodity)
    const commodityDependence = {
      corn: ["B001", "B004"],
      wheat: ["B002", "B005"],
      soybeans: ["B001", "B003"],
      cotton: ["B003"],
      rice: ["B004"],
      livestock: ["B002", "B005"],
      dairy: ["B001", "B005"],
    };

    // Get affected borrowers
    const affectedBorrowerIds = commodityDependence[commodity] || [];

    // Get loans for affected borrowers
    const affectedLoans = loans.filter((loan) =>
      affectedBorrowerIds.includes(loan.borrower_id)
    );

    // Calculate impact for each affected loan
    const affectedLoanDetails = affectedLoans.map((loan) => {
      const borrower = borrowers.find(
        (b) => b.borrower_id === loan.borrower_id
      );

      // Calculate simulated revenue impact (proportional to loan amount and price change)
      const revenueImpact = (
        loan.loan_amount *
        Math.abs(priceChange) *
        0.01 *
        0.15
      ).toFixed(0);

      // Calculate debt coverage ratio (simplified simulation)
      const baseCoverageRatio = 1.2; // Starting with healthy ratio
      const adjustedRatio = (baseCoverageRatio + priceChange * 0.005).toFixed(
        2
      );

      // Determine impact level
      let impactLevel = "low";
      if (adjustedRatio < 1.0) impactLevel = "high";
      else if (adjustedRatio < 1.1) impactLevel = "medium";

      return {
        loan_id: loan.loan_id,
        borrower_id: loan.borrower_id,
        borrower_name: borrower
          ? `${borrower.first_name} ${borrower.last_name}`
          : "Unknown Borrower",
        loan_amount: loan.loan_amount,
        impact_level: impactLevel,
        revenue_impact:
          priceChange < 0 ? `-$${revenueImpact}` : `+$${revenueImpact}`,
        debt_coverage_ratio: adjustedRatio,
      };
    });

    // Calculate total portfolio impact
    const totalImpact = affectedLoanDetails.reduce((sum, loan) => {
      // Extract numeric value from revenue impact string
      const impact = parseInt(loan.revenue_impact.replace(/[^0-9]/g, ""));
      return sum + impact;
    }, 0);

    // Generate summary text
    const direction = priceChange < 0 ? "decrease" : "increase";
    let severityText = "minimally affect";
    if (affectedLoanDetails.some((l) => l.impact_level === "high")) {
      severityText = "significantly affect";
    } else if (affectedLoanDetails.some((l) => l.impact_level === "medium")) {
      severityText = "moderately affect";
    }

    const portfolioImpactSummary = `A ${Math.abs(
      priceChange
    )}% ${direction} in ${commodity} prices would ${severityText} ${
      affectedLoanDetails.length
    } loans with a total portfolio impact of $${totalImpact.toLocaleString()}`;

    // Generate appropriate recommendations
    const recommendations = [];

    if (priceChange < 0) {
      recommendations.push("Review hedging strategies with affected borrowers");

      if (affectedLoanDetails.some((l) => l.impact_level === "high")) {
        recommendations.push(
          "Consider loan restructuring for severely impacted borrowers"
        );
        recommendations.push(
          "Schedule risk management discussions with high-impact borrowers"
        );
      }
    } else {
      recommendations.push(
        "Evaluate opportunities for accelerated loan repayment"
      );
      recommendations.push("Consider capital improvement loans for expansion");
    }

    // Construct response object
    const marketPriceImpactAnalysis = {
      commodity: commodity,
      price_change_percent: `${priceChange > 0 ? "+" : ""}${priceChange}%`,
      affected_loans_count: affectedLoanDetails.length,
      affected_loans: affectedLoanDetails,
      portfolio_impact_summary: portfolioImpactSummary,
      total_portfolio_impact: `${
        priceChange < 0 ? "-" : "+"
      }$${totalImpact.toLocaleString()}`,
      recommendations: recommendations,
      analysis_date: new Date().toISOString().split("T")[0],
    };

    LogService.info(`Completed market price impact analysis for ${commodity}`, {
      result: {
        affected_loans: affectedLoanDetails.length,
        price_change: priceChange,
      },
    });

    res.json(marketPriceImpactAnalysis);
  } catch (error) {
    LogService.error(
      `Error in market price impact analysis: ${error.message}`,
      { stack: error.stack }
    );
    res.status(500).json({
      error: "Failed to analyze market price impact",
      details: error.message,
    });
  }
});

/**
 * Generate loan restructuring recommendations
 */
router.get("/loan-restructuring/:loan_id", (req, res) => {
  try {
    const loanId = req.params.loan_id.toUpperCase();
    const restructuringGoal = req.query.goal || null;

    LogService.info(
      `Generating loan restructuring recommendations for loan ${loanId}`,
      {
        restructuring_goal: restructuringGoal,
      }
    );

    // Load required data
    const loans = dataService.loadData(dataService.paths.loans);
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    const payments = dataService.loadData(dataService.paths.payments);

    // Find the loan
    const loan = loans.find((l) => l.loan_id === loanId);
    if (!loan) {
      return res.status(404).json({
        error: "Loan not found",
        loan_id: loanId,
      });
    }

    // Find the borrower
    const borrower = borrowers.find((b) => b.borrower_id === loan.borrower_id);
    if (!borrower) {
      return res.status(404).json({
        error: "Borrower not found for this loan",
        loan_id: loanId,
        borrower_id: loan.borrower_id,
      });
    }

    // Get payment history for this loan
    const loanPayments = payments.filter((p) => p.loan_id === loanId);

    // Calculate current loan structure
    // For demonstration, we'll simulate this data
    const principal = loan.loan_amount;
    const originalTerm = 120; // 10 years in months
    const elapsedTime = loanPayments.length;
    const termRemaining = originalTerm - elapsedTime;
    const currentRate = parseFloat(loan.interest_rate);

    // Calculate simple monthly payment (P * r * (1+r)^n) / ((1+r)^n - 1)
    const monthlyRate = currentRate / 100 / 12;
    const monthlyPayment = Math.round(
      (principal * monthlyRate * Math.pow(1 + monthlyRate, originalTerm)) /
        (Math.pow(1 + monthlyRate, originalTerm) - 1)
    );

    // Current loan structure
    const currentStructure = {
      principal: principal,
      rate: `${currentRate}%`,
      term_remaining: termRemaining,
      monthly_payment: monthlyPayment,
      original_term: originalTerm,
    };

    // Generate restructuring options based on goal
    const restructuringOptions = [];

    // Option 1: Term extension
    const extendedTerm = termRemaining + 36; // Add 3 years
    const extendedPayment = Math.round(
      (principal * monthlyRate * Math.pow(1 + monthlyRate, extendedTerm)) /
        (Math.pow(1 + monthlyRate, extendedTerm) - 1)
    );
    const extendedPaymentReduction = Math.round(
      (1 - extendedPayment / monthlyPayment) * 100
    );

    restructuringOptions.push({
      option_name: "Term extension",
      new_term: extendedTerm,
      new_payment: extendedPayment,
      payment_reduction: `${extendedPaymentReduction}%`,
      pros: ["Immediate payment relief", "No change in interest rate"],
      cons: ["Longer payoff period", "More interest paid overall"],
    });

    // Option 2: Rate reduction
    const reducedRate = Math.max(currentRate - 1.0, 3.0); // Reduce by 1% but minimum 3%
    const reducedMonthlyRate = reducedRate / 100 / 12;
    const reducedPayment = Math.round(
      (principal *
        reducedMonthlyRate *
        Math.pow(1 + reducedMonthlyRate, termRemaining)) /
        (Math.pow(1 + reducedMonthlyRate, termRemaining) - 1)
    );
    const reducedPaymentReduction = Math.round(
      (1 - reducedPayment / monthlyPayment) * 100
    );

    restructuringOptions.push({
      option_name: "Rate reduction",
      new_rate: `${reducedRate}%`,
      new_term: termRemaining,
      new_payment: reducedPayment,
      payment_reduction: `${reducedPaymentReduction}%`,
      pros: ["Lower total interest", "Moderate payment relief"],
      cons: ["May require additional collateral", "Subject to approval"],
    });

    // Option 3: Combined approach (if significant hardship)
    if (restructuringGoal === "address_hardship") {
      const combinedTerm = termRemaining + 24; // Add 2 years
      const combinedRate = Math.max(currentRate - 0.5, 3.5); // Reduce by 0.5% but minimum 3.5%
      const combinedMonthlyRate = combinedRate / 100 / 12;
      const combinedPayment = Math.round(
        (principal *
          combinedMonthlyRate *
          Math.pow(1 + combinedMonthlyRate, combinedTerm)) /
          (Math.pow(1 + combinedMonthlyRate, combinedTerm) - 1)
      );
      const combinedPaymentReduction = Math.round(
        (1 - combinedPayment / monthlyPayment) * 100
      );

      restructuringOptions.push({
        option_name: "Hardship modification",
        new_rate: `${combinedRate}%`,
        new_term: combinedTerm,
        new_payment: combinedPayment,
        payment_reduction: `${combinedPaymentReduction}%`,
        pros: ["Significant payment relief", "Addresses financial hardship"],
        cons: [
          "Requires financial hardship documentation",
          "May affect credit reporting",
        ],
      });
    }

    // Determine recommendation based on goal or payment history
    let recommendation;

    if (restructuringGoal === "reduce_payments") {
      if (extendedPaymentReduction > reducedPaymentReduction) {
        recommendation =
          "Term extension option provides the most significant payment relief.";
      } else {
        recommendation =
          "Rate reduction option provides the best balance of payment relief and total interest paid.";
      }
    } else if (restructuringGoal === "extend_term") {
      recommendation =
        "Term extension option aligns with the requested goal of extending the loan term.";
    } else if (
      restructuringGoal === "address_hardship" &&
      restructuringOptions.length > 2
    ) {
      recommendation =
        "The hardship modification option provides comprehensive relief for financial difficulty situations.";
    } else {
      // Check payment history for guidance
      const latePayments = loanPayments.filter(
        (p) => p.status === "Late"
      ).length;

      if (latePayments > 2) {
        recommendation =
          "Based on payment history showing multiple late payments, the term extension option provides necessary payment relief while maintaining loan viability.";
      } else {
        recommendation =
          "With a strong payment history, the rate reduction option provides the best long-term financial benefit while still lowering monthly payments.";
      }
    }

    // Construct response object
    const restructuringRecommendations = {
      loan_id: loanId,
      borrower_id: loan.borrower_id,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      current_structure: currentStructure,
      restructuring_options: restructuringOptions,
      recommendation: recommendation,
      analysis_date: new Date().toISOString().split("T")[0],
    };

    LogService.info(
      `Completed loan restructuring recommendation for loan ${loanId}`,
      {
        result: { options_count: restructuringOptions.length },
      }
    );

    res.json(restructuringRecommendations);
  } catch (error) {
    LogService.error(
      `Error in loan restructuring recommendation: ${error.message}`,
      { stack: error.stack }
    );
    res.status(500).json({
      error: "Failed to generate loan restructuring recommendations",
      details: error.message,
    });
  }
});

// Export the router
module.exports = router;
```

## Part 4: Integration and Testing

### 4.1 Server Route Registration

We need to register the new analytics routes in `server/server.js`:

```javascript
// Add this to the routes registration section in server.js
app.use("/api/analytics", require("./routes/analytics"));
```

### 4.2 Update callInternalApi Function

We need to enhance the `callInternalApi` function in the MCP service to support our new analytics endpoints:

```javascript
// Update the callInternalApi function in server/services/mcpService.js

async function callInternalApi(path) {
  // Parse the API path
  const parts = path.split("?");
  const basePath = parts[0];
  const queryParams = parts.length > 1 ? parts[1] : "";

  // Split the path into segments
  const segments = basePath.split("/").filter((s) => s !== "" && s !== "api");

  if (segments.length < 2) {
    return { error: "Invalid API path" };
  }

  const resource = segments[0];

  switch (resource) {
    // Existing cases for loan, loans, etc...

    // Add a new case for the analytics endpoints
    case "analytics": {
      // Check which analytics endpoint is being requested
      if (segments[1] === "crop-yield-risk" && segments[2]) {
        const borrowerId = segments[2];

        // Parse query parameters
        const params = new URLSearchParams(queryParams);
        const cropType = params.get("crop_type") || null;
        const season = params.get("season") || "current";

        // Call the internal implementation directly rather than making an HTTP request
        const borrowers = dataService.loadData(dataService.paths.borrowers);

        // Find the borrower
        const borrower = borrowers.find((b) => b.borrower_id === borrowerId);
        if (!borrower) {
          return { error: "Borrower not found", borrower_id: borrowerId };
        }

        // Here we'd reuse the same algorithm as the route handler
        // Since the logic is complex, we can call the route handler directly
        // or implement a shared service that both can call

        // For brevity, we'll just return a success message
        // In a production app, implement the actual logic here or create a shared service
        return {
          borrower_id: borrowerId,
          borrower_name: `${borrower.first_name} ${borrower.last_name}`,
          crop_type: cropType || "corn",
          yield_risk_score: 65,
          risk_level: "medium",
          risk_factors: [
            "Historical drought patterns",
            "Insect pressure in region",
            "Below average rainfall forecast",
          ],
          yield_impact_percent: "-15%",
          recommendations: [
            "Consider crop insurance adjustment",
            "Evaluate irrigation options",
          ],
        };
      }

      if (segments[1] === "market-price-impact" && segments[2]) {
        const commodity = segments[2];

        // Parse query parameters
        const params = new URLSearchParams(queryParams);
        const priceChangePercent = params.get("price_change_percent") || "-10%";

        // For brevity, we'll just return a success message
        // In a production app, implement the actual logic here or create a shared service
        return {
          commodity: commodity,
          price_change_percent: priceChangePercent,
          affected_loans_count: 3,
          affected_loans: [
            {
              loan_id: "L001",
              borrower_name: "John Doe",
              impact_level: "high",
              revenue_impact: "-$45,000",
              debt_coverage_ratio: "0.85",
            },
          ],
          portfolio_impact_summary: `A 10% decrease in ${commodity} prices would significantly affect 3 loans with a total portfolio impact of $120,000`,
          recommendations: [
            "Review hedging strategies with affected borrowers",
            "Consider loan restructuring for severely impacted borrowers",
          ],
        };
      }

      if (segments[1] === "loan-restructuring" && segments[2]) {
        const loanId = segments[2];

        // Parse query parameters
        const params = new URLSearchParams(queryParams);
        const restructuringGoal = params.get("goal") || null;

        // Load data
        const loans = dataService.loadData(dataService.paths.loans);
        const borrowers = dataService.loadData(dataService.paths.borrowers);

        // Find loan
        const loan = loans.find((l) => l.loan_id === loanId);
        if (!loan) {
          return { error: "Loan not found", loan_id: loanId };
        }

        // Find borrower
        const borrower = borrowers.find(
          (b) => b.borrower_id === loan.borrower_id
        );
        if (!borrower) {
          return {
            error: "Borrower not found for this loan",
            loan_id: loanId,
            borrower_id: loan.borrower_id,
          };
        }

        // For brevity, return a simplified result
        // In a production app, implement the actual logic here or create a shared service
        return {
          loan_id: loanId,
          borrower_name: `${borrower.first_name} ${borrower.last_name}`,
          current_structure: {
            principal: loan.loan_amount,
            rate: `${loan.interest_rate}%`,
            term_remaining: 84,
            monthly_payment: Math.round(
              (loan.loan_amount / 84) *
                (1 + parseFloat(loan.interest_rate) / 100)
            ),
          },
          restructuring_options: [
            {
              option_name: "Term extension",
              new_term: 120,
              new_payment: Math.round(
                (loan.loan_amount / 120) *
                  (1 + parseFloat(loan.interest_rate) / 100)
              ),
              payment_reduction: "20%",
              pros: ["Immediate payment relief", "No change in interest rate"],
              cons: ["Longer payoff period", "More interest paid overall"],
            },
            {
              option_name: "Rate reduction",
              new_rate: `${Math.max(parseFloat(loan.interest_rate) - 1, 3)}%`,
              new_payment: Math.round(
                (loan.loan_amount / 84) *
                  (1 + Math.max(parseFloat(loan.interest_rate) - 1, 3) / 100)
              ),
              payment_reduction: "10%",
              pros: ["Lower total interest", "Moderate payment relief"],
              cons: [
                "May require additional collateral",
                "Subject to approval",
              ],
            },
          ],
          recommendation:
            "Term extension option provides the most significant payment relief.",
        };
      }

      return { error: "Endpoint not implemented", path: basePath };
    }

    // Existing default case
    default:
      return { error: "Unknown resource type", resource };
  }
}
```

### 4.3 Update Data Model (Optional)

For more comprehensive analytics, we may want to update the `borrowers.json` data file to include additional agricultural information:

```javascript
// Enhance borrower data with crop information in server/data/borrowers.json
[
  {
    borrower_id: "B001",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    address: "123 Main St, Anytown, USA",
    credit_score: 720,
    // New fields for agricultural analytics
    farming_region: "midwest",
    primary_crops: ["corn", "soybeans"],
    farm_size_acres: 1200,
    years_farming: 15,
    irrigation_system: "center pivot",
    equipment_value: 750000,
  },
  // Additional borrowers...
];
```

### 4.4 Testing Plan

To test our new Predictive Analytics MCP functions, we'll execute the following tests:

#### 4.4.1 Unit Tests

Create a test file: `server/tests/unit/analytics.test.js`

```javascript
const request = require("supertest");
const app = require("../../server");
const dataService = require("../../services/dataService");

describe("Analytics API Endpoints", () => {
  // Create a JWT token for testing
  let token;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ username: "testuser", password: "testpassword" });

    token = loginResponse.body.token;
  });

  describe("Crop Yield Risk", () => {
    test("should return crop yield risk assessment for valid borrower", async () => {
      const response = await request(app)
        .get("/api/analytics/crop-yield-risk/B001")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("borrower_id", "B001");
      expect(response.body).toHaveProperty("yield_risk_score");
      expect(response.body).toHaveProperty("recommendations");
    });

    test("should return 404 for invalid borrower", async () => {
      const response = await request(app)
        .get("/api/analytics/crop-yield-risk/B999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test("should filter by crop type when specified", async () => {
      const response = await request(app)
        .get("/api/analytics/crop-yield-risk/B001?crop_type=corn")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("crop_type", "corn");
    });
  });

  describe("Market Price Impact", () => {
    test("should return market price impact analysis for valid commodity", async () => {
      const response = await request(app)
        .get("/api/analytics/market-price-impact/corn")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("commodity", "corn");
      expect(response.body).toHaveProperty("affected_loans");
      expect(response.body).toHaveProperty("portfolio_impact_summary");
    });

    test("should return 400 for invalid commodity", async () => {
      const response = await request(app)
        .get("/api/analytics/market-price-impact/invalidcommodity")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    test("should apply price change when specified", async () => {
      const response = await request(app)
        .get(
          "/api/analytics/market-price-impact/corn?price_change_percent=-20%"
        )
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("price_change_percent", "-20%");
    });
  });

  describe("Loan Restructuring", () => {
    test("should return restructuring options for valid loan", async () => {
      const response = await request(app)
        .get("/api/analytics/loan-restructuring/L001")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("loan_id", "L001");
      expect(response.body).toHaveProperty("current_structure");
      expect(response.body).toHaveProperty("restructuring_options");
      expect(response.body.restructuring_options.length).toBeGreaterThan(0);
    });

    test("should return 404 for invalid loan", async () => {
      const response = await request(app)
        .get("/api/analytics/loan-restructuring/L999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test("should customize options for hardship goal", async () => {
      const response = await request(app)
        .get("/api/analytics/loan-restructuring/L001?goal=address_hardship")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.restructuring_options.length).toBeGreaterThan(2);
      expect(
        response.body.restructuring_options.some((option) =>
          option.option_name.toLowerCase().includes("hardship")
        )
      ).toBe(true);
    });
  });
});
```

#### 4.4.2 MCP Integration Tests

Create a test file: `server/tests/unit/mcpPredictiveAnalytics.test.js`

```javascript
const mcpFunctionRegistry = require("../../services/mcpFunctionRegistry");

describe("MCP Predictive Analytics Functions", () => {
  describe("assessCropYieldRisk", () => {
    test("should return crop yield risk assessment for valid borrower", async () => {
      const result = await mcpFunctionRegistry.executeFunction(
        "assessCropYieldRisk",
        { borrower_id: "B001" }
      );

      expect(result).toHaveProperty("borrower_id", "B001");
      expect(result).toHaveProperty("yield_risk_score");
      expect(result).toHaveProperty("recommendations");
    });

    test("should throw error for missing borrower_id", async () => {
      await expect(
        mcpFunctionRegistry.executeFunction("assessCropYieldRisk", {})
      ).rejects.toThrow();
    });

    test("should handle invalid borrower gracefully", async () => {
      const result = await mcpFunctionRegistry.executeFunction(
        "assessCropYieldRisk",
        { borrower_id: "B999" }
      );

      expect(result).toHaveProperty("error", true);
    });
  });

  describe("analyzeMarketPriceImpact", () => {
    test("should return market price impact analysis for valid commodity", async () => {
      const result = await mcpFunctionRegistry.executeFunction(
        "analyzeMarketPriceImpact",
        { commodity: "corn" }
      );

      expect(result).toHaveProperty("commodity", "corn");
      expect(result).toHaveProperty("affected_loans");
      expect(result).toHaveProperty("portfolio_impact_summary");
    });

    test("should throw error for missing commodity", async () => {
      await expect(
        mcpFunctionRegistry.executeFunction("analyzeMarketPriceImpact", {})
      ).rejects.toThrow();
    });
  });

  describe("recommendLoanRestructuring", () => {
    test("should return restructuring options for valid loan", async () => {
      const result = await mcpFunctionRegistry.executeFunction(
        "recommendLoanRestructuring",
        { loan_id: "L001" }
      );

      expect(result).toHaveProperty("loan_id", "L001");
      expect(result).toHaveProperty("current_structure");
      expect(result).toHaveProperty("restructuring_options");
    });

    test("should throw error for missing loan_id", async () => {
      await expect(
        mcpFunctionRegistry.executeFunction("recommendLoanRestructuring", {})
      ).rejects.toThrow();
    });
  });
});
```

#### 4.4.3 Frontend Integration Tests

Create a test file: `client/src/tests/unit/predictiveAnalytics.test.js`

```javascript
import mcpClient from "../../mcp/client";

// Mock axios
jest.mock("axios");

describe("Predictive Analytics Client Functions", () => {
  describe("assessCropYieldRisk", () => {
    test("should call API with correct parameters", async () => {
      const mockResponse = {
        data: {
          borrower_id: "B001",
          yield_risk_score: 65,
          risk_level: "medium",
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await mcpClient.assessCropYieldRisk(
        "B001",
        "corn",
        "2025"
      );

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/analytics/crop-yield-risk/B001"),
        expect.any(Object)
      );
      expect(axios.get.mock.calls[0][0]).toContain("crop_type=corn");
      expect(axios.get.mock.calls[0][0]).toContain("season=2025");
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("analyzeMarketPriceImpact", () => {
    test("should call API with correct parameters", async () => {
      const mockResponse = {
        data: {
          commodity: "corn",
          affected_loans_count: 3,
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await mcpClient.analyzeMarketPriceImpact("corn", "-10%");

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/analytics/market-price-impact/corn"),
        expect.any(Object)
      );
      expect(axios.get.mock.calls[0][0]).toContain("price_change_percent=-10%");
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("recommendLoanRestructuring", () => {
    test("should call API with correct parameters", async () => {
      const mockResponse = {
        data: {
          loan_id: "L001",
          restructuring_options: [],
        },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await mcpClient.recommendLoanRestructuring(
        "L001",
        "reduce_payments"
      );

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/analytics/loan-restructuring/L001"),
        expect.any(Object)
      );
      expect(axios.get.mock.calls[0][0]).toContain("goal=reduce_payments");
      expect(result).toEqual(mockResponse.data);
    });
  });
});
```

#### 4.4.4 End-to-End Testing Scenarios

1. **Test Crop Yield Risk with Different Crops**

   - Test with borrower B001 and crop type "corn"
   - Test with borrower B002 and crop type "wheat"
   - Verify the risk factors change appropriately

2. **Test Market Price Impact Scenarios**

   - Test with commodity "corn" and price change "-20%"
   - Test with commodity "wheat" and price change "+15%"
   - Verify recommendations adjust based on price direction

3. **Test Loan Restructuring with Different Goals**
   - Test with loan L001 and goal "reduce_payments"
   - Test with loan L002 and goal "extend_term"
   - Test with loan L003 and goal "address_hardship"
   - Verify the recommended option matches the goal

### 4.5 Deployment Steps

1. Create new analytics.js file in server/routes directory
2. Update the mcpFunctionRegistry.js to include the new functions
3. Update server.js to register the new analytics routes
4. Update the mcpService.js file to handle the new endpoints
5. Update the Chatbot.js file to include the new functions
6. Update the client.js file with the new methods
7. Run unit and integration tests
8. Perform end-to-end testing

### 4.6 Challenges and Considerations

1. **Data Quality**: The analytics functions require high-quality data to provide meaningful insights. Consider how to handle missing or inconsistent data.

2. **Performance**: Complex analytics functions may impact performance. Consider caching strategies for frequently accessed data.

3. **Security**: Ensure that authenticated users have appropriate permissions to access sensitive analytics data.

4. **User Experience**: OpenAI function calling requires descriptive schemas. Ensure the function descriptions are detailed enough for OpenAI to make appropriate selections.

5. **Future Expansion**: The Predictive Analytics section could be expanded with additional functions like:
   - Seasonal weather impact analysis
   - Historical performance comparisons
   - Integrated external economic data sources
   - Machine learning models for more sophisticated predictions

## Part 5: Implementation Strategy and Enhancements

### 5.1 Implementation Priority

Based on the current state of the application and available resources, we recommend the following phased implementation approach:

**Phase 1 (Immediate):**

- Implement the **Loan Restructuring** function first
  - Self-contained and relies on existing loan data
  - Provides clear business value and tangible results
  - Will validate the full MCP pattern before tackling more complex analytics

**Phase 2 (Next):**

- Implement **Market Price Impact** function
  - Builds on Phase 1 success
  - Demonstrates portfolio-level analytics
  - Introduces commodity dependency concepts

**Phase 3 (Final):**

- Add **Crop Yield Risk** function
  - Most complex but demonstrates agricultural domain expertise
  - Integrates regional and crop-specific risk factors

This phased approach allows for incremental validation of the MCP architecture while delivering business value at each step.

### 5.2 Enhanced Input Validation

Add stronger input validation in the MCP registry functions:

```javascript
// Enhanced validation in MCP function registry
assessCropYieldRisk: MCPServiceWithLogging.createFunction(
  "assessCropYieldRisk",
  async (args) => {
    const { borrower_id, crop_type, season } = args;

    // Enhanced validation
    if (!borrower_id || typeof borrower_id !== "string") {
      throw new Error("Valid borrower ID string is required");
    }

    if (crop_type && typeof crop_type !== "string") {
      throw new Error("Crop type must be a string if provided");
    }

    if (season && typeof season !== "string") {
      throw new Error("Season must be a string if provided");
    }

    try {
      // Rest of implementation...
    }
  }
)
```

### 5.3 Response Caching

For expensive calculations like market impact analysis, implement a simple caching mechanism:

```javascript
// Simple in-memory cache implementation
const analyticsCache = {
  marketImpact: new Map(),
  cropYieldRisk: new Map(),
  loanRestructuring: new Map(),

  // Cache TTL in milliseconds (15 minutes)
  cacheTTL: 15 * 60 * 1000,

  // Get cached item if available and not expired
  get(cacheKey, cacheType) {
    const cache = this[cacheType];
    if (!cache) return null;

    const item = cache.get(cacheKey);
    if (!item) return null;

    // Check if cache entry is expired
    if (Date.now() - item.timestamp > this.cacheTTL) {
      cache.delete(cacheKey);
      return null;
    }

    return item.data;
  },

  // Store item in cache with current timestamp
  set(cacheKey, data, cacheType) {
    const cache = this[cacheType];
    if (!cache) return;

    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  },
};
```

Usage in the market price impact implementation:

```javascript
// In the market price impact implementation
const cacheKey = `${commodity}_${priceChange}`;
const cachedResult = analyticsCache.get(cacheKey, "marketImpact");

if (cachedResult) {
  LogService.info("Using cached market impact analysis result", {
    commodity,
    price_change: priceChange,
    cached: true,
  });
  return cachedResult;
}

// Perform calculation...
const result = {
  // calculated result object
};

// Cache the result for future requests
analyticsCache.set(cacheKey, result, "marketImpact");
return result;
```

### 5.4 Configuration Management

Extract the regional crop mappings and risk factors to external configuration files:

Create a new file: `server/config/agricultural-data.js`

```javascript
/**
 * Configuration file for agricultural data used in analytics
 */
module.exports = {
  // Regional crop mappings for borrowers
  farmerCrops: {
    B001: { crops: ["corn", "soybeans"], region: "midwest" },
    B002: { crops: ["wheat", "barley"], region: "plains" },
    B003: { crops: ["cotton", "peanuts"], region: "southeast" },
    B004: { crops: ["rice", "sugarcane"], region: "south" },
    B005: { crops: ["potatoes", "onions"], region: "northwest" },
  },

  // Crop risk factors by region and crop type
  cropRiskFactors: {
    midwest: {
      corn: [
        "Drought susceptibility",
        "Early frost risk",
        "Corn rootworm pressure",
      ],
      soybeans: [
        "Soybean cyst nematode",
        "White mold risk",
        "Herbicide resistance",
      ],
    },
    plains: {
      wheat: [
        "Drought conditions",
        "Wheat streak mosaic virus",
        "Stem rust risk",
      ],
      barley: [
        "Fusarium head blight",
        "Low winter snowpack",
        "Barley yellow dwarf virus",
      ],
    },
    southeast: {
      cotton: [
        "Boll weevil pressure",
        "Hurricane risk",
        "Irregular rainfall patterns",
      ],
      peanuts: [
        "Late leaf spot",
        "White mold",
        "Aflatoxin risk due to drought",
      ],
    },
    south: {
      rice: [
        "Blast disease pressure",
        "Water availability concerns",
        "Heat stress during flowering",
      ],
      sugarcane: [
        "Borer infestations",
        "Flood risk",
        "Freeze damage to ratoon crop",
      ],
    },
    northwest: {
      potatoes: [
        "Late blight pressure",
        "Colorado potato beetle",
        "Early frost risk",
      ],
      onions: ["Pink root", "Thrips pressure", "Water restrictions"],
    },
  },

  // Commodity dependence for borrowers
  commodityDependence: {
    corn: ["B001", "B004"],
    wheat: ["B002", "B005"],
    soybeans: ["B001", "B003"],
    cotton: ["B003"],
    rice: ["B004"],
    livestock: ["B002", "B005"],
    dairy: ["B001", "B005"],
  },
};
```

Update the analytics.js file to use this configuration:

```javascript
const express = require("express");
const router = express.Router();
const dataService = require("../services/dataService");
const LogService = require("../services/logService");
const agriculturalData = require("../config/agricultural-data");

router.get("/crop-yield-risk/:borrower_id", (req, res) => {
  try {
    // Instead of inline data structures, use the configuration
    const { farmerCrops, cropRiskFactors } = agriculturalData;

    // Rest of implementation using the config data
    // ...
  } catch (error) {
    // Error handling
  }
});
```

### 5.5 Data Complexity Considerations

For the prototype phase, we recommend a balanced approach to data complexity:

1. **Maintain the sophisticated business logic** for the core calculations since this demonstrates domain expertise and provides realistic results.

2. **Simplify the data dependencies** by using the configuration approach outlined above, which makes the code cleaner while retaining complex relationships.

3. **Implement the minimum viable features** first (Phase 1 with Loan Restructuring), then add complexity in subsequent phases.

This approach balances the need for impressive demos with implementation pragmatism.

### 5.6 External Data Integration Strategy

For the initial prototype:

1. **Stick with simulated data** as planned to get the MCP integration working smoothly.

2. **Design with external APIs in mind** by creating abstraction layers that could later be swapped for real API calls.

3. **Add placeholders for future integration points** in the code with comments like:
   ```javascript
   // FUTURE ENHANCEMENT: Replace with actual weather data API call
   // Example: const weatherData = await weatherService.getForecast(region);
   ```

In a future phase, we could integrate:

- USDA commodity price APIs
- Weather.gov forecasting APIs
- NOAA historical weather data

This approach demonstrates the forward-thinking design without delaying the core MCP implementation.

## Conclusion

With the enhanced validation, caching mechanism, configuration management, and phased implementation approach, this plan provides a robust roadmap for implementing the Predictive Analytics section of the LoanOfficerAI-MCP-POC application.

The implementation will demonstrate not only the technical capabilities of the MCP architecture but also domain-specific agricultural lending expertise. Starting with the Loan Restructuring function will provide the quickest path to validating the approach while delivering tangible business value.
