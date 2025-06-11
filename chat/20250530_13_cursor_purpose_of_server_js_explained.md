# Purpose of server.js Explained
_Exported on 6/4/2025 at 14:32:56 CDT from Cursor (0.50.7)_

---

**User**

@server.js Why is this here?

---

**Cursor**

This is an Express.js server implementation that provides API endpoints for a loan management system. It serves data about:

- Collateral
- Loans
- Borrowers 
- Payments
- Equipment

The server reads data from JSON files in a 'data' directory and exposes various endpoints to query this information. Based on your workspace path "LoanOfficerAI-MCP-POC", this appears to be the backend API for a Loan Officer AI proof-of-concept application.

The extensive logging throughout the file suggests it's being used for debugging and development purposes.

---

**User**

Please review this project in detail and the cursor rules please.

---

**Cursor**

I'll review the project structure and the cursor rules to give you a comprehensive overview.

Let me first check the cursor rules to understand the development standards:

Now, let me examine the package.json to understand the project dependencies:

Let me check the README to understand the project's purpose and structure:

Let me examine the server directory to understand the server-side implementation:

Let's examine the client directory to understand the frontend implementation:

Let's look at the client source files:

Let's check the MCP implementation, which seems to be a key feature of this project:

Let's check the server-side MCP implementation:

Let's check the data directory to understand the data model:

Based on my review of the project structure, here's a comprehensive summary:

## Project Review: LoanOfficerAI-MCP-POC

This is a proof-of-concept application demonstrating AI-powered agricultural lending intelligence with Model Completion Protocol (MCP) integration. The project is structured as a full-stack application with Node.js/Express backend and React frontend.

### Key Components:

1. **MCP (Model Completion Protocol)**: 
   - A structured way for AI applications to communicate with backend services
   - Enables type-safe function calling, structured data retrieval, and better context management
   - Implemented in both client and server sides

2. **Backend (Express.js)**:
   - RESTful API endpoints for loans, borrowers, payments, collateral
   - MCP function handlers for AI integration
   - Mock data stored in JSON files simulating a database
   - Risk assessment algorithms for agricultural lending

3. **Frontend (React)**:
   - Dashboard for loan portfolio overview
   - Borrower profiles with farm characteristics
   - Equipment tracking
   - AI-powered chatbot interface using MCP

4. **Data Model**:
   - Borrowers with credit scores, income, farm details
   - Loans with various types and statuses
   - Payment history
   - Equipment inventory
   - Collateral information

5. **Development Standards**:
   - **Accessibility Requirements**: The project follows WCAG 2.1 AA standards with requirements for semantic HTML, keyboard navigation, screen reader support, etc.
   - **Logging Standards**: Although the full details weren't provided, there's evidence of structured logging practices
   - **Troubleshooting Standards**: Guidelines for methodically addressing issues

### Project Purpose:
This project demonstrates how AI can be integrated into agricultural lending processes in a reliable way using MCP, preventing hallucinations by ensuring the AI only works with real data from defined backend functions.

### Integration Points:
- OpenAI API for natural language processing
- MCP for structured function calling between AI and backend
- React frontend for user interface
- Express backend for data handling and business logic

### Development Environment:
- Node.js/Express for backend
- React with Material UI for frontend
- Jest for testing
- Concurrently for running multiple services during development

This appears to be a well-structured proof-of-concept demonstrating an innovative approach to integrating AI into financial services applications, with careful attention to accessibility standards, structured logging, and methodical troubleshooting.

---

**User**

What are the commands for client and server startups?

---

**Cursor**

Based on the `package.json` file, here are the startup commands for the client and server:

## Individual Startup Commands:

### Server Only:
```bash
npm run server
```
Or directly:
```bash
cd server && npm start
```

### Client Only:
```bash
npm run client
```
Or directly:
```bash
cd client && npm start
```

## Combined Development Command:

### Start Both Client and Server Together:
```bash
npm run dev
```
This uses `concurrently` to run both the server and client simultaneously.

## Direct Startup (from root directory):

### Start Server:
```bash
npm start
```
(This runs `cd server && node server.js`)

## Default Ports:
- **Server**: Port 3001
- **Client**: Port 3000 (React default)

## Prerequisites:
Make sure you've installed dependencies first:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd client && npm install
```

The `npm run dev` command is typically the most convenient for development as it starts both services with one command and shows their logs in the same terminal window.

```shellscript
npm run server
```

```shellscript
cd server && npm start
```

```shellscript
npm run client
```

```shellscript
cd client && npm start
```

```shellscript
npm run dev
```

```shellscript
npm start
```

```shellscript
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd client && npm install
```

---

**User**

For the active loans call, please show me the client implementation and the server implementation. I am explaining to someone what this is doing.

---

**Cursor**

I'll help you find both the client and server implementations for the active loans functionality. Let me search for the relevant code.

Now let me get the specific implementations. First, let's look at the client-side implementation:

Now let's look at the server-side implementation for active loans:

Let's also check how the chatbot uses the getActiveLoans function:

Now I have a comprehensive understanding of how the active loans functionality works. Let me provide you with a clear explanation of both the client and server implementations:

## Active Loans Implementation Overview

### Client-Side Implementation (React/MCP Client)

**Location**: `client/src/mcp/client.js` (lines 90-100)

```javascript
async getActiveLoans() {
  try {
    console.log('Fetching active loans...');
    const response = await axios.get(`${this.baseURL}/loans/active`, this.getConfig());
    return response.data;
  } catch (error) {
    this.handleApiError(error, 'getActiveLoans');
    throw error;
  }
}
```

**What it does:**
1. Makes an HTTP GET request to the server endpoint `/api/loans/active`
2. Includes authentication headers via `this.getConfig()` which adds the JWT token
3. Logs the operation for debugging
4. Returns the response data (array of active loans)
5. Handles errors consistently using the error handler

### Server-Side Implementation (Express/Node.js)

**Location**: `server/routes/loans.js` (lines 155-195)

```javascript
// Get active loans
router.get('/active', (req, res) => {
  LogService.info('Fetching active loans');
  
  try {
    // Load data from JSON files (simulating a database)
    const loans = dataService.loadData(dataService.paths.loans);
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    
    // Filter for only active loans
    const activeLoans = loans.filter(l => l.status === 'Active');
    
    // Enhance each loan with borrower information
    const activeLoansWithBorrowers = activeLoans.map(loan => {
      const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
      return {
        ...loan,
        borrower: borrower ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown',
        borrower_details: borrower || null
      };
    });
    
    LogService.info(`Found ${activeLoans.length} active loans`);
    return res.json(activeLoansWithBorrowers);
  } catch (error) {
    LogService.error('Error fetching active loans', { error: error.message });
    return res.status(500).json({ 
      error: 'Failed to retrieve active loans', 
      details: error.message 
    });
  }
});
```

**What it does:**
1. Loads loan data from JSON files (in production, this would query a database)
2. Filters the loans array to only include loans where `status === 'Active'`
3. Enriches each active loan with borrower information by joining with borrower data
4. Returns an enhanced array that includes both loan details and borrower information
5. Implements comprehensive error handling and logging

### Integration with the AI Chatbot

**Location**: `client/src/components/Chatbot.js`

The chatbot uses the MCP (Model Completion Protocol) to expose this function to the AI:

```javascript
{
  name: "getActiveLoans",
  description: "Get a list of all currently active loans",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
}
```

When a user asks about active loans, the AI:
1. Recognizes the intent through OpenAI's function calling
2. Calls `getActiveLoans` with no parameters
3. Receives the structured data response
4. Formats it into a natural language response

### Example Flow:

1. **User asks**: "Show me all active loans"
2. **AI recognizes** this needs the `getActiveLoans` function
3. **Client calls**: `mcpClient.getActiveLoans()`
4. **Server processes**: Filters loans, adds borrower info
5. **Response includes**: Array of loan objects with borrower details
6. **AI formats**: Natural language response with the loan information

This implementation demonstrates the MCP pattern where:
- The AI doesn't generate data (preventing hallucinations)
- All data comes from structured backend functions
- The AI only formats real data into natural language
- Authentication is handled throughout the flow

```javascript
async getActiveLoans() {
  try {
    console.log('Fetching active loans...');
    const response = await axios.get(`${this.baseURL}/loans/active`, this.getConfig());
    return response.data;
  } catch (error) {
    this.handleApiError(error, 'getActiveLoans');
    throw error;
  }
}
```

```javascript
// Get active loans
router.get('/active', (req, res) => {
  LogService.info('Fetching active loans');
  
  try {
    // Load data from JSON files (simulating a database)
    const loans = dataService.loadData(dataService.paths.loans);
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    
    // Filter for only active loans
    const activeLoans = loans.filter(l => l.status === 'Active');
    
    // Enhance each loan with borrower information
    const activeLoansWithBorrowers = activeLoans.map(loan => {
      const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
      return {
        ...loan,
        borrower: borrower ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown',
        borrower_details: borrower || null
      };
    });
    
    LogService.info(`Found ${activeLoans.length} active loans`);
    return res.json(activeLoansWithBorrowers);
  } catch (error) {
    LogService.error('Error fetching active loans', { error: error.message });
    return res.status(500).json({ 
      error: 'Failed to retrieve active loans', 
      details: error.message 
    });
  }
});
```

```javascript
{
  name: "getActiveLoans",
  description: "Get a list of all currently active loans",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
}
```

