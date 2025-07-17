# LoanOfficerAI MCP - Testing Workflow

## 🧪 How to Test Fresh Deployment

### Step 1: Check Current System

```bash
node check-system.js
```

This shows what you currently have installed.

### Step 2: Clean Slate Test (Optional)

If you want to test from a truly fresh state:

```bash
# Stop and remove existing containers
docker stop sql-server 2>/dev/null || true
docker rm sql-server 2>/dev/null || true

# Remove environment files (backup first if needed)
mv .env .env.backup 2>/dev/null || true
mv server/.env server/.env.backup 2>/dev/null || true

# Check system again - should show missing items
node check-system.js
```

### Step 3: Run Automated Setup

```bash
# Run the complete automated setup
node setup-database-complete.js --auto
```

This will:

- ✅ Check/install Docker and SQL Server
- ✅ Create fresh database with configurable name
- ✅ Import all 10+ loans and complete dataset
- ✅ Run comprehensive verification (5 phases)
- ✅ Show you're ready to go

### Step 4: Verify Everything Works

```bash
# Check system again - should show everything installed
node check-system.js

# Run the comprehensive test suite (70 tests)
npm test

# OR run functional POC tests (13 tests)
npm run test:mcp
```

### Step 5: Start the Application

```bash
# Terminal 1: Start backend
cd server && npm start

# Terminal 2: Start frontend
cd client && npm start
```

## 🎯 Testing in New Location

To test deployment to a completely new location:

1. **Zip the project** (excluding node_modules and .env):

```bash
zip -r loanofficer-ai-mcp.zip . -x "node_modules/*" "*/node_modules/*" ".env" "server/.env"
```

2. **Copy to new location** and extract

3. **Run system check**:

```bash
node check-system.js
```

4. **Install dependencies** (if missing):

```bash
# Use bootstrap script for all dependencies
node bootstrap.js

# OR manually (if bootstrap script fails):
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

5. **Run automated setup**:

```bash
node setup-database-complete.js --auto
```

## 📊 Expected Results

**Before Setup (Fresh System):**

- ✅ Node.js, npm, Git, Docker installed
- ❌ No SQL Server container
- ❌ No .env files
- ❌ No database

**After Setup:**

- ✅ SQL Server container running
- ✅ Database created with configurable name
- ✅ All data imported (10 borrowers, 10 loans, 21 payments, etc.)
- ✅ Environment files configured
- ✅ All tests passing (70/70)
- ✅ Ready for production use

## 🔧 Troubleshooting

If setup fails:

1. Check Docker is running: `docker info`
2. Check system requirements: `node check-system.js`
3. Run setup in interactive mode: `node setup-database-complete.js`
4. Check logs for specific error messages

## 🎉 Success Indicators

You know it's working when:

- System check shows all green checkmarks
- Setup script completes all 5 verification phases
- Test suite shows 70/70 tests passing
- You can start both server and client successfully

> **Testing Update:** All fallback test paths have been removed; tests fail if SQL DB is unreachable.
