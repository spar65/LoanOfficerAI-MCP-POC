import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

class MCPClient {
  constructor() {
    this.client = null;
    this.transport = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }
  
  async connect(url = 'http://localhost:3001/mcp') {
    try {
      console.log(`[MCP Client] Connecting to ${url}`);
      
      // Create StreamableHTTP transport
      this.transport = new StreamableHTTPClientTransport(new URL(url));
      
      // Create MCP client
      this.client = new Client({
        name: 'LoanOfficerAI-Client',
        version: '1.0.0'
      });
      
      // Connect to MCP server
      await this.client.connect(this.transport);
      
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log('[MCP Client] Connected successfully');
      
      // Set up connection event handlers
      this.transport.onclose = () => {
        console.log('[MCP Client] Connection closed');
        this.connected = false;
        this.attemptReconnect(url);
      };
      
      this.transport.onerror = (error) => {
        console.error('[MCP Client] Transport error:', error);
      };
      
      return true;
    } catch (error) {
      console.error('[MCP Client] Connection failed:', error);
      this.connected = false;
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect(url);
      }
      
      throw error;
    }
  }
  
  async attemptReconnect(url) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[MCP Client] Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`[MCP Client] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.connect(url);
      } catch (error) {
        console.error('[MCP Client] Reconnection failed:', error);
      }
    }, delay);
  }
  
  async disconnect() {
    if (this.transport) {
      await this.transport.close();
      this.connected = false;
      console.log('[MCP Client] Disconnected');
    }
  }
  
  isConnected() {
    return this.connected;
  }
  
  // Tool execution methods
  async callTool(toolName, args = {}) {
    if (!this.connected || !this.client) {
      throw new Error('MCP client not connected');
    }
    
    try {
      console.log(`[MCP Client] Calling tool: ${toolName}`, args);
      
      const result = await this.client.callTool({
        name: toolName,
        arguments: args
      });
      
      // Parse the result content
      if (result.content && result.content.length > 0) {
        const content = result.content[0];
        if (content.type === 'text') {
          try {
            return JSON.parse(content.text);
          } catch {
            return content.text;
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error(`[MCP Client] Tool call failed for ${toolName}:`, error);
      throw error;
    }
  }
  
  // Specific tool methods
  async getBorrowerNonAccrualRisk(borrowerId) {
    return this.callTool('getBorrowerNonAccrualRisk', { borrowerId });
  }
  
  async evaluateCollateralSufficiency(loanId, marketConditions = 'stable') {
    return this.callTool('evaluateCollateralSufficiency', { loanId, marketConditions });
  }
  
  async getBorrowerDefaultRisk(borrowerId, timeHorizon = 'medium_term') {
    return this.callTool('getBorrowerDefaultRisk', { borrowerId, timeHorizon });
  }
  
  // List available tools
  async listTools() {
    if (!this.connected || !this.client) {
      throw new Error('MCP client not connected');
    }
    
    try {
      const tools = await this.client.listTools();
      console.log('[MCP Client] Available tools:', tools);
      return tools;
    } catch (error) {
      console.error('[MCP Client] Failed to list tools:', error);
      throw error;
    }
  }

  // Health check method for server status
  async checkHealth() {
    try {
      const response = await fetch('http://localhost:3001/api/system/status');
      return response.ok;
    } catch (error) {
      console.error('[MCP Client] Health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const mcpClient = new MCPClient();

// TEMPORARILY DISABLE MCP AUTO-CONNECT - focusing on HTTP flow first
// Auto-connect on module load with better error handling
if (typeof window !== 'undefined' && false) { // Disabled for now
  // Browser environment - try to connect immediately and on window load
  const tryConnect = async () => {
    try {
      console.log('[MCP Client] Attempting to connect...');
      const success = await mcpClient.connect();
      if (success) {
        console.log('[MCP Client] Successfully connected to MCP server');
      } else {
        console.warn('[MCP Client] Failed to connect to MCP server');
      }
    } catch (error) {
      console.error('[MCP Client] Connection error:', error);
    }
  };
  
  // Try connecting immediately
  tryConnect();
  
  // Also try on window load as backup
  window.addEventListener('load', () => {
    if (!mcpClient.isConnected()) {
      console.log('[MCP Client] Window loaded, attempting reconnection...');
      tryConnect();
    }
  });
}

// Add a baseURL property for HTTP fallback
mcpClient.baseURL = 'http://localhost:3001/api';

export default mcpClient; 