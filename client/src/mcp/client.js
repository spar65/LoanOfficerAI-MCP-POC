import axios from 'axios';
import authService from './authService';

const mcpClient = {
  // In production, update baseURL to real MCP endpoint (e.g., https://your-mcp-api.com)
  baseURL: 'http://localhost:3001/api',
  
  // Get axios config with auth headers
  getConfig() {
    const token = authService.getToken();
    const config = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true // Important for cookies
    };
    
    console.log('API request with auth token:', token ? 'Present' : 'Missing');
    return config;
  },
  
  // Check server health (public endpoint)
  async checkHealth() {
    try {
      console.log('Checking server health...');
      const response = await axios.get(`${this.baseURL}/health`);
      console.log('Server health check response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Server health check failed:', error.message);
      return null;
    }
  },
  
  // Handle API errors consistently
  handleApiError(error, endpoint) {
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx
      console.error(`${endpoint} API error:`, {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // If unauthorized, maybe token expired
      if (error.response.status === 401) {
        console.log('Authentication error - token may have expired');
        // Redirect to login or refresh token logic could be added here
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`${endpoint} request error:`, error.request);
    } else {
      // Something happened in setting up the request
      console.error(`${endpoint} setup error:`, error.message);
    }
    return error;
  },
  
  async getAllLoans() {
    try {
      console.log('Fetching all loans...');
      const response = await axios.get(`${this.baseURL}/loans`, this.getConfig());
      console.log(`Received ${response.data.length} loans`);
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getAllLoans');
      return [];
    }
  },
  
  async getLoanStatus(loanId) {
    try {
      console.log(`Fetching status for loan ${loanId}...`);
      const response = await axios.get(`${this.baseURL}/loan/status/${loanId}`, this.getConfig());
      return response.data.status;
    } catch (error) {
      this.handleApiError(error, 'getLoanStatus');
      throw error;
    }
  },
  
  async getLoanDetails(loanId) {
    try {
      console.log(`Fetching details for loan ${loanId}...`);
      const response = await axios.get(`${this.baseURL}/loan/${loanId}`, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getLoanDetails');
      throw error;
    }
  },
  
  async getActiveLoans() {
    try {
      console.log('Fetching active loans...');
      const response = await axios.get(`${this.baseURL}/loans/active`, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getActiveLoans');
      throw error;
    }
  },
  
  async getLoansByBorrower(borrower) {
    try {
      console.log(`Fetching loans for borrower ${borrower}...`);
      const response = await axios.get(`${this.baseURL}/loans/borrower/${encodeURIComponent(borrower)}`, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getLoansByBorrower');
      throw error;
    }
  },
  
  async getLoanPayments(loanId) {
    try {
      console.log(`Fetching payments for loan ${loanId}...`);
      const response = await axios.get(`${this.baseURL}/loan/${loanId}/payments`, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getLoanPayments');
      throw error;
    }
  },
  
  async getLoanCollateral(loanId) {
    try {
      console.log(`Fetching collateral for loan ${loanId}...`);
      const response = await axios.get(`${this.baseURL}/loan/${loanId}/collateral`, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getLoanCollateral');
      throw error;
    }
  },
  
  async getLoanSummary() {
    try {
      console.log('Fetching loan summary...');
      const response = await axios.get(`${this.baseURL}/loans/summary`, this.getConfig());
      console.log('Loan summary received:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getLoanSummary');
      // Return default values on error
      return {
        totalLoans: 0,
        activeLoans: 0,
        totalAmount: 0,
        delinquencyRate: 0
      };
    }
  },
  
  async getBorrowers() {
    try {
      console.log('Fetching all borrowers...');
      const response = await axios.get(`${this.baseURL}/borrowers`, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getBorrowers');
      throw error;
    }
  },
  
  async getBorrowerDetails(borrowerId) {
    try {
      console.log(`Fetching details for borrower ${borrowerId}...`);
      const response = await axios.get(`${this.baseURL}/borrower/${borrowerId}`, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getBorrowerDetails');
      throw error;
    }
  }
};

export default mcpClient; 