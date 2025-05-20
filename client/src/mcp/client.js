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
  },
  
  // =================== PREDICTIVE ANALYTICS FUNCTIONS ===================
  
  async predictDefaultRisk(borrowerId, timeHorizon = '3m') {
    try {
      console.log(`Predicting default risk for borrower ${borrowerId} with time horizon ${timeHorizon}...`);
      const response = await axios.get(`${this.baseURL}/predict/default-risk/${borrowerId}?time_horizon=${timeHorizon}`, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'predictDefaultRisk');
      throw error;
    }
  },
  
  async predictNonAccrualRisk(borrowerId) {
    try {
      console.log(`Predicting non-accrual risk for borrower ${borrowerId}...`);
      const response = await axios.get(`${this.baseURL}/predict/non-accrual-risk/${borrowerId}`, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'predictNonAccrualRisk');
      throw error;
    }
  },
  
  async forecastEquipmentMaintenance(borrowerId, timeHorizon = '1y') {
    try {
      console.log(`Forecasting equipment maintenance costs for borrower ${borrowerId} over ${timeHorizon}...`);
      const response = await axios.get(`${this.baseURL}/predict/equipment-maintenance/${borrowerId}?time_horizon=${timeHorizon}`, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'forecastEquipmentMaintenance');
      throw error;
    }
  },
  
  async assessCropYieldRisk(borrowerId, options = {}) {
    try {
      let url = `${this.baseURL}/predict/crop-yield-risk/${borrowerId}`;
      const params = [];
      
      if (options.cropType) {
        params.push(`crop_type=${encodeURIComponent(options.cropType)}`);
      }
      
      if (options.season) {
        params.push(`season=${encodeURIComponent(options.season)}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      console.log(`Assessing crop yield risk for borrower ${borrowerId}...`);
      const response = await axios.get(url, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'assessCropYieldRisk');
      throw error;
    }
  },
  
  async analyzeMarketPriceImpact(borrowerId, commodityTypes = []) {
    try {
      let url = `${this.baseURL}/predict/market-price-impact/${borrowerId}`;
      
      if (commodityTypes && commodityTypes.length > 0) {
        url += `?commodities=${encodeURIComponent(commodityTypes.join(','))}`;
      }
      
      console.log(`Analyzing market price impact for borrower ${borrowerId}...`);
      const response = await axios.get(url, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'analyzeMarketPriceImpact');
      // For demo, return mock data if endpoint doesn't exist yet
      return this.getMockMarketPriceImpact(borrowerId, commodityTypes);
    }
  },
  
  getMockMarketPriceImpact(borrowerId, commodityTypes) {
    const defaultCommodities = ['corn', 'soybeans', 'wheat'];
    const commodities = commodityTypes.length > 0 ? commodityTypes : defaultCommodities;
    
    const result = {
      borrower_id: borrowerId,
      analysis_date: new Date().toISOString().split('T')[0],
      overall_income_change_risk: Math.random() > 0.7 ? 'high' : (Math.random() > 0.4 ? 'medium' : 'low'),
      income_drop_probability: Math.round(Math.random() * 60) / 100, // 0-0.6 probability
      commodity_analysis: []
    };
    
    commodities.forEach(commodity => {
      // Generate mock price trends
      const currentPrice = {
        'corn': 5.20 + (Math.random() * 1.5 - 0.75),
        'soybeans': 12.40 + (Math.random() * 2 - 1),
        'wheat': 6.80 + (Math.random() * 1.8 - 0.9),
        'cotton': 0.85 + (Math.random() * 0.2 - 0.1),
        'rice': 14.50 + (Math.random() * 2 - 1)
      }[commodity.toLowerCase()] || 10.0;
      
      const priceChange = (Math.random() > 0.6) ? 
        -(Math.random() * 0.25 + 0.05) : // 5-30% decrease
        (Math.random() * 0.15 - 0.05);   // -5 to +10% change
      
      const futurePrice = currentPrice * (1 + priceChange);
      
      result.commodity_analysis.push({
        commodity: commodity,
        current_price: Math.round(currentPrice * 100) / 100,
        projected_price: Math.round(futurePrice * 100) / 100,
        price_change_percent: Math.round(priceChange * 100),
        income_impact: Math.round(priceChange * 100) < -15 ? 'significant' : 
                      (Math.round(priceChange * 100) < -5 ? 'moderate' : 'minimal'),
        market_factors: this.generateMarketFactors(commodity, priceChange)
      });
    });
    
    return result;
  },
  
  generateMarketFactors(commodity, priceChange) {
    const factors = [];
    
    if (priceChange < -0.15) {
      factors.push(`Increased production forecasts for ${commodity} globally`);
      factors.push(`Lower import demand from major markets`);
    } else if (priceChange < -0.05) {
      factors.push(`Slightly higher than expected yields in key growing regions`);
    } else if (priceChange > 0.05) {
      factors.push(`Weather concerns in key growing regions`);
      factors.push(`Increased export demand`);
    } else {
      factors.push(`Stable supply and demand fundamentals`);
    }
    
    // Add random market factors
    const randomFactors = [
      `Trade policy changes affecting ${commodity} exports`,
      `Shift in biofuel mandates impacting demand`,
      `Currency fluctuations affecting export competitiveness`,
      `Changing consumer preferences`,
      `Transportation and logistics challenges`
    ];
    
    // Add 1-2 random factors
    const randomCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < randomCount; i++) {
      const factor = randomFactors[Math.floor(Math.random() * randomFactors.length)];
      if (!factors.includes(factor)) {
        factors.push(factor);
      }
    }
    
    return factors;
  },
  
  async recommendLoanRestructuring(loanId, optimizationGoal = 'lower_payments') {
    try {
      console.log(`Recommending loan restructuring options for loan ${loanId} with goal: ${optimizationGoal}`);
      const response = await axios.get(`${this.baseURL}/recommendations/refinance/${loanId}?optimization_goal=${optimizationGoal}`, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'recommendLoanRestructuring');
      throw error;
    }
  }
};

export default mcpClient; 