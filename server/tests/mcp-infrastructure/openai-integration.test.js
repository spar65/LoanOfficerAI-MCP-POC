/**
 * OpenAI Integration Tests
 * 
 * Tests the complete flow from natural language query to 
 * function execution to natural language response.
 */
const request = require('supertest');
const { app, init } = require('../../server'); // Fix: destructure app and init from server export
const authService = require('../../auth/authService');
const tokenService = require('../../auth/tokenService');

describe('OpenAI Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Initialize the server app (registers routes, etc.)
    await init();
    
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
          invalid: 'format'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Phase 1: Basic OpenAI Function Calling', () => {
    test('Should return natural language response for simple queries', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Hello' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
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
      expect(typeof response.body.content).toBe('string');
      expect(response.body.content.length).toBeGreaterThan(10);
      
      // Should contain loan information (not raw JSON)
      expect(response.body.content).not.toMatch(/^\{.*\}$/s);
      expect(response.body.content).not.toMatch(/^\[.*\]$/s);
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
      expect(response.body).toHaveProperty('content');
      expect(typeof response.body.content).toBe('string');
      expect(response.body.content.length).toBeGreaterThan(10);
    });

    test('Should handle case-insensitive loan IDs', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Show me loan l001' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(typeof response.body.content).toBe('string');
      expect(response.body.content.length).toBeGreaterThan(10);
    });

    test('Should handle whitespace in entity IDs', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Show me loan  L001  ' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(typeof response.body.content).toBe('string');
      expect(response.body.content.length).toBeGreaterThan(10);
    });
  });

  describe('Phase 4: Error Handling', () => {
    test('Should handle malformed function arguments', async () => {
      // This test verifies the system doesn't crash with malformed input
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Show me loan with invalid syntax {}[]' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(typeof response.body.content).toBe('string');
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
            { role: 'user', content: 'Show me loan L001' }
          ]
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(30000); // 30 seconds max
    });

    test('Should maintain conversation context', async () => {
      const response = await request(app)
        .post('/api/openai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Show me loan L001' },
            { role: 'assistant', content: 'Here are the details for loan L001...' },
            { role: 'user', content: 'What about the borrower for that loan?' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(typeof response.body.content).toBe('string');
      expect(response.body.content.length).toBeGreaterThan(10);
    });
  });
}); 