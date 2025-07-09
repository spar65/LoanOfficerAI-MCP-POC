#!/usr/bin/env node
require('dotenv').config();

// Test script to debug loan lookup issue
async function testLoanLookup() {
  console.log('🔍 DIRECT LOAN LOOKUP TEST');
  console.log('========================\n');
  
  try {
    // Test 1: Direct database query
    console.log('1. Testing direct database query...');
    const db = require('./utils/database');
    const directResult = await db.executeQuery(
      'SELECT * FROM Loans WHERE loan_id = @loanId',
      { loanId: 'L001' }
    );
    console.log(`   ✅ Direct query found ${directResult.recordset.length} records`);
    
    // Test 2: Service method (fresh require)
    console.log('\n2. Testing service method (fresh require)...');
    delete require.cache[require.resolve('./server/services/mcpDatabaseService')];
    const mcpDatabaseService = require('./server/services/mcpDatabaseService');
    
    try {
      const serviceResult = await mcpDatabaseService.getLoanDetails('L001');
      console.log('   ✅ Service method succeeded:', serviceResult.loan_id);
    } catch (error) {
      console.log('   ❌ Service method failed:', error.message);
    }
    
    // Test 3: Check what the server path would resolve to
    console.log('\n3. Checking server module paths...');
    const path = require('path');
    const serverPath = path.join(__dirname, 'server', 'routes', 'mcp.js');
    const servicePath = path.join(__dirname, 'services', 'mcpDatabaseService.js');
    console.log('   Server route path:', serverPath);
    console.log('   Service path from route:', path.resolve(path.dirname(serverPath), '../../services/mcpDatabaseService.js'));
    console.log('   Actual service path:', servicePath);
    console.log('   Paths match:', path.resolve(path.dirname(serverPath), '../../services/mcpDatabaseService.js') === servicePath);
    
    // Test 4: Simulate server environment
    console.log('\n4. Simulating server environment...');
    process.chdir(path.join(__dirname, 'server'));
    console.log('   Changed to server directory:', process.cwd());
    
    // Clear cache and require from server perspective
    delete require.cache[require.resolve('./services/mcpDatabaseService')];
    const serverMcpService = require('./services/mcpDatabaseService');
    
    try {
      const serverResult = await serverMcpService.getLoanDetails('L001');
      console.log('   ✅ Server perspective succeeded:', serverResult.loan_id);
    } catch (error) {
      console.log('   ❌ Server perspective failed:', error.message);
    }
    
    await db.disconnect();
    console.log('\n✅ Test complete');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testLoanLookup(); 