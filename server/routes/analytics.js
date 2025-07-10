const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const mcpDatabaseService = require('../services/mcpDatabaseService');
const LogService = require('../services/logService');

// Get all high risk farmers
router.get('/high-risk-farmers', async (req, res) => {
  const timeHorizon = req.query.time_horizon || '3m';
  const threshold = req.query.threshold || 'high';
  
  LogService.info(`Identifying high risk farmers with time horizon: ${timeHorizon}, threshold: ${threshold}`);
  
  try {
    // Load data from database
    const borrowersResult = await mcpDatabaseService.executeQuery('SELECT * FROM Borrowers', {});
    const loansResult = await mcpDatabaseService.executeQuery('SELECT * FROM Loans', {});
    const paymentsResult = await mcpDatabaseService.executeQuery('SELECT * FROM Payments', {});
    
    const borrowers = borrowersResult.recordset || borrowersResult;
    const loans = loansResult.recordset || loansResult;
    const payments = paymentsResult.recordset || paymentsResult;
    
    // Define risk thresholds based on the threshold parameter
    let riskThreshold;
    switch(threshold.toLowerCase()) {
      case 'high':
        riskThreshold = 0.3; // Default probability > 30%
        break;
      case 'medium':
        riskThreshold = 0.15; // Default probability > 15%
        break;
      case 'low':
        riskThreshold = 0.05; // Default probability > 5%
        break;
      default:
        riskThreshold = 0.3;
    }
    
    // Process each borrower
    const riskAssessments = borrowers.map(borrower => {
      // Get borrower's loans
      const borrowerLoans = loans.filter(l => l.borrower_id === borrower.borrower_id);
      
      // Skip borrowers with no loans
      if (borrowerLoans.length === 0) {
        return {
          borrower_id: borrower.borrower_id,
          borrower_name: `${borrower.first_name} ${borrower.last_name}`,
          default_probability: 0,
          default_risk_level: "none",
          key_factors: ["No active loans"],
          time_horizon: timeHorizon
        };
      }
      
      // Get payment history
      const allPayments = [];
      borrowerLoans.forEach(loan => {
        const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
        allPayments.push(...loanPayments);
      });
      
      // Calculate recent payment performance
      const allPaymentsSorted = [...allPayments].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
      const recentPayments = allPaymentsSorted.slice(0, 6); // Last 6 payments
      const lateRecentPayments = recentPayments.filter(p => p.status === 'Late').length;
      const latePaymentRatio = recentPayments.length > 0 ? lateRecentPayments / recentPayments.length : 0;
      
      // Calculate debt-to-income ratio
      const totalLoanAmount = borrowerLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
      const debtToIncomeRatio = totalLoanAmount / borrower.income;
      
      // Calculate default probability
      let baseProbability = 0;
      
      // More late payments = higher default probability
      if (latePaymentRatio > 0.5) baseProbability += 0.4;
      else if (latePaymentRatio > 0.3) baseProbability += 0.25;
      else if (latePaymentRatio > 0) baseProbability += 0.1;
      
      // Higher debt-to-income = higher default probability
      if (debtToIncomeRatio > 4) baseProbability += 0.3;
      else if (debtToIncomeRatio > 2) baseProbability += 0.15;
      else if (debtToIncomeRatio > 1) baseProbability += 0.05;
      
      // Lower credit score = higher default probability
      if (borrower.credit_score < 600) baseProbability += 0.25;
      else if (borrower.credit_score < 650) baseProbability += 0.15;
      else if (borrower.credit_score < 700) baseProbability += 0.05;
      
      // Farm size factor - smaller farms may have less buffer
      if (borrower.farm_size < 50) baseProbability += 0.1;
      
      // Adjust for time horizon
      let defaultProbability = 0;
      if (timeHorizon === '3m') {
        defaultProbability = baseProbability * 0.7; // Shorter term = lower probability
      } else if (timeHorizon === '6m') {
        defaultProbability = baseProbability * 1.0;
      } else if (timeHorizon === '1y' || timeHorizon === '12m') {
        defaultProbability = baseProbability * 1.3; // Longer term = higher probability
      }
      
      // Cap probability between 0-1
      defaultProbability = Math.max(0, Math.min(1, defaultProbability));
      
      // Determine risk level
      let riskLevel = "low";
      if (defaultProbability > 0.3) riskLevel = "high";
      else if (defaultProbability > 0.15) riskLevel = "medium";
      
      // Generate key factors
      const keyFactors = [];
      if (latePaymentRatio > 0) {
        keyFactors.push(`${Math.round(latePaymentRatio * 100)}% of recent payments were late`);
      }
      if (debtToIncomeRatio > 1) {
        keyFactors.push(`High debt-to-income ratio of ${debtToIncomeRatio.toFixed(1)}`);
      }
      if (borrower.credit_score < 700) {
        keyFactors.push(`Credit score of ${borrower.credit_score} below optimal range`);
      }
      if (borrower.farm_size < 50) {
        keyFactors.push(`Small farm size (${borrower.farm_size} acres) limits financial buffer`);
      }
      
      return {
        borrower_id: borrower.borrower_id,
        borrower_name: `${borrower.first_name} ${borrower.last_name}`,
        default_probability: Math.round(defaultProbability * 100) / 100,
        default_risk_level: riskLevel,
        farm_type: borrower.farm_type,
        farm_size: borrower.farm_size,
        credit_score: borrower.credit_score,
        key_factors: keyFactors,
        time_horizon: timeHorizon
      };
    });
    
    // Filter for high risk borrowers based on the threshold
    const highRiskFarmers = riskAssessments.filter(assessment => 
      assessment.default_probability >= riskThreshold
    );
    
    // Sort by risk (highest first)
    highRiskFarmers.sort((a, b) => b.default_probability - a.default_probability);
    
    // Generate summary
    const riskLevelCounts = {
      high: riskAssessments.filter(a => a.default_risk_level === 'high').length,
      medium: riskAssessments.filter(a => a.default_risk_level === 'medium').length,
      low: riskAssessments.filter(a => a.default_risk_level === 'low').length,
      none: riskAssessments.filter(a => a.default_risk_level === 'none').length
    };
    
    // Add risk mitigation recommendations
    const recommendations = [];
    if (highRiskFarmers.length > 0) {
      recommendations.push(`Proactively engage with ${highRiskFarmers.length} high risk borrowers to discuss loan status.`);
      
      // Check for common risk factors
      const creditRiskCount = highRiskFarmers.filter(f => 
        f.key_factors.some(factor => factor.includes('credit score'))
      ).length;
      
      const latePaymentCount = highRiskFarmers.filter(f => 
        f.key_factors.some(factor => factor.includes('payments were late'))
      ).length;
      
      if (creditRiskCount > 0) {
        recommendations.push(`${creditRiskCount} farmers have credit scores below optimal range. Consider credit counseling programs.`);
      }
      
      if (latePaymentCount > 0) {
        recommendations.push(`${latePaymentCount} farmers have recent late payments. Review payment schedules to align with farm cash flow.`);
      }
    } else {
      recommendations.push("No high risk farmers detected under current criteria.");
    }
    
    const result = {
      time_horizon: timeHorizon,
      risk_threshold: threshold,
      risk_threshold_value: riskThreshold,
      total_borrowers_analyzed: borrowers.length,
      high_risk_count: highRiskFarmers.length,
      risk_level_summary: riskLevelCounts,
      recommendations: recommendations,
      farmers: highRiskFarmers
    };
    
    LogService.info(`High risk farmers analysis completed. Found ${highRiskFarmers.length} farmers above the ${threshold} risk threshold.`);
    res.json(result);
  } catch (error) {
    LogService.error(`Error identifying high risk farmers:`, {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to identify high risk farmers',
      details: error.message
    });
  }
});

// Analyze payment patterns for a borrower
router.get('/payment-patterns/:borrower_id', async (req, res) => {
  const borrowerId = req.params.borrower_id;
  const period = req.query.period || '1y'; // Default to 1 year
  
  LogService.info(`Analyzing payment patterns for borrower ${borrowerId} with period: ${period}`);
  
  try {
    // Load data from database
    const borrowersResult = await mcpDatabaseService.executeQuery('SELECT * FROM Borrowers', {});
    const loansResult = await mcpDatabaseService.executeQuery('SELECT * FROM Loans', {});
    const paymentsResult = await mcpDatabaseService.executeQuery('SELECT * FROM Payments', {});
    
    const borrowers = borrowersResult.recordset || borrowersResult;
    const loans = loansResult.recordset || loansResult;
    const payments = paymentsResult.recordset || paymentsResult;
  
  // Find the borrower
  const borrower = borrowers.find(b => b.borrower_id === borrowerId);
  if (!borrower) {
    LogService.warn(`Borrower not found with ID: ${borrowerId}`);
    return res.status(404).json({ error: 'Borrower not found' });
  }
  
  // Get borrower's loans
  const borrowerLoans = loans.filter(l => l.borrower_id === borrowerId);
  if (borrowerLoans.length === 0) {
    return res.json({
      borrower_id: borrowerId,
      period: period,
      patterns: ["No loans found for this borrower"],
      seasonality_score: 0,
      consistency_score: 0
    });
  }
  
  // Get payment history for all borrower's loans
  let allPayments = [];
  borrowerLoans.forEach(loan => {
    const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
    allPayments.push(...loanPayments);
  });
  
  // Filter by time period
  const now = new Date();
  let periodStart = new Date();
  if (period === '6m') periodStart.setMonth(now.getMonth() - 6);
  else if (period === '1y') periodStart.setFullYear(now.getFullYear() - 1);
  else if (period === '2y') periodStart.setFullYear(now.getFullYear() - 2);
  else if (period === '3y') periodStart.setFullYear(now.getFullYear() - 3);
  
  allPayments = allPayments.filter(p => new Date(p.payment_date) >= periodStart);
  
  // Group payments by month to analyze seasonality
  const paymentsByMonth = {};
  const statusByMonth = {};
  
  allPayments.forEach(payment => {
    const date = new Date(payment.payment_date);
    const monthKey = date.getMonth(); // 0-11 for Jan-Dec
    
    if (!paymentsByMonth[monthKey]) paymentsByMonth[monthKey] = [];
    paymentsByMonth[monthKey].push(payment);
    
    if (!statusByMonth[monthKey]) statusByMonth[monthKey] = [];
    statusByMonth[monthKey].push(payment.status);
  });
  
  // Analyze payment patterns
  const patterns = [];
  
  // Check for seasonality - months with more/fewer payments
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
  
  // High payment months (typically after harvest)
  const paymentCounts = Object.keys(paymentsByMonth).map(month => ({
    month: parseInt(month),
    count: paymentsByMonth[month].length
  }));
  
  paymentCounts.sort((a, b) => b.count - a.count);
  
  if (paymentCounts.length > 0) {
    // Identify high payment months
    const highPaymentMonths = paymentCounts.slice(0, Math.min(3, paymentCounts.length))
      .filter(m => m.count > 1)
      .map(m => monthNames[m.month]);
    
    if (highPaymentMonths.length > 0) {
      patterns.push(`Higher payment activity in: ${highPaymentMonths.join(', ')}`);
    }
    
    // Identify potential problem months
    const problemMonths = [];
    Object.keys(statusByMonth).forEach(month => {
      const statuses = statusByMonth[month];
      const lateCount = statuses.filter(s => s === 'Late').length;
      const latePercentage = (lateCount / statuses.length) * 100;
      
      if (latePercentage > 50 && statuses.length >= 2) {
        problemMonths.push(monthNames[parseInt(month)]);
      }
    });
    
    if (problemMonths.length > 0) {
      patterns.push(`More payment issues observed in: ${problemMonths.join(', ')}`);
    }
  }
  
  // Check overall payment consistency
  const totalPayments = allPayments.length;
  const onTimePayments = allPayments.filter(p => p.status === 'On Time').length;
  const latePayments = allPayments.filter(p => p.status === 'Late').length;
  
  const consistencyScore = totalPayments > 0 ? (onTimePayments / totalPayments) : 0;
  
  if (totalPayments > 0) {
    if (latePayments === 0) {
      patterns.push("All payments made on time");
    } else {
      const latePercentage = Math.round((latePayments / totalPayments) * 100);
      patterns.push(`${latePercentage}% of payments were late (${latePayments} of ${totalPayments})`);
    }
  }
  
  // Calculate seasonality score
  let seasonalityScore = 0;
  if (paymentCounts.length >= 3) {
    // If payments are concentrated in specific months, seasonality is higher
    const totalPaymentsAcrossMonths = paymentCounts.reduce((sum, m) => sum + m.count, 0);
    const top3MonthsPayments = paymentCounts.slice(0, 3).reduce((sum, m) => sum + m.count, 0);
    seasonalityScore = top3MonthsPayments / totalPaymentsAcrossMonths;
  }
  
  const result = {
    borrower_id: borrowerId,
    borrower_name: `${borrower.first_name} ${borrower.last_name}`,
    period: period,
    total_payments_analyzed: totalPayments,
    patterns: patterns,
    seasonality_score: Number(seasonalityScore.toFixed(2)),
    consistency_score: Number(consistencyScore.toFixed(2))
  };
  
  LogService.info(`Payment pattern analysis completed for borrower ${borrowerId}`);
  res.json(result);
  } catch (error) {
    LogService.error(`Error analyzing payment patterns for borrower ${borrowerId}:`, {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to analyze payment patterns',
      details: error.message
    });
  }
});

// Predict default risk for a specific borrower
router.get('/predict/default-risk/:borrower_id', async (req, res) => {
  const borrowerId = req.params.borrower_id;
  const timeHorizon = req.query.time_horizon || '3m';
  
  LogService.info(`Predicting default risk for borrower ${borrowerId} with time horizon: ${timeHorizon}`);
  
     try {
     // Load data from database
     const borrowersResult = await mcpDatabaseService.executeQuery('SELECT * FROM Borrowers', {});
     const loansResult = await mcpDatabaseService.executeQuery('SELECT * FROM Loans', {});
     const paymentsResult = await mcpDatabaseService.executeQuery('SELECT * FROM Payments', {});
     
     const borrowers = borrowersResult.recordset || borrowersResult;
     const loans = loansResult.recordset || loansResult;
     const payments = paymentsResult.recordset || paymentsResult;
     
     // Find the borrower
     const borrower = borrowers.find(b => b.borrower_id === borrowerId);
    if (!borrower) {
      return res.status(404).json({ error: 'Borrower not found' });
    }
    
    // Get borrower's loans
    const borrowerLoans = loans.filter(l => l.borrower_id === borrowerId);
    if (borrowerLoans.length === 0) {
      return res.json({
        borrower_id: borrowerId,
        borrower_name: `${borrower.first_name} ${borrower.last_name}`,
        default_probability: 0,
        time_horizon: timeHorizon,
        key_factors: ["No loans found for this borrower"],
        prediction_confidence: 1.0
      });
    }
    
    // Get payment history
    const allPayments = [];
    borrowerLoans.forEach(loan => {
      const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
      allPayments.push(...loanPayments);
    });
    
    // Calculate recent payment performance
    const allPaymentsSorted = [...allPayments].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
    const recentPayments = allPaymentsSorted.slice(0, 6); // Last 6 payments
    const lateRecentPayments = recentPayments.filter(p => p.status === 'Late').length;
    const latePaymentRatio = recentPayments.length > 0 ? lateRecentPayments / recentPayments.length : 0;
    
    // Calculate debt-to-income ratio
    const totalLoanAmount = borrowerLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
    const debtToIncomeRatio = totalLoanAmount / borrower.income;
    
    // Calculate default probability based on time horizon
    let baseProbability = 0;
    
    // More late payments = higher default probability
    if (latePaymentRatio > 0.5) baseProbability += 0.4;
    else if (latePaymentRatio > 0.3) baseProbability += 0.25;
    else if (latePaymentRatio > 0) baseProbability += 0.1;
    
    // Higher debt-to-income = higher default probability
    if (debtToIncomeRatio > 4) baseProbability += 0.3;
    else if (debtToIncomeRatio > 2) baseProbability += 0.15;
    else if (debtToIncomeRatio > 1) baseProbability += 0.05;
    
    // Lower credit score = higher default probability
    if (borrower.credit_score < 600) baseProbability += 0.25;
    else if (borrower.credit_score < 650) baseProbability += 0.15;
    else if (borrower.credit_score < 700) baseProbability += 0.05;
    
    // Farm size factor - smaller farms may have less buffer
    if (borrower.farm_size < 50) baseProbability += 0.1;
    
    // Adjust for time horizon
    let defaultProbability = 0;
    if (timeHorizon === '3m') {
      defaultProbability = baseProbability * 0.7; // Shorter term = lower probability
    } else if (timeHorizon === '6m') {
      defaultProbability = baseProbability * 1.0;
    } else if (timeHorizon === '1y') {
      defaultProbability = baseProbability * 1.3; // Longer term = higher probability
    }
    
    // Cap probability between 0-1
    defaultProbability = Math.max(0, Math.min(1, defaultProbability));
    
    // Generate key factors behind prediction
    const keyFactors = [];
    if (latePaymentRatio > 0) {
      keyFactors.push(`${Math.round(latePaymentRatio * 100)}% of recent payments were late`);
    }
    if (debtToIncomeRatio > 1) {
      keyFactors.push(`High debt-to-income ratio of ${debtToIncomeRatio.toFixed(1)}`);
    }
    if (borrower.credit_score < 700) {
      keyFactors.push(`Credit score of ${borrower.credit_score} below optimal range`);
    }
    if (borrower.farm_size < 50) {
      keyFactors.push(`Small farm size (${borrower.farm_size} acres) limits financial buffer`);
    }
    
    // Set confidence level based on data quality
    const predictionConfidence = Math.min(0.95, 0.7 + (recentPayments.length / 10));
    
    // Return the prediction
    const result = {
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      default_probability: Math.round(defaultProbability * 100) / 100,
      default_risk_level: defaultProbability > 0.6 ? "high" : (defaultProbability > 0.3 ? "medium" : "low"),
      time_horizon: timeHorizon,
      key_factors: keyFactors,
      prediction_confidence: Math.round(predictionConfidence * 100) / 100
    };
    
    LogService.info(`Default risk prediction for borrower ${borrowerId}: ${defaultProbability.toFixed(2)} (${result.default_risk_level})`);
    res.json(result);
  } catch (error) {
    LogService.error(`Error predicting default risk for borrower ${borrowerId}:`, {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to predict default risk',
      details: error.message
    });
  }
});

// Predict non-accrual risk for a borrower
router.get('/predict/non-accrual-risk/:borrower_id', async (req, res) => {
  const borrowerId = req.params.borrower_id;
  
  LogService.info(`Predicting non-accrual risk for borrower ${borrowerId}`);
  
  try {
    // Load data from database
    LogService.debug(`Loading data for non-accrual risk prediction for borrower ${borrowerId}`);
    const borrowersResult = await mcpDatabaseService.executeQuery('SELECT * FROM Borrowers', {});
    const loansResult = await mcpDatabaseService.executeQuery('SELECT * FROM Loans', {});
    const paymentsResult = await mcpDatabaseService.executeQuery('SELECT * FROM Payments', {});
    
    const borrowers = borrowersResult.recordset || borrowersResult;
    const loans = loansResult.recordset || loansResult;
    const payments = paymentsResult.recordset || paymentsResult;
    
    LogService.debug(`Loaded ${borrowers.length} borrowers, ${loans.length} loans, and ${payments.length} payments`);
    
    // Find the borrower
    const borrower = borrowers.find(b => b.borrower_id === borrowerId);
    if (!borrower) {
      LogService.warn(`Borrower not found with ID: ${borrowerId}`);
      return res.status(404).json({ error: 'Borrower not found' });
    }
    
    LogService.debug(`Found borrower: ${borrower.first_name} ${borrower.last_name}`);
    
    // Get borrower's loans
    const borrowerLoans = loans.filter(l => l.borrower_id === borrowerId);
    LogService.debug(`Found ${borrowerLoans.length} loans for borrower ${borrowerId}`);
    
    if (borrowerLoans.length === 0) {
      LogService.info(`No loans found for borrower ${borrowerId}`);
      return res.json({
        borrower_id: borrowerId,
        borrower_name: `${borrower.first_name} ${borrower.last_name}`,
        non_accrual_probability: 0,
        recovery_probability: 1.0,
        consecutive_late_payments: 0,
        status: "No loans found"
      });
    }
    
    // Get payment history for all loans
    let maxConsecutiveLate = 0;
    let currentConsecutiveLate = 0;
    let totalLatePayments = 0;
    let totalPayments = 0;
    let recentLatePayments = 0;
    
    // Analyze payment patterns for each loan
    borrowerLoans.forEach(loan => {
      LogService.debug(`Analyzing payments for loan ${loan.loan_id}`);
      const loanPayments = payments.filter(p => p.loan_id === loan.loan_id)
        .sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));
      
      LogService.debug(`Found ${loanPayments.length} payments for loan ${loan.loan_id}`);
      
      // Reset counter for each loan
      currentConsecutiveLate = 0;
      
      loanPayments.forEach(payment => {
        totalPayments++;
        
        if (payment.status === 'Late') {
          totalLatePayments++;
          currentConsecutiveLate++;
          
          // Check if this is a recent payment (last 3 months)
          const paymentDate = new Date(payment.payment_date);
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          
          if (paymentDate >= threeMonthsAgo) {
            recentLatePayments++;
          }
        } else {
          // Reset counter on on-time payment
          currentConsecutiveLate = 0;
        }
        
        // Track maximum consecutive late payments
        if (currentConsecutiveLate > maxConsecutiveLate) {
          maxConsecutiveLate = currentConsecutiveLate;
        }
      });
    });
    
    LogService.debug(`Payment analysis summary: Total payments: ${totalPayments}, Late payments: ${totalLatePayments}, Recent late: ${recentLatePayments}, Max consecutive late: ${maxConsecutiveLate}`);
    
    // Calculate non-accrual probability factors
    let nonAccrualProbability = 0;
    
    // Consecutive late payments are a strong indicator
    if (maxConsecutiveLate >= 4) {
      nonAccrualProbability += 0.6; // Very high risk
    } else if (maxConsecutiveLate === 3) {
      nonAccrualProbability += 0.4; // High risk
    } else if (maxConsecutiveLate === 2) {
      nonAccrualProbability += 0.25; // Moderate risk
    } else if (maxConsecutiveLate === 1) {
      nonAccrualProbability += 0.1; // Low risk
    }
    
    // Overall late payment percentage
    const latePaymentRatio = totalPayments > 0 ? totalLatePayments / totalPayments : 0;
    LogService.debug(`Late payment ratio: ${latePaymentRatio.toFixed(2)}`);
    
    if (latePaymentRatio > 0.3) {
      nonAccrualProbability += 0.3;
    } else if (latePaymentRatio > 0.2) {
      nonAccrualProbability += 0.2;
    } else if (latePaymentRatio > 0.1) {
      nonAccrualProbability += 0.1;
    }
    
    // Recent late payments are more concerning
    if (recentLatePayments >= 2) {
      nonAccrualProbability += 0.2;
    } else if (recentLatePayments === 1) {
      nonAccrualProbability += 0.1;
    }
    
    // Credit score factor
    if (borrower.credit_score < 600) {
      nonAccrualProbability += 0.2;
    } else if (borrower.credit_score < 650) {
      nonAccrualProbability += 0.1;
    }
    
    LogService.debug(`Initial non-accrual probability: ${nonAccrualProbability.toFixed(2)}`);
    
    // Cap probability between 0-1
    nonAccrualProbability = Math.max(0, Math.min(1, nonAccrualProbability));
    
    // Calculate recovery probability based on factors that increase resilience
    let recoveryProbability = 1.0;
    
    // More severe non-accrual cases have lower recovery chances
    if (nonAccrualProbability > 0.7) {
      recoveryProbability = 0.3;
    } else if (nonAccrualProbability > 0.5) {
      recoveryProbability = 0.5;
    } else if (nonAccrualProbability > 0.3) {
      recoveryProbability = 0.7;
    }
    
    // Farm size and diversity improve recovery chances
    if (borrower.farm_size > 200) {
      recoveryProbability += 0.1;
    }
    
    // Good credit score improves recovery
    if (borrower.credit_score > 700) {
      recoveryProbability += 0.1;
    }
    
    // Cap recovery probability between 0-1
    recoveryProbability = Math.max(0, Math.min(1, recoveryProbability));
    
    // Determine status based on current factors
    let status = "Healthy";
    if (nonAccrualProbability > 0.7) {
      status = "High Risk";
    } else if (nonAccrualProbability > 0.4) {
      status = "Watch";
    } else if (nonAccrualProbability > 0.2) {
      status = "Monitoring Advised";
    }
    
    // Generate recommendations
    const recommendations = [];
    if (maxConsecutiveLate >= 3) {
      recommendations.push("Immediate payment plan discussion needed");
    } else if (maxConsecutiveLate === 2) {
      recommendations.push("Proactive outreach to discuss payment patterns recommended");
    }
    
    if (recentLatePayments > 0) {
      recommendations.push("Recent payment issues detected - monitor closely next payment cycle");
    }
    
    const result = {
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      non_accrual_probability: Math.round(nonAccrualProbability * 100) / 100,
      recovery_probability: Math.round(recoveryProbability * 100) / 100,
      status: status,
      consecutive_late_payments: maxConsecutiveLate,
      recommendations: recommendations
    };
    
    LogService.info(`Non-accrual risk prediction for borrower ${borrowerId}: ${nonAccrualProbability.toFixed(2)} (${status})`);
    LogService.debug(`Full result for borrower ${borrowerId}:`, result);
    
    res.json(result);
  } catch (error) {
    LogService.error(`Error predicting non-accrual risk for borrower ${borrowerId}:`, {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to predict non-accrual risk',
      details: error.message
    });
  }
});

// Recommend refinancing options
router.get('/recommendations/refinance/:loan_id', (req, res) => {
  const loanId = req.params.loan_id;
  
  LogService.info(`Generating refinancing options for loan ${loanId}`);
  
  // Load data
  const loans = dataService.loadData(dataService.paths.loans);
  const payments = dataService.loadData(dataService.paths.payments);
  
  // Find the loan
  const loan = loans.find(l => l.loan_id === loanId);
  if (!loan) {
    return res.status(404).json({ error: 'Loan not found' });
  }
  
  // Get payment history
  const loanPayments = payments.filter(p => p.loan_id === loanId);
  
  // Current loan details
  const currentRate = loan.interest_rate;
  const currentTerm = loan.term_length;
  
  // Calculate remaining term (simplified)
  // In a real system, this would be calculated based on amortization schedule
  const remainingTerm = Math.max(Math.floor(currentTerm * 0.7), 24); // Assume 30% of term has passed, min 24 months
  
  // Generate refinancing options (simplified)
  const options = [];
  
  // Option 1: Lower rate, same term
  if (currentRate > 3.0) {
    const newRate = Math.max(currentRate - 0.75, 3.0);
    
    // Calculate monthly payment at current rate (simplified)
    const monthlyPaymentBefore = (loan.loan_amount * (currentRate/100/12) * Math.pow(1 + currentRate/100/12, currentTerm)) / 
                               (Math.pow(1 + currentRate/100/12, currentTerm) - 1);
    
    // Calculate new monthly payment
    const monthlyPaymentAfter = (loan.loan_amount * (newRate/100/12) * Math.pow(1 + newRate/100/12, remainingTerm)) / 
                              (Math.pow(1 + newRate/100/12, remainingTerm) - 1);
    
    const monthlySavings = monthlyPaymentBefore - monthlyPaymentAfter;
    const totalInterestSavings = monthlySavings * remainingTerm;
    
    options.push({
      option_id: "REFI-1",
      description: "Lower rate refinance",
      new_rate: newRate,
      new_term: remainingTerm,
      monthly_payment: Number(monthlyPaymentAfter.toFixed(2)),
      monthly_savings: Number(monthlySavings.toFixed(2)),
      total_interest_savings: Number(totalInterestSavings.toFixed(2))
    });
  }
  
  // Option 2: Shorter term, slightly lower rate
  if (remainingTerm > 36) {
    const newTerm = Math.floor(remainingTerm * 0.8);
    const newRate = Math.max(currentRate - 0.25, 3.0);
    
    // Calculate monthly payment at current rate (simplified)
    const monthlyPaymentBefore = (loan.loan_amount * (currentRate/100/12) * Math.pow(1 + currentRate/100/12, currentTerm)) / 
                               (Math.pow(1 + currentRate/100/12, currentTerm) - 1);
    
    // Calculate new monthly payment
    const monthlyPaymentAfter = (loan.loan_amount * (newRate/100/12) * Math.pow(1 + newRate/100/12, newTerm)) / 
                              (Math.pow(1 + newRate/100/12, newTerm) - 1);
    
    // Note: monthly payment might be higher, but total interest paid will be lower
    const totalInterestBefore = (monthlyPaymentBefore * remainingTerm) - loan.loan_amount;
    const totalInterestAfter = (monthlyPaymentAfter * newTerm) - loan.loan_amount;
    const totalInterestSavings = totalInterestBefore - totalInterestAfter;
    
    options.push({
      option_id: "REFI-2",
      description: "Shorter term refinance",
      new_rate: newRate,
      new_term: newTerm,
      monthly_payment: Number(monthlyPaymentAfter.toFixed(2)),
      monthly_difference: Number((monthlyPaymentAfter - monthlyPaymentBefore).toFixed(2)),
      total_interest_savings: Number(totalInterestSavings.toFixed(2))
    });
  }
  
  // Option 3: Cash-out refinance for equipment or expansion
  if (loan.loan_amount > 50000 && loanPayments.filter(p => p.status === 'Late').length === 0) {
    const additionalAmount = loan.loan_amount * 0.2; // 20% additional
    const newLoanAmount = loan.loan_amount + additionalAmount;
    const newRate = currentRate + 0.25; // Slightly higher rate for cash-out
    
    // Calculate monthly payment at current rate (simplified)
    const monthlyPaymentBefore = (loan.loan_amount * (currentRate/100/12) * Math.pow(1 + currentRate/100/12, currentTerm)) / 
                               (Math.pow(1 + currentRate/100/12, currentTerm) - 1);
    
    // Calculate new monthly payment
    const monthlyPaymentAfter = (newLoanAmount * (newRate/100/12) * Math.pow(1 + newRate/100/12, remainingTerm)) / 
                              (Math.pow(1 + newRate/100/12, remainingTerm) - 1);
    
    options.push({
      option_id: "REFI-3",
      description: "Cash-out refinance for farm improvements",
      new_loan_amount: Number(newLoanAmount.toFixed(2)),
      additional_funds: Number(additionalAmount.toFixed(2)),
      new_rate: newRate,
      new_term: remainingTerm,
      monthly_payment: Number(monthlyPaymentAfter.toFixed(2)),
      monthly_payment_increase: Number((monthlyPaymentAfter - monthlyPaymentBefore).toFixed(2))
    });
  }
  
  const result = {
    loan_id: loanId,
    current_rate: currentRate,
    current_term_remaining: remainingTerm,
    current_balance: loan.loan_amount,
    refinancing_recommended: options.length > 0,
    options: options
  };
  
  LogService.info(`Generated ${options.length} refinancing options for loan ${loanId}`);
  res.json(result);
});

// Forecast equipment maintenance costs
router.get('/equipment-forecast/:borrower_id', (req, res) => {
  const borrowerId = req.params.borrower_id;
  const year = req.query.year || new Date().getFullYear() + 1;
  
  LogService.info(`Forecasting equipment maintenance costs for borrower ${borrowerId} for year ${year}`);
  
  try {
    // Load data
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    
    // Find the borrower
    const borrower = borrowers.find(b => b.borrower_id === borrowerId);
    if (!borrower) {
      LogService.warn(`Borrower not found with ID: ${borrowerId}`);
      return res.status(404).json({ error: 'Borrower not found' });
    }
    
    // Simplified equipment maintenance cost model
    // In a real system, this would use more sophisticated modeling and historical data
    const farmSize = borrower.farm_size || 100; // Default to 100 acres if not specified
    const farmType = borrower.farm_type || 'Crop';
    
    // Base costs by farm type
    let baseCostPerAcre = 0;
    if (farmType === 'Crop') {
      baseCostPerAcre = 25; // $25 per acre for crop farms
    } else if (farmType === 'Livestock') {
      baseCostPerAcre = 15; // $15 per acre for livestock farms
    } else if (farmType === 'Dairy') {
      baseCostPerAcre = 30; // $30 per acre for dairy farms
    } else {
      baseCostPerAcre = 20; // Default for other farm types
    }
    
    // Adjust for farm size (economies of scale)
    let sizeMultiplier = 1.0;
    if (farmSize > 500) {
      sizeMultiplier = 0.8; // 20% discount for large farms
    } else if (farmSize > 200) {
      sizeMultiplier = 0.9; // 10% discount for medium farms
    }
    
    // Calculate equipment age factor (using borrower age as proxy)
    // In a real system, would use actual equipment age and condition
    const borrowerAge = borrower.age || 45;
    let equipmentAgeFactor = 1.0;
    if (borrowerAge > 60) {
      equipmentAgeFactor = 1.3; // Older farmers might have older equipment
    } else if (borrowerAge < 35) {
      equipmentAgeFactor = 0.9; // Younger farmers might have newer equipment
    }
    
    // Calculate estimated costs
    const totalAcres = farmSize;
    const annualMaintenanceCost = Math.round(totalAcres * baseCostPerAcre * sizeMultiplier * equipmentAgeFactor);
    
    // Add equipment categories with estimated costs
    const equipmentCategories = [];
    
    if (farmType === 'Crop') {
      equipmentCategories.push({
        category: 'Tractors',
        estimated_cost: Math.round(annualMaintenanceCost * 0.4),
        maintenance_items: ['Oil changes', 'Filter replacements', 'Hydraulic repairs']
      });
      equipmentCategories.push({
        category: 'Combines/Harvesters',
        estimated_cost: Math.round(annualMaintenanceCost * 0.3),
        maintenance_items: ['Rotor maintenance', 'Cutting mechanisms', 'Belts and chains']
      });
      equipmentCategories.push({
        category: 'Implements',
        estimated_cost: Math.round(annualMaintenanceCost * 0.2),
        maintenance_items: ['Blade sharpening', 'Bearings', 'Structural repairs']
      });
      equipmentCategories.push({
        category: 'Irrigation',
        estimated_cost: Math.round(annualMaintenanceCost * 0.1),
        maintenance_items: ['Pump maintenance', 'Pipe repairs', 'Sprinkler heads']
      });
    } else if (farmType === 'Livestock') {
      equipmentCategories.push({
        category: 'Feeding Equipment',
        estimated_cost: Math.round(annualMaintenanceCost * 0.35),
        maintenance_items: ['Feed mixer repairs', 'Conveyor maintenance', 'Motor replacements']
      });
      equipmentCategories.push({
        category: 'Tractors',
        estimated_cost: Math.round(annualMaintenanceCost * 0.3),
        maintenance_items: ['Oil changes', 'Filter replacements', 'Hydraulic repairs']
      });
      equipmentCategories.push({
        category: 'Handling Equipment',
        estimated_cost: Math.round(annualMaintenanceCost * 0.25),
        maintenance_items: ['Gate repairs', 'Chute maintenance', 'Hydraulic cylinder replacement']
      });
      equipmentCategories.push({
        category: 'Fencing Equipment',
        estimated_cost: Math.round(annualMaintenanceCost * 0.1),
        maintenance_items: ['Post drivers', 'Wire stretchers', 'Electric fence components']
      });
    }
    
    // Cost reduction recommendations
    const recommendations = [];
    if (annualMaintenanceCost > 10000) {
      recommendations.push('Consider preventative maintenance schedule to reduce overall costs');
      recommendations.push('Evaluate equipment replacement versus repair for high-maintenance items');
    }
    if (farmSize > 200) {
      recommendations.push('Bulk purchase of common replacement parts may reduce costs');
    }
    recommendations.push('Regular equipment inspections can identify issues before they become costly repairs');
    
    const result = {
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      forecast_year: year,
      farm_type: farmType,
      farm_size: farmSize,
      total_maintenance_forecast: annualMaintenanceCost,
      equipment_categories: equipmentCategories,
      cost_reduction_recommendations: recommendations
    };
    
    LogService.info(`Equipment maintenance forecast completed for borrower ${borrowerId}: $${annualMaintenanceCost}`);
    res.json(result);
  } catch (error) {
    LogService.error(`Error forecasting equipment maintenance for borrower ${borrowerId}`, { error: error.message });
    res.status(500).json({ 
      error: 'Failed to forecast equipment maintenance costs', 
      details: error.message 
    });
  }
});

// Assess crop yield risk
router.get("/crop-yield-risk/:borrower_id", (req, res) => {
  try {
    const borrowerId = req.params.borrower_id.toUpperCase();
    const cropType = req.query.crop_type || null;
    const season = req.query.season || "current";
    
    LogService.info(`Assessing crop yield risk for borrower ${borrowerId}`, {
      crop_type: cropType,
      season: season,
    });
    
    // Load required data
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    const loans = dataService.loadData(dataService.paths.loans);
    
    // Find the borrower
    const borrower = borrowers.find((b) => b.borrower_id.toUpperCase() === borrowerId);
    if (!borrower) {
      LogService.warn(`Borrower not found with ID: ${borrowerId}`);
      return res.status(404).json({
        error: "Borrower not found",
        borrower_id: borrowerId,
      });
    }
    
    // Determine crops grown by borrower (simulated data)
    const farmerCrops = {
      B001: { crops: ["corn", "soybeans"], region: "midwest" },
      B002: { crops: ["wheat", "barley"], region: "plains" },
      B003: { crops: ["cotton", "peanuts"], region: "southeast" },
      B004: { crops: ["rice", "sugarcane"], region: "south" },
      B005: { crops: ["potatoes", "onions"], region: "northwest" },
    };
    
    // If we don't have specific crop data for this borrower, create some
    if (!farmerCrops[borrowerId]) {
      farmerCrops[borrowerId] = { crops: ["corn"], region: "midwest" };
    }
    
    // Target specific crop if provided, otherwise use primary crop
    const targetCrop =
      cropType && farmerCrops[borrowerId].crops.includes(cropType)
        ? cropType
        : farmerCrops[borrowerId].crops[0];
    
    // Simulate crop risk factors by region and crop
    const cropRiskFactors = {
      midwest: {
        corn: [
          "Drought susceptibility",
          "Early frost risk",
          "Corn rootworm pressure",
        ],
        soybeans: [
          "Soybean cyst nematode",
          "White mold risk",
          "Herbicide resistance",
        ],
      },
      plains: {
        wheat: [
          "Drought conditions",
          "Wheat streak mosaic virus",
          "Stem rust risk",
        ],
        barley: [
          "Fusarium head blight",
          "Low winter snowpack",
          "Barley yellow dwarf virus",
        ],
      },
      southeast: {
        cotton: [
          "Boll weevil pressure",
          "Hurricane risk",
          "Irregular rainfall patterns",
        ],
        peanuts: [
          "Late leaf spot",
          "White mold",
          "Aflatoxin risk due to drought",
        ],
      },
      south: {
        rice: [
          "Blast disease pressure",
          "Water availability concerns",
          "Heat stress during flowering",
        ],
        sugarcane: [
          "Borer infestations",
          "Flood risk",
          "Freeze damage to ratoon crop",
        ],
      },
      northwest: {
        potatoes: [
          "Late blight pressure",
          "Colorado potato beetle",
          "Early frost risk",
        ],
        onions: ["Pink root", "Thrips pressure", "Water restrictions"],
      },
    };
    
    // Get risk factors for the farmer's region and crop
    const region = farmerCrops[borrowerId].region;
    const riskFactors = cropRiskFactors[region][targetCrop] || [
      "Weather variability",
      "Pest pressure",
      "Market volatility",
    ];
    
    // Generate synthetic risk score (50-85 range)
    const riskScore = Math.floor(Math.random() * 35) + 50;
    
    // Determine risk level based on score
    let riskLevel = "medium";
    if (riskScore < 60) riskLevel = "low";
    else if (riskScore > 75) riskLevel = "high";
    
    // Generate yield impact based on risk score
    const yieldImpactPercent = `${-(riskScore - 50) / 2}%`;
    
    // Generate appropriate recommendations based on risk factors
    const recommendations = [];
    
    if (
      riskFactors.some(
        (f) =>
          f.toLowerCase().includes("drought") ||
          f.toLowerCase().includes("water")
      )
    ) {
      recommendations.push(
        "Review irrigation infrastructure and water availability"
      );
    }
    
    if (
      riskFactors.some(
        (f) =>
          f.toLowerCase().includes("pest") ||
          f.toLowerCase().includes("beetle") ||
          f.toLowerCase().includes("weevil")
      )
    ) {
      recommendations.push("Consider adjusting pest management program");
    }
    
    if (
      riskFactors.some(
        (f) =>
          f.toLowerCase().includes("disease") ||
          f.toLowerCase().includes("blight") ||
          f.toLowerCase().includes("rust")
      )
    ) {
      recommendations.push(
        "Implement disease resistant varieties if available"
      );
    }
    
    if (riskScore > 70) {
      recommendations.push("Evaluate crop insurance coverage levels");
    }
    
    // Ensure we have at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push(
        "Monitor field conditions closely throughout the season"
      );
    }
    
    // Construct response object
    const cropYieldRiskAssessment = {
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      crop_type: targetCrop,
      yield_risk_score: riskScore,
      risk_level: riskLevel,
      risk_factors: riskFactors,
      yield_impact_percent: yieldImpactPercent,
      recommendations: recommendations,
      assessment_date: new Date().toISOString().split("T")[0],
      region: region,
    };
    
    LogService.info(
      `Completed crop yield risk assessment for borrower ${borrowerId}`,
      {
        result: { risk_level: riskLevel, risk_score: riskScore },
      }
    );
    
    res.json(cropYieldRiskAssessment);
  } catch (error) {
    LogService.error(`Error in crop yield risk assessment: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({
      error: "Failed to assess crop yield risk",
      details: error.message,
    });
  }
});

// Analyze market price impact
router.get("/market-price-impact/:commodity", (req, res) => {
  try {
    const commodity = req.params.commodity.toLowerCase();
    const priceChangePercent = req.query.price_change_percent || null;
    
    LogService.info(`Analyzing market price impact for ${commodity}`, {
      price_change_percent: priceChangePercent,
    });
    
    // Load required data
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    const loans = dataService.loadData(dataService.paths.loans);
    
    // Validate commodity
    const validCommodities = [
      "corn",
      "wheat",
      "soybeans",
      "cotton",
      "rice",
      "livestock",
      "dairy",
    ];
    if (!validCommodities.includes(commodity)) {
      return res.status(400).json({
        error: "Invalid commodity specified",
        valid_commodities: validCommodities,
      });
    }
    
    // Parse price change percentage or use default
    let priceChange = -10; // Default to 10% decrease
    if (priceChangePercent) {
      const match = priceChangePercent.match(/([+-]?\d+)%/);
      if (match) {
        priceChange = parseInt(match[1]);
      }
    }
    
    // Simulate commodity dependence for borrowers (which borrowers are affected by this commodity)
    const commodityDependence = {
      corn: ["B001", "B004"],
      wheat: ["B002", "B005"],
      soybeans: ["B001", "B003"],
      cotton: ["B003"],
      rice: ["B004"],
      livestock: ["B002", "B005"],
      dairy: ["B001", "B005"],
    };
    
    // Get affected borrowers
    const affectedBorrowerIds = commodityDependence[commodity] || [];
    
    // Get loans for affected borrowers
    const affectedLoans = loans.filter((loan) =>
      affectedBorrowerIds.includes(loan.borrower_id)
    );
    
    // Calculate impact for each affected loan
    const affectedLoanDetails = affectedLoans.map((loan) => {
      const borrower = borrowers.find(
        (b) => b.borrower_id === loan.borrower_id
      );
      
      // Calculate simulated revenue impact (proportional to loan amount and price change)
      const revenueImpact = (
        loan.loan_amount *
        Math.abs(priceChange) *
        0.01 *
        0.15
      ).toFixed(0);
      
      // Calculate debt coverage ratio (simplified simulation)
      const baseCoverageRatio = 1.2; // Starting with healthy ratio
      const adjustedRatio = (baseCoverageRatio + priceChange * 0.005).toFixed(
        2
      );
      
      // Determine impact level
      let impactLevel = "low";
      if (adjustedRatio < 1.0) impactLevel = "high";
      else if (adjustedRatio < 1.1) impactLevel = "medium";
      
      return {
        loan_id: loan.loan_id,
        borrower_id: loan.borrower_id,
        borrower_name: borrower
          ? `${borrower.first_name} ${borrower.last_name}`
          : "Unknown Borrower",
        loan_amount: loan.loan_amount,
        impact_level: impactLevel,
        revenue_impact:
          priceChange < 0 ? `-$${revenueImpact}` : `+$${revenueImpact}`,
        debt_coverage_ratio: adjustedRatio,
      };
    });
    
    // Calculate total portfolio impact
    const totalImpact = affectedLoanDetails.reduce((sum, loan) => {
      // Extract numeric value from revenue impact string
      const impact = parseInt(loan.revenue_impact.replace(/[^0-9]/g, ""));
      return sum + impact;
    }, 0);
    
    // Generate summary text
    const direction = priceChange < 0 ? "decrease" : "increase";
    let severityText = "minimally affect";
    if (affectedLoanDetails.some((l) => l.impact_level === "high")) {
      severityText = "significantly affect";
    } else if (affectedLoanDetails.some((l) => l.impact_level === "medium")) {
      severityText = "moderately affect";
    }
    
    const portfolioImpactSummary = `A ${Math.abs(
      priceChange
    )}% ${direction} in ${commodity} prices would ${severityText} ${
      affectedLoanDetails.length
    } loans with a total portfolio impact of $${totalImpact.toLocaleString()}`;
    
    // Generate appropriate recommendations
    const recommendations = [];
    
    if (priceChange < 0) {
      recommendations.push("Review hedging strategies with affected borrowers");
      
      if (affectedLoanDetails.some((l) => l.impact_level === "high")) {
        recommendations.push(
          "Consider loan restructuring for severely impacted borrowers"
        );
        recommendations.push(
          "Schedule risk management discussions with high-impact borrowers"
        );
      }
    } else {
      recommendations.push(
        "Evaluate opportunities for accelerated loan repayment"
      );
      recommendations.push("Consider capital improvement loans for expansion");
    }
    
    // Construct response object
    const marketPriceImpactAnalysis = {
      commodity: commodity,
      price_change_percent: `${priceChange > 0 ? "+" : ""}${priceChange}%`,
      affected_loans_count: affectedLoanDetails.length,
      affected_loans: affectedLoanDetails,
      portfolio_impact_summary: portfolioImpactSummary,
      total_portfolio_impact: `${
        priceChange < 0 ? "-" : "+"
      }$${totalImpact.toLocaleString()}`,
      recommendations: recommendations,
      analysis_date: new Date().toISOString().split("T")[0],
    };
    
    LogService.info(`Completed market price impact analysis for ${commodity}`, {
      result: {
        affected_loans: affectedLoanDetails.length,
        price_change: priceChange,
      },
    });
    
    res.json(marketPriceImpactAnalysis);
  } catch (error) {
    LogService.error(
      `Error in market price impact analysis: ${error.message}`,
      { stack: error.stack }
    );
    res.status(500).json({
      error: "Failed to analyze market price impact",
      details: error.message,
    });
  }
});

// Get refinancing options
router.get('/refinancing-options/:loan_id', (req, res) => {
  const loanId = req.params.loan_id;
  
  LogService.info(`Getting refinancing options for loan ${loanId}`);
  
  try {
    // Load data
    const loans = dataService.loadData(dataService.paths.loans);
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    
    // Find the loan - ensure case-insensitive comparison
    const loan = loans.find((l) => l.loan_id.toUpperCase() === loanId.toUpperCase());
    if (!loan) {
      LogService.warn(`Loan not found with ID: ${loanId}`);
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // Get borrower information
    const borrower = borrowers.find((b) => b.borrower_id.toUpperCase() === loan.borrower_id.toUpperCase());
    if (!borrower) {
      LogService.warn(`Borrower not found for loan ${loanId}, borrower ID: ${loan.borrower_id}`);
      return res.status(404).json({
        error: "Borrower not found for this loan",
        loan_id: loanId,
        borrower_id: loan.borrower_id
      });
    }
    
    // Current loan details
    const currentRate = loan.interest_rate;
    const remainingPrincipal = loan.loan_amount; // Simplified - in reality would be calculated based on payments
    const remainingTerm = loan.term; // Simplified - in reality would be calculated based on start date
    
    // Generate refinancing options
    const options = [];
    
    // Lower rate, same term
    if (currentRate > 4.0) {
      const newRate = Math.max(currentRate - 0.5, 3.5);
      const monthlySavings = calculateMonthlySavings(remainingPrincipal, currentRate, newRate, remainingTerm);
      
      options.push({
        option_type: 'Lower Rate',
        new_rate: newRate,
        term_years: remainingTerm,
        monthly_savings: monthlySavings,
        total_savings: monthlySavings * 12 * remainingTerm,
        closing_costs: Math.round(remainingPrincipal * 0.01), // Assume 1% closing costs
        break_even_months: Math.ceil((remainingPrincipal * 0.01) / monthlySavings)
      });
    }
    
    // Lower rate, longer term
    if (remainingTerm < 25) {
      const newTerm = Math.min(remainingTerm + 5, 30);
      const newRate = currentRate - 0.25;
      const monthlySavings = calculateMonthlySavingsLongerTerm(remainingPrincipal, currentRate, newRate, remainingTerm, newTerm);
      
      options.push({
        option_type: 'Lower Rate & Extended Term',
        new_rate: newRate,
        term_years: newTerm,
        monthly_savings: monthlySavings,
        total_interest_cost_change: (remainingPrincipal * newRate / 100 * newTerm) - (remainingPrincipal * currentRate / 100 * remainingTerm),
        closing_costs: Math.round(remainingPrincipal * 0.015), // Assume 1.5% closing costs for term change
        break_even_months: Math.ceil((remainingPrincipal * 0.015) / monthlySavings)
      });
    }
    
    // Shorter term, higher rate
    if (remainingTerm > 15) {
      const newTerm = remainingTerm - 5;
      const newRate = currentRate + 0.125;
      const monthlyCost = calculateMonthlyIncrease(remainingPrincipal, currentRate, newRate, remainingTerm, newTerm);
      
      options.push({
        option_type: 'Accelerated Payoff',
        new_rate: newRate,
        term_years: newTerm,
        monthly_cost_increase: monthlyCost,
        total_interest_savings: (remainingPrincipal * currentRate / 100 * remainingTerm) - (remainingPrincipal * newRate / 100 * newTerm),
        closing_costs: Math.round(remainingPrincipal * 0.01), // Assume 1% closing costs
        years_saved: remainingTerm - newTerm
      });
      }
      
    // Cash-out option
    if (loan.loan_type === 'Farm Mortgage' && borrower.credit_score > 680) {
      const maxCashOut = remainingPrincipal * 0.15;
      const newPrincipal = remainingPrincipal + maxCashOut;
      const newRate = currentRate + 0.375;
      const monthlyCost = calculateMonthlyWithCashout(remainingPrincipal, newPrincipal, currentRate, newRate, remainingTerm);
      
      options.push({
        option_type: 'Cash-Out Refinance',
        new_rate: newRate,
        term_years: remainingTerm,
        max_cash_out: Math.round(maxCashOut),
        new_loan_amount: Math.round(newPrincipal),
        monthly_payment_increase: monthlyCost,
        closing_costs: Math.round(newPrincipal * 0.02) // Assume 2% closing costs for cash-out
      });
    }
    
    // Sort options by total savings
    options.sort((a, b) => {
      if (a.total_savings && b.total_savings) {
        return b.total_savings - a.total_savings;
      }
      if (a.total_interest_savings && b.total_interest_savings) {
        return b.total_interest_savings - a.total_interest_savings;
      }
      return 0;
    });
    
    const result = {
      loan_id: loanId,
      borrower_id: borrower.borrower_id,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      current_loan: {
        principal: remainingPrincipal,
        interest_rate: currentRate,
        remaining_term: remainingTerm,
        loan_type: loan.loan_type
      },
      refinancing_options: options,
      market_conditions: "Rates are historically low, favorable for refinancing."
    };
    
    LogService.info(`Refinancing options generated for loan ${loanId}: ${options.length} options`);
    res.json(result);
  } catch (error) {
    LogService.error(`Error getting refinancing options for loan ${loanId}`, { error: error.message });
    res.status(500).json({ 
      error: 'Failed to get refinancing options', 
      details: error.message 
    });
  }
});

// Helper function to calculate monthly savings with a lower rate
function calculateMonthlySavings(principal, oldRate, newRate, termYears) {
  const oldMonthlyRate = oldRate / 100 / 12;
  const newMonthlyRate = newRate / 100 / 12;
  const months = termYears * 12;
  
  const oldPayment = principal * (oldMonthlyRate * Math.pow(1 + oldMonthlyRate, months)) / (Math.pow(1 + oldMonthlyRate, months) - 1);
  const newPayment = principal * (newMonthlyRate * Math.pow(1 + newMonthlyRate, months)) / (Math.pow(1 + newMonthlyRate, months) - 1);
  
  return Math.round(oldPayment - newPayment);
}

// Helper function to calculate monthly savings with longer term
function calculateMonthlySavingsLongerTerm(principal, oldRate, newRate, oldTermYears, newTermYears) {
  const oldMonthlyRate = oldRate / 100 / 12;
  const newMonthlyRate = newRate / 100 / 12;
  const oldMonths = oldTermYears * 12;
  const newMonths = newTermYears * 12;
  
  const oldPayment = principal * (oldMonthlyRate * Math.pow(1 + oldMonthlyRate, oldMonths)) / (Math.pow(1 + oldMonthlyRate, oldMonths) - 1);
  const newPayment = principal * (newMonthlyRate * Math.pow(1 + newMonthlyRate, newMonths)) / (Math.pow(1 + newMonthlyRate, newMonths) - 1);
  
  return Math.round(oldPayment - newPayment);
}

// Helper function to calculate monthly cost increase with shorter term
function calculateMonthlyIncrease(principal, oldRate, newRate, oldTermYears, newTermYears) {
  const oldMonthlyRate = oldRate / 100 / 12;
  const newMonthlyRate = newRate / 100 / 12;
  const oldMonths = oldTermYears * 12;
  const newMonths = newTermYears * 12;
  
  const oldPayment = principal * (oldMonthlyRate * Math.pow(1 + oldMonthlyRate, oldMonths)) / (Math.pow(1 + oldMonthlyRate, oldMonths) - 1);
  const newPayment = principal * (newMonthlyRate * Math.pow(1 + newMonthlyRate, newMonths)) / (Math.pow(1 + newMonthlyRate, newMonths) - 1);
  
  return Math.round(newPayment - oldPayment);
  }

// Helper function to calculate monthly cost with cash-out
function calculateMonthlyWithCashout(oldPrincipal, newPrincipal, oldRate, newRate, termYears) {
  const oldMonthlyRate = oldRate / 100 / 12;
  const newMonthlyRate = newRate / 100 / 12;
  const months = termYears * 12;
  
  const oldPayment = oldPrincipal * (oldMonthlyRate * Math.pow(1 + oldMonthlyRate, months)) / (Math.pow(1 + oldMonthlyRate, months) - 1);
  const newPayment = newPrincipal * (newMonthlyRate * Math.pow(1 + newMonthlyRate, months)) / (Math.pow(1 + newMonthlyRate, months) - 1);
  
  return Math.round(newPayment - oldPayment);
}

// Generate loan restructuring recommendations
router.get("/loan-restructuring/:loan_id", (req, res) => {
  try {
    const loanId = req.params.loan_id.toUpperCase();
    const restructuringGoal = req.query.goal || null;
    
    LogService.info(`Generating loan restructuring recommendations for loan ${loanId}`, {
      restructuring_goal: restructuringGoal
    });
    
    // Load required data
    const loans = dataService.loadData(dataService.paths.loans);
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    const payments = dataService.loadData(dataService.paths.payments);
    
    // Find the loan - ensure case-insensitive comparison
    const loan = loans.find((l) => l.loan_id.toUpperCase() === loanId.toUpperCase());
    if (!loan) {
      LogService.warn(`Loan not found with ID: ${loanId}`);
      return res.status(404).json({
        error: "Loan not found",
        loan_id: loanId
      });
    }
    
    // Find the borrower - ensure case-insensitive comparison
    const borrower = borrowers.find((b) => b.borrower_id.toUpperCase() === loan.borrower_id.toUpperCase());
    if (!borrower) {
      LogService.warn(`Borrower not found for loan ${loanId}, borrower ID: ${loan.borrower_id}`);
      return res.status(404).json({
        error: "Borrower not found for this loan",
        loan_id: loanId,
        borrower_id: loan.borrower_id
      });
    }
    
    // Get payment history for this loan
    const loanPayments = payments.filter((p) => p.loan_id === loanId);
    
    // Calculate current loan structure
    // For demonstration, we'll simulate this data
    const principal = loan.loan_amount;
    const originalTerm = 120; // 10 years in months
    const elapsedTime = loanPayments.length;
    const termRemaining = originalTerm - elapsedTime;
    const currentRate = parseFloat(loan.interest_rate);
    
    // Calculate simple monthly payment (P * r * (1+r)^n) / ((1+r)^n - 1)
    const monthlyRate = currentRate / 100 / 12;
    const monthlyPayment = Math.round(
      (principal * monthlyRate * Math.pow(1 + monthlyRate, originalTerm)) /
        (Math.pow(1 + monthlyRate, originalTerm) - 1)
    );
    
    // Current loan structure
    const currentStructure = {
      principal: principal,
      rate: `${currentRate}%`,
      term_remaining: termRemaining,
      monthly_payment: monthlyPayment,
      original_term: originalTerm
    };
    
    // Generate restructuring options based on goal
    const restructuringOptions = [];
    
    // Option 1: Term extension
    const extendedTerm = termRemaining + 36; // Add 3 years
    const extendedPayment = Math.round(
      (principal * monthlyRate * Math.pow(1 + monthlyRate, extendedTerm)) /
        (Math.pow(1 + monthlyRate, extendedTerm) - 1)
    );
    const extendedPaymentReduction = Math.round(
      (1 - extendedPayment / monthlyPayment) * 100
    );
    
    restructuringOptions.push({
      option_name: "Term extension",
      new_term: extendedTerm,
      new_payment: extendedPayment,
      payment_reduction: `${extendedPaymentReduction}%`,
      pros: ["Immediate payment relief", "No change in interest rate"],
      cons: ["Longer payoff period", "More interest paid overall"]
    });
    
    // Option 2: Rate reduction
    const reducedRate = Math.max(currentRate - 1.0, 3.0); // Reduce by 1% but minimum 3%
    const reducedMonthlyRate = reducedRate / 100 / 12;
    const reducedPayment = Math.round(
      (principal *
        reducedMonthlyRate *
        Math.pow(1 + reducedMonthlyRate, termRemaining)) /
        (Math.pow(1 + reducedMonthlyRate, termRemaining) - 1)
    );
    const reducedPaymentReduction = Math.round(
      (1 - reducedPayment / monthlyPayment) * 100
    );
    
    restructuringOptions.push({
      option_name: "Rate reduction",
      new_rate: `${reducedRate}%`,
      new_term: termRemaining,
      new_payment: reducedPayment,
      payment_reduction: `${reducedPaymentReduction}%`,
      pros: ["Lower total interest", "Moderate payment relief"],
      cons: ["May require additional collateral", "Subject to approval"]
    });
    
    // Option 3: Combined approach (if significant hardship)
    if (restructuringGoal === "address_hardship") {
      const combinedTerm = termRemaining + 24; // Add 2 years
      const combinedRate = Math.max(currentRate - 0.5, 3.5); // Reduce by 0.5% but minimum 3.5%
      const combinedMonthlyRate = combinedRate / 100 / 12;
      const combinedPayment = Math.round(
        (principal *
          combinedMonthlyRate *
          Math.pow(1 + combinedMonthlyRate, combinedTerm)) /
          (Math.pow(1 + combinedMonthlyRate, combinedTerm) - 1)
      );
      const combinedPaymentReduction = Math.round(
        (1 - combinedPayment / monthlyPayment) * 100
      );
      
      restructuringOptions.push({
        option_name: "Hardship modification",
        new_rate: `${combinedRate}%`,
        new_term: combinedTerm,
        new_payment: combinedPayment,
        payment_reduction: `${combinedPaymentReduction}%`,
        pros: ["Significant payment relief", "Addresses financial hardship"],
        cons: [
          "Requires financial hardship documentation",
          "May affect credit reporting"
        ]
      });
    }
    
    // Determine recommendation based on goal or payment history
    let recommendation;
    
    if (restructuringGoal === "reduce_payments") {
      if (extendedPaymentReduction > reducedPaymentReduction) {
        recommendation =
          "Term extension option provides the most significant payment relief.";
      } else {
        recommendation =
          "Rate reduction option provides the best balance of payment relief and total interest paid.";
      }
    } else if (restructuringGoal === "extend_term") {
      recommendation =
        "Term extension option aligns with the requested goal of extending the loan term.";
    } else if (
      restructuringGoal === "address_hardship" &&
      restructuringOptions.length > 2
    ) {
      recommendation =
        "The hardship modification option provides comprehensive relief for financial difficulty situations.";
    } else {
      // Check payment history for guidance
      const latePayments = loanPayments.filter(
        (p) => p.status === "Late"
      ).length;
      
      if (latePayments > 2) {
        recommendation =
          "Based on payment history showing multiple late payments, the term extension option provides necessary payment relief while maintaining loan viability.";
      } else {
        recommendation =
          "With a strong payment history, the rate reduction option provides the best long-term financial benefit while still lowering monthly payments.";
      }
    }
    
    // Construct response object
    const restructuringRecommendations = {
      loan_id: loanId,
      borrower_id: loan.borrower_id,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      current_structure: currentStructure,
      restructuring_options: restructuringOptions,
      recommendation: recommendation,
      analysis_date: new Date().toISOString().split("T")[0]
    };
    
    LogService.info(`Completed loan restructuring recommendation for loan ${loanId}`, {
      result: { options_count: restructuringOptions.length }
    });
    
    res.json(restructuringRecommendations);
  } catch (error) {
    LogService.error(`Error in loan restructuring recommendation: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      error: "Failed to generate loan restructuring recommendations",
      details: error.message
    });
  }
});

module.exports = router; 