#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    step: (msg) => console.log(`${colors.cyan}🔧 ${msg}${colors.reset}`),
    header: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`)
};

class ApplicationLauncher {
    constructor() {
        this.processes = [];
        this.isWindows = process.platform === 'win32';
        this.isMac = process.platform === 'darwin';
        this.isLinux = process.platform === 'linux';
    }

    async run() {
        log.header('🚀 LoanOfficerAI MCP - Application Launcher');
        
        console.log('This script will:');
        console.log('  1. 🔍 Validate project setup');
        console.log('  2. 🖥️  Launch server on port 3001');
        console.log('  3. 🌐 Launch client on port 3000');
        console.log('  4. 📱 Open browser automatically');
        console.log('  5. 📊 Monitor both processes\n');

        // Step 1: Validate setup
        await this.validateSetup();
        
        // Step 2: Start server
        await this.startServer();
        
        // Step 3: Wait a moment for server to initialize
        await this.delay(3000);
        
        // Step 4: Start client
        await this.startClient();
        
        // Step 5: Wait for client to start
        await this.delay(5000);
        
        // Step 6: Open browser
        await this.openBrowser();
        
        // Step 7: Monitor processes
        this.setupProcessMonitoring();
        
        // Step 8: Show status and instructions
        this.showStatus();
    }

    async validateSetup() {
        log.step('Validating project setup...');
        
        // Check if we're in the right directory
        if (!fs.existsSync('package.json')) {
            log.error('package.json not found. Please run this script from the project root directory.');
            process.exit(1);
        }
        
        // Check if server directory exists
        if (!fs.existsSync('server')) {
            log.error('Server directory not found. Please ensure project structure is correct.');
            process.exit(1);
        }
        
        // Check if client directory exists
        if (!fs.existsSync('client')) {
            log.error('Client directory not found. Please ensure project structure is correct.');
            process.exit(1);
        }
        
        // Check if dependencies are installed
        if (!fs.existsSync('server/node_modules')) {
            log.warning('Server dependencies not found. Run: cd server && npm install');
        }
        
        if (!fs.existsSync('client/node_modules')) {
            log.warning('Client dependencies not found. Run: cd client && npm install');
        }
        
        // Check if environment file exists
        if (!fs.existsSync('server/.env')) {
            log.warning('Server .env file not found. Some features may not work.');
            log.info('Run setup.js to configure environment variables.');
        }
        
        log.success('Project structure validated');
    }

    async startServer() {
        log.step('Starting server on port 3001...');
        
        const serverCommand = this.getTerminalCommand({
            title: 'LoanOfficerAI Server (Port 3001)',
            command: 'cd server && npm run dev',
            workingDir: path.join(process.cwd(), 'server'),
            color: 'blue'
        });
        
        try {
            const serverProcess = spawn(serverCommand.shell, serverCommand.args, {
                stdio: 'inherit',
                detached: true,
                cwd: process.cwd()
            });
            
            this.processes.push({
                name: 'Server',
                process: serverProcess,
                port: 3001,
                url: 'http://localhost:3001'
            });
            
            log.success('Server terminal launched');
        } catch (error) {
            log.error(`Failed to start server: ${error.message}`);
            throw error;
        }
    }

    async startClient() {
        log.step('Starting client on port 3000...');
        
        const clientCommand = this.getTerminalCommand({
            title: 'LoanOfficerAI Client (Port 3000)',
            command: 'cd client && npm start',
            workingDir: path.join(process.cwd(), 'client'),
            color: 'green'
        });
        
        try {
            const clientProcess = spawn(clientCommand.shell, clientCommand.args, {
                stdio: 'inherit',
                detached: true,
                cwd: process.cwd()
            });
            
            this.processes.push({
                name: 'Client',
                process: clientProcess,
                port: 3000,
                url: 'http://localhost:3000'
            });
            
            log.success('Client terminal launched');
        } catch (error) {
            log.error(`Failed to start client: ${error.message}`);
            throw error;
        }
    }

    getTerminalCommand({ title, command, workingDir, color }) {
        if (this.isWindows) {
            // Windows Command Prompt
            return {
                shell: 'cmd',
                args: ['/c', 'start', 'cmd', '/k', `title ${title} && ${command}`]
            };
        } else if (this.isMac) {
            // macOS Terminal
            const script = `
                tell application "Terminal"
                    do script "cd '${workingDir}' && echo '🚀 ${title}' && ${command}"
                    set custom title of front window to "${title}"
                end tell
            `;
            return {
                shell: 'osascript',
                args: ['-e', script]
            };
        } else {
            // Linux - try different terminal emulators
            const terminals = [
                { cmd: 'gnome-terminal', args: ['--title', title, '--', 'bash', '-c', `cd '${workingDir}' && echo '🚀 ${title}' && ${command}; exec bash`] },
                { cmd: 'konsole', args: ['--title', title, '-e', 'bash', '-c', `cd '${workingDir}' && echo '🚀 ${title}' && ${command}; exec bash`] },
                { cmd: 'xterm', args: ['-title', title, '-e', 'bash', '-c', `cd '${workingDir}' && echo '🚀 ${title}' && ${command}; exec bash`] },
                { cmd: 'x-terminal-emulator', args: ['-title', title, '-e', 'bash', '-c', `cd '${workingDir}' && echo '🚀 ${title}' && ${command}; exec bash`] }
            ];
            
            for (const terminal of terminals) {
                try {
                    require('child_process').execSync(`which ${terminal.cmd}`, { stdio: 'ignore' });
                    return { shell: terminal.cmd, args: terminal.args };
                } catch (e) {
                    // Terminal not found, try next one
                }
            }
            
            // Fallback - just run in current terminal
            log.warning('No suitable terminal emulator found. Running in current terminal.');
            return { shell: 'bash', args: ['-c', `cd '${workingDir}' && ${command}`] };
        }
    }

    async openBrowser() {
        log.step('Opening browser...');
        
        const url = 'http://localhost:3000';
        let command;
        
        if (this.isWindows) {
            command = `start ${url}`;
        } else if (this.isMac) {
            command = `open ${url}`;
        } else {
            command = `xdg-open ${url}`;
        }
        
        try {
            require('child_process').exec(command);
            log.success('Browser opened to http://localhost:3000');
        } catch (error) {
            log.warning('Could not open browser automatically');
            log.info(`Please open your browser to: ${url}`);
        }
    }

    setupProcessMonitoring() {
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            log.info('\n🛑 Shutting down application...');
            this.cleanup();
        });
        
        process.on('SIGTERM', () => {
            log.info('\n🛑 Shutting down application...');
            this.cleanup();
        });
    }

    cleanup() {
        log.step('Cleaning up processes...');
        
        this.processes.forEach(({ name, process }) => {
            try {
                if (process && !process.killed) {
                    process.kill();
                    log.success(`${name} process terminated`);
                }
            } catch (error) {
                log.warning(`Could not terminate ${name} process`);
            }
        });
        
        log.success('Cleanup complete');
        process.exit(0);
    }

    showStatus() {
        log.header('🎉 Application Started Successfully!');
        
        console.log(`${colors.bold}🌐 Application URLs:${colors.reset}`);
        console.log(`   Client:  ${colors.green}http://localhost:3000${colors.reset} (React App)`);
        console.log(`   Server:  ${colors.blue}http://localhost:3001${colors.reset} (API Server)`);
        console.log(`   Health:  ${colors.cyan}http://localhost:3001/api/health${colors.reset} (Server Status)`);
        
        console.log(`\n${colors.bold}🔑 Test Credentials:${colors.reset}`);
        console.log(`   Username: ${colors.yellow}john.doe${colors.reset}`);
        console.log(`   Password: ${colors.yellow}password123${colors.reset}`);
        
        console.log(`\n${colors.bold}🤖 Try These Chatbot Queries:${colors.reset}`);
        console.log(`   • "Show me all active loans"`);
        console.log(`   • "What's the risk for borrower B001?"`);
        console.log(`   • "Get loan details for L001"`);
        console.log(`   • "Show me loan summary"`);
        
        console.log(`\n${colors.bold}📊 Monitoring:${colors.reset}`);
        console.log(`   • Server and client are running in separate terminals`);
        console.log(`   • Watch terminal windows for logs and errors`);
        console.log(`   • Press ${colors.red}Ctrl+C${colors.reset} in this window to stop all processes`);
        
        console.log(`\n${colors.bold}📚 Documentation:${colors.reset}`);
        console.log(`   • README-01-EVALUATION-STEPS.md - Full evaluation guide`);
        console.log(`   • README-12-EXECUTIVE-SUMMARY.md - Business overview`);
        console.log(`   • README-03-TECHNICAL-GUIDE.md - Technical details`);
        
        console.log(`\n${colors.green}🎯 Ready for demonstration!${colors.reset}`);
        console.log(`\n${colors.dim}Tip: Keep this terminal open to monitor the application.${colors.reset}`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the launcher if this script is executed directly
if (require.main === module) {
    const launcher = new ApplicationLauncher();
    launcher.run().catch(error => {
        console.error(`${colors.red}Launch failed:${colors.reset}`, error);
        process.exit(1);
    });
}

module.exports = ApplicationLauncher; 