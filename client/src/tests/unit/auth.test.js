/**
 * Client Authentication Tests
 * Tests for the client-side authentication service and login component
 */
import authService from '../../mcp/authService';

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = String(value);
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Client Authentication', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  describe('AuthService', () => {
    test('setAuth stores token and user data in localStorage', () => {
      // Create mock auth data
      const mockAuthData = {
        token: 'mock-jwt-token',
        user: {
          id: 'u001',
          username: 'john.doe',
          firstName: 'John',
          lastName: 'Doe',
          role: 'loan_officer'
        }
      };

      // Call setAuth
      const result = authService.setAuth(mockAuthData);

      // Verify result
      expect(result).toBe(true);

      // Verify localStorage
      expect(localStorage.getItem('loan_officer_auth_token')).toBe('mock-jwt-token');
      expect(JSON.parse(localStorage.getItem('loan_officer_user'))).toEqual(mockAuthData.user);
    });

    test('setAuth returns false with invalid data', () => {
      // Test with null
      expect(authService.setAuth(null)).toBe(false);
      
      // Test with missing token
      expect(authService.setAuth({ user: { id: 'u001' } })).toBe(false);
    });

    test('getToken returns token from localStorage', () => {
      // Setup
      localStorage.setItem('loan_officer_auth_token', 'mock-jwt-token');
      
      // Verify
      expect(authService.getToken()).toBe('mock-jwt-token');
    });

    test('getUser returns user data from localStorage', () => {
      // Setup
      const userData = { id: 'u001', username: 'john.doe' };
      localStorage.setItem('loan_officer_user', JSON.stringify(userData));
      
      // Verify
      expect(authService.getUser()).toEqual(userData);
    });

    test('isAuthenticated returns true when both token and user exist', () => {
      // Setup
      localStorage.setItem('loan_officer_auth_token', 'mock-jwt-token');
      localStorage.setItem('loan_officer_user', JSON.stringify({ id: 'u001' }));
      
      // Verify
      expect(authService.isAuthenticated()).toBe(true);
    });

    test('isAuthenticated returns false when token or user is missing', () => {
      // No data
      expect(authService.isAuthenticated()).toBe(false);
      
      // Only token
      localStorage.setItem('loan_officer_auth_token', 'mock-jwt-token');
      expect(authService.isAuthenticated()).toBe(false);
      
      // Clear and test with only user
      localStorage.clear();
      localStorage.setItem('loan_officer_user', JSON.stringify({ id: 'u001' }));
      expect(authService.isAuthenticated()).toBe(false);
    });

    test('logout clears auth data from localStorage', () => {
      // Setup
      localStorage.setItem('loan_officer_auth_token', 'mock-jwt-token');
      localStorage.setItem('loan_officer_user', JSON.stringify({ id: 'u001' }));
      
      // Call logout
      authService.logout();
      
      // Verify localStorage is cleared
      expect(localStorage.getItem('loan_officer_auth_token')).toBeNull();
      expect(localStorage.getItem('loan_officer_user')).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
}); 