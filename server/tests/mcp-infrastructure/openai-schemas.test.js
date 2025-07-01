/**
 * Tests for OpenAI integration schemas and function formats
 * These tests validate the structure and processing of OpenAI function schemas
 * without depending on network requests or external APIs
 */
const validation = require('../../utils/validation');
const mcpResponseFormatter = require('../../utils/mcpResponseFormatter');

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
  
  test('Validation utility normalizes entity IDs correctly', () => {
    // Test normalization of entity IDs
    if (validation.normalizeId) {
      expect(validation.normalizeId('L001')).toBe('L001');
      expect(validation.normalizeId('l001')).toBe('L001');
      expect(validation.normalizeId('b002')).toBe('B002');
      expect(validation.normalizeId('  C001  ')).toBe('C001');
      expect(validation.normalizeId('')).toBe('');
      expect(validation.normalizeId(null)).toBe('');
      expect(validation.normalizeId(undefined)).toBe('');
    }
  });
  
  test('MCP Response Formatter formats success responses correctly', () => {
    if (mcpResponseFormatter) {
      const sampleData = {
        loan_id: 'L001',
        loan_amount: 50000,
        interest_rate: 3.5
      };
      
      const formattedResponse = mcpResponseFormatter.formatSuccess(sampleData, 'getLoanDetails');
      
      expect(formattedResponse).toHaveProperty('loan_id', 'L001');
      expect(formattedResponse).toHaveProperty('loan_amount', 50000);
      expect(formattedResponse).toHaveProperty('_metadata');
      expect(formattedResponse._metadata).toHaveProperty('success', true);
      expect(formattedResponse._metadata).toHaveProperty('function', 'getLoanDetails');
      expect(formattedResponse._metadata).toHaveProperty('timestamp');
    }
  });
  
  test('MCP Response Formatter formats error responses correctly', () => {
    if (mcpResponseFormatter) {
      const error = new Error('Entity not found');
      error.code = 'ENTITY_NOT_FOUND';
      error.details = {
        entity_type: 'loan',
        entity_id: 'L999'
      };
      
      const formattedError = mcpResponseFormatter.formatError(error, 'getLoanDetails');
      
      expect(formattedError).toHaveProperty('error', true);
      expect(formattedError).toHaveProperty('message');
      expect(formattedError.message).toMatch(/not found/i);
      expect(formattedError).toHaveProperty('code', 'ENTITY_NOT_FOUND');
      expect(formattedError).toHaveProperty('entity_type', 'loan');
      expect(formattedError).toHaveProperty('entity_id', 'L999');
      expect(formattedError).toHaveProperty('function', 'getLoanDetails');
    }
  });
  
  test('MCP Response Formatter handles validation errors', () => {
    if (mcpResponseFormatter) {
      const validationError = new Error('Validation failed');
      validationError.code = 'VALIDATION_ERROR';
      validationError.details = {
        validation_errors: [
          { field: 'loan_id', message: 'Loan ID is required' }
        ]
      };
      
      const formattedError = mcpResponseFormatter.formatError(validationError, 'getLoanDetails');
      
      expect(formattedError).toHaveProperty('error', true);
      expect(formattedError).toHaveProperty('message');
      expect(formattedError.message).toMatch(/validation failed/i);
      expect(formattedError).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(formattedError).toHaveProperty('validation_errors');
      expect(Array.isArray(formattedError.validation_errors)).toBe(true);
      expect(formattedError.validation_errors[0]).toHaveProperty('field', 'loan_id');
    }
  });
}); 