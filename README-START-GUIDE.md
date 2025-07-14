# 🚀 Quick Start Guide - LoanOfficerAI MCP

## Three Simple Steps

### 1. Check Your System

```bash
npm run check
```

**What this does:**

- ✅ Validates Node.js and npm versions
- ✅ Checks Docker installation and containers
- ✅ Verifies required files exist
- ✅ Tests database connectivity
- ✅ Confirms environment readiness

### 2. Setup Everything

```bash
npm run setup
```

**What this does:**

- 🔑 Prompts for OpenAI API key
- 📝 Creates environment files
- 📦 Installs all dependencies (server + client)
- 🗄️ Sets up database (optional)
- 🧪 Runs comprehensive tests
- 🔧 Fixes any issues found

### 3. Start the Application

```bash
npm start
```

**What this does:**

- ✅ Validates project setup
- 🖥️ Launches server on port 3001 (in new terminal)
- 🌐 Launches client on port 3000 (in new terminal)
- 📱 Opens browser automatically to http://localhost:3000
- 📊 Monitors both processes

## Super Simple - One Line Summary

```bash
npm check && npm setup && npm start
```

## Alternative Commands

### Development Mode

```bash
npm run dev
```

Same as `npm start` - launches both server and client automatically.

### Manual Terminal Setup

If you prefer to manage terminals yourself:

```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

### Testing

```bash
npm test           # Run all tests
npm run test:server # Server tests only
npm run test:client # Client tests only
```

### Cleanup & Reset

```bash
npm run clean      # Remove all node_modules
npm run reset      # Clean + install + setup
```

## What You'll See

After running `npm start`, you'll see:

1. **✅ System Validation** - Quick checks pass
2. **🖥️ Server Terminal** - New window with server logs
3. **🌐 Client Terminal** - New window with React app
4. **📱 Browser Opens** - Automatic launch to http://localhost:3000
5. **🎯 Ready to Demo** - Full AI agricultural lending system

## Troubleshooting

If something goes wrong:

1. **Check System**: `npm check` - See what's missing
2. **Reset Everything**: `npm run reset` - Clean slate
3. **Manual Setup**: Follow individual terminal commands above

## What's Running

- **Server**: http://localhost:3001 (API + MCP functions)
- **Client**: http://localhost:3000 (React UI + Chatbot)
- **Database**: SQL Server container (if configured)

## Next Steps

Once running, try these in the chatbot:

- "Show me all active loans"
- "What's the risk assessment for borrower 1?"
- "Find high-risk agricultural borrowers"
- "Calculate collateral sufficiency for loan 3"
