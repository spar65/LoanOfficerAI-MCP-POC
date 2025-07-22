# README-00b-START-GUIDE.md

# 🚀 Quick Start Guide - LoanOfficerAI MCP

## UAT Deployment - 4 Simple Steps

### Step 1: Install Dependencies (After Unzipping)

```bash
node bootstrap.js
```

**What this does:**

- 📦 Installs root dependencies (including dotenv)
- 🔧 Installs server dependencies
- 🎨 Installs client dependencies
- ✅ **ONLY** installs - no configuration

### Step 2: Check System Requirements

```bash
npm run check
```

**What this does:**

- ✅ Validates Node.js and npm versions
- ✅ Checks Docker installation and containers
- ✅ Verifies required files exist
- ✅ Tests database connectivity (required)
- ✅ Confirms environment readiness

### Step 3: Setup & Configure

```bash
npm run setup
```

**What this does:**

- 🔑 Prompts for OpenAI API key
- 📝 Creates environment files (.env)
- 🗄️ Sets up required database
- 🧪 Runs comprehensive tests
- 🔧 Fixes any issues found

### Step 4: Start the Application

```bash
npm start
```

**What this does:**

- ✅ Validates project setup
- 🖥️ Launches server on port 3001
- 🌐 Launches client on port 3000
- 📱 Opens browser to http://localhost:3000

## One-Line UAT Flow

```bash
node bootstrap.js && npm run check && npm run setup && npm start
```

## Alternative: Manual Dependencies

If `node bootstrap.js` fails:

```bash
# Install dependencies manually
npm install
cd server && npm install
cd ../client && npm install
cd ..

# Then continue with normal flow
npm run check && npm run setup && npm start
```

## Development Mode

For ongoing development work:

```bash
npm run dev    # Same as npm start
```

### Manual Terminal Management

```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

## Testing

```bash
npm test           # Run all tests
npm run test:server # Server tests only
npm run test:client # Client tests only
```

## Cleanup & Reset

```bash
npm run clean      # Remove all node_modules
npm run reset      # Clean + install + setup
```

## What You'll See

After `npm start`:

1. **✅ System Validation** - Quick checks pass
2. **🖥️ Server Terminal** - New window with server logs
3. **🌐 Client Terminal** - New window with React app
4. **📱 Browser Opens** - Automatic launch to http://localhost:3000
5. **🎯 Ready to Demo** - Full AI agricultural lending system

## Common UAT Issues & Solutions

### "Cannot find module 'dotenv'"

**Cause**: Dependencies not installed  
**Solution**: Run `node bootstrap.js` first

### "Port already in use"

**Cause**: Something using ports 3000/3001  
**Solution**: Run `npm run check` to identify conflicts

### "Database connection failed"

**Cause**: Database not configured  
**Solution**: Database is required - ensure SQL Server is running and .env is configured

### "OpenAI API key required"

**Cause**: No API key configured  
**Solution**: Get key from https://platform.openai.com/api-keys

## What's Running

- **Server**: http://localhost:3001 (API + MCP functions)
- **Client**: http://localhost:3000 (React UI + Chatbot)
- **Database**: SQL Server (required for operation)

## Test the Chatbot

Once running, try these queries:

- "Show me all active loans"
- "What's the risk assessment for borrower B001?"
- "Find high-risk agricultural borrowers"
- "Calculate collateral sufficiency for loan L003"

## Summary: Perfect UAT Flow

1. **Unzip** the project
2. **Bootstrap**: `node bootstrap.js` (install dependencies)
3. **Check**: `npm run check` (verify system)
4. **Setup**: `npm run setup` (configure everything)
5. **Start**: `npm start` (launch application)
6. **Test**: Use the chatbot and dashboard
