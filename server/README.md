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
  - Integrates with all 16 MCP functions

## MCP Functions (16 Total)

### Loan Functions (5)

- `getLoanDetails` - Get detailed loan information from database
- `getLoanStatus` - Get loan status from database
- `getLoanSummary` - Get portfolio summary from database
- `getActiveLoans` - Get all active loans from database
- `getLoansByBorrower` - Get loans for specific borrower from database

### Risk Assessment Functions (3)

- `getBorrowerDefaultRisk` - Calculate default risk from database
- `getBorrowerNonAccrualRisk` - Calculate non-accrual risk from database
- `evaluateCollateralSufficiency` - Evaluate collateral from database

### Analytics Functions (8)

- `recommendLoanRestructuring` - AI-powered restructuring recommendations
- `assessCropYieldRisk` - Crop risk analysis
- `analyzeMarketPriceImpact` - Market impact analysis
- `forecastEquipmentMaintenance` - Equipment maintenance forecasting
- `getRefinancingOptions` - Refinancing option analysis
- `analyzePaymentPatterns` - Payment behavior analysis
- `getHighRiskFarmers` - High-risk borrower identification
- `getBorrowerDetails` - Detailed borrower information from database

## Testing

```bash
# Run all tests
npm test

# Run database integration tests
npm run test:database

# Run MCP function tests
npm run test:mcp

# Check system health
curl http://localhost:3001/api/system/status
```

## Production Deployment

- **Database**: SQL Server with connection pooling
- **Authentication**: JWT token-based security
- **Logging**: Comprehensive Winston-based logging
- **Monitoring**: System health endpoints
- **Fallback**: Automatic JSON file fallback for reliability
