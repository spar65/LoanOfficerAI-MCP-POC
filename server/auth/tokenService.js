/**
 * Token service for managing JWT and refresh tokens
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwtSecret, refreshTokenExpiresIn } = require('./config');
const fs = require('fs');
const path = require('path');

// In-memory store for refresh tokens (use Redis or database in production)
const refreshTokens = new Map();

// Path to persist tokens across server restarts (for development only)
const tokenStorePath = path.join(__dirname, '../data/refreshTokens.json');

// Load persisted tokens if available
try {
  if (fs.existsSync(tokenStorePath)) {
    const data = JSON.parse(fs.readFileSync(tokenStorePath, 'utf8'));
    for (const [token, tokenData] of Object.entries(data)) {
      refreshTokens.set(token, {
        userId: tokenData.userId,
        expiresAt: tokenData.expiresAt
      });
    }
    console.log(`Loaded ${refreshTokens.size} refresh tokens`);
  }
} catch (err) {
  console.error('Error loading refresh tokens:', err);
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
 * Generate a new refresh token
 * @param {Object} user - User object
 * @returns {string} - Refresh token
 */
exports.generateRefreshToken = (user) => {
  // Create a cryptographically secure random token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Store token with user ID and expiration time
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  
  refreshTokens.set(refreshToken, {
    userId: user.id,
    expiresAt
  });
  
  // Persist tokens (development only)
  persistTokens();
  
  return refreshToken;
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
 * Generate a JWT access token
 * @param {Object} user - User object
 * @returns {string} - JWT access token
 */
exports.generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      tenantId: user.tenantId
    },
    jwtSecret,
    { expiresIn: '15m' }
  );
};

/**
 * Verify a JWT access token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
exports.verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
};

// Clean up expired tokens periodically (every hour)
setInterval(() => {
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