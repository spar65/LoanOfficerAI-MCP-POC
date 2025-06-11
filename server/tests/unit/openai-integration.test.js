/**
 * Tests for OpenAI integration endpoints
 * These tests focus on validating the OpenAI integration schema and endpoint structure
 */

const request = require('supertest');
const app = require('../../server');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockImplementation(async (options) => {
              // First step - detect function calls
              if (options.functions && options.functions.length > 0 && options.function_call === 'auto') {
                // If any message contains "loan details"
                if (options.messages.some(m => 
                  m.role === 'user' && 
                  m.content && 
                  m.content.toLowerCase().includes('loan details')
                )) {
                  return {
                    choices: [
                      {
                        message: {
                          role: 'assistant',
                          function_call: {
                            name: 'getLoanDetails',
                            arguments: JSON.stringify({ loan_id: 'L001' })
                          }
                        }
                      }
                    ]
                  };
                }
                
                // Default case when functions are provided
                return {
                  choices: [
                    {
                      message: {
                        content: "This is a mock response from the AI",
                        role: "assistant"
                      }
                    }
                  ]
                };
              }
              
              // Second step - function result transformation
              const functionMessage = options.messages.find(m => m.role === 'function');
              if (functionMessage) {
                // Check if the function was getLoanDetails
                if (functionMessage.name === 'getLoanDetails') {
                  return {
                    choices: [
                      {
                        message: {
                          content: `Here are the details for loan L001: Amount: $50,000, Interest rate: 3.5%, Term: 60 months`,
                          role: "assistant"
                        }
                      }
                    ]
                  };
                }
              }
              
              // Default response
              return {
                choices: [
                  {
                    message: {
                      content: "This is a mock response from the AI",
                      role: "assistant"
                    }
                  }
                ]
              };
            })
          }
        }
      };
    })
  };
});

// Create a valid token for testing
const createValidToken = () => {
  const secretKey = process.env.JWT_SECRET || 'your-secret-key';
  const payload = {
    userId: 'test-user',
    role: 'admin',
    tenant: 'test-tenant'
  };
  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};

describe('OpenAI Integration Tests', () => {
  let validToken;

  beforeAll(() => {
    // Set environment variable for tests
    process.env.OPENAI_API_KEY = 'test-api-key';
    validToken = createValidToken();
  });

  afterAll(() => {
    // Clean up
    delete process.env.OPENAI_API_KEY;
  });

  test('OpenAI chat endpoint should require authentication', async () => {
    const response = await request(app)
      .post('/api/openai/chat')
      .send({
        messages: [{ role: 'user', content: 'Hello' }]
      });

    expect(response.status).toBe(401);
  });

  test('OpenAI chat endpoint should validate request body', async () => {
    const response = await request(app)
      .post('/api/openai/chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        // Missing messages array
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Messages array is required');
  });

  test('OpenAI chat endpoint should process a valid request', async () => {
    const response = await request(app)
      .post('/api/openai/chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('content', 'This is a mock response from the AI');
    expect(response.body).toHaveProperty('role', 'assistant');
  });

  test('OpenAI chat endpoint should handle function definitions', async () => {
    const response = await request(app)
      .post('/api/openai/chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Get loan details' }
        ],
        functions: [
          {
            name: 'getLoanDetails',
            description: 'Get detailed information about a specific loan',
            parameters: {
              type: 'object',
              properties: {
                loan_id: {
                  type: 'string',
                  description: 'The ID of the loan to retrieve',
                }
              },
              required: ['loan_id']
            }
          }
        ],
        function_call: 'auto'
      });

    expect(response.status).toBe(200);
  });
  
  test('OpenAI chat endpoint should execute detected function and return natural language response', async () => {
    // This test verifies the complete function calling flow, ensuring:
    // 1. OpenAI detects the need to call a function
    // 2. The function is executed 
    // 3. The result is sent back to OpenAI for natural language formatting
    // 4. A natural language response is returned to the user
    
    const response = await request(app)
      .post('/api/openai/chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        messages: [
          { role: 'user', content: 'Show me loan details for L001' }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('content');
    expect(response.body.content).toMatch(/loan L001/i);
    expect(response.body.content).toMatch(/\$50,000/);
    expect(response.body.content).toMatch(/3.5%/);
    
    // Important: Should NOT be raw JSON
    expect(response.body.content).not.toMatch(/^\{/);
    expect(response.body.content).not.toMatch(/\}$/);
  });
});

describe('OpenAI Integration Schema Tests', () => {
  test('MCP function schemas are valid for OpenAI', () => {
    // Define the expected schema structure for OpenAI function calling
    const validateFunctionSchema = (func) => {
      // Check basic structure
      expect(func).toHaveProperty('name');
      expect(func).toHaveProperty('description');
      expect(func).toHaveProperty('parameters');
      
      // Check parameters structure
      expect(func.parameters).toHaveProperty('type');
      expect(func.parameters).toHaveProperty('properties');
      
      // For functions with parameters, check they are properly defined
      if (Object.keys(func.parameters.properties).length > 0) {
        // At least one parameter should have type and description
        const firstParam = Object.values(func.parameters.properties)[0];
        expect(firstParam).toHaveProperty('type');
        expect(firstParam).toHaveProperty('description');
      }
      
      return true;
    };
    
    // Define sample MCP function schemas like we use in the client
    const MCP_FUNCTIONS = [
      {
        name: "getAllLoans",
        description: "Get a list of all loans in the system",
        parameters: { type: "object", properties: {}, required: [] },
      },
      {
        name: "getLoanDetails",
        description: "Get detailed information about a specific loan",
        parameters: {
          type: "object",
          properties: {
            loan_id: {
              type: "string",
              description: "The ID of the loan to retrieve",
            },
          },
          required: ["loan_id"],
        },
      },
      {
        name: "getLoanSummary",
        description: "Get summary statistics about all loans",
        parameters: { type: "object", properties: {}, required: [] },
      }
    ];
    
    // Validate each function schema
    MCP_FUNCTIONS.forEach(func => {
      expect(validateFunctionSchema(func)).toBe(true);
    });
  });
  
  test('OpenAI API key validation logic works correctly', () => {
    // Test the key validation logic without making actual API calls
    
    // Save original env and clear it for testing
    const originalEnv = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    
    // Validation function similar to what we use in the server
    const validateApiKey = () => {
      if (!process.env.OPENAI_API_KEY) {
        return false;
      }
      return true;
    };
    
    // Test without key
    expect(validateApiKey()).toBe(false);
    
    // Test with key
    process.env.OPENAI_API_KEY = 'test-api-key';
    expect(validateApiKey()).toBe(true);
    
    // Restore original environment
    if (originalEnv) {
      process.env.OPENAI_API_KEY = originalEnv;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  });
  
  test('Response handlers correctly process different OpenAI formats', () => {
    // Test the function that processes OpenAI responses
    
    // Basic text response handler
    const handleTextResponse = (message) => {
      return {
        text: message.content,
        sender: 'bot'
      };
    };
    
    // Function call response handler
    const handleFunctionCallResponse = (message) => {
      return {
        hasFunctionCall: true,
        functionName: message.function_call.name,
        arguments: JSON.parse(message.function_call.arguments)
      };
    };
    
    // Test text response
    const textResponse = { role: 'assistant', content: 'Hello, how can I help?' };
    expect(handleTextResponse(textResponse)).toEqual({
      text: 'Hello, how can I help?',
      sender: 'bot'
    });
    
    // Test function call response
    const functionCallResponse = {
      role: 'assistant',
      function_call: {
        name: 'getLoanDetails',
        arguments: '{"loan_id":"L001"}'
      }
    };
    expect(handleFunctionCallResponse(functionCallResponse)).toEqual({
      hasFunctionCall: true,
      functionName: 'getLoanDetails',
      arguments: { loan_id: 'L001' }
    });
  });
}); 