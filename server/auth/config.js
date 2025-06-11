/**
 * Authentication configuration
 * Contains JWT secrets, token expiration settings, and cookie options
 */
module.exports = {
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || "loan-officer-ai-jwt-secret-for-development-only",
  jwtExpiresIn: "15m", // Access token expiration
  refreshTokenExpiresIn: "7d", // Refresh token expiration
  
  // Cookie settings for refresh tokens
  cookieOptions: {
    httpOnly: true, // Prevent JavaScript access to the cookie
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // Prevent CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: "/" // Available across the entire site
  }
}; 