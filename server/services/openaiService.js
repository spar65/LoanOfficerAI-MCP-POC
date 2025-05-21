/**
 * OpenAI Service
 * Provides enhanced logging and metrics for OpenAI API calls
 */
const { OpenAI } = require('openai');
const LogService = require('./logService');

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      LogService.error('OPENAI_API_KEY environment variable is not set');
      throw new Error('OpenAI API key is not configured');
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    LogService.info('OpenAI client initialized');
  }
  
  /**
   * Process a chat completion request with enhanced MCP logging
   * @param {Object} options - OpenAI chat completion options
   * @returns {Promise<Object>} - OpenAI response
   */
  async createChatCompletion(options) {
    const startTime = Date.now();
    const model = options.model || 'gpt-4o';
    const messages = options.messages || [];
    const functions = options.functions || [];
    
    LogService.mcp('MCP OPENAI REQUEST', {
      model,
      messageCount: messages.length,
      functionCount: functions.length,
      systemMessage: messages.find(m => m.role === 'system')?.content?.substring(0, 100) + '...'
    });
    
    try {
      // Make request to OpenAI
      const response = await this.client.chat.completions.create({
        model,
        ...options
      });
      
      // Calculate duration
      const duration = Date.now() - startTime;
      
      // Check for function call in response
      const message = response.choices[0].message;
      const functionCall = message.function_call;
      
      if (functionCall) {
        LogService.mcp(`MCP FUNCTION SELECTION: ${functionCall.name}`, {
          function: functionCall.name,
          arguments: functionCall.arguments,
          duration: `${duration}ms`,
          tokensUsed: response.usage?.total_tokens
        });
      } else {
        LogService.mcp(`MCP OPENAI RESPONSE (${duration}ms)`, {
          tokensUsed: response.usage?.total_tokens || 'unknown',
          responseType: functionCall ? 'function_call' : 'message',
          contentLength: message.content?.length || 0,
          duration: `${duration}ms`
        });
      }
      
      return response;
    } catch (error) {
      // Calculate duration even for errors
      const duration = Date.now() - startTime;
      
      LogService.error(`MCP OPENAI ERROR (${duration}ms)`, {
        error: error.message,
        duration: `${duration}ms`,
        request: {
          model,
          messageCount: messages.length,
          functionCount: functions.length
        }
      });
      
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new OpenAIService(); 