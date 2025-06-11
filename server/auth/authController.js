/**
 * Authentication controller
 * Handles login, token refresh, and logout
 */
const { jwtSecret, jwtExpiresIn, cookieOptions } = require('./config');
const tokenService = require('./tokenService');
const userService = require('./userService');

/**
 * Login endpoint
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate request
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }
    
    // Find user by username
    const user = userService.findByUsername(username);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Verify password
    const passwordValid = await userService.verifyPassword(password, user.passwordHash);
    
    if (!passwordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check if user account is active
    if (!user.active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is disabled' 
      });
    }
    
    // Generate access token
    const accessToken = tokenService.generateAccessToken(user);
    
    // Generate refresh token
    const refreshToken = tokenService.generateRefreshToken(user);
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);
    
    // Update last login time
    userService.updateLoginTime(user.id);
    
    // Return access token and user info
    res.json({
      success: true,
      accessToken,
      user: userService.getPublicUserData(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

/**
 * Refresh token endpoint
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token required' 
      });
    }
    
    // Validate refresh token
    const tokenData = tokenService.validateRefreshToken(refreshToken);
    
    if (!tokenData) {
      // Clear invalid cookie
      res.clearCookie('refreshToken');
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired refresh token' 
      });
    }
    
    // Get user from database
    const user = userService.findById(tokenData.userId);
    
    if (!user || !user.active) {
      // Clear cookie if user not found or inactive
      res.clearCookie('refreshToken');
      
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }
    
    // Invalidate old refresh token (token rotation)
    tokenService.invalidateRefreshToken(refreshToken);
    
    // Generate new access token
    const accessToken = tokenService.generateAccessToken(user);
    
    // Generate new refresh token
    const newRefreshToken = tokenService.generateRefreshToken(user);
    
    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, cookieOptions);
    
    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Token refresh failed' 
    });
  }
};

/**
 * Logout endpoint
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Invalidate refresh token
      tokenService.invalidateRefreshToken(refreshToken);
    }
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed' 
    });
  }
}; 