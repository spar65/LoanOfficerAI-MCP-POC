# LoanOfficerAI MCP - Linux Setup Guide

This guide provides step-by-step instructions for setting up the LoanOfficerAI MCP system on Linux with Docker SQL Server. Updated for full database integration and production-ready configuration.

## Prerequisites

- Linux system (Ubuntu 20.04+, CentOS 8+, or similar)
- Node.js 18+ and npm (recommended: use nvm for version management)
- Docker and Docker Compose
- Git
- OpenAI API key for full AI functionality

## Quick Setup

```bash
# Clone the repository
git clone <repository-url>
cd LoanOfficerAI-MCP-POC

# Run automated setup (installs dependencies, sets up database, migrates data, runs tests)
node setup-and-test.js
```

## Database Configuration

The system supports configurable database names and connection settings via environment variables or .env file.

### Default Configuration

```bash
DB_SERVER=localhost
DB_NAME=LoanOfficerDB
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
DB_PORT=1433
USE_DATABASE=true
```

### Custom Database Examples

**Development Environment:**

```bash
export DB_NAME=LoanOfficer_Dev
export DB_SERVER=localhost
node setup-database-complete.js
```

**Testing Environment:**

```bash
export DB_NAME=LoanOfficer_Test
export DB_SERVER=test-server
export DB_USER=testuser
export DB_PASSWORD=TestPass123
node setup-database-complete.js
```

**Production Environment:**

```bash
export DB_NAME=LoanOfficer_Prod
export DB_SERVER=prod-sql-server
export DB_USER=produser
export DB_PASSWORD=SecureProdPass
node setup-database-complete.js
```

### Configuration Priority

1. Environment variables (highest)
2. .env file
3. Defaults (lowest)

## Manual Setup Steps

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Server dependencies
cd server && npm install && cd ..

# Client dependencies
cd client && npm install && cd ..
```

### 2. Setup SQL Server with Docker

```bash
# Start SQL Server container
export DB_PASSWORD=YourStrong@Passw0rd
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=$DB_PASSWORD" \
  -p 1433:1433 --name sql-server \
  -d mcr.microsoft.com/mssql/server:2019-latest

# Wait for startup (30-60 seconds)
sleep 45
```

### 3. Create Database and Migrate Data

```bash
# Set configuration
export DB_NAME=LoanOfficerDB
export DB_SERVER=localhost
export DB_USER=sa
export DB_PASSWORD=YourStrong@Passw0rd
export USE_DATABASE=true

# Run complete setup and migration
node setup-database-complete.js
```

### 4. Configure Environment

Create `server/.env`:

```bash
# Database
DB_SERVER=localhost
DB_NAME=LoanOfficerDB
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
USE_DATABASE=true

# Server
PORT=3001
NODE_ENV=development

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Logging
MCP_LOG_LEVEL=debug
```

### 5. Start the Application

```bash
# Terminal 1: Start server
cd server && npm start

# Terminal 2: Start client
cd client && npm start
```

Access at http://localhost:3000

## Testing

```bash
# Run all tests (uses configured database)
npm test

# Test with custom database
export DB_NAME=TestDB
npm test
```

## Multiple Environments

```bash
# Dev instance
export DB_NAME=LoanOfficer_Dev
export PORT=3001
node setup-database-complete.js

# Test instance
export DB_NAME=LoanOfficer_Test
export PORT=3002
node setup-database-complete.js
```

## Troubleshooting

### Database Issues

1. **Check container:**

   ```bash
   docker ps | grep sql-server
   docker logs sql-server
   ```

2. **Test connection:**

   ```bash
   docker exec -it sql-server /opt/mssql-tools/bin/sqlcmd \
     -S localhost -U sa -P "$DB_PASSWORD" \
     -Q "SELECT name FROM sys.databases"
   ```

3. **Verify setup:**
   ```bash
   node test-db-connection.js
   ```

### Port Conflicts

```bash
export PORT=4000
export SERVER_PORT=4001
node start.js
```

### Permissions

```bash
sudo usermod -aG docker $USER
# Restart session
```

## Production Deployment

1. **Secure credentials:**

   ```bash
   export DB_PASSWORD=$(openssl rand -base64 32)
   ```

2. **Production config:**

   ```bash
   export NODE_ENV=production
   export USE_DATABASE=true
   ```

3. **Run setup:**
   ```bash
   node setup-database-complete.js
   ```

## Security Best Practices

- Use secure passwords
- Restrict database access
- Enable encryption
- Regular backups
- Follow logging standards (Rule 130)

## Next Steps

- Access: http://localhost:3000
- Login: john.doe / password123
- Test queries: "Show active loans"
- Review READMEs for more info

For issues, check logs in server/logs/ or run troubleshooting scripts.
