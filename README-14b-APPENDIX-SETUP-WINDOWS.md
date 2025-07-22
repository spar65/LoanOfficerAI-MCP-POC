# README-14b-APPENDIX-SETUP-WINDOWS.md

# LoanOfficerAI MCP - Windows Setup Guide

This guide provides step-by-step instructions for setting up the LoanOfficerAI MCP system on Windows with SQL Server LocalDB or Express. Updated for full database integration and production-ready configuration.

> **NOTE:** This appendix reflects a mandatory SQL Server setup—no JSON fallback files are used.

## Prerequisites

- Windows 10/11 or Windows Server 2019+
- Node.js 18+ and npm (download from nodejs.org or use nvm-windows)
- Git
- SQL Server 2019+ (Express edition recommended for development)
- OpenAI API key for full AI functionality
- PowerShell or Command Prompt

## Quick Setup

```powershell
# Clone the repository
git clone <repository-url>
cd LoanOfficerAI-MCP-POC

# Run automated setup (installs dependencies, sets up database, migrates data, runs tests)
node setup-and-test.js
```

## Database Configuration

The system supports configurable database names and connection settings via environment variables or .env file. For Windows, we recommend SQL Server LocalDB for development.

### Default Configuration (LocalDB)

```powershell
$env:DB_SERVER='(localdb)\MSSQLLocalDB'
$env:DB_NAME='LoanOfficerDB'
$env:DB_USER='sa'  # Or Windows Authentication
$env:DB_PASSWORD='YourStrong@Passw0rd'  # If using SQL auth
$env:USE_DATABASE='true'
```

### Custom Database Examples

**Development Environment (LocalDB):**

```powershell
$env:DB_NAME='LoanOfficer_Dev'
$env:DB_SERVER='(localdb)\MSSQLLocalDB'
node setup-database-complete.js
```

**Testing Environment (SQL Express):**

```powershell
$env:DB_NAME='LoanOfficer_Test'
$env:DB_SERVER='localhost\SQLEXPRESS'
$env:DB_USER='testuser'
$env:DB_PASSWORD='TestPass123'
node setup-database-complete.js
```

**Production Environment (Remote SQL):**

```powershell
$env:DB_NAME='LoanOfficer_Prod'
$env:DB_SERVER='prod-sql-server'
$env:DB_USER='produser'
$env:DB_PASSWORD='SecureProdPass'
node setup-database-complete.js
```

### Configuration Priority

1. Environment variables (highest)
2. .env file
3. Defaults (lowest)

## Manual Setup Steps

### 1. Install Dependencies

```powershell
# Use bootstrap script for all dependencies
node bootstrap.js

# OR manually (if bootstrap script fails):
# Root dependencies
npm install

# Server dependencies
cd server; npm install; cd ..

# Client dependencies
cd client; npm install; cd ..
```

### 2. Setup SQL Server

- Download and install SQL Server Express from Microsoft
- Or use LocalDB (included with Visual Studio or SQL Server Management Studio)
- Enable TCP/IP in SQL Server Configuration Manager
- Create initial database if needed via SSMS

### 3. Create Database and Migrate Data

```powershell
# Set configuration
$env:DB_NAME='LoanOfficerDB'
$env:DB_SERVER='(localdb)\MSSQLLocalDB'
$env:DB_USER='sa'
$env:DB_PASSWORD='YourStrong@Passw0rd'
$env:USE_DATABASE='true'

# Run complete setup and migration
node setup-database-complete.js
```

### 4. Configure Environment

Create `server\.env`:

Database
DB_SERVER=(localdb)\MSSQLLocalDB
DB_NAME=LoanOfficerDB
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
USE_DATABASE=true
Server
PORT=3001
NODE_ENV=development
OpenAI
OPENAI_API_KEY=your_openai_api_key_here
Logging
MCP_LOG_LEVEL=debug

### 5. Start the Application

- Open two Command Prompt/PowerShell windows

Window 1:

```powershell
cd server
npm start
```

Window 2:

```powershell
cd client
npm start
```

Access at http://localhost:3000

## Testing

```powershell
# Run all tests (uses configured database)
npm test

# Test with custom database
$env:DB_NAME='TestDB'
npm test
```

## Multiple Environments

```powershell
# Dev instance
$env:DB_NAME='LoanOfficer_Dev'
$env:PORT='3001'
node setup-database-complete.js

# Test instance
$env:DB_NAME='LoanOfficer_Test'
$env:PORT='3002'
node setup-database-complete.js
```

## Troubleshooting

### Database Issues

1. **Check SQL Server service:**

   - Open SQL Server Configuration Manager
   - Ensure SQL Server (instance) is running

2. **Test connection (PowerShell):**

   ```powershell
   Invoke-Sqlcmd -ServerInstance '(localdb)\MSSQLLocalDB' -Query 'SELECT name FROM sys.databases' -Username sa -Password 'YourStrong@Passw0rd'
   ```

3. **Verify setup:**
   ```powershell
   node test-db-connection.js
   ```

### Port Conflicts

```powershell
$env:PORT='4000'
$env:SERVER_PORT='4001'
node start.js
```

### Permissions

- Run Command Prompt as Administrator if needed
- Ensure SQL Server has proper user permissions

## Production Deployment

1. **Secure credentials:**

   ```powershell
   $env:DB_PASSWORD = (New-Guid).ToString()
   ```

2. **Production config:**

   ```powershell
   $env:NODE_ENV='production'
   $env:USE_DATABASE='true'
   ```

3. **Run setup:**
   ```powershell
   node setup-database-complete.js
   ```

## Security Best Practices

- Use secure passwords/Windows Authentication
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
