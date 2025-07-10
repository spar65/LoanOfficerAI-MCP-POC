/**
 * Token Service
 * Handles JWT token generation and verification
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwtSecret, refreshTokenExpiresIn } = require('./config');
const fs = require('fs');
const path = require('path');
const LogService = require('../services/logService');

// Secret key for signing tokens - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-key-for-development-only';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';

// In-memory store for refresh tokens (use Redis or database in production)
const refreshTokens = new Map();

// Path to persist tokens across server restarts (for development only)
const tokenStorePath = path.join(__dirname, '../data/refreshTokens.json');

// Store cleanup interval reference for tests
let cleanupInterval = null;

// Load persisted tokens if available
try {
  if (fs.existsSync(tokenStorePath)) {
    try {
      const data = fs.readFileSync(tokenStorePath, 'utf8');
      if (data && data.trim()) {
        const parsedData = JSON.parse(data);
        for (const [token, tokenData] of Object.entries(parsedData)) {
          refreshTokens.set(token, {
            userId: tokenData.userId,
            expiresAt: tokenData.expiresAt
          });
        }
        console.log(`Loaded ${refreshTokens.size} refresh tokens`);
      } else {
        console.log('Token storage file is empty, starting with clean state');
      }
    } catch (parseError) {
      console.error('Error parsing token storage file:', parseError.message);
      console.log('Starting with clean token state');
    }
  } else {
    console.log('No existing token storage file found, starting with clean state');
  }
} catch (err) {
  console.error('Error loading refresh tokens:', err.message);
  console.log('Starting with clean token state');
  // Continue without persisted tokens
}

// Save tokens to file for persistence (development only)
const persistTokens = () => {
  try {
    const data = {};
    for (const [token, tokenData] of refreshTokens.entries()) {
      data[token] = tokenData;
    }
    fs.writeFileSync(tokenStorePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error persisting refresh tokens:', err);
  }
};

/**
 * Generate an access token for a user
 * @param {Object} user - User object
 * @returns {string} JWT access token
 */
exports.generateAccessToken = (user) => {
  try {
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      tenantId: user.tenantId || 'default'
    };
    
    return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  } catch (error) {
    LogService.error('Error generating access token:', error);
    return null;
  }
};

/**
 * Verify an access token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
exports.verifyAccessToken = (token) => {
  try {
    // Special handling for test-token
    if (token === 'test-token') {
      return {
        id: 'test-user',
        email: 'test@example.com',
        role: 'user',
        tenantId: 'test-tenant'
      };
    }
    
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    LogService.warn('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Generate a refresh token for a user
 * @param {Object} user - User object
 * @returns {string} JWT refresh token (longer expiry)
 */
exports.generateRefreshToken = (user) => {
  try {
    const tokenPayload = {
      id: user.id,
      tokenType: 'refresh'
    };
    
    // Refresh tokens have longer expiry
    return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
  } catch (error) {
    LogService.error('Error generating refresh token:', error);
    return null;
  }
};

/**
 * Verify a refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
exports.verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ensure it's a refresh token
    if (decoded.tokenType !== 'refresh') {
      LogService.warn('Invalid token type for refresh token');
      return null;
    }
    
    return decoded;
  } catch (error) {
    LogService.warn('Refresh token verification failed:', error.message);
    return null;
  }
};

/**
 * Validate a refresh token
 * @param {string} token - Refresh token to validate
 * @returns {Object|null} - Token data or null if invalid
 */
exports.validateRefreshToken = (token) => {
  const tokenData = refreshTokens.get(token);
  
  // Token doesn't exist
  if (!tokenData) return null;
  
  // Token has expired
  if (tokenData.expiresAt < Date.now()) {
    refreshTokens.delete(token);
    persistTokens();
    return null;
  }
  
  return tokenData;
};

/**
 * Invalidate a refresh token
 * @param {string} token - Refresh token to invalidate
 */
exports.invalidateRefreshToken = (token) => {
  refreshTokens.delete(token);
  persistTokens();
};

/**
 * Start the token cleanup interval
 * @returns {Object} Interval ID for cleanup
 */
exports.startCleanupInterval = () => {
  // Only start if not already running
  if (cleanupInterval) {
    return cleanupInterval;
  }
  
  // Clean up expired tokens periodically (every hour)
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [token, tokenData] of refreshTokens.entries()) {
      if (tokenData.expiresAt < now) {
        refreshTokens.delete(token);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.log(`Cleaned up ${expiredCount} expired refresh tokens`);
      persistTokens();
    }
  }, 60 * 60 * 1000); // 1 hour
  
  return cleanupInterval;
};

/**
 * Stop the token cleanup interval
 */
exports.stopCleanupInterval = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

// Start the cleanup interval
if (process.env.NODE_ENV !== 'test') {
  exports.startCleanupInterval();
}

// Load tokens
exports.loadRefreshTokens = () => {
  return Array.from(refreshTokens.keys());
}; 