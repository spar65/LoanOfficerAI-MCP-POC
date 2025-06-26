/**
 * Auth Fix Script
 * 
 * This script injects a test authentication token into the browser's localStorage.
 * Run this in the browser console to fix authentication issues for testing.
 */

// Set environment variable to allow test authentication
process.env.ALLOW_TEST_AUTH = 'true';

// Print instructions for fixing auth in the browser
console.log(`
===== AUTHENTICATION FIX INSTRUCTIONS =====

Copy and paste the following code into your browser console 
while on the client application page:

localStorage.setItem('loan_officer_auth_token', 'test-token');
localStorage.setItem('loan_officer_user', JSON.stringify({
  id: 'test-user',
  username: 'test-user',
  role: 'admin',
  tenantId: 'test-tenant',
  isTestUser: true
}));

console.log('Test authentication token set. Please refresh the page.');

===========================================
`);

// This is just a helper script, doesn't need to be executed
console.log('Authentication fix script loaded. Follow instructions above.'); 