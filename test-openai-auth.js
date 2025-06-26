/**
 * Test script to check OpenAI authentication
 * Run with: node test-openai-auth.js
 */
require('dotenv').config();
const { OpenAI } = require('openai');

async function testOpenAIAuth() {
  console.log('Testing OpenAI authentication...');
  
  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY is not set in environment variables');
    console.error('Please check your .env file and ensure it contains a valid OpenAI API key');
    return false;
  }
  
  // Mask the key for logging (show only last 4 characters)
  const apiKey = process.env.OPENAI_API_KEY;
  const maskedKey = apiKey.length > 4 
    ? '*'.repeat(apiKey.length - 4) + apiKey.substring(apiKey.length - 4)
    : '****';
  
  console.log(`Using API key: ${maskedKey}`);
  
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Make a simple test call
    console.log('Making test API call to OpenAI...');
    const models = await openai.models.list();
    
    console.log(`✅ SUCCESS: Authentication successful!`);
    console.log(`Retrieved ${models.data.length} models from OpenAI`);
    return true;
  } catch (error) {
    console.error('❌ ERROR: Authentication failed');
    console.error(`Error message: ${error.message}`);
    
    // Check for common error types
    if (error.message.includes('401')) {
      console.error('This appears to be an invalid or expired API key.');
      console.error('Please check your OpenAI account and update your API key.');
    } else if (error.message.includes('429')) {
      console.error('Rate limit exceeded. Your account may be out of credits or hitting rate limits.');
    } else if (error.message.includes('timeout') || error.message.includes('network')) {
      console.error('Network issue. Please check your internet connection.');
    }
    
    return false;
  }
}

// Run the test
testOpenAIAuth().then(success => {
  if (!success) {
    process.exit(1);
  }
}); 