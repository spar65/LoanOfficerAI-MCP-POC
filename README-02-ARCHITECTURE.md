# README-02-ARCHITECTURE.md

# LoanOfficerAI MCP - System Architecture Overview

## 🏗️ ARCHITECTURAL VISION

**Design Philosophy**: Modern, AI-first agricultural lending platform built on Model Completion Protocol (MCP) for reliable, scalable, and intelligent loan management.

**Core Principles**:

- **AI-Native**: Every operation accessible through natural language
- **MCP-First**: Structured function calling ensures reliable AI interactions
- **Enterprise-Ready**: Production-grade security, monitoring, and scalability
- **Hybrid Resilience**: Database + JSON fallback for maximum reliability

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
│  │   (6 functions) │  │   (4 functions) │  │   (6 functions) │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA ACCESS LAYER                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   Repository    │  │   Connection    │  │   Fallback      │    │
│  │   Pattern       │  │   Pool Manager  │  │   Mechanism     │    │
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

## �� CORE ARCHITECTURAL COMPONENTS

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

**Repository Pattern**

- **Abstraction**: Clean separation between business logic and data access
- **Connection Management**: Pooled connections with retry logic
- **Fallback Strategy**: Automatic JSON file fallback on database failure
- **Transaction Support**: ACID compliance for data integrity

### 6. Persistence Layer

**Hybrid Data Strategy**

- **Primary**: SQL Server with connection pooling
- **Fallback**: JSON files for development and reliability
- **Audit Trail**: Complete operation logging for compliance
- **Backup Strategy**: Automated data protection (future)

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

6. DATABASE SERVICE
   ├─ Attempts SQL Server query
   ├─ Falls back to JSON if needed
   └─ Returns borrower risk data

7. OPENAI SERVICE (Second Call)
   ├─ Formats raw data into natural language
   ├─ Provides context and recommendations
   └─ Returns user-friendly response

8. REACT CLIENT
   ├─ Displays formatted response
   ├─ Updates conversation history
   └─ Logs interaction for analytics
```

### Traditional API Flow

```
1. API REQUEST
   └─ GET /api/loans/active

2. EXPRESS ROUTER
   ├─ Validates authentication
   ├─ Applies rate limiting
   └─ Routes to loan controller

3. LOAN CONTROLLER
   ├─ Validates request parameters
   ├─ Calls appropriate service method
   └─ Formats response

4. DATA SERVICE
   ├─ Queries database or JSON files
   ├─ Applies business logic
   └─ Returns processed data

5. HTTP RESPONSE
   ├─ JSON formatted data
   ├─ Appropriate status codes
   └─ CORS headers included
```

---

## 🔒 SECURITY ARCHITECTURE

### Authentication & Authorization

```javascript
// Multi-layer security approach
1. JWT Authentication
   ├─ Token-based stateless authentication
   ├─ Automatic token refresh
   └─ Role-based access control

2. API Key Protection
   ├─ OpenAI keys server-side only
   ├─ Environment variable configuration
   └─ No client-side exposure

3. Request Validation
   ├─ Input sanitization
   ├─ SQL injection prevention
   └─ XSS protection

4. Audit Logging
   ├─ All operations logged
   ├─ User action tracking
   └─ Compliance reporting
```

### Data Protection

- **Encryption**: TLS 1.3 for data in transit
- **PII Handling**: Automatic redaction in logs
- **Access Control**: Role-based permissions
- **Audit Trail**: Complete operation history

---

## 📊 MONITORING & OBSERVABILITY ARCHITECTURE

### Logging Strategy

```javascript
// Winston-based structured logging
const logLevels = {
  error: 0, // Critical failures
  warn: 1, // Potential issues
  info: 2, // General operations
  mcp: 3, // MCP protocol operations (custom)
  debug: 4, // Detailed debugging
};

// Log destinations
const transports = [
  new winston.transports.Console(), // Development
  new winston.transports.File({
    // Production
    filename: "error.log",
    level: "error",
  }),
  new winston.transports.File({
    filename: "mcp.log",
    level: "mcp",
  }),
];
```

### Health Monitoring

```javascript
// System health endpoints
GET /api/system/status
{
  "status": "healthy",
  "services": {
    "mcp": { "functions_registered": 16 },
    "database": { "connected": true },
    "openai": { "available": true }
  },
  "performance": {
    "avg_response_time": "245ms",
    "success_rate": "98.5%"
  }
}
```

### Performance Metrics

- **Response Time**: < 200ms for database queries
- **AI Response Time**: < 1500ms for complex queries
- **Availability**: 99.9% uptime target
- **Error Rate**: < 1% for production operations

---

## 🚀 SCALABILITY ARCHITECTURE

### Horizontal Scaling Strategy

```
┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   Load Balancer │
│   (Future)      │    │   (Future)      │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   App Server 1  │    │   App Server 2  │
│   (Node.js)     │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │   Database      │
            │   (SQL Server)  │
            └─────────────────┘
```

### Database Scaling

- **Connection Pooling**: 10 max connections per server
- **Read Replicas**: Future horizontal read scaling
- **Caching Layer**: Redis for frequently accessed data (future)
- **Partitioning**: Table partitioning for large datasets (future)

### Performance Optimization

- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Webpack bundle optimization
- **API Caching**: Response caching for static data
- **Database Indexing**: Optimized for MCP query patterns

---

## 🔧 DEPLOYMENT ARCHITECTURE

### Environment Strategy

```javascript
// Environment-specific configurations
const environments = {
  development: {
    database: { type: "json_fallback" },
    logging: { level: "debug", console: true },
    openai: { timeout: 30000 },
  },
  staging: {
    database: { type: "sql_server", pool: 5 },
    logging: { level: "info", files: true },
    openai: { timeout: 15000 },
  },
  production: {
    database: { type: "sql_server", pool: 10 },
    logging: { level: "warn", files: true },
    openai: { timeout: 10000 },
  },
};
```

### Container Strategy (Future)

```dockerfile
# Multi-stage Docker build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

---

## 📋 ARCHITECTURAL DECISIONS

### Technology Choices

| Component          | Technology      | Rationale                                    |
| ------------------ | --------------- | -------------------------------------------- |
| **Frontend**       | React 18        | Modern, component-based, excellent ecosystem |
| **Backend**        | Node.js/Express | JavaScript full-stack, rapid development     |
| **Database**       | SQL Server      | Enterprise-grade, excellent tooling          |
| **AI Provider**    | OpenAI GPT-4o   | Best-in-class function calling capabilities  |
| **Authentication** | JWT             | Stateless, scalable, industry standard       |
| **Logging**        | Winston         | Structured logging, multiple transports      |
| **Testing**        | Jest            | Comprehensive testing framework              |

### Design Patterns

- **Repository Pattern**: Clean data access abstraction
- **Service Layer**: Business logic separation
- **Middleware Pattern**: Cross-cutting concerns
- **Observer Pattern**: Event-driven logging
- **Strategy Pattern**: Fallback mechanisms

### Trade-offs & Considerations

**Chosen**: Hybrid database approach (SQL + JSON)

- ✅ **Pro**: Maximum reliability and development flexibility
- ⚠️ **Con**: Additional complexity in data access layer

**Chosen**: Server-side AI integration

- ✅ **Pro**: API key security, centralized control
- ⚠️ **Con**: Server dependency for AI features

**Chosen**: MCP protocol for AI functions

- ✅ **Pro**: Structured, reliable AI interactions
- ⚠️ **Con**: Learning curve for new protocol

---

## 🔮 FUTURE ARCHITECTURE EVOLUTION

### Phase 1: Enhanced Reliability (Next 3 months)

- **Database Migration**: Complete SQL Server integration
- **Caching Layer**: Redis for performance optimization
- **Load Balancing**: Multi-instance deployment
- **Monitoring**: Prometheus + Grafana dashboards

### Phase 2: Advanced Features (3-6 months)

- **Microservices**: Break monolith into focused services
- **Event Streaming**: Kafka for real-time data processing
- **ML Pipeline**: Custom risk models and predictions
- **Multi-tenant**: SaaS-ready architecture

### Phase 3: Enterprise Scale (6-12 months)

- **Kubernetes**: Container orchestration
- **Service Mesh**: Istio for service communication
- **Global Distribution**: Multi-region deployment
- **Advanced Security**: Zero-trust architecture

---

## 🎯 ARCHITECTURAL PRINCIPLES SUMMARY

### Core Principles

1. **AI-First Design**: Every operation accessible through natural language
2. **Reliability Over Performance**: Fallback mechanisms ensure availability
3. **Security by Design**: Multi-layer security with audit trails
4. **Scalability Ready**: Architecture supports horizontal scaling
5. **Developer Experience**: Clear patterns and comprehensive documentation

### Quality Attributes

- **Maintainability**: Clean code, clear separation of concerns
- **Testability**: Comprehensive test coverage at all layers
- **Observability**: Complete monitoring and logging
- **Extensibility**: Plugin architecture for new MCP functions
- **Performance**: Sub-second response times for core operations

**Status**: ✅ **ENTERPRISE-READY ARCHITECTURE**

The LoanOfficerAI MCP architecture successfully balances innovation with reliability, providing a solid foundation for AI-powered agricultural lending that can scale from POC to enterprise deployment.

### Trade-offs & Considerations

**Chosen**: Hybrid database approach (SQL + JSON)

- ✅ **Pro**: Maximum reliability and development flexibility
- ⚠️ **Con**: Additional complexity in data access layer

**Chosen**: Server-side AI integration

- ✅ **Pro**: API key security, centralized control
- ⚠️ **Con**: Server dependency for AI features
