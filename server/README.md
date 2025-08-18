# Loan Chatbot POC - MCP Server

This is the Node.js/Express server implementing the Model Completion Protocol (MCP) with complete SQL Server database integration.

## Prerequisites

- Node.js and npm installed
- OpenAI API key for the AI chatbot integration
- SQL Server (Docker recommended) or SQL Server LocalDB

## Setup

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   # If you ran bootstrap.js from the root directory, dependencies are already installed
   # Otherwise install manually:
   npm install
   ```

3. Set up SQL Server Database:

   **Option A: Docker (Recommended for Mac/Linux)**:

   ```bash
   docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" \
      -p 1433:1433 --name sql-server \
      -d mcr.microsoft.com/mssql/server:2019-latest
   ```

   **Option B: SQL Server LocalDB (Windows)**:

   ```bash
   # Use connection string: (localdb)\MSSQLLocalDB
   ```

4. Create a `.env` file in the server directory:

   ```
   OPENAI_API_KEY=your_openai_api_key
   PORT=3001
   NODE_ENV=development

   # Database Configuration
   USE_DATABASE=true
   DB_SERVER=localhost
   DB_NAME=LoanOfficerDB
   DB_USER=sa
   DB_PASSWORD=YourStrong@Passw0rd
   ```

5. Start the server:

   ```bash
   npm start
   ```

   The server will automatically:

   - Connect to SQL Server database
   - Create database schema if needed
   - Populate with sample data
   - Fall back to JSON files if database unavailable

The server will run at http://localhost:3001.

## Database Integration

✅ **COMPLETE SQL SERVER INTEGRATION**

- **Primary Data Source**: SQL Server database with proper schema
- **Automatic Schema Creation**: Database and tables created automatically
- **Connection Pooling**: Efficient database resource management
- **Fallback Mechanism**: Automatic fallback to JSON files if database unavailable
- **16 MCP Functions**: All functions integrated with database services

## API Endpoints

### MCP Function Endpoints

- GET /api/mcp/functions: Get all available MCP functions
- POST /api/mcp/execute: Execute MCP function with parameters
- GET /api/system/status: System health check with database status

### Traditional REST Endpoints

- GET /api/loans: Get all loans from database
- GET /api/loan/:id: Get loan details by ID from database
- GET /api/loan/status/:id: Get loan status by ID from database
- GET /api/loans/active: Get all active loans from database
- GET /api/loans/borrower/:name: Get loans by borrower name from database

### OpenAI Integration

- POST /api/openai/chat: Proxy endpoint for OpenAI chat completions API
  - Requires authentication token
  - Accepts messages array and function definitions
  - Supports function calling for structured data retrieval
  - Integrates with all 18 MCP functions

## MCP Functions (18 Total)

### Basic Loan Information Functions (7)

- `getLoanDetails` - Get detailed loan information from database
- `getLoanStatus` - Get loan status from database
- `getLoanSummary` - Get portfolio summary from database
- `getActiveLoans` - Get all active loans from database
- `getLoansByBorrower` - Get loans for specific borrower from database
- `getLoanPayments` - Get payment history for specific loan from database
- `getLoanCollateral` - Get collateral information for specific loan from database

### Borrower & Risk Assessment Functions (4)

- `getBorrowerDetails` - Get detailed borrower information from database
- `getBorrowerDefaultRisk` - Calculate default risk from database
- `getBorrowerNonAccrualRisk` - Calculate non-accrual risk from database
- `evaluateCollateralSufficiency` - Evaluate collateral from database

### Predictive Analytics Functions (7)

- `analyzeMarketPriceImpact` - Market price impact analysis for specific borrowers
- `forecastEquipmentMaintenance` - Equipment maintenance forecasting
- `assessCropYieldRisk` - Crop yield risk analysis for agricultural loans
- `getRefinancingOptions` - Refinancing option analysis and recommendations
- `analyzePaymentPatterns` - Payment behavior pattern analysis
- `recommendLoanRestructuring` - AI-powered loan restructuring recommendations
- `getHighRiskFarmers` - High-risk borrower identification across portfolio

## Testing

### 🧪 **Two-Tier Testing Strategy**

#### **1. Jest Comprehensive Tests (Recommended)**

```bash
# Run 70 comprehensive Jest tests - cleanest output
npm test
```

**Output:**

```
Test Suites: 9 passed, 9 total
Tests:       70 passed, 70 total
Snapshots:   0 total
Time:        2.256 s
Ran all test suites.
```

**What's Tested:**

- ✅ **OpenAI Integration** (11 tests) - Function calling, response handling
- ✅ **MCP Infrastructure** (11 tests) - Function registry, logging, error handling
- ✅ **Database Operations** (15 tests) - SQL operations, predictive analytics
- ✅ **Authentication** (6 tests) - JWT tokens, security validation
- ✅ **Unit Components** (27 tests) - Mock data, utilities, edge cases

#### **2. Functional POC Tests**

```bash
# Run 13 core business logic tests
npm run test:mcp
```

**Output:**

```
Total Tests: 13
Passed: 13
Failed: 0
```

**What's Tested:**

- ✅ **Core Loan Operations** - Database-driven loan information
- ✅ **Risk Assessment Functions** - AI-powered risk calculations
- ✅ **High-Risk Analysis** - Farmer risk identification
- ✅ **OpenAI End-to-End** - Complete AI function calling workflow

### Additional Test Commands

```bash
# Database integration validation
npm run test:database

# Individual test categories
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:coverage       # Coverage report

# System health check
curl http://localhost:3001/api/system/status
```

## Production Deployment

- **Database**: SQL Server with connection pooling
- **Authentication**: JWT token-based security
- **Logging**: Comprehensive Winston-based logging
- **Monitoring**: System health endpoints
- **Fallback**: Automatic JSON file fallback for reliability
