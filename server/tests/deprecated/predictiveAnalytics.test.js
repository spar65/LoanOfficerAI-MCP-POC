/**
 * Integration Tests for Predictive Analytics API Endpoints
 * 
 * Tests the three predictive analytics endpoints:
 * - /api/analytics/loan-restructuring/:loanId
 * - /api/analytics/crop-yield-risk/:borrowerId
 * - /api/analytics/market-price-impact/:commodity
 */
const request = require('supertest');
const app = require('../../server');
const jwt = require('jsonwebtoken');
const config = require('../../auth/config');

// Create a valid test token
const createTestToken = () => {
  return jwt.sign(
    { userId: 'test-user', role: 'admin' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
};

describe('Predictive Analytics API Endpoints', () => {
  let testToken;

  beforeAll(() => {
    testToken = createTestToken();
  });

  describe('GET /api/analytics/loan-restructuring/:loanId', () => {
    test('should return loan restructuring options for valid loan ID', async () => {
      const response = await request(app)
        .get('/api/analytics/loan-restructuring/L001')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('loan_id', 'L001');
      expect(response.body).toHaveProperty('current_structure');
      expect(response.body).toHaveProperty('restructuring_options');
      expect(Array.isArray(response.body.restructuring_options)).toBe(true);
      expect(response.body.restructuring_options.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('recommendation');
    });

    test('should accept restructuring_goal query parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/loan-restructuring/L001?restructuring_goal=reduce_payments')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('loan_id', 'L001');
      expect(response.body).toHaveProperty('restructuring_options');
    });

    test('should return 404 for non-existent loan ID', async () => {
      const response = await request(app)
        .get('/api/analytics/loan-restructuring/L999')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBeTruthy();
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/loan-restructuring/L001');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/analytics/crop-yield-risk/:borrowerId', () => {
    test('should return crop yield risk assessment for valid borrower ID', async () => {
      const response = await request(app)
        .get('/api/analytics/crop-yield-risk/B001')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('borrower_id', 'B001');
      expect(response.body).toHaveProperty('yield_risk_score');
      expect(response.body).toHaveProperty('risk_level');
      expect(response.body).toHaveProperty('risk_factors');
      expect(Array.isArray(response.body.risk_factors)).toBe(true);
      expect(response.body).toHaveProperty('recommendations');
    });

    test('should accept crop_type and season query parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/crop-yield-risk/B001?crop_type=corn&season=current')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('borrower_id', 'B001');
      expect(response.body).toHaveProperty('crop_type', 'corn');
      expect(response.body).toHaveProperty('season', 'current');
    });

    test('should return 404 for non-existent borrower ID', async () => {
      const response = await request(app)
        .get('/api/analytics/crop-yield-risk/B999')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBeTruthy();
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/crop-yield-risk/B001');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/analytics/market-price-impact/:commodity', () => {
    test('should return market price impact analysis for valid commodity', async () => {
      const response = await request(app)
        .get('/api/analytics/market-price-impact/corn')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('commodity', 'corn');
      expect(response.body).toHaveProperty('affected_loans_count');
      expect(response.body).toHaveProperty('affected_loans');
      expect(Array.isArray(response.body.affected_loans)).toBe(true);
      expect(response.body).toHaveProperty('portfolio_impact_summary');
      expect(response.body).toHaveProperty('recommendations');
    });

    test('should accept price_change_percent query parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/market-price-impact/corn?price_change_percent=-10%25')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('commodity', 'corn');
      expect(response.body).toHaveProperty('price_change_percent');
    });

    test('should return 400 for invalid commodity', async () => {
      const response = await request(app)
        .get('/api/analytics/market-price-impact/invalidCommodity')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBeTruthy();
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/market-price-impact/corn');

      expect(response.status).toBe(401);
    });
  });
}); 