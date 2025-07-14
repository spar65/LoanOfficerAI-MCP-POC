// Jest setup file for client tests
import '@testing-library/jest-dom';
import React from 'react';

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

// Mock React.useRef to prevent destructuring issues
const originalUseRef = React.useRef;
React.useRef = jest.fn((initialValue) => {
  const ref = originalUseRef(initialValue);
  // Ensure ref.current is always defined
  if (ref.current === null || ref.current === undefined) {
    ref.current = {};
  }
  return ref;
});

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

// Mock ResizeObserver for MUI components
class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {
    // Mock implementation
  }
  
  unobserve() {
    // Mock implementation
  }
  
  disconnect() {
    // Mock implementation
  }
}

global.ResizeObserver = ResizeObserverMock;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Call the matchMedia mock setup
global.matchMediaMock();

// Silence React error logging in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalConsoleError(...args);
}; 