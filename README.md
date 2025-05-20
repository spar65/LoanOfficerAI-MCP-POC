# Loan Officer AI - MCP Proof of Concept

A proof-of-concept application demonstrating AI-powered agricultural lending intelligence with MCP integration.

## Features

- Dashboard with agricultural loan portfolio overview
- Detailed borrower profiles with farm characteristics
- Equipment tracking with maintenance history
- AI-powered risk assessment based on payment history
- Interactive chatbot for loan officers

## Data Model

The application uses a comprehensive data model designed for agricultural lending:

- **Borrowers**: Profiles with credit scores, income, farm size, and farm type (Crop, Livestock, Mixed)
- **Loans**: Various loan types (Land, Equipment, Short-term, Long-term) with terms and status
- **Payments**: Payment history with on-time/late status tracking
- **Equipment**: Farm equipment inventory with maintenance records
- **Collateral**: Land and equipment used as loan collateral

## Setup

1. **Start the server**:

   ```bash
   cd server
   npm install
   npm start
   ```

2. **Start the client**:

   ```bash
   cd client
   npm install
   npm start
   ```

3. Open http://localhost:3000 in your browser

## Technology Stack

- **Frontend**: React with Material UI
- **Backend**: Node.js/Express
- **Database**: JSON files (simulated database)
- **AI Integration**: Rule-based intelligence with agricultural lending models

## Testing Overview

This project includes both server and client tests (22 passing tests total):

### Server Tests (19 passing tests)

- **Simple Tests**: Basic validation of test framework
- **Mock Data Tests**: Tests for data structures using mock data
- **Utility Tests**: Tests for pure utility functions without external dependencies
- **Auth Utility Tests**: Testing of auth-related utility functions
- **Skipped Tests**: More complex tests that are kept for reference but skipped for the POC

### Client Tests (3 passing tests)

- **Simple Tests**: Basic validation tests including React component rendering test

## Running Tests

To run all 22 tests (both server and client):

```bash
npm test
```

To run only server tests (19 tests):

```bash
npm run test:server
```

To run only client tests (3 tests):

```bash
npm run test:client
```

## Test Structure

### Server Tests

Server tests are located in the `server/tests` directory and organized into:

- `tests/unit/`: Unit tests for isolated components
- `tests/integration/`: Tests for API interactions (skipped for POC)

### Client Tests

Client tests are located in the `client/src/tests` directory:
