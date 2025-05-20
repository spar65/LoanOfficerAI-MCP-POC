// Mock axios module
const axios = {
  post: jest.fn().mockResolvedValue({
    data: {
      content: 'This is a mock response from the AI',
      role: 'assistant'
    }
  }),
  get: jest.fn().mockResolvedValue({ data: {} }),
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

// Export axios mock object
module.exports = axios; 