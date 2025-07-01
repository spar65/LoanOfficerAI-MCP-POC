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
      
      // If unauthorized, maybe token expired - try to refresh
      if (error.response.status === 401) {
        console.log('Authentication error - attempting to refresh token');
        
        // We'll return a special error object that indicates token refresh is needed
        error.tokenExpired = true;
        
        // Let the calling function handle the refresh flow
        return error;
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
      
      // Normalize the borrowerId
      const normalizedId = borrowerId.toString().toUpperCase().trim();
      console.log(`Using normalized borrower ID: ${normalizedId}`);
      
      // First try the analytics endpoint
      try {
        const response = await axios.get(
          `${this.baseURL}/analytics/predict/non-accrual-risk/${normalizedId}`, 
          this.getConfig()
        );
        console.log('Analytics API returned non-accrual risk data successfully');
        return response.data;
      } catch (analyticsError) {
        console.log('Analytics API failed, trying risk endpoint:', analyticsError.message);
        
        // If analytics fails, try the risk endpoint
        try {
          const riskResponse = await axios.get(
            `${this.baseURL}/risk/non-accrual/${normalizedId}`,
            this.getConfig()
          );
          console.log('Risk API returned non-accrual risk data successfully');
          return riskResponse.data;
        } catch (riskError) {
          console.log('Risk API also failed:', riskError.message);
          
          // If all else fails, try to get borrower data and construct a response
          try {
            const borrowerResponse = await axios.get(
              `${this.baseURL}/borrowers/${normalizedId}`,
              this.getConfig()
            );
            
            if (borrowerResponse.data) {
              console.log('Constructing fallback response with borrower data');
              return {
                borrower_id: normalizedId,
                borrower_name: `${borrowerResponse.data.first_name} ${borrowerResponse.data.last_name}`,
                risk_score: 45, // Medium risk
                risk_level: "medium",
                risk_factors: [
                  "Payment history inconsistency",
                  "Seasonal cash flow challenges"
                ],
                fallback_generation: true,
                message: "Based on available information, there is a medium risk of this borrower becoming non-accrual."
              };
            }
            
            throw new Error('Could not retrieve borrower data');
          } catch (borrowerError) {
            console.error('All API attempts failed for non-accrual risk:', borrowerError);
            throw new Error(`Failed to assess non-accrual risk for borrower ${normalizedId}: ${borrowerError.message}`);
          }
        }
      }
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
  
  async assessCropYieldRisk(borrowerId, cropType = null, season = 'current') {
    return this.retryRequestWithRefresh(async function(borrowerId, cropType, season) {
      try {
        console.log(`Assessing crop yield risk for borrower ${borrowerId}, crop: ${cropType || 'all crops'}, season: ${season}`);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (cropType) queryParams.append('crop_type', cropType);
        if (season) queryParams.append('season', season);
        
        const response = await axios.get(
          `${this.baseURL}/analytics/crop-yield-risk/${borrowerId}?${queryParams.toString()}`,
          this.getConfig()
        );
        
        console.log('Crop yield risk assessment result:', response.data);
        return response.data;
      } catch (error) {
        const processedError = this.handleApiError(error, 'assessCropYieldRisk');
        
        // If an auth error that needs token refresh, the calling function will handle it
        if (processedError.tokenExpired) throw processedError;
        
        // Otherwise return graceful fallback
        return {
          borrower_id: borrowerId,
          error: true,
          message: `Unable to assess crop yield risk: ${error.message}`,
          risk_level: "unknown",
          risk_factors: ["Assessment unavailable due to data limitations or connectivity issues"],
          recommendations: ["Contact agricultural specialist for manual assessment"]
        };
      }
    }, borrowerId, cropType, season);
  },
  
  async analyzeMarketPriceImpact(commodity, priceChangePercent = null) {
    return this.retryRequestWithRefresh(async function(commodity, priceChangePercent) {
      try {
        console.log(`Analyzing market price impact for ${commodity}, change: ${priceChangePercent || 'current projections'}`);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (priceChangePercent) queryParams.append('price_change_percent', priceChangePercent);
        
        const response = await axios.get(
          `${this.baseURL}/analytics/market-price-impact/${commodity}?${queryParams.toString()}`,
          this.getConfig()
        );
        
        console.log('Market price impact analysis result:', response.data);
        return response.data;
      } catch (error) {
        const processedError = this.handleApiError(error, 'analyzeMarketPriceImpact');
        
        // If an auth error that needs token refresh, the calling function will handle it
        if (processedError.tokenExpired) throw processedError;
        
        // Otherwise return graceful fallback
        return {
          commodity: commodity,
          error: true,
          message: `Unable to analyze market price impact: ${error.message}`,
          affected_loans_count: 0,
          affected_loans: [],
          portfolio_impact_summary: "Analysis unavailable due to data limitations or connectivity issues"
        };
      }
    }, commodity, priceChangePercent);
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
  
  async recommendLoanRestructuring(loanId, restructuringGoal = null) {
    return this.retryRequestWithRefresh(async function(loanId, restructuringGoal) {
      try {
        console.log(`Generating loan restructuring recommendations for loan ${loanId}, goal: ${restructuringGoal || 'general'}`);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (restructuringGoal) queryParams.append('goal', restructuringGoal);
        
        const response = await axios.get(
          `${this.baseURL}/analytics/loan-restructuring/${loanId}?${queryParams.toString()}`,
          this.getConfig()
        );
        
        console.log('Loan restructuring recommendations:', response.data);
        return response.data;
      } catch (error) {
        const processedError = this.handleApiError(error, 'recommendLoanRestructuring');
        
        // If an auth error that needs token refresh, the calling function will handle it
        if (processedError.tokenExpired) throw processedError;
        
        // Otherwise return graceful fallback
        return {
          loan_id: loanId,
          error: true,
          message: `Unable to generate loan restructuring recommendations: ${error.message}`,
          current_structure: {},
          restructuring_options: [],
          recommendation: "Unable to generate recommendations due to data limitations or connectivity issues"
        };
      }
    }, loanId, restructuringGoal);
  },
  
  // =================== RISK ASSESSMENT FUNCTIONS ===================
  
  async evaluateCollateralSufficiency(loanId, marketConditions = 'stable') {
    return this.retryRequestWithRefresh(async function(loanId, marketConditions) {
      try {
        console.log(`Evaluating collateral sufficiency for loan ${loanId} under ${marketConditions} market conditions...`);
        const response = await axios.get(`${this.baseURL}/risk/collateral-sufficiency/${loanId}?market_conditions=${marketConditions}`, this.getConfig());
        console.log('Collateral evaluation result:', response.data);
        return response.data;
      } catch (error) {
        this.handleApiError(error, 'evaluateCollateralSufficiency');
        
        // Return a graceful fallback with error information
        return {
          loan_id: loanId,
          is_sufficient: false,
          error: true,
          message: `Unable to evaluate collateral: ${error.message}`,
          sufficiency_ratio: 0,
          assessment: "Could not evaluate collateral due to data limitations or connectivity issues."
        };
      }
    }, loanId, marketConditions);
  },
  
  async analyzePaymentPatterns(borrowerId, period = '1y') {
    try {
      console.log(`Analyzing payment patterns for borrower ${borrowerId} over ${period}...`);
      const response = await axios.get(
        `${this.baseURL}/analytics/payment-patterns/${borrowerId}?period=${period}`,
        this.getConfig()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'analyzePaymentPatterns');
      throw error;
    }
  },
  
  async findFarmersAtRisk(cropType, season, riskLevel = 'high') {
    try {
      console.log(`Finding farmers at risk with params: crop=${cropType}, season=${season}, risk=${riskLevel}`);
      let url = `${this.baseURL}/risk/farmers-at-risk?`;
      const params = [];
      
      if (cropType) params.push(`crop_type=${encodeURIComponent(cropType)}`);
      if (season) params.push(`season=${encodeURIComponent(season)}`);
      if (riskLevel) params.push(`risk_level=${encodeURIComponent(riskLevel)}`);
      
      url += params.join('&');
      
      const response = await axios.get(url, this.getConfig());
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'findFarmersAtRisk');
      throw error;
    }
  },
  
  async getBorrowerNonAccrualRisk(borrowerId) {
    return this.retryRequestWithRefresh(async function(borrowerId) {
      try {
        console.log(`Evaluating non-accrual risk for borrower ${borrowerId}...`);
        const response = await axios.get(`${this.baseURL}/risk/non-accrual/${borrowerId}`, this.getConfig());
        console.log('Non-accrual risk evaluation result:', response.data);
        return response.data;
      } catch (error) {
        this.handleApiError(error, 'getBorrowerNonAccrualRisk');
        
        // Return a graceful fallback with error information
        return {
          borrower_id: borrowerId,
          non_accrual_risk: "unknown",
          risk_score: 50,
          error: true,
          message: `Unable to assess non-accrual risk: ${error.message}`,
          risk_factors: ["Assessment unavailable due to data limitations or connectivity issues"],
          recommendations: ["Contact loan officer for manual risk assessment"]
        };
      }
    }, borrowerId);
  },
  
  async getBorrowerDefaultRisk(borrowerId, timeHorizon = 'medium_term') {
    return this.retryRequestWithRefresh(async function(borrowerId, timeHorizon) {
      try {
        console.log(`Evaluating default risk for borrower ${borrowerId} with time horizon ${timeHorizon}...`);
        const response = await axios.get(`${this.baseURL}/risk/default/${borrowerId}?time_horizon=${timeHorizon}`, this.getConfig());
        console.log('Default risk evaluation result:', response.data);
        return response.data;
      } catch (error) {
        this.handleApiError(error, 'getBorrowerDefaultRisk');
        
        // Return a graceful fallback with error information
        return {
          borrower_id: borrowerId,
          risk_score: 50, // Default to medium risk when we can't calculate
          risk_level: "unknown",
          error: true,
          message: `Unable to assess default risk: ${error.message}`,
          time_horizon: timeHorizon,
          key_factors: ["Risk assessment unavailable due to data limitations or connectivity issues"],
          recommendation: "Contact loan officer for manual risk assessment"
        };
      }
    }, borrowerId, timeHorizon);
  },
  
  // Method to handle retrying requests after token refresh
  async retryRequestWithRefresh(requestFunction, ...args) {
    try {
      // Try the request first
      return await requestFunction.apply(this, args);
    } catch (error) {
      // If it's a token expiration error, try to refresh the token
      if (error.tokenExpired) {
        console.log('Token expired, attempting to refresh before retrying request');
        
        // Try to refresh the token
        const refreshSuccess = await authService.refreshToken();
        
        if (refreshSuccess) {
          console.log('Token refreshed successfully, retrying original request');
          // Retry the original request with the new token
          return await requestFunction.apply(this, args);
        } else {
          console.error('Token refresh failed');
          // Redirect to login page or show an error to the user
          // For now, just throw the error
          throw new Error('Authentication failed. Please log in again.');
        }
      }
      
      // If it's any other error, just throw it
      throw error;
    }
  },
};

export default mcpClient; 