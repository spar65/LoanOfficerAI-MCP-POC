# Loan Chatbot POC - MCP Server

This is the Node.js/Express server simulating an MCP server, interacting with a fake JSON database.

## Prerequisites

- Node.js and npm installed

## Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

The server will run at http://localhost:3001.

## Endpoints

- GET /api/loans: Get all loans
- GET /api/loan/:id: Get loan details by ID
- GET /api/loan/status/:id: Get loan status by ID
- GET /api/loans/active: Get all active loans
- GET /api/loans/borrower/:name: Get loans by borrower name

## Notes

- Uses loans.json as a fake database.
- In production, replace with real MCP endpoints connecting to the Loan Origination and Accounting Systems.
