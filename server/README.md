# Loan Chatbot POC - MCP Server

This is the Node.js/Express server simulating an MCP server, interacting with a fake JSON database.

## Prerequisites

- Node.js and npm installed
- OpenAI API key for the AI chatbot integration

## Setup

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory with your OpenAI API key:

   ```
   OPENAI_API_KEY=your_openai_api_key
   PORT=3001
   NODE_ENV=development
   ```

4. Start the server:

   ```bash
   npm start
   ```

   Alternatively, you can provide the API key directly when starting the server:

   ```bash
   OPENAI_API_KEY=your_openai_api_key npm start
   ```

The server will run at http://localhost:3001.

## Endpoints

### Loan Endpoints

- GET /api/loans: Get all loans
- GET /api/loan/:id: Get loan details by ID
- GET /api/loan/status/:id: Get loan status by ID
- GET /api/loans/active: Get all active loans
- GET /api/loans/borrower/:name: Get loans by borrower name

### OpenAI Integration

- POST /api/openai/chat: Proxy endpoint for OpenAI chat completions API
  - Requires authentication token
  - Accepts messages array and function definitions
  - Supports function calling for structured data retrieval

## Notes

- Uses JSON files as a fake database.
- In production, replace with real MCP endpoints connecting to the Loan Origination and Accounting Systems.
- The OpenAI integration uses the API key from environment variables for security.
