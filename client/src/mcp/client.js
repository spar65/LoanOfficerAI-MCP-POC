import axios from 'axios';

const mcpClient = {
  // In production, update baseURL to real MCP endpoint (e.g., https://your-mcp-api.com)
  baseURL: 'http://localhost:3001/api',
  
  async getAllLoans() {
    try {
      const response = await axios.get(`${this.baseURL}/loans`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loans:', error);
      return [];
    }
  },
  
  async getLoanStatus(loanId) {
    try {
      const response = await axios.get(`${this.baseURL}/loan/status/${loanId}`);
      return response.data.status;
    } catch (error) {
      console.error('Error fetching loan status:', error);
      throw error;
    }
  },
  
  async getLoanDetails(loanId) {
    try {
      const response = await axios.get(`${this.baseURL}/loan/${loanId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loan details:', error);
      throw error;
    }
  },
  
  async getActiveLoans() {
    try {
      const response = await axios.get(`${this.baseURL}/loans/active`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active loans:', error);
      throw error;
    }
  },
  
  async getLoansByBorrower(borrower) {
    try {
      const response = await axios.get(`${this.baseURL}/loans/borrower/${encodeURIComponent(borrower)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loans by borrower:', error);
      throw error;
    }
  },
  
  async getLoanPayments(loanId) {
    try {
      const response = await axios.get(`${this.baseURL}/loan/${loanId}/payments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loan payments:', error);
      throw error;
    }
  },
  
  async getLoanCollateral(loanId) {
    try {
      const response = await axios.get(`${this.baseURL}/loan/${loanId}/collateral`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loan collateral:', error);
      throw error;
    }
  },
  
  async getLoanSummary() {
    try {
      const response = await axios.get(`${this.baseURL}/loans/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loan summary:', error);
      throw error;
    }
  },
  
  async getBorrowers() {
    try {
      const response = await axios.get(`${this.baseURL}/borrowers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching borrowers:', error);
      throw error;
    }
  },
  
  async getBorrowerDetails(borrowerId) {
    try {
      const response = await axios.get(`${this.baseURL}/borrower/${borrowerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching borrower details:', error);
      throw error;
    }
  }
};

export default mcpClient; 