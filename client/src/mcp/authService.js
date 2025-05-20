/**
 * Authentication service for the client application
 */

// Local storage keys
const TOKEN_KEY = 'loan_officer_auth_token';
const USER_KEY = 'loan_officer_user';

const authService = {
  /**
   * Save authentication data to local storage
   * @param {Object} authData - Auth data containing token and user
   */
  setAuth(authData) {
    if (!authData) {
      console.error('Invalid auth data provided:', authData);
      return false;
    }
    
    if (!authData.token) {
      console.error('No token provided in auth data:', authData);
      return false;
    }
    
    console.log('Saving authentication data');
    localStorage.setItem(TOKEN_KEY, authData.token);
    
    if (authData.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    } else {
      console.warn('No user data provided with token');
    }
    
    // For debugging
    this.logAuthStatus();
    return true;
  },

  /**
   * Get the current auth token
   * @returns {string|null} - The auth token or null if not logged in
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get the current user
   * @returns {Object|null} - The user or null if not logged in
   */
  getUser() {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error('Error parsing user data:', e);
      // Invalid user data - clear it
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if authenticated
   */
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    
    // Only consider authenticated if both token and user data exist
    return !!token && !!user;
  },

  /**
   * Log out user by clearing storage
   */
  logout() {
    console.log('Logging out and clearing auth data');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  
  /**
   * Log current authentication status to console (for debugging)
   */
  logAuthStatus() {
    const token = this.getToken();
    const user = this.getUser();
    
    console.log('Auth Status:', {
      isAuthenticated: this.isAuthenticated(),
      tokenExists: !!token,
      tokenLength: token ? token.length : 0,
      userExists: !!user,
      username: user ? user.username : null,
      role: user ? user.role : null
    });
  }
};

export default authService; 