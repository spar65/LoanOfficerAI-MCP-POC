# Database Integration Guide for MCP Loan Management System

This guide provides a comprehensive overview of the SQL Server database integration for the Loan Officer AI MCP application.

## 🚀 Overview

The MCP Loan Management System has been enhanced with a SQL Server database backend, replacing the JSON file-based data storage with a robust relational database system. This change offers several benefits:

1. **Improved Performance**: SQL queries are optimized for data retrieval and filtering
2. **Data Integrity**: Relational constraints ensure data consistency
3. **Concurrent Access**: Multiple users can access the system simultaneously
4. **Scalability**: Better handling of large datasets
5. **Security**: Enhanced data access controls and auditing

## 🏗️ Architecture

The database integration follows a layered architecture:

1. **Database Layer**: SQL Server database with normalized schema
2. **Data Access Layer**: DatabaseManager utility for connection and query execution
3. **Repository Layer**: Entity-specific repositories implementing data access patterns
4. **Service Layer**: mcpDatabaseService providing business logic
5. **API Layer**: MCP server exposing database functionality through MCP tools

## 🔧 Configuration

### Environment Variables

Database connection is controlled through environment variables in the `.env` file:

```
DB_SERVER=(localdb)\\MSSQLLocalDB   # SQL Server address
DB_NAME=LoanOfficerDB               # Database name
DB_USER=                           # Optional: SQL authentication username
DB_PASSWORD=                       # Optional: SQL authentication password
USE_DATABASE=true                  # Set to 'true' to use database, 'false' to use JSON files
```

### Connection Options

The DatabaseManager supports the following connection options:

- **Windows Authentication**: Default when no DB_USER/DB_PASSWORD provided
- **SQL Authentication**: Used when DB_USER and DB_PASSWORD are provided
- **Connection Pooling**: Manages connection reuse
- **Automatic Retries**: Implements exponential backoff for connection failures

## 📊 Database Schema

### Core Tables

- **Users**: Authentication and authorization information
- **Borrowers**: Agricultural borrower details with risk profiles
- **Loans**: Loan information with AI approval recommendations
- **Collateral**: Loan collateral with valuation data
- **Payments**: Loan payment history and status tracking
- **Equipment**: Farm equipment tracking with depreciation

### MCP-Specific Tables

- **MCPConversations**: Tracks AI interactions and sessions
- **AIRecommendations**: Stores AI-generated insights and advice
- **AuditLog**: Records changes made by AI vs. humans
- **LoanAnalysis**: Stores detailed AI analysis of loans

## 🔄 Data Migration

The system includes utilities for migrating data from JSON files to the database:

1. **Initial Setup**: `scripts/dbSetup.sh` creates the database schema
2. **Data Migration**: `scripts/migrateJsonToDb.js` transfers data from JSON to SQL
3. **Verification**: The migration process includes validation steps

### Migration Command

```bash
npm run migrate
```

## 🛠️ Implementation Details

### Database Manager (`utils/database.js`)

The `DatabaseManager` provides a robust interface for database operations:

- Connection management with retry logic
- Parameterized query execution
- Transaction support
- Error handling and logging

### MCP Database Service (`services/mcpDatabaseService.js`)

This service implements MCP function logic using the database:

- Borrower risk assessment
- Loan collateral evaluation
- Payment tracking
- AI recommendation storage

### MCP Server Integration

The MCP server has been updated to:

- Initialize database connections on startup
- Use database services for data retrieval
- Fall back to JSON data if database access fails
- Include database status in health checks
- Implement graceful shutdown of database connections

## 🔍 Fallback Mechanism

The system includes a fallback mechanism that automatically reverts to JSON file storage when:

1. The `USE_DATABASE` environment variable is set to `false`
2. A database connection cannot be established
3. A database query fails during MCP function execution

This ensures system reliability during database maintenance or in environments without database access.

## 🧪 Testing

### Database Tests

Run the database integration tests:

```bash
npm test -- --testPathPattern=database
```

### Health Check

Verify database connectivity through the health endpoint:

```bash
curl http://localhost:3001/api/health
```

## 📝 Migration Notes

When migrating from JSON files to the database:

1. Ensure data consistency before migration
2. Run migration in a staging environment first
3. Back up JSON files before migration
4. Monitor database performance after migration
5. Validate all MCP functions with database mode enabled

## 🛡️ Best Practices

1. Use parameterized queries to prevent SQL injection
2. Implement connection pooling for performance
3. Close database connections during application shutdown
4. Add indexes for frequently queried columns
5. Use transactions for multi-step operations

---

## 🔄 Switching Between JSON and Database Mode

The system can be switched between JSON files and database mode by changing the `USE_DATABASE` environment variable:

1. Set `USE_DATABASE=false` to use JSON files
2. Set `USE_DATABASE=true` to use the SQL Server database

After changing this setting, restart the application for the changes to take effect.

## 📚 Additional Resources

- [SQL Server Documentation](https://docs.microsoft.com/en-us/sql/sql-server/)
- [Node.js SQL Server Driver](https://github.com/tediousjs/node-mssql)
- [Database Schema Diagram](docs/database-schema.png)

# Docker SQL Server Configuration and Troubleshooting

## Docker SQL Server Setup

For macOS users, SQL Server LocalDB is not available. Instead, we use Docker to run SQL Server:

1. Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Run SQL Server container:
   ```bash
   docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" \
      -p 1433:1433 --name sql-server \
      -d mcr.microsoft.com/mssql/server:2019-latest
   ```

## Connection Configuration

Update your `.env` file with the following settings:

```
# Database Configuration
DB_SERVER=localhost
DB_NAME=LoanOfficerDB
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
USE_DATABASE=true
```

## Common Issues and Solutions

### Connection String Format

When connecting to SQL Server in Docker:

- Use `localhost` as the server name (not `localhost,1433` or `(localdb)\MSSQLLocalDB`)
- Set the port explicitly in the connection configuration
- Ensure Docker container is running before testing

### SQL Query Syntax

- Use standard SQL query syntax with parameterized queries
- Replace template literal syntax (query\`SELECT _ FROM table\`) with string syntax (`query('SELECT _ FROM table')`)
- Use proper parameter naming in queries

### Table Schema

- Ensure column names match exactly in queries (e.g., `loan_id` not `id`)
- Check case sensitivity in table and column names
- Verify foreign key relationships are properly set up

## Testing Database Connection

Run the database integration tests to verify your connection:

```bash
node run-db-tests.js
```

This will:

1. Connect to SQL Server
2. Create database and tables if they don't exist
3. Insert test data
4. Run test queries
5. Clean up test data
