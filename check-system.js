#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    header: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`)
};

function checkCommand(command, name) {
    try {
        const result = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
        log.success(`${name} is installed: ${result.trim().split('\n')[0]}`);
        return true;
    } catch (error) {
        log.error(`${name} is NOT installed`);
        return false;
    }
}

function checkFile(path, name) {
    if (fs.existsSync(path)) {
        log.success(`${name} exists: ${path}`);
        return true;
    } else {
        log.error(`${name} is missing: ${path}`);
        return false;
    }
}

function checkDockerContainer(containerName) {
    try {
        const result = execSync(`docker ps -a --filter "name=${containerName}" --format "{{.Names}}: {{.Status}}"`, { stdio: 'pipe', encoding: 'utf8' });
        if (result.trim()) {
            log.info(`Docker container found: ${result.trim()}`);
            return true;
        } else {
            log.warning(`Docker container '${containerName}' not found`);
            return false;
        }
    } catch (error) {
        log.error(`Cannot check Docker containers (Docker may not be running)`);
        return false;
    }
}

async function main() {
    log.header('🔍 LoanOfficerAI MCP - System Check');
    
    console.log('Checking system prerequisites and current state...\n');
    
    // Check basic requirements
    log.header('📋 Basic Requirements');
    const nodeInstalled = checkCommand('node --version', 'Node.js');
    const npmInstalled = checkCommand('npm --version', 'npm');
    const gitInstalled = checkCommand('git --version', 'Git');
    const dockerInstalled = checkCommand('docker --version', 'Docker');
    
    // Check Docker status
    if (dockerInstalled) {
        try {
            execSync('docker info', { stdio: 'pipe' });
            log.success('Docker is running');
        } catch (error) {
            log.warning('Docker is installed but not running');
        }
    }
    
    // Check for existing containers
    log.header('🐳 Docker Containers');
    if (dockerInstalled) {
        checkDockerContainer('sql-server');
    }
    
    // Check project files
    log.header('📁 Project Files');
    checkFile('package.json', 'Root package.json');
    checkFile('server/package.json', 'Server package.json');
    checkFile('client/package.json', 'Client package.json');
    checkFile('setup-database-complete.js', 'Setup script');
    
    // Check environment files
    log.header('⚙️ Configuration Files');
    const envExists = checkFile('.env', 'Environment file');
    const serverEnvExists = checkFile('server/.env', 'Server environment file');
    
    // Check database connection (if env exists)
    if (envExists) {
        try {
            const envContent = fs.readFileSync('.env', 'utf8');
            const dbName = envContent.match(/DB_NAME=(.+)/)?.[1] || 'Not configured';
            const useDatabase = envContent.match(/USE_DATABASE=(.+)/)?.[1] || 'Not configured';
            const apiKey = envContent.includes('OPENAI_API_KEY=') && 
                          !envContent.includes('OPENAI_API_KEY=your_openai_api_key_here') ? 'Configured' : 'Not configured';
            
            log.info(`Database name: ${dbName}`);
            log.info(`Use database: ${useDatabase}`);
            log.info(`OpenAI API key: ${apiKey}`);
        } catch (error) {
            log.warning('Could not read .env file');
        }
    }
    
    // Check node_modules
    log.header('📦 Dependencies');
    checkFile('node_modules', 'Root node_modules');
    checkFile('server/node_modules', 'Server node_modules');
    checkFile('client/node_modules', 'Client node_modules');
    
    // Check database (if Docker is running)
    log.header('🗄️ Database Status');
    if (dockerInstalled) {
        try {
            const containers = execSync('docker ps --format "{{.Names}}: {{.Status}}"', { stdio: 'pipe', encoding: 'utf8' });
            if (containers.includes('sql-server')) {
                log.success('SQL Server container is running');
                
                // Try to check database
                try {
                    const dbCheck = execSync('docker exec sql-server /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -C -Q "SELECT name FROM sys.databases WHERE name LIKE \'%Loan%\'"', { stdio: 'pipe', encoding: 'utf8' });
                    if (dbCheck.includes('LoanOfficer')) {
                        log.success('LoanOfficer database found');
                    } else {
                        log.warning('No LoanOfficer database found');
                    }
                } catch (error) {
                    log.warning('Could not check database (may need setup)');
                }
            } else {
                log.warning('SQL Server container is not running');
            }
        } catch (error) {
            log.warning('Could not check running containers');
        }
    }
    
    // Summary
    log.header('📊 Summary');
    
    const basicReqs = nodeInstalled && npmInstalled && gitInstalled && dockerInstalled;
    
    if (basicReqs) {
        log.success('✅ All basic requirements are installed!');
        console.log('');
        console.log('🚀 Ready to run setup:');
        console.log('   node setup-database-complete.js --auto');
        console.log('');
        console.log('🔧 Or interactive setup:');
        console.log('   node setup-database-complete.js');
    } else {
        log.error('❌ Some basic requirements are missing');
        console.log('');
        console.log('📝 Install missing requirements:');
        if (!nodeInstalled) console.log('   • Install Node.js: https://nodejs.org/');
        if (!npmInstalled) console.log('   • npm comes with Node.js');
        if (!gitInstalled) console.log('   • Install Git: https://git-scm.com/');
        if (!dockerInstalled) console.log('   • Install Docker: https://docs.docker.com/get-docker/');
    }
    
    console.log('');
    console.log('💡 This check shows what you have BEFORE running setup');
    console.log('   The setup script will install/configure what\'s missing');
}

// Run the check
if (require.main === module) {
    main().catch(error => {
        console.error('System check failed:', error.message);
        process.exit(1);
    });
}

module.exports = { main }; 