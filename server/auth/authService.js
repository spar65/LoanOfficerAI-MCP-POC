/**
 * Server-side Authentication Service
 * This is a simplified auth service for server-side use and testing
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userService = require('./userService');
const tokenService = require('./tokenService');

const authService = {
  /**
   * Authenticate a user with username and password
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object|null>} User object if authenticated, null otherwise
   */
  async authenticate(username, password) {
    try {
      const user = userService.findByUsername(username);
      if (!user) {
        return null;
      }

      const isValidPassword = await userService.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return null;
      }

      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  },

  /**
   * Generate authentication tokens for a user
   * @param {Object} user - User object
   * @returns {Object} Object containing access and refresh tokens
   */
  generateTokens(user) {
    try {
      const accessToken = tokenService.generateAccessToken(user);
      const refreshToken = tokenService.generateRefreshToken(user);

      return {
        accessToken,
        refreshToken,
        expiresIn: '1h'
      };
    } catch (error) {
      console.error('Token generation error:', error);
      return null;
    }
  },

  /**
   * Verify an access token
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  verifyToken(token) {
    return tokenService.verifyAccessToken(token);
  },

  /**
   * Refresh an access token using a refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object|null>} New tokens or null if invalid
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = tokenService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return null;
      }

      const user = userService.findById(decoded.id);
      if (!user) {
        return null;
      }

      return this.generateTokens(user);
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }
};

module.exports = authService; 