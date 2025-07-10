# README-03-TECHNICAL-GUIDE.md

# LoanOfficerAI MCP - Technical Implementation Guide

## 🛠️ TECHNICAL OVERVIEW

**Purpose**: Comprehensive technical guide for developers, DevOps engineers, and technical stakeholders working with the LoanOfficerAI MCP system.

**Scope**: Installation, configuration, development workflows, deployment, and operational procedures.

---

## 🚀 QUICK START GUIDE

### Prerequisites

```bash
# Required software
Node.js >= 16.0.0
npm >= 8.0.0
Git >= 2.30.0

# Optional (for database integration)
SQL Server 2019+ or Docker
SQL Server Management Studio (Windows)
Azure Data Studio (Cross-platform)
```

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/LoanOfficerAI-MCP-POC.git
cd LoanOfficerAI-MCP-POC

# 2. Install all dependencies
npm run install:all

# 3. Run comprehensive tests
npm test

# 4. Start development servers
npm run dev
```

### Verification

```bash
# Check system health
curl http://localhost:3001/api/system/status

# Test MCP functions
curl http://localhost:3001/api/mcp/functions

# Verify AI integration
open http://localhost:3000
```

---

## 🔧 DEVELOPMENT ENVIRONMENT SETUP

### Environment Variables

```bash
# server/.env
OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_FILE_LOGGING=true

# Database configuration (SQL Server - Primary)
USE_DATABASE=true
DB_SERVER=localhost
DB_NAME=LoanOfficerDB
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd

# JWT configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h
```

### Development Scripts

```bash
# Root level scripts
npm run install:all      # Install all dependencies
npm run dev              # Start both server and client
npm run clean            # Clean all node_modules
npm test                 # Run comprehensive test suite

# Server scripts
cd server
npm start                # Start production server
npm run dev              # Start development server with nodemon
npm run test:jest        # Run Jest unit tests
npm run test:mcp         # Test MCP functions
npm run db:setup         # Setup database schema
npm run migrate          # Migrate JSON data to database

# Client scripts
cd client
npm start                # Start React development server
npm run build            # Build production bundle
npm run test             # Run React component tests
npm run analyze          # Analyze bundle size
```

### IDE Configuration

**VS Code Extensions (Recommended)**

```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

**VS Code Settings**

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.autoFixOnSave": true,
  "javascript.preferences.importModuleSpecifier": "relative"
}
```

---

## 📁 PROJECT STRUCTURE DEEP DIVE

### Server Architecture

```
server/
├── auth/                    # Authentication system
│   ├── authController.js    # JWT token management
│   ├── authMiddleware.js    # Authentication middleware
│   ├── authRoutes.js        # Authentication endpoints
│   └── userService.js       # User management
├── data/                    # JSON data files (fallback only)
│   ├── borrowers.json       # Borrower fallback data
│   ├── loans.json           # Loan fallback data
│   ├── payments.json        # Payment history fallback
│   └── collateral.json      # Collateral fallback data
├── middleware/              # Express middleware
│   ├── authMiddleware.js    # JWT validation
│   ├── errorHandler.js      # Global error handling
│   ├── logger.js            # Request logging
│   ├── requestContext.js    # Request correlation
│   └── tenantMiddleware.js  # Multi-tenant support
├── routes/                  # API endpoints
│   ├── auth.js              # Authentication routes
│   ├── loans.js             # Loan management
│   ├── borrowers.js         # Borrower management
│   ├── mcp.js               # MCP function endpoints
│   └── openai.js            # AI proxy endpoints
├── services/                # Business logic
│   ├── dataService.js       # Core business operations
│   ├── mcpDatabaseService.js # Database-integrated MCP (Primary)
│   ├── mcpService.js        # MCP protocol implementation
│   ├── openaiService.js     # OpenAI integration
│   └── logService.js        # Centralized logging
├── tests/                   # Test suites
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── mcp-core/            # MCP function tests
│   └── helpers/             # Test utilities
└── utils/                   # Utility functions
    ├── database.js          # Database connection management
    ├── validation.js        # Input validation
    └── mcpResponseFormatter.js # Response formatting
```

### Client Architecture

```
client/
├── public/                  # Static assets
│   ├── index.html           # Main HTML template
│   └── favicon.ico          # Application icon
├── src/                     # React application
│   ├── components/          # React components
│   │   ├── Chatbot.js       # AI conversation interface
│   │   ├── Dashboard.js     # Portfolio overview
│   │   ├── LoanDashboard.js # Loan management
│   │   └── SystemStatus.js  # Health monitoring
│   ├── hooks/               # Custom React hooks
│   │   └── useMcpFunction.js # MCP function calling
│   ├── mcp/                 # MCP client implementation
│   │   ├── client.js        # MCP protocol client
│   │   └── authService.js   # Authentication service
│   ├── tests/               # Component tests
│   │   ├── unit/            # Unit tests
│   │   ├── integration/     # Integration tests
│   │   └── mocks/           # Test mocks
│   ├── App.js               # Main application component
│   ├── index.js             # Application entry point
│   └── theme.js             # Material-UI theme
└── package.json             # Client dependencies
```

---

## 🔌 API REFERENCE

### Authentication Endpoints

```javascript
// POST /api/auth/login
{
  "username": "john.doe",
  "password": "password123"
}
// Response: { "token": "jwt-token", "user": {...} }

// POST /api/auth/refresh
{
  "refreshToken": "refresh-token"
}
// Response: { "token": "new-jwt-token" }

// POST /api/auth/logout
// Headers: Authorization: Bearer <token>
// Response: { "message": "Logged out successfully" }
```

### MCP Function Endpoints

```javascript
// GET /api/mcp/functions
// Response: Array of available MCP functions with schemas

// POST /api/mcp/execute
{
  "functionName": "getLoanDetails",
  "arguments": { "loan_id": "L001" }
}
// Response: Structured MCP response

// GET /api/mcp/loan/:loanId
// Response: Loan details via MCP function

// GET /api/mcp/borrower/:borrowerId
// Response: Borrower details via MCP function
```

### OpenAI Integration Endpoints

```javascript
// POST /api/openai/chat
{
  "messages": [
    { "role": "user", "content": "Show me loan L001" }
  ],
  "functions": [...],  // Optional, MCP functions auto-included
  "function_call": "auto"
}
// Response: Natural language formatted response
```

### System Health Endpoints

```javascript
// GET /api/system/status
{
  "status": "healthy",
  "timestamp": "2025-01-09T...",
  "services": {
    "mcp": { "functions_registered": 16 },
    "database": { "connected": true },
    "openai": { "available": true }
  },
  "performance": {
    "avg_response_time": "245ms",
    "memory_usage": "87MB"
  }
}

// GET /api/system/health
// Simple health check endpoint
// Response: 200 OK or 503 Service Unavailable
```

---

## 🗄️ DATABASE INTEGRATION

### SQL Server Setup (Windows)

```bash
# Install SQL Server LocalDB
# Download from: https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb

# Verify installation
sqllocaldb info

# Create database instance
sqllocaldb create "MSSQLLocalDB"
sqllocaldb start "MSSQLLocalDB"
```

### Docker Setup (Mac/Linux)

```bash
# Start SQL Server container
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" \
  -p 1433:1433 --name sql-server \
  -d mcr.microsoft.com/mssql/server:2019-latest

# Verify container is running
docker ps

# Connect to database
docker exec -it sql-server /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "YourStrong@Passw0rd"
```

### Database Schema Setup

```bash
# Create database and schema
cd server
node scripts/setupDatabase.js

# Migrate JSON data to database
node scripts/migrateJsonToDb.js

# Verify migration
node scripts/validateMigration.js
```

### Connection Configuration

```javascript
// server/utils/database.js
const sql = require("mssql");

const config = {
  server: process.env.DB_SERVER || "(localdb)\\\\MSSQLLocalDB",
  database: process.env.DB_NAME || "LoanOfficerDB",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false, // Use true for Azure
    trustServerCertificate: true,
    connectionTimeout: 15000,
    requestTimeout: 15000,
  },
};

class DatabaseManager {
  static async getConnection() {
    try {
      const pool = await sql.connect(config);
      return pool;
    } catch (error) {
      console.error("Database connection failed:", error);
      throw error;
    }
  }
}
```

---

## 🧪 TESTING FRAMEWORK

### Test Categories

```bash
# Run all tests
npm test                     # Comprehensive functional tests

# Server tests
cd server
npm run test:jest            # Jest unit tests
npm run test:mcp             # MCP function tests
npm run test:integration     # API integration tests
npm run test:database        # Database integration tests

# Client tests
cd client
npm test                     # React component tests
npm run test:coverage        # Test coverage report
```

### Writing MCP Function Tests

```javascript
// server/tests/mcp-core/test-loan-details.js
const mcpDatabaseService = require("../../services/mcpDatabaseService");

describe("MCP Loan Details Function", () => {
  beforeEach(async () => {
    // Setup test data
    await setupTestDatabase();
  });

  test("should return loan details for valid loan ID", async () => {
    const result = await mcpDatabaseService.getLoanDetails("L001");

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("loan_id", "L001");
    expect(result.data).toHaveProperty("loan_amount");
    expect(result.data).toHaveProperty("borrower_name");
  });

  test("should handle invalid loan ID gracefully", async () => {
    const result = await mcpDatabaseService.getLoanDetails("INVALID");

    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });
});
```

### Performance Testing

```javascript
// server/tests/helpers/performance-test.js
const { performance } = require("perf_hooks");

class PerformanceTest {
  static async measureFunction(fn, ...args) {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();

    return {
      result,
      duration: end - start,
      success: !result.error,
    };
  }

  static async benchmarkMCPFunctions() {
    const functions = [
      () => mcpService.getLoanDetails("L001"),
      () => mcpService.getBorrowerDefaultRisk("B001"),
      () => mcpService.getActiveLoans(),
    ];

    const results = [];
    for (const fn of functions) {
      const result = await this.measureFunction(fn);
      results.push(result);
    }

    return results;
  }
}
```

---

## 📊 MONITORING & LOGGING

### Log Configuration

```javascript
// server/services/logService.js
const winston = require("winston");

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    mcp: 3, // Custom MCP level
    debug: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    mcp: "magenta",
    debug: "blue",
  },
};

class LogService {
  constructor() {
    this.logger = winston.createLogger({
      levels: customLevels.levels,
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }

  mcp(message, meta = {}) {
    this.logger.log("mcp", message, {
      ...meta,
      category: "mcp-operation",
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Health Monitoring

```javascript
// server/routes/system.js
const express = require("express");
const router = express.Router();

router.get("/status", async (req, res) => {
  try {
    const status = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        mcp: {
          status: "operational",
          functions_registered: mcpFunctionRegistry.getCount(),
        },
        database: {
          status: (await testDatabaseConnection())
            ? "connected"
            : "disconnected",
          type:
            process.env.USE_DATABASE === "true"
              ? "sql_server"
              : "json_fallback",
        },
        openai: {
          status: process.env.OPENAI_API_KEY ? "available" : "not_configured",
        },
      },
      performance: {
        memory_usage: `${Math.round(
          process.memoryUsage().heapUsed / 1024 / 1024
        )}MB`,
        uptime: `${Math.round(process.uptime())}s`,
      },
    };

    res.json(status);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});
```

---

## 🚀 DEPLOYMENT GUIDE

### Production Environment Setup

```bash
# Environment variables for production
export NODE_ENV=production
export PORT=3001
export LOG_LEVEL=info
export ENABLE_FILE_LOGGING=true
export USE_DATABASE=true
export DB_SERVER=your-production-db-server
export DB_NAME=LoanOfficerDB
export OPENAI_API_KEY=your-production-api-key
export JWT_SECRET=your-secure-jwt-secret
```

### Build Process

```bash
# Build client for production
cd client
npm run build

# The build folder is ready to be deployed
# Copy build folder contents to your web server

# Server is ready for production
cd ../server
npm install --production
npm start
```

### PM2 Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'loan-officer-ai',
    script: 'server.js',
    cwd: './server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
};

# Start with PM2
npm2 start ecosystem.config.js

# Monitor processes
npm2 monit

# View logs
npm2 logs
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ .
RUN npm run build

# Setup server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .

# Final image
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/server .
COPY --from=builder /app/client/build ./public

EXPOSE 3001
CMD ["npm", "start"]
```

```bash
# Build and run Docker container
docker build -t loan-officer-ai .
docker run -p 3001:3001 \
  -e OPENAI_API_KEY=your-api-key \
  -e NODE_ENV=production \
  loan-officer-ai
```

---

## 🔧 TROUBLESHOOTING GUIDE

### Common Issues

#### Server Won't Start

```bash
# Check Node.js version
node --version  # Must be >= 16.0.0

# Check port availability
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Check environment variables
echo $OPENAI_API_KEY
echo $NODE_ENV

# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues

```bash
# Test database connection
node -e "require('./utils/database').testConnection()"

# Check SQL Server status
# Windows:
services.msc  # Look for SQL Server services

# Docker:
docker ps  # Check if SQL Server container is running
docker logs sql-server  # Check container logs

# Fallback to JSON files
export USE_DATABASE=false
npm start
```

#### OpenAI Integration Issues

```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check API usage
# Visit: https://platform.openai.com/usage

# Test without AI features
# Use direct MCP endpoints: /api/mcp/loan/L001
```

#### Memory Issues

```bash
# Monitor memory usage
node --max-old-space-size=4096 server.js

# Profile memory
node --inspect server.js
# Open Chrome DevTools for debugging

# Check for memory leaks
npm install -g clinic
clinic doctor -- node server.js
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
export DEBUG=*
npm start

# Node.js debugging
node --inspect-brk server.js
# Open chrome://inspect in Chrome

# VS Code debugging
# Add to .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/server/server.js",
  "env": {
    "NODE_ENV": "development",
    "LOG_LEVEL": "debug"
  }
}
```

---

## 🔐 SECURITY CONSIDERATIONS

### API Key Management

```bash
# Never commit API keys to version control
echo "*.env" >> .gitignore
echo "config/secrets.js" >> .gitignore

# Use environment variables
export OPENAI_API_KEY=sk-...

# For production, use secure secret management
# AWS Secrets Manager, Azure Key Vault, etc.
```

### Input Validation

```javascript
// server/utils/validation.js
const Joi = require("joi");

const loanIdSchema = Joi.string().pattern(/^L\d{3}$/);
const borrowerIdSchema = Joi.string().pattern(/^B\d{3}$/);

function validateLoanId(loanId) {
  const { error } = loanIdSchema.validate(loanId);
  if (error) {
    throw new Error(`Invalid loan ID: ${loanId}`);
  }
  return loanId;
}
```

### Rate Limiting

```javascript
// server/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});

app.use("/api/", limiter);
```

---

## 📈 PERFORMANCE OPTIMIZATION

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX IX_Loans_Status ON Loans(status);
CREATE INDEX IX_Loans_BorrowerId ON Loans(borrower_id);
CREATE INDEX IX_Payments_LoanId_Date ON Payments(loan_id, payment_date DESC);
```

### Caching Strategy

```javascript
// server/middleware/cache.js
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

function cacheMiddleware(duration = 600) {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached) {
      return res.json(cached);
    }

    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };

    next();
  };
}
```

### Bundle Optimization

```javascript
// client/webpack.config.js (if ejected)
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },
};
```

---

## 🎯 DEVELOPMENT BEST PRACTICES

### Code Style

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:security/recommended'
  ],
  rules: {
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-unused-vars': 'error'
  }
};

// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true
}
```

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/new-mcp-function
git add .
git commit -m "feat: add new MCP function for loan analysis"
git push origin feature/new-mcp-function

# Conventional commits
# feat: new feature
# fix: bug fix
# docs: documentation
# style: formatting
# refactor: code restructuring
# test: adding tests
# chore: maintenance
```

### Documentation

```javascript
/**
 * Calculate default risk for a borrower
 * @param {string} borrowerId - The borrower ID (format: B001)
 * @param {Object} options - Additional options
 * @param {boolean} options.includeHistory - Include payment history
 * @returns {Promise<Object>} Risk assessment result
 * @throws {Error} When borrower ID is invalid
 * @example
 * const risk = await calculateDefaultRisk('B001', { includeHistory: true });
 * console.log(risk.risk_score); // 0.25
 */
async function calculateDefaultRisk(borrowerId, options = {}) {
  // Implementation
}
```

---

## 🎉 CONCLUSION

**The LoanOfficerAI MCP Technical Guide provides comprehensive coverage** of:

- **✅ Development Setup**: Complete environment configuration
- **✅ API Integration**: Detailed endpoint documentation
- **✅ Database Management**: SQL Server and fallback strategies
- **✅ Testing Framework**: Unit, integration, and performance tests
- **✅ Deployment Procedures**: Production-ready deployment guides
- **✅ Monitoring & Logging**: Comprehensive observability setup
- **✅ Troubleshooting**: Common issues and solutions
- **✅ Security Best Practices**: API key management and input validation
- **✅ Performance Optimization**: Caching, indexing, and bundle optimization

**Status**: ✅ **COMPREHENSIVE TECHNICAL DOCUMENTATION**

This guide serves as the definitive technical reference for all aspects of the LoanOfficerAI MCP system, from initial setup through production deployment and ongoing maintenance.
