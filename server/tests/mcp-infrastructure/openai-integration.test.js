/**
 * OpenAI Integration Tests
 * 
 * Tests the complete flow from natural language query to 
 * function execution to natural language response.
 */
const request = require('supertest');
const app = require('../../server');
const authService = require('../../auth/authService');
const tokenService = require('../../auth/tokenService');

describe('OpenAI Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Generate a test token
    authToken = 'test-token';
  });

  describe('Phase 0: Diagnostic Tests', () => {
    test('OpenAI route should exist and be accessible', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Hello' }
          ]
        });

      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(500);
    });

    test('Should require authentication', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .send({
          messages: [
            { role: 'user', content: 'Hello' }
          ]
        });

      expect(response.status).toBe(401);
    });

    test('Should validate request body format', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing messages array
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Phase 1: Basic OpenAI Function Calling', () => {
    test('Should return natural language response for simple queries', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Hello, how are you?' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('role', 'assistant');
      expect(typeof response.body.content).toBe('string');
      expect(response.body.content.length).toBeGreaterThan(0);
    });

    test('Should identify and call getLoanDetails function', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Show me details for loan L001' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('role', 'assistant');

      // Should be natural language, not raw JSON
      expect(response.body.content).toMatch(/loan/i);
      expect(response.body.content).toMatch(/L001/i);
      expect(response.body.content).not.toMatch(/^\{/); // Should not start with {
      expect(response.body.content).not.toMatch(/\}$/); // Should not end with }
    });
  });

  describe('Phase 2: Data Path and Entity Resolution', () => {
    test('Should find existing borrower B001', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Tell me about borrower B001' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.content).toMatch(/B001/i);
      expect(response.body.content).not.toMatch(/not found|error/i);
      expect(response.body.content).toMatch(/borrower|farmer|credit/i);
    });

    test('Should handle case-insensitive loan IDs', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Show me loan l001 details' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.content).not.toMatch(/not found|error/i);
      expect(response.body.content).toMatch(/loan/i);
    });

    test('Should handle whitespace in entity IDs', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Tell me about borrower  B001  ' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.content).not.toMatch(/not found|error/i);
    });

    test('Should return helpful error for non-existent entities', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Show me loan L999' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.content).toMatch(/not found|doesn't exist|unable to find/i);
      expect(response.body.content).toMatch(/L999/);
    });
  });

  describe('Phase 3: All MCP Functions', () => {
    const testCases = [
      {
        name: 'getActiveLoans',
        query: 'Show me only active loans',
        expectedKeywords: ['active', 'loan']
      },
      {
        name: 'getLoansByBorrower',
        query: 'What loans does borrower B001 have?',
        expectedKeywords: ['B001', 'loan']
      },
      {
        name: 'evaluateCollateralSufficiency',
        query: 'Is the collateral sufficient for loan L001?',
        expectedKeywords: ['L001', 'collateral', 'sufficient']
      }
    ];

    testCases.forEach(({ name, query, expectedKeywords }) => {
      test(`Should handle ${name} function with natural language response`, async () => {
        const response = await request(app)
          .post('/api/openai/chat')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            messages: [
              { role: 'user', content: query }
            ]
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('content');
        expect(response.body).toHaveProperty('role', 'assistant');

        // Should be natural language
        expect(typeof response.body.content).toBe('string');
        expect(response.body.content.length).toBeGreaterThan(10);

        // Should not be raw JSON
        expect(response.body.content).not.toMatch(/^\{.*\}$/s);
        expect(response.body.content).not.toMatch(/^\[.*\]$/s);

        // Should contain expected keywords
        expectedKeywords.forEach(keyword => {
          expect(response.body.content.toLowerCase()).toMatch(
            new RegExp(keyword.toLowerCase())
          );
        });
      });
    });
  });

  describe('Phase 4: Error Handling', () => {
    test('Should handle OpenAI API errors gracefully', async () => {
      // Mock error by causing a syntax error in function arguments
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            // Complex message that might cause OpenAI to generate invalid arguments
            { role: 'user', content: 'Show me a detailed analysis of loan L001 with 50 data points and compare it to loans issued in the years 1995, 2005, and 2015 using metric #$@%' }
          ]
        });

      // Either handle gracefully with a 200 response or return a 500 with proper error message
      if (response.status === 200) {
        // Should be natural language error explanation
        expect(response.body.content).toMatch(/sorry|unable|error|couldn't|can't/i);
      } else {
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
      }
    });

    test('Should handle malformed function arguments', async () => {
      // This would test internal error handling when OpenAI returns malformed function calls
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Show me details for loan' } // Missing loan ID
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      // Should ask for clarification or provide helpful guidance
      expect(response.body.content).toMatch(/loan|ID|specify|which/i);
    });
  });

  describe('Phase 5: Performance and Quality', () => {
    test('Should respond within reasonable time', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Show me all active loans' }
          ]
        });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(15000); // Should respond within 15 seconds
    });

    test('Should maintain conversation context', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Show me loan L001' },
            { role: 'assistant', content: 'Here are the details for loan L001...' },
            { role: 'user', content: 'What is the collateral for this loan?' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.content).toMatch(/L001|collateral/i);
    });

    test('Should provide professional, helpful responses', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'What loans are available?' }
          ]
        });

      expect(response.status).toBe(200);

      const content = response.body.content.toLowerCase();
      // Should be professional (no casual language)
      expect(content).not.toMatch(/hey|yo|sup|dude/);

      // Should be helpful and informative
      expect(content.length).toBeGreaterThan(50);
      expect(content).toMatch(/loan|available|information/);
    });
  });
}); 