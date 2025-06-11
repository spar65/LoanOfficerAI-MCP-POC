// Jest setup file for client tests
import '@testing-library/jest-dom';

// Create mock API responses
global.mockApiResponse = (data) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
};

// Create mock API error response
global.mockApiError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return Promise.reject(error);
};

// Setup global mocks
global.matchMediaMock = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Mock scrollIntoView for React refs
Element.prototype.scrollIntoView = jest.fn();

// Setup for HTML elements that may not exist in JSDOM
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
}

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
    this.elements = new Set();
    this.thresholds = [];
    this.root = null;
    this.rootMargin = '';
  }

  observe(element) {
    this.elements.add(element);
  }

  unobserve(element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }
}

global.IntersectionObserver = IntersectionObserverMock;

// Setup global mocks for localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Apply global mocks
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Initialize matchMedia mock
global.matchMediaMock();

// Silence React error logging in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalConsoleError(...args);
}; 