/**
 * Test token generator
 * Generates a valid JWT token for testing the API
 */
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./server/auth/config');

// Create a test user object
const testUser = {
  id: 'test-user',
  username: 'testuser',
  role: 'tester',
  tenantId: 'test-tenant'
};

// Generate a token
const token = jwt.sign(testUser, jwtSecret, { expiresIn: '1h' });

console.log('\n===== TEST TOKEN =====');
console.log(token);
console.log('\n===== USE THIS IN YOUR REQUESTS =====');
console.log(`Authorization: Bearer ${token}`);
console.log('\n===== FOR CURL =====');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3001/api/openai/chat`);
console.log('\n===== FOR TEST SCRIPT =====');
console.log(`const TEST_TOKEN = '${token}';`);
console.log('\n===== Token expires in 1 hour ====='); 