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
