#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('🔑 LoanOfficerAI - Environment Setup');
console.log('====================================');

const envPath = path.join(__dirname, 'server', '.env');
const envExamplePath = path.join(__dirname, 'server', 'env.example');

// Check if .env already exists
if (fs.existsSync(envPath)) {
    console.log('✅ Environment file already exists at server/.env');
    console.log('💡 To update your OpenAI API key, edit server/.env manually');
    process.exit(0);
}

// Read the example file
if (!fs.existsSync(envExamplePath)) {
    console.error('❌ env.example file not found');
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('');
console.log('To enable full chatbot functionality, you need an OpenAI API key.');
console.log('Get one from: https://platform.openai.com/api-keys');
console.log('');

rl.question('Enter your OpenAI API key (or press Enter to use placeholder): ', (apiKey) => {
    const finalApiKey = apiKey.trim() || 'sk-proj-enter-your-real-openai-api-key-here';
    
    // Read example file and replace the API key
    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    envContent = envContent.replace('your_openai_api_key_here', finalApiKey);
    
    // Add database configuration
    envContent += `

# Database Configuration (optional - defaults to JSON files)
USE_DATABASE=false
DB_SERVER=localhost
DB_NAME=LoanOfficerAI_MCP_POC
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
DB_PORT=1433`;

    // Write the .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('');
    console.log('✅ Environment file created successfully!');
    console.log('📁 Location: server/.env');
    
    if (finalApiKey === 'sk-proj-enter-your-real-openai-api-key-here') {
        console.log('');
        console.log('⚠️  Remember to replace the placeholder API key in server/.env');
        console.log('   with your real OpenAI API key for full functionality');
    }
    
    console.log('');
    console.log('🚀 Next step: npm start');
    
    rl.close();
}); 