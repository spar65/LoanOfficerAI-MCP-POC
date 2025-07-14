// Mock axios module
const axios = {
  post: jest.fn().mockResolvedValue({
    data: {
      content: 'This is a mock response from the AI',
      role: 'assistant'
    }
  }),
  get: jest.fn().mockResolvedValue({ 
    data: {
      loans: [],
      borrowers: [],
      message: 'Mock data response'
    }
  }),
  defaults: {
    baseURL: '',
    headers: {
      common: {},
    },
  },
  create: jest.fn().mockReturnValue({
    post: jest.fn().mockResolvedValue({ data: {} }),
    get: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  }),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

// Default export for ES modules
export default axios;

// Named export for CommonJS
module.exports = axios; 