/**
 * Authentication routes
 */
const express = require('express');
const authController = require('./authController');
const authMiddleware = require('./authMiddleware');

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Login user and get access token
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public (requires refresh token cookie)
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate refresh token
 * @access Public (but typically used when authenticated)
 */
router.post('/logout', authController.logout);

/**
 * @route GET /api/auth/verify
 * @desc Verify token is valid
 * @access Private
 */
router.get('/verify', authMiddleware.verifyToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      tenantId: req.user.tenantId
    }
  });
});

module.exports = router; 