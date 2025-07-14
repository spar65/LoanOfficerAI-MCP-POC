# LoanOfficerAI MCP - Linux Setup Guide

This guide provides step-by-step instructions for setting up the LoanOfficerAI MCP system on Linux with Docker SQL Server.

## Prerequisites

- Linux system (Ubuntu 18.04+, CentOS 7+, or similar)
- Node.js 16+ and npm
- Docker and Docker Compose
- Git

## Quick Setup

```bash
# Clone the repository
git clone <repository-url>
cd LoanOfficerAI-MCP-POC

# Run automated setup (will install dependencies, setup database, run tests)
node setup.js
```

## Database Configuration

The system supports configurable database names and connection settings. You can customize these via environment variables:

### Default Configuration

```bash
DB_NAME=LoanOfficerAI_MCP_POC
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
DB_PORT=1433
```

### Custom Database Name Examples

**Example 1: Development Environment**

```bash
export DB_NAME=LoanOfficerAI_Dev
export DB_SERVER=localhost
node setup.js
```

**Example 2: Testing Environment**

```bash
export DB_NAME=LoanOfficerAI_Test
export DB_SERVER=test-server.company.com
export DB_USER=testuser
export DB_PASSWORD=TestPassword123
node setup.js
```

**Example 3: Production Environment**

```bash
export DB_NAME=LoanOfficerAI_Production
export DB_SERVER=prod-sql.company.com
export DB_USER=produser
export DB_PASSWORD=SecureProductionPassword
node setup.js
```

### Environment Variable Priority

The system uses the following priority order:

1. Environment variables (highest priority)
2. .env file values
3. Default values (lowest priority)

## Manual Setup Steps

If you prefer manual setup or need to troubleshoot:

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Setup SQL Server with Docker

```bash
# Start SQL Server container with custom database name
export DB_NAME=MyCustomDatabase

docker run -e "ACCEPT_EULA=Y" \
  -e "SA_PASSWORD=YourStrong@Passw0rd" \
  -p 1433:1433 \
  --name sql-server \
  -d mcr.microsoft.com/mssql/server:2019-latest

# Wait for SQL Server to start (about 30 seconds)
sleep 30
```

### 3. Create Database and Migrate Data

```bash
# Set your custom database configuration
export DB_NAME=MyCustomDatabase
export DB_SERVER=localhost
export DB_USER=sa
export DB_PASSWORD=YourStrong@Passw0rd

# Run database setup
node setup.js
```

### 4. Configure Environment

Create `.env` file in the project root:

```bash
# Database Configuration
DB_SERVER=localhost
DB_NAME=MyCustomDatabase
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
USE_DATABASE=true
NODE_ENV=development
PORT=3000

# OpenAI API Key (optional for basic testing)
OPENAI_API_KEY=your_openai_api_key_here
```

### 5. Start the Application

```bash
# Terminal 1: Start the server
cd server && npm start

# Terminal 2: Start the client
cd client && npm start
```

## Testing with Custom Database

The test suite automatically uses the configured database:

```bash
# Run tests with default database
npm test

# Run tests with custom database
export DB_NAME=MyTestDatabase
npm test
```

## Multiple Environment Setup

You can run multiple instances with different database names:

```bash
# Development instance
export DB_NAME=LoanOfficerAI_Dev
export PORT=3001
node setup.js

# Testing instance
export DB_NAME=LoanOfficerAI_Test
export PORT=3002
node setup.js

# Each will have its own isolated database
```

## Troubleshooting

### Database Connection Issues

1. **Check Docker container**:

   ```bash
   docker ps | grep sql-server
   docker logs sql-server
   ```

2. **Test database connection**:

   ```bash
   docker exec -it sql-server /opt/mssql-tools/bin/sqlcmd \
     -S localhost -U sa -P "YourStrong@Passw0rd" \
     -Q "SELECT name FROM sys.databases"
   ```

3. **Verify database exists**:
   ```bash
   export DB_NAME=YourDatabaseName
   node -e "
   require('dotenv').config();
   const sql = require('mssql');
   sql.connect({
     server: process.env.DB_SERVER || 'localhost',
     database: process.env.DB_NAME,
     user: process.env.DB_USER || 'sa',
     password: process.env.DB_PASSWORD,
     options: { encrypt: false, trustServerCertificate: true }
   }).then(() => console.log('Connected to', process.env.DB_NAME))
   .catch(err => console.error('Connection failed:', err.message));
   "
   ```

### Port Conflicts

If ports 3000/3001 are in use:

```bash
export PORT=4000
export SERVER_PORT=4001
node setup.js
```

### Permission Issues

Ensure Docker has proper permissions:

```bash
sudo usermod -aG docker $USER
# Log out and back in, or restart your session
```

## Production Deployment

For production deployment:

1. **Use secure passwords**:

   ```bash
   export DB_PASSWORD=$(openssl rand -base64 32)
   ```

2. **Use production database server**:

   ```bash
   export DB_SERVER=your-production-sql-server.com
   export DB_NAME=LoanOfficerAI_Production
   ```

3. **Set production environment**:

   ```bash
   export NODE_ENV=production
   export USE_DATABASE=true
   ```

4. **Run setup**:
   ```bash
   node setup.js
   ```

## Security Considerations

- Change default SQL Server password
- Use environment variables for sensitive data
- Enable SQL Server encryption in production
- Use firewall rules to restrict database access
- Regular database backups

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the logs in `server/logs/`
3. Run `node setup.js` to re-validate your environment
4. Check that all environment variables are properly set

## Next Steps

After successful setup:

1. Access the application at `http://localhost:3000`
2. Login with test credentials: `john.doe` / `password123`
3. Try the AI chatbot with queries like "Show me all active loans"
4. Review the documentation in the project README files
