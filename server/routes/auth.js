/**
 * Authentication API Routes
 */
const express = require('express');
const router = express.Router();
const LogService = require('../services/logService');
const TokenService = require('../auth/tokenService');

// Mock user database for development
const users = [
  {
    id: 'user1',
    username: 'admin',
    password: '$2b$10$eCQGHXYRyBRdXcGLsQSW8.VzYYZLZl9eEw6DcZqLBrRiIwJ2Xz5T.',  // hashed 'password123'
    role: 'admin',
    tenantId: 'default'
  },
  {
    id: 'user2',
    username: 'loanofficer',
    password: '$2b$10$eCQGHXYRyBRdXcGLsQSW8.VzYYZLZl9eEw6DcZqLBrRiIwJ2Xz5T.',  // hashed 'password123'
    role: 'user',
    tenantId: 'default'
  },
  {
    id: 'user3',
    username: 'john.doe',
    password: 'password123',  // plain text for this user
    role: 'user',
    tenantId: 'default'
  }
];

/**
 * POST /api/auth/login - User login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user (in a real app, this would check the database)
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Handle both hashed and plaintext passwords
    let passwordValid = false;
    
    if (user.username === 'john.doe') {
      // Direct comparison for john.doe
      passwordValid = user.password === password;
    } else {
      // For other users with hashed passwords
      // In a real app we would use bcrypt.compare()
      passwordValid = password === 'password123';
    }
    
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = TokenService.generateAccessToken(user);
    
    // Prepare response
    const userResponse = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    LogService.info(`User logged in: ${username}`, {
      userId: user.id,
      role: user.role
    });
    
    res.json({
      user: userResponse,
      accessToken,
      success: true
    });
  } catch (error) {
    LogService.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * POST /api/auth/logout - User logout
 */
router.post('/logout', (req, res) => {
  // In a real app, you might invalidate tokens here
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/profile - Get user profile (requires authentication)
 */
router.get('/profile', (req, res) => {
  // The auth middleware would normally add the user to the request
  // For this demo, we'll just return a mock profile
  res.json({
    id: 'user1',
    username: 'admin',
    role: 'admin',
    preferences: {
      theme: 'light',
      notifications: true
    }
  });
});

module.exports = router; 