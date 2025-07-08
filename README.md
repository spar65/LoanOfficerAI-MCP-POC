# Loan Officer AI - MCP Proof of Concept - Updated June 2025

A proof-of-concept application demonstrating AI-powered agricultural lending intelligence with Model Completion Protocol (MCP) integration.

## Latest Updates

- **June 11, 2025**: Successfully sanitized repository and secured GitHub integration
- **May 30, 2025**: Enhanced logging system with comprehensive tests
- **May 19, 2025**: Added OpenAI integration with proper API key management

## What is MCP?

- **Structured data retrieval**: Backend functions return standardized JSON data
- **Better context management**: Functions can provide additional context to the AI model

This application demonstrates how MCP can be used to create a reliable AI-powered loan officer assistant that accesses real data through defined functions rather than making up information.

## Features

- Dashboard with agricultural loan portfolio overview
- Detailed borrower profiles with farm characteristics
- Equipment tracking with maintenance history
- AI-powered risk assessment based on payment history
- Interactive chatbot for loan officers with OpenAI integration
- Natural language processing for loan inquiries using MCP functions

## How MCP Works in This Application

1. **User Login & Bootstrap**: When you log in, the application uses MCP to load initial user data
2. **Chatbot Interactions**: When you ask the chatbot a question, it:
   - Analyzes your request to determine which function to call
   - Calls the appropriate MCP function on the server
   - Receives structured data back
   - Formulates a natural language response based on real data

For example, if you ask "What's the status of John Smith's loan?", the AI will:

- Identify this as a request for loan details
- Call the getLoanDetails MCP function with borrower="John Smith"
- Receive actual loan data from the database
- Generate a response using only the factual information provided

## Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/LoanOfficerAI-MCP-POC.git
   cd LoanOfficerAI-MCP-POC
   ```

2. **Set up environment variables**:

   The server requires configuration for OpenAI and other settings. Create a `.env` file in the server directory:

   ```
   # server/.env
   OPENAI_API_KEY=your_openai_api_key
   PORT=3001
   NODE_ENV=development
   MCP_LOG_LEVEL=info
   ```

   **Important**: You must obtain an OpenAI API key from the [OpenAI platform](https://platform.openai.com/api-keys). This application uses OpenAI's function calling capability, which requires a paid API key.

3. **Install dependencies and start the server**:

   ```bash
   cd server
   npm install
   npm start
   ```

4. **Install dependencies and start the client** (in a new terminal):

   ```bash
   cd client
   npm install
   npm start
   ```

5. Open http://localhost:3000 in your browser

6. **Login credentials**:
   - Username: john.doe
   - Password: password123

## MCP Function Examples

The application includes several MCP functions that the AI can call:

- `getBorrowerDetails`: Retrieves information about a specific borrower
- `getLoanDetails`: Gets information about a borrower's loans
- `getPaymentHistory`: Retrieves payment history for a loan
- `calculateRiskScore`: Analyzes loan performance data to determine risk
- `getEquipmentDetails`: Retrieves information about farm equipment
- `getPriceForecasts`: Gets commodity price forecasts for risk assessment

## Project Structure

- **client/**: React frontend application
  - **src/mcp/**: Client-side MCP implementation
  - **src/components/**: React components including the AI chatbot
- **server/**: Node.js backend
  - **routes/**: API endpoints including MCP function handlers
  - **services/**: Business logic including McpService
  - **data/**: Mock data for the application
  - **mcp/**: Server-side MCP implementation

## Technology Stack

- **Frontend**: React with Material UI
- **Backend**: Node.js/Express
- **Database**: JSON files (simulated database)
- **AI Integration**:
  - OpenAI's GPT models for natural language understanding
  - MCP for structured function calling
  - Rule-based intelligence with agricultural lending models

## Testing

### Running Tests

To run all tests across the entire application (both client and server):

```bash
npm test
```

To run only server tests:

```bash
npm run test:server
```

To run only client tests:

```bash
npm run test:client
```

### Test Categories

The application provides specialized test commands for different components:

```bash
# Server-side Jest tests only
npm run test:jest

# Component-specific tests
npm run test:openai     # Test OpenAI function calling integration
npm run test:logging    # Test logging and PII redaction functionality
npm run test:performance # Test API performance characteristics
npm run test:security   # Test authentication and security mechanisms

# Run all custom tests (excluding Jest tests)
npm run test:custom

# Run interactive test selection menu
npm run test:interactive
```

These test suites validate critical aspects of the application:

1. **OpenAI Tests**: Verify that OpenAI function calling works correctly, returning natural language responses based on structured data.
2. **Logging Tests**: Ensure all operations are logged appropriately with sensitive information redacted and request context propagated through the system.
3. **Performance Tests**: Measure response times, throughput, and stability under various loads.
4. **Security Tests**: Verify authentication, input validation, and protection against common vulnerabilities.

### Testing MCP Functions

The application includes specific tests for MCP functions. You can run these with:

```bash
cd server
npm run test:mcp
```

This validates that all MCP functions return the expected data structures.

## Troubleshooting

- **OpenAI API errors**: Check that your API key is correct and has sufficient credits
- **Server connection issues**: Ensure the server is running on port 3001
- **Client not connecting**: Check that the React app is running on port 3000
- **MCP function errors**: Check the server logs for detailed error information

## Documentation

For more detailed information on MCP implementation, see:

- **README-Dev-Tutorial.md**: Comprehensive developer guide to MCP
- **README-Dev-Tutorial-Simple.md**: Simplified explanation of MCP concepts
- **.cursor/rules/**: Collection of MCP implementation rules and best practices

## Data Model

The application uses a comprehensive data model designed for agricultural lending:

- **Borrowers**: Profiles with credit scores, income, farm size, and farm type (Crop, Livestock, Mixed)
- **Loans**: Various loan types (Land, Equipment, Short-term, Long-term) with terms and status
- **Payments**: Payment history with on-time/late status tracking
- **Equipment**: Farm equipment inventory with maintenance records
- **Collateral**: Land and equipment used as loan collateral

## Test Structure

### Server Tests

Server tests are located in the `server/tests` directory and organized into:

- `tests/unit/`: Unit tests for isolated components
- `tests/integration/`: Tests for API interactions (skipped for POC)

### Client Tests

Client tests are located in the `client/src/tests` directory:

# Database Integration

The application now supports SQL Server database integration:

- Data is stored in a SQL Server database instead of JSON files
- Connection pooling with retry logic ensures robust database access
- Automated schema creation simplifies setup
- Docker support for macOS users

## Setting Up the Database

1. **Docker SQL Server (macOS/Linux)**:

   ```bash
   docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" \
      -p 1433:1433 --name sql-server \
      -d mcr.microsoft.com/mssql/server:2019-latest
   ```

2. **LocalDB (Windows)**:
   Use SQL Server LocalDB with connection string: `(localdb)\MSSQLLocalDB`

3. **Configure Environment**:
   Create a `.env` file with:

   ```
   DB_SERVER=localhost
   DB_NAME=LoanOfficerDB
   DB_USER=sa
   DB_PASSWORD=YourStrong@Passw0rd
   USE_DATABASE=true
   ```

4. **Run Database Tests**:
   ```bash
   node run-db-tests.js
   ```

For more details, see [DB-INTEGRATION-GUIDE.md](DB-INTEGRATION-GUIDE.md).
