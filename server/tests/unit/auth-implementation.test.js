/**
 * Authentication Implementation Tests
 * Tests for the implemented authentication flow in the MCP POC
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock fs and path modules to avoid actual file operations
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/'))
}));

// Import fs for mocking
const fs = require('fs');

// Import auth modules
const authController = require('../../auth/authController');
const userService = require('../../auth/userService');
const tokenService = require('../../auth/tokenService');
const { jwtSecret } = require('../../auth/config');

describe('Authentication Implementation', () => {
  // Setup mock data
  const mockUsers = [
    {
      id: 'u001',
      username: 'john.doe',
      email: 'john.doe@example.com',
      passwordHash: '$2b$10$7ZXg.a7hMWmwMcZ3pzPir.bSAeY2L4VE9Vpb7ok2OEvQBrUSiLyvy',
      firstName: 'John',
      lastName: 'Doe',
      role: 'loan_officer',
      tenantId: 't001',
      active: true
    }
  ];

  // Setup before tests
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock fs.readFileSync to return mock users
    fs.readFileSync.mockImplementation((path) => {
      if (path.includes('users.json')) {
        return JSON.stringify(mockUsers);
      }
      return '[]';
    });
  });

  describe('User Authentication', () => {
    test('verifyPassword correctly matches password with hash', async () => {
      // Test with password123 which matches our hash
      const result = await userService.verifyPassword('password123', mockUsers[0].passwordHash);
      expect(result).toBe(true);
      
      // Test with incorrect password
      const wrongResult = await userService.verifyPassword('wrongpassword', mockUsers[0].passwordHash);
      expect(wrongResult).toBe(false);
    });

    test('findByUsername returns user when username exists', () => {
      const user = userService.findByUsername('john.doe');
      expect(user).toBeDefined();
      expect(user.id).toBe('u001');
      expect(user.firstName).toBe('John');
    });

    test('findByUsername returns null when username does not exist', () => {
      const user = userService.findByUsername('nonexistent');
      expect(user).toBeNull();
    });
  });

  describe('Token Management', () => {
    test('generates valid access token for user', () => {
      const user = mockUsers[0];
      const token = tokenService.generateAccessToken(user);
      
      // Verify token is a string and not empty
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      
      // Verify the token content
      const decoded = jwt.verify(token, jwtSecret);
      expect(decoded.id).toBe(user.id);
      expect(decoded.username).toBe(user.username);
      expect(decoded.role).toBe(user.role);
    });

    test('verifyAccessToken properly validates tokens', () => {
      const user = mockUsers[0];
      const token = tokenService.generateAccessToken(user);
      
      // Valid token should be verified
      const decoded = tokenService.verifyAccessToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(user.id);
      
      // Invalid token should return null
      expect(tokenService.verifyAccessToken('invalid.token.here')).toBeNull();
    });
  });

  describe('Client Authentication Flow', () => {
    test('login success path returns token and user data', async () => {
      // Mock req and res objects
      const req = {
        body: {
          username: 'john.doe',
          password: 'password123'
        }
      };
      
      const res = {
        cookie: jest.fn(),
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      // Call the login function
      await authController.login(req, res);
      
      // Verify the response
      expect(res.json).toHaveBeenCalled();
      const responseArg = res.json.mock.calls[0][0];
      
      expect(responseArg.success).toBe(true);
      expect(responseArg.accessToken).toBeDefined();
      expect(responseArg.user).toBeDefined();
      expect(responseArg.user.id).toBe('u001');
      expect(responseArg.user.username).toBe('john.doe');
      // Verify passwordHash is not included in response
      expect(responseArg.user.passwordHash).toBeUndefined();
    });

    test('login fails with invalid credentials', async () => {
      // Mock req and res objects
      const req = {
        body: {
          username: 'john.doe',
          password: 'wrongpassword'
        }
      };
      
      const res = {
        cookie: jest.fn(),
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      // Call the login function
      await authController.login(req, res);
      
      // Verify the response is unauthorized
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      
      const responseArg = res.json.mock.calls[0][0];
      expect(responseArg.success).toBe(false);
      expect(responseArg.message).toBeDefined();
    });
  });
}); 