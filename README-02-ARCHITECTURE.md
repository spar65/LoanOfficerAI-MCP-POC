# README-02-ARCHITECTURE.md

# LoanOfficerAI MCP - System Architecture Overview

## 🏗️ ARCHITECTURAL VISION

**Design Philosophy**: Modern, AI-first agricultural lending platform built on Model Completion Protocol (MCP) for reliable, scalable, and intelligent loan management.

**Core Principles**:

- **AI-Native**: Every operation accessible through natural language
- **MCP-First**: Structured function calling ensures reliable AI interactions
- **Enterprise-Ready**: Production-grade security, monitoring, and scalability
- **Database-First**: SQL Server with high-availability clustering (no JSON fallback)

---

## 🎯 SYSTEM OVERVIEW

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   React Web     │  │   Admin Panel   │  │   Mobile App    │    │
│  │   Application   │  │   (Future)      │  │   (Future)      │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   Express.js    │  │   JWT Auth      │  │   Rate Limiting │    │
│  │   Router        │  │   Middleware    │  │   & Validation  │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         AI ORCHESTRATION LAYER                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   OpenAI GPT-4o │  │   MCP Function  │  │   Response      │    │
│  │   Integration   │  │   Registry      │  │   Formatter     │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   Loan Services │  │   Risk Engine   │  │   Analytics     │    │
│  │   (5 functions) │  │   (3 functions) │  │   (8 functions) │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA ACCESS LAYER                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   MCP Database  │  │   Connection    │  │   Fallback      │    │
│  │   Service       │  │   Pool Manager  │  │   Mechanism     │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          PERSISTENCE LAYER                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   SQL Server    │  │   JSON Files    │  │   Audit Logs   │    │
│  │   (Primary)     │  │   (Fallback)    │  │   (Compliance)  │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔧 CORE ARCHITECTURAL COMPONENTS

### 1. Presentation Layer

**React Web Application**

- **Technology**: React 18 + Material-UI
- **Features**: Responsive design, real-time chat interface
- **Authentication**: JWT token-based with automatic refresh
- **State Management**: React hooks with context API

```javascript
// Component Architecture
src/
├── components/
│   ├── Chatbot.js           // AI conversation interface
│   ├── Dashboard.js         // Portfolio overview
│   ├── LoanDashboard.js     // Detailed loan management
│   └── SystemStatus.js      // Health monitoring
├── hooks/
│   └── useMcpFunction.js    // MCP function calling hook
└── mcp/
    ├── client.js           // MCP client implementation
    └── authService.js      // Authentication service
```

### 2. API Gateway Layer

**Express.js Server**

- **Port**: 3001 (configurable)
- **Middleware Stack**: Authentication, logging, error handling
- **Security**: CORS, helmet, rate limiting
- **Documentation**: OpenAPI/Swagger ready

```javascript
// Middleware Stack
app.use(helmet()); // Security headers
app.use(cors()); // Cross-origin requests
app.use(requestContextMiddleware); // Request tracking
app.use(requestLogger); // Request/response logging
app.use("/api/auth", authRoutes); // Authentication endpoints
app.use("/api/openai", openaiRoutes); // AI proxy endpoints
app.use("/api/mcp", mcpRoutes); // MCP function endpoints
app.use(errorHandler); // Global error handling
```

### 3. AI Orchestration Layer

**OpenAI Integration**

- **Model**: GPT-4o with function calling
- **Security**: Server-side API key management
- **Flow**: Two-phase AI interaction (function selection → result formatting)
- **Monitoring**: Token usage tracking, response time monitoring

**MCP Function Registry**

- **16 Functions**: Categorized by business domain
- **Schema Validation**: OpenAI-compatible function definitions
- **Execution Engine**: Centralized function calling with error handling
- **Response Formatting**: Consistent JSON structure across all functions

### 4. Business Logic Layer

**Domain Services**

- **Loan Services**: CRUD operations, portfolio management
- **Risk Engine**: Default risk, non-accrual risk, collateral assessment
- **Analytics Engine**: Predictive modeling, market analysis, restructuring

```javascript
// Service Architecture
services/
├── dataService.js           // Core business operations
├── mcpDatabaseService.js    // Database-integrated MCP functions
├── mcpService.js            // MCP protocol implementation
├── openaiService.js         // AI service integration
└── logService.js            // Centralized logging
```

### 5. Data Access Layer

**MCP Database Service**

- **Primary Integration**: SQL Server database with connection pooling
- **Fallback Strategy**: Automatic JSON file fallback on database failure
- **Transaction Support**: ACID compliance for data integrity
- **Performance Optimization**: Indexed queries and connection management

### 6. Persistence Layer

**Database-First Strategy**

- **Primary**: SQL Server with connection pooling and optimization
<!-- Legacy fallback bullet removed – system is now SQL-only -->
- **Audit Trail**: Complete operation logging for compliance
- **Schema Management**: Automatic database schema creation and migration

---

## 🔄 REQUEST FLOW ARCHITECTURE

### AI-Powered Query Flow

```
1. USER INPUT
   └─ "What's the default risk for borrower B001?"

2. REACT CLIENT
   ├─ Captures user input
   ├─ Adds to conversation history
   └─ Sends to server proxy

3. EXPRESS SERVER
   ├─ Validates JWT token
   ├─ Logs request with correlation ID
   └─ Forwards to OpenAI service

4. OPENAI SERVICE
   ├─ Analyzes query intent
   ├─ Selects appropriate MCP function
   └─ Returns function call instruction

5. MCP FUNCTION REGISTRY
   ├─ Validates function exists
   ├─ Executes getBorrowerDefaultRisk(B001)
   └─ Returns structured data

6. MCP DATABASE SERVICE
   ├─ Executes SQL Server query
   ├─ Falls back to JSON if needed
   └─ Returns borrower risk data from database

7. OPENAI SERVICE (Second Call)
   ├─ Formats raw data into natural language
   ├─ Provides context and recommendations
   └─ Returns user-friendly response

8. REACT CLIENT
   ├─ Displays formatted response
   ├─ Updates conversation history
   └─ Logs interaction for analytics
```

### Database Query Flow

```
1. MCP FUNCTION CALL
   └─ getBorrowerDefaultRisk("B001")

2. MCP DATABASE SERVICE
   ├─ Validates input parameters
   ├─ Constructs parameterized SQL query
   └─ Executes via connection pool

3. SQL SERVER DATABASE
   ├─ Executes query with optimized indexes
   ├─ Returns recordset with borrower data
   └─ Maintains connection pool efficiency

4. RESULT PROCESSING
   ├─ Extracts data from recordset
   ├─ Applies business logic calculations
   └─ Formats response for AI consumption

<!-- Deprecated fallback mechanism section removed – SQL-only architecture -->
```
