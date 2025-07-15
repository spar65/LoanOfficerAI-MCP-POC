#!/usr/bin/env node

/**
 * Bootstrap Script for LoanOfficerAI MCP POC
 * 
 * This script ONLY installs dependencies - no configuration
 * Run this first after unzipping the project
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Colors for console output (without external dependencies)
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
    console.log('');
    log('='.repeat(60), 'blue');
    log(`📦 ${message}`, 'blue');
    log('='.repeat(60), 'blue');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

async function bootstrap() {
    try {
        logHeader('Installing Dependencies Only');
        
        // Check if we're in the right directory
        if (!fs.existsSync('package.json')) {
            logError('package.json not found. Please run this from the project root.');
            process.exit(1);
        }
        
        // Step 1: Install root dependencies
        log('\n📦 Installing root dependencies...');
        try {
            execSync('npm install', { stdio: 'inherit' });
            logSuccess('Root dependencies installed');
        } catch (error) {
            logError('Failed to install root dependencies');
            throw error;
        }
        
        // Step 2: Install server dependencies
        log('\n🔧 Installing server dependencies...');
        try {
            execSync('cd server && npm install', { stdio: 'inherit' });
            logSuccess('Server dependencies installed');
        } catch (error) {
            logError('Failed to install server dependencies');
            throw error;
        }
        
        // Step 3: Install client dependencies
        log('\n🎨 Installing client dependencies...');
        try {
            execSync('cd client && npm install', { stdio: 'inherit' });
            logSuccess('Client dependencies installed');
        } catch (error) {
            logError('Failed to install client dependencies');
            throw error;
        }
        
        // Done - next steps
        logHeader('Dependencies Installation Complete!');
        logSuccess('All dependencies have been installed');
        log('\n🎯 Next Steps:', 'blue');
        log('1. npm run check    - Verify system requirements', 'yellow');
        log('2. npm run setup    - Configure environment & database', 'yellow');
        log('3. npm start        - Launch the application', 'yellow');
        
    } catch (error) {
        logError('Bootstrap failed');
        logError(error.message);
        log('\n🔧 Manual steps you can try:', 'yellow');
        log('1. npm install', 'yellow');
        log('2. cd server && npm install', 'yellow');
        log('3. cd ../client && npm install', 'yellow');
        process.exit(1);
    }
}

// Run bootstrap
bootstrap(); 