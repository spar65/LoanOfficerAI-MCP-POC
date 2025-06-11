# LoanOfficerAI-MCP-POC Project Directory Tree

This document provides the complete directory structure of the LoanOfficerAI MCP Proof of Concept project.

## Project Root Structure

```
.
├── BKUP                      # Backup directory
├── HitList-MCP-Evaluation03-Overview-Project.md
├── chat                      # Chat logs and chat-related files
├── client                    # Frontend React application
├── docs                      # Documentation files
├── node_modules              # Node.js dependencies
├── package-lock.json
├── package.json
├── server                    # Backend Node.js server
├── templates                 # Template files for code generation
├── TEST-FIXES-DETAILED-REVIEW.md
├── TEST-INVENTORY.md
├── UNIFIED-TEST-STRATEGY.md
└── Various test files (test-*.js)
```

## Client Directory Structure

```
client/
├── build                     # Production build output
├── public                    # Public static files
├── src                       # Source code
│   ├── components            # React components
│   │   ├── Chatbot.js        # Main chatbot component
│   │   ├── Dashboard.js      # Dashboard component
│   │   └── ...
│   ├── mcp                   # MCP integration
│   │   ├── authService.js    # Authentication service
│   │   ├── backup            # Backup of MCP files
│   │   └── client.js         # HTTP MCP client implementation
│   ├── tests                 # Frontend tests
│   │   ├── integration       # Integration tests
│   │   ├── mocks             # Test mocks
│   │   └── unit              # Unit tests
│   ├── App.css               # Main app styles
│   ├── App.js                # Main React application component
│   ├── index.js              # Application entry point
│   └── ...
└── package.json              # Frontend dependencies
```

## Server Directory Structure

```
server/
├── auth                      # Authentication-related code
├── config                    # Configuration files
├── controllers               # API controllers
├── data                      # Data files (JSON)
│   ├── ai_models             # AI model configurations
│   ├── borrowers.json        # Borrower data
│   ├── collateral.json       # Collateral data
│   ├── loans.json            # Loan data
│   └── payments.json         # Payment history data
├── mcp                       # MCP server implementation
│   └── server.js             # MCP server
├── middleware                # Express middleware
├── models                    # Data models
├── routes                    # API routes
│   ├── analytics.js          # Analytics endpoints
│   ├── borrowers.js          # Borrower endpoints
│   ├── collateral.js         # Collateral endpoints
│   ├── loans.js              # Loan endpoints
│   ├── openai.js             # OpenAI integration
│   ├── payments.js           # Payments endpoints
│   └── risk.js               # Risk assessment endpoints
├── services                  # Business logic services
│   ├── dataService.js        # Data access service
│   ├── logService.js         # Logging service
│   ├── mcpService.js         # MCP service
│   └── openaiService.js      # OpenAI service
├── templates                 # Code templates
├── tests                     # Backend tests
│   ├── integration           # Integration tests
│   ├── mock-data             # Test data
│   ├── mocks                 # Test mocks
│   └── unit                  # Unit tests
├── utils                     # Utility functions
│   └── validation.js         # Data validation
└── server.js                 # Main server entry point
```

## Key Files

### Frontend

- `client/src/components/Chatbot.js` - Main chatbot UI component
- `client/src/mcp/client.js` - MCP client implementation for API calls
- `client/src/App.js` - Main application component

### Backend

- `server/server.js` - Main Express server
- `server/mcp/server.js` - MCP server implementation
- `server/routes/openai.js` - OpenAI integration
- `server/services/dataService.js` - Data access layer
- `server/data/*.json` - JSON data files (loans, borrowers, etc.)
