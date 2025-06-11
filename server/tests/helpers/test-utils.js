/**
 * Test Utilities
 * 
 * This module provides utility functions for testing the API using industry
 * standard approaches.
 */

const request = require('supertest');
const express = require('express');
const http = require('http');
const LogService = require('../../services/logService');

// Import app directly but not other functions to avoid circular dependencies
let app;
try {
  app = require('../../server').app;
} catch (error) {
  // Create a minimal app if server.js can't be loaded
  app = express();
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  LogService.warn('Using minimal test app due to import error:', error.message);
}

// Test constants
const TEST_PORT = process.env.TEST_PORT || 3002;
const TEST_TOKEN = 'test-token';

// Supertest agent for making requests without starting server
const agent = request(app);

// Function to get authenticated agent
const getAuthenticatedAgent = () => {
  return agent.set('Authorization', `Bearer ${TEST_TOKEN}`);
};

// Cache server instance for tests that need a running server
let serverInstance = null;

/**
 * Start test server if not already running
 * @returns {Promise<Object>} Server instance
 */
const startTestServer = async () => {
  if (serverInstance) {
    return serverInstance;
  }
  
  try {
    LogService.info(`Starting test server on port ${TEST_PORT}`);
    
    // Create server without using startServer from server.js
    return new Promise((resolve, reject) => {
      const server = http.createServer(app);
      server.listen(TEST_PORT, () => {
        LogService.info(`Test server started on port ${TEST_PORT}`);
        serverInstance = server;
        resolve(server);
      });
      
      server.on('error', (error) => {
        LogService.error(`Failed to start test server: ${error.message}`);
        reject(error);
      });
    });
  } catch (error) {
    LogService.error(`Failed to start test server: ${error.message}`);
    throw error;
  }
};

/**
 * Stop test server if running
 */
const stopTestServer = async () => {
  if (serverInstance) {
    LogService.info('Stopping test server...');
    
    return new Promise((resolve) => {
      // Set a timeout to force server shutdown after 2 seconds
      const shutdownTimeout = setTimeout(() => {
        LogService.warn('Force closing test server after timeout');
        serverInstance = null;
        resolve();
      }, 2000);
      
      // Attempt graceful shutdown
      serverInstance.close(() => {
        clearTimeout(shutdownTimeout);
        LogService.info('Test server stopped gracefully');
        serverInstance = null;
        
        // Add a small delay to ensure all resources are released
        setTimeout(resolve, 100);
      });
      
      // Force close all remaining connections
      serverInstance.getConnections((err, count) => {
        if (err) {
          LogService.error(`Error getting connections: ${err.message}`);
        } else if (count > 0) {
          LogService.warn(`Forcibly closing ${count} open connections`);
          // Use Node's internal _connections array to force close connections
          if (serverInstance._connections) {
            Object.keys(serverInstance._connections).forEach(key => {
              try {
                const socket = serverInstance._connections[key];
                socket.destroy();
              } catch (e) {
                // Ignore errors when destroying sockets
              }
            });
          }
        }
      });
    });
  }
};

/**
 * Make an authenticated request to the API using supertest
 * This does NOT require a running server
 * 
 * @param {string} method - HTTP method (get, post, put, delete)
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body (for POST/PUT)
 * @returns {Promise<Object>} Supertest response
 */
const apiRequest = async (method, endpoint, data = null) => {
  let req = getAuthenticatedAgent()[method](endpoint);
  
  if (data && (method === 'post' || method === 'put')) {
    req = req.send(data);
  }
  
  return req.set('Accept', 'application/json');
};

module.exports = {
  agent,
  getAuthenticatedAgent,
  startTestServer,
  stopTestServer,
  apiRequest,
  TEST_PORT,
  TEST_TOKEN
}; 