# MCP Developer Tutorial - LoanOfficerAI POC Edition

## Introduction

Welcome to the **LoanOfficerAI Model Completion Protocol (MCP)** implementation! This tutorial will guide you through our working POC that demonstrates MCP in action for agricultural lending.

🎯 **What You'll Learn:**

- How MCP works in a real application (not just theory!)
- Our POC improvements: validation, monitoring, error handling
- Practical examples from working agricultural lending use cases
- How to extend and improve the system

## What is MCP in Our Context?

MCP (Model Completion Protocol) in our LoanOfficerAI POC serves as:

- **AI Function Calling Interface** - Primary use for OpenAI GPT-4 integration
- **Structured API Communication** - Type-safe interfaces with validation
- **Agricultural Domain Functions** - Risk assessment, loan analysis, predictive analytics
- **Real-time System Monitoring** - Health checks and status reporting

### Why MCP for Agricultural Lending?

Our POC demonstrates MCP's power for complex domain logic:

- **Risk Assessment**: `getBorrowerNonAccrualRisk`, `predictDefaultRisk`
- **Data Retrieval**: `getLoanDetails`, `getBorrowerDetails`
- **Predictive Analytics**: `forecastEquipmentMaintenance`, `assessCropYieldRisk`
- **Market Analysis**: `analyzeMarketPriceImpact`

## 🏗️ Our POC Architecture Overview

Our LoanOfficerAI POC implements MCP across three main layers:

### 1. **OpenAI Integration Layer** (`/api/openai/chat`)

- Handles GPT-4 function calling
- Routes AI requests to appropriate MCP functions
- Manages conversation context and function results

### 2. **MCP Function Registry** (12 active functions)

- **Risk Assessment** (4 functions): Default risk, non-accrual risk, high-risk farmers
- **Data Retrieval** (4 functions): Loan details, borrower info, active loans
- **Analytics** (4 functions): Equipment forecasting, crop yield, market impact

### 3. **System Monitoring** (`/api/system/status`, `/api/mcp/functions`)

- Real-time health monitoring
- Function availability tracking
- Performance metrics and uptime

## 🚀 Getting Started with Our POC

### Current MCP Service Implementation

Our POC uses a lightweight MCP service for logging and metrics:

```javascript
// server/services/mcpService.js - Our POC implementation
class McpService {
  /**
   * Wraps an MCP function call with logging and timing
   */
  static async call(fn, functionName, ...args) {
    LogService.mcp(`▶ STARTING MCP: ${functionName}`, args);
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      LogService.mcp(`✓ COMPLETED MCP: ${functionName} (${duration}ms)`, {
        resultSize: result ? JSON.stringify(result).length : 0,
        parameters: args,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      LogService.error(`✗ FAILED MCP: ${functionName} (${duration}ms)`, {
        error: error.message,
        parameters: args,
      });
      throw error;
    }
  }
}
```

### POC-Specific Improvements We've Added

#### 1. **Fixed Function Execution Flow** (Critical Fix - Dec 2024)

**Problem**: Early `return;` statements in OpenAI route prevented function results from being processed.

**Solution**: Removed early returns and restructured logic flow:

```javascript
// server/routes/openai.js - FIXED execution flow
if (functionName === 'getBorrowerNonAccrualRisk') {
  // Validation and borrower check
  if (borrowerCheck.error) {
    functionResult = { error: 'Borrower not found', ... };
    // DON'T return early - let function result be processed
  }

  // Only proceed if no previous errors
  if (!functionResult || !functionResult.error) {
    // Try risk endpoint, then analytics fallback
    const riskResult = await callInternalApi(`/api/risk/non-accrual/${borrowerId}`);
    if (!riskResult.error) {
      functionResult = riskResult;
    } else {
      // Fallback to analytics
      const analyticsResult = await callInternalApi(`/api/analytics/predict/non-accrual-risk/${borrowerId}`);
      functionResult = analyticsResult.error ?
        { error: 'Both endpoints failed' } : analyticsResult;
    }
  }
}
// Function result gets processed and sent back to OpenAI properly
```

#### 2. **Simple Validation System** (`server/utils/validation.js`)

```javascript
// Lightweight validation perfect for POC
function validateBorrowerId(borrowerId) {
  if (!/^B\d+$/.test(borrowerId.toUpperCase())) {
    return {
      valid: false,
      errors: [
        {
          field: "borrowerId",
          message: "Borrower ID must be in format B001, B002, etc.",
        },
      ],
    };
  }
  return { valid: true, errors: null };
}

// Main validation function for MCP arguments
function validateMcpArgs(functionName, args) {
  switch (functionName) {
    case "getBorrowerNonAccrualRisk":
      return validateBorrowerId(args.borrowerId);
    // ... other function validations
  }
}
```

#### 3. **System Status Endpoints** (Demo-ready monitoring)

```javascript
// server/server.js - Enhanced health monitoring
app.get("/api/system/status", (req, res) => {
  const systemStatus = {
    status: "operational",
    version: "1.0.0-poc",
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
    },
    data_health: {
      borrower_b001: borrowersCheck.b001Found ? "verified" : "missing",
      total_borrowers: borrowersCheck.borrowers.length,
    },
  };
  res.json(systemStatus);
});
```

### Real MCP Functions from Our POC

#### Agricultural Risk Assessment Function

Our non-accrual risk function demonstrates MCP for complex domain logic:

```javascript
// server/routes/openai.js - Actual POC implementation
{
  name: "getBorrowerNonAccrualRisk",
  description: "Assess non-accrual risk for a specific borrower based on payment history and financial indicators",
  parameters: {
    type: "object",
    properties: {
      borrowerId: {
        type: "string",
        description: "The ID of the borrower to analyze (e.g., B001, B002)"
      }
    },
    required: ["borrowerId"]
  }
}
```

#### How It Works in Practice

```javascript
// In OpenAI route handler - our actual implementation
if (functionName === "getBorrowerNonAccrualRisk") {
  const { borrowerId } = functionArgs;

  // 1. Validate borrower ID format
  const validation = validateMcpArgs(functionName, functionArgs);
  if (!validation.valid) {
    return res.json({
      role: "assistant",
      content: `I'm sorry, but there was an issue with the request: ${validation.errors
        .map((e) => e.message)
        .join(", ")}`,
    });
  }

  // 2. Verify borrower exists
  const borrowerCheck = await callInternalApi(`/api/borrowers/${borrowerId}`);

  // 3. Get risk assessment with fallback
  const riskResult = await callInternalApi(
    `/api/risk/non-accrual/${borrowerId}`
  );
  if (riskResult.error) {
    // Fallback to analytics endpoint
    const analyticsFallback = await callInternalApi(
      `/api/analytics/predict/non-accrual-risk/${borrowerId}`
    );
    functionResult = analyticsFallback;
  } else {
    functionResult = riskResult;
  }
}
```

#### Function Categories in Our POC

```javascript
// Current function registry (/api/mcp/functions)
const mcpFunctions = [
  // Risk Assessment (4 functions)
  { name: "getBorrowerNonAccrualRisk", category: "Risk Assessment" },
  { name: "getBorrowerDefaultRisk", category: "Risk Assessment" },
  { name: "getHighRiskFarmers", category: "Risk Assessment" },

  // Data Retrieval (4 functions)
  { name: "getBorrowerDetails", category: "Data Retrieval" },
  { name: "getLoanDetails", category: "Data Retrieval" },
  { name: "getActiveLoans", category: "Data Retrieval" },

  // Analytics (4 functions)
  { name: "predictDefaultRisk", category: "Analytics" },
  { name: "forecastEquipmentMaintenance", category: "Analytics" },
  { name: "assessCropYieldRisk", category: "Analytics" },
  { name: "analyzeMarketPriceImpact", category: "Analytics" },
];
```

### Client Implementation - React Frontend

#### Our MCP Client (`client/src/mcp/client.js`)

Our POC uses specific API endpoints for different MCP function categories:

```javascript
const mcpClient = {
  baseURL: "http://localhost:3001/api",

  // Get axios config with auth headers
  getConfig() {
    const token = authService.getToken();
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    };
  },

  // Agricultural lending specific functions
  async predictNonAccrualRisk(borrowerId) {
    const response = await axios.get(
      `${this.baseURL}/predict/non-accrual-risk/${borrowerId}`,
      this.getConfig()
    );
    return response.data;
  },

  async getBorrowerDetails(borrowerId) {
    const response = await axios.get(
      `${this.baseURL}/borrower/${borrowerId}`,
      this.getConfig()
    );
    return response.data;
  },
};
```

#### Chatbot Integration with MCP Functions

Our chatbot processes MCP function calls through the OpenAI endpoint:

```javascript
// client/src/components/Chatbot.js - Function processing
const processFunctionCall = async (functionCall) => {
  const { name, arguments: argsString } = functionCall;
  const args = JSON.parse(argsString);

  switch (name) {
    case "getBorrowerNonAccrualRisk":
      // Map to the correct mcpClient function
      result = await mcpClient.predictNonAccrualRisk(args.borrowerId);
      break;

    case "getBorrowerDetails":
      result = await mcpClient.getBorrowerDetails(args.borrowerId);
      break;

    case "predictDefaultRisk":
      result = await mcpClient.predictDefaultRisk(
        args.borrower_id,
        args.time_horizon || "3m"
      );
      break;
  }

  return { role: "function", name, content: JSON.stringify(result) };
};
```

#### SystemStatus Component (POC Monitoring)

Our real-time system monitoring component:

```javascript
// client/src/components/SystemStatus.js - Demo-ready monitoring
const SystemStatus = ({ compact = false }) => {
  const [status, setStatus] = useState(null);
  const [mcpFunctions, setMcpFunctions] = useState(null);

  const fetchStatus = async () => {
    // Get system status and MCP functions info
    const [systemStatus, functionsStatus] = await Promise.all([
      fetch(`${mcpClient.baseURL}/system/status`).then((r) => r.json()),
      fetch(`${mcpClient.baseURL}/mcp/functions`).then((r) => r.json()),
    ]);

    setStatus(systemStatus);
    setMcpFunctions(functionsStatus);
  };

  // Real-time status display with auto-refresh
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getStatusIcon(status.status)} {/* Green/Yellow/Red indicators */}
          <Typography>System: {status.status}</Typography>
          <Typography>
            {mcpFunctions.active_functions}/{mcpFunctions.total_functions}{" "}
            functions active
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
```

## 🔧 POC Improvements & Lessons Learned

### 1. **Function Name Mapping Fix**

The biggest issue we solved: Client-side function schemas didn't match server-side handlers.

**Problem**: Chatbot called `getBorrowerNonAccrualRisk` but client tried to execute `predictNonAccrualRisk`
**Solution**: Added proper function mapping in chatbot's `processFunctionCall`

```javascript
// Before: Function calls failed silently
case 'getBorrowerNonAccrualRisk':
  // This would fail - no mapping!
  result = await mcpClient[name](args.borrowerId);

// After: Explicit mapping to correct client function
case 'getBorrowerNonAccrualRisk':
  result = await mcpClient.predictNonAccrualRisk(args.borrowerId);
```

### 2. **User-Friendly Error Handling**

We replaced technical errors with domain-specific messages:

```javascript
// client/src/components/Chatbot.js - Better error UX
catch (error) {
  let userMessage = error.message;

  if (error.message.includes('Network Error')) {
    userMessage = 'Unable to connect to the server. Please check if the server is running.';
  } else if (error.message.includes('404')) {
    userMessage = 'The requested information was not found. Please check the ID and try again.';
  }

  return {
    role: "function",
    content: JSON.stringify({
      error: userMessage,
      technical_details: error.message
    })
  };
}
```

### 3. **Validation at the OpenAI Route Level**

We added request validation before function execution:

```javascript
// server/routes/openai.js - Validation integration
const validation = validateMcpArgs(functionName, functionArgs);
if (!validation.valid) {
  const errorMessage = validation.errors.map((e) => e.message).join(", ");
  return res.json({
    role: "assistant",
    content: `I'm sorry, but there was an issue with the request: ${errorMessage}`,
  });
}
```

## 🧪 Testing Your POC

### Automated Test Scripts (New!)

We've created comprehensive test scripts to verify MCP function calling:

#### 1. **Node.js Test Script** (`test-mcp-functions.js`)

```bash
# Run comprehensive MCP tests
node test-mcp-functions.js

# Expected output:
🚀 Starting MCP Function Calling Tests
=====================================
✅ Server is running: operational
📊 Memory usage: 45 MB

🧪 Testing: Default Risk Assessment - B003
✅ Test passed - Contains expected data

🧪 Testing: Non-Accrual Risk Assessment - B001
✅ Test passed - Contains expected data

📋 Test Summary
================
✅ Passed: 5/5
🎉 All MCP function tests passed!
```

#### 2. **Browser Test Interface** (`test-ui-integration.html`)

Open in browser and test:

- System health checks
- Direct API endpoint tests
- MCP function calling through OpenAI route
- Validation with invalid inputs

#### 3. **Manual Demo Script for Stakeholders**

##### **System Health Check**

```bash
# Check if everything is running
curl http://localhost:3001/api/system/status

# Expected response:
{
  "status": "operational",
  "version": "1.0.0-poc",
  "uptime": 120,
  "data_health": {
    "borrower_b001": "verified",
    "total_borrowers": 10
  }
}
```

##### **MCP Function Registry**

```bash
# Show available functions
curl http://localhost:3001/api/mcp/functions

# Expected: 12 active functions across 3 categories
{
  "total_functions": 12,
  "active_functions": 12,
  "categories": {
    "Risk Assessment": 4,
    "Data Retrieval": 4,
    "Analytics": 4
  }
}
```

##### **AI Chat Demo** (Now Working!)

Open the UI and try these queries:

- ✅ "What's the default risk for borrower B003 in the next 3 months?"
- ✅ "Is there a risk that borrower B001 will become non-accrual?"
- ✅ "Which farmers are at high risk of default?"
- ✅ "Show me details for borrower B004"

**Validation Demo:**

- ❌ "What's the default risk for borrower XYZ123?" (Should show validation error)

### Troubleshooting Common Issues (Updated!)

#### Problem: ✅ FIXED - "It seems there was an issue accessing the data for borrower"

**Previous Cause**: Early `return;` statements in OpenAI route prevented function results from being processed
**Solution Applied**: Removed early returns and restructured execution flow
**Status**: Now working correctly - test with automated scripts

#### Problem: "Function not found" errors

**Cause**: Function name mismatch between client and server
**Fix**: Check the `processFunctionCall` mapping in Chatbot.js
**Status**: Verified working in current POC

#### Problem: "Borrower ID must be in format B001" validation errors

**Cause**: Validation working correctly!
**Demo Value**: Show how validation provides user-friendly error messages
**Test**: Try "What's the default risk for borrower XYZ123?" to see validation in action

#### Problem: SystemStatus showing "error" status

**Check**:

1. Is server running on port 3001?
2. Does `server/data/borrowers.json` exist?
3. Is borrower B001 in the data?

**Quick Test**: Run `node test-mcp-functions.js` to verify all systems

#### Problem: OpenAI route returns function_call but no final response

**Cause**: Logic flow issues in function execution
**Fix**: Ensure functionResult is properly set and no early returns occur
**Verify**: Use browser test interface to check end-to-end flow

## 🚀 Extending Your POC

### Adding New MCP Functions

#### Step 1: Define the Function Schema (OpenAI Route)

```javascript
// server/routes/openai.js - Add to mcpFunctions array
{
  name: "assessLoanRisk",
  description: "Assess overall risk for a specific loan",
  parameters: {
    type: "object",
    properties: {
      loanId: {
        type: "string",
        description: "The ID of the loan to assess (e.g., L001)"
      }
    },
    required: ["loanId"]
  }
}
```

#### Step 2: Add Validation (if needed)

```javascript
// server/utils/validation.js - Add to validateMcpArgs switch
case 'assessLoanRisk':
  validation = validateLoanId(args.loanId);
  break;
```

#### Step 3: Implement the Handler

```javascript
// server/routes/openai.js - Add to function handler
else if (functionName === 'assessLoanRisk') {
  const { loanId } = functionArgs;
  functionResult = await McpService.call(
    () => callInternalApi(`/api/risk/loan/${loanId}`),
    'assessLoanRisk',
    loanId
  );
}
```

#### Step 4: Add Client-Side Support

```javascript
// client/src/mcp/client.js - Add client method
async assessLoanRisk(loanId) {
  const response = await axios.get(`${this.baseURL}/risk/loan/${loanId}`, this.getConfig());
  return response.data;
}

// client/src/components/Chatbot.js - Add to processFunctionCall
case 'assessLoanRisk':
  result = await mcpClient.assessLoanRisk(args.loanId);
  break;
```

### Key Architectural Decisions for Our POC

#### 1. **Why JSON Files Instead of Database?**

- **POC Speed**: Faster setup, no database configuration
- **Demo Simplicity**: Easy to modify test data
- **Migration Path**: Clear path to PostgreSQL for production

#### 2. **Why Separate API Endpoints vs. Single MCP Route?**

- **Current**: Each function type has its own endpoint (`/api/risk/*`, `/api/analytics/*`)
- **Future**: Single `/api/mcp` endpoint with function routing
- **Benefit**: Easier to add new functions without new routes

#### 3. **Why OpenAI Route Handles Function Calling?**

- **Integration**: Direct GPT-4 function calling support
- **Context Management**: Conversation flow with function results
- **Fallback Logic**: Multiple endpoint attempts for resilience

## 📚 Learning Resources & Next Steps

### For New Developers

1. **Start Here**: Open `client/src/components/Chatbot.js` and see function mapping
2. **Understand Data Flow**: User message → OpenAI → Function call → API → Response
3. **Try Adding a Function**: Follow the 4-step process above

### For System Expansion (See HitList-Next-Steps.md)

- **Tier 1**: Testing framework, environment config, complete MCP route
- **Tier 2**: PostgreSQL integration, advanced error handling
- **Tier 3**: Security hardening, monitoring, containerization

### POC Success Metrics

- ✅ **12 MCP functions active** across 3 categories
- ✅ **Real-time system monitoring** with health indicators
- ✅ **User-friendly error handling** with validation
- ✅ **Professional demo experience** ready for stakeholders

## 🎯 Key Takeaways

### What Makes This POC Successful

1. **Real agricultural use cases** - Not generic examples
2. **Working AI integration** - GPT-4 function calling in action
3. **Professional monitoring** - System status and health checks
4. **Practical error handling** - User-friendly messages, not technical errors
5. **Extensible architecture** - Clear patterns for adding new functions

### MCP Benefits Demonstrated

- **Type Safety**: Schema validation catches errors early
- **Monitoring**: Real-time function availability and health
- **Composability**: Functions can call other functions (with fallbacks)
- **Domain Focus**: Agricultural lending logic clearly separated
- **Developer Experience**: Clear patterns for extending functionality

---

**Ready to demo or extend your POC?** Check `HitList-Next-Steps.md` for the complete roadmap from POC to production! 🚀
