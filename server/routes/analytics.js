const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const LogService = require('../services/logService');

// Get all high risk farmers
router.get('/high-risk-farmers', (req, res) => {
  const timeHorizon = req.query.time_horizon || '3m';
  const threshold = req.query.threshold || 'high';
  
  LogService.info(`Identifying high risk farmers with time horizon: ${timeHorizon}, threshold: ${threshold}`);
  
  try {
    // Load data
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    const loans = dataService.loadData(dataService.paths.loans);
    const payments = dataService.loadData(dataService.paths.payments);
    
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
router.get('/payment-patterns/:borrower_id', (req, res) => {
  const borrowerId = req.params.borrower_id;
  const period = req.query.period || '1y'; // Default to 1 year
  
  LogService.info(`Analyzing payment patterns for borrower ${borrowerId} with period: ${period}`);
  
  // Load data
  const borrowers = dataService.loadData(dataService.paths.borrowers);
  const loans = dataService.loadData(dataService.paths.loans);
  const payments = dataService.loadData(dataService.paths.payments);
  
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
});

// Predict default risk for a specific borrower
router.get('/predict/default-risk/:borrower_id', (req, res) => {
  const borrowerId = req.params.borrower_id;
  const timeHorizon = req.query.time_horizon || '3m';
  
  LogService.info(`Predicting default risk for borrower ${borrowerId} with time horizon: ${timeHorizon}`);
  
  // Load data
  const borrowers = dataService.loadData(dataService.paths.borrowers);
  const loans = dataService.loadData(dataService.paths.loans);
  const payments = dataService.loadData(dataService.paths.payments);
  
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
});

// Predict non-accrual risk for a borrower
router.get('/predict/non-accrual-risk/:borrower_id', (req, res) => {
  const borrowerId = req.params.borrower_id;
  
  LogService.info(`Predicting non-accrual risk for borrower ${borrowerId}`);
  
  try {
    // Load data
    LogService.debug(`Loading data for non-accrual risk prediction for borrower ${borrowerId}`);
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    const loans = dataService.loadData(dataService.paths.loans);
    const payments = dataService.loadData(dataService.paths.payments);
    
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
router.get('/equipment/forecast/:borrower_id', (req, res) => {
  const borrowerId = req.params.borrower_id;
  const timeHorizon = req.query.time_horizon || '1y';
  
  LogService.info(`Forecasting equipment maintenance costs for borrower ${borrowerId} with time horizon: ${timeHorizon}`);
  
  try {
    // Load data
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    const equipment = dataService.loadData(dataService.paths.mockEquipment);
    
    // Find borrower
    const borrower = borrowers.find(b => b.borrower_id === borrowerId);
    if (!borrower) {
      LogService.warn(`Borrower not found with ID: ${borrowerId}`);
      return res.status(404).json({ error: 'Borrower not found' });
    }
    
    // Find borrower's equipment (or use defaults if not found)
    let borrowerEquipment = equipment.filter(e => e.borrower_id === borrowerId);
    if (borrowerEquipment.length === 0) {
      // Create some default equipment for the borrower
      borrowerEquipment = [
        {
          id: `EQ-${borrowerId}-1`,
          borrower_id: borrowerId,
          type: "Tractor",
          model: "John Deere 8R",
          year: 2020,
          purchase_date: "2020-03-15",
          purchase_price: 350000,
          condition: "Good",
          hours_used: 1200
        },
        {
          id: `EQ-${borrowerId}-2`,
          borrower_id: borrowerId,
          type: "Harvester",
          model: "Case IH 8250",
          year: 2019,
          purchase_date: "2019-05-20",
          purchase_price: 425000,
          condition: "Good",
          hours_used: 900
        }
      ];
    }
    
    // Calculate base maintenance costs based on equipment type, age, and condition
    const maintenanceCosts = borrowerEquipment.map(equip => {
      const age = new Date().getFullYear() - equip.year;
      const hoursPerYear = equip.hours_used / Math.max(1, age);
      
      // Base maintenance cost as percentage of value 
      let maintenanceRate = 0.02; // 2% for new equipment
      
      // Adjust for age
      if (age > 5) maintenanceRate += 0.01 * (age - 5); // Add 1% per year over 5
      
      // Adjust for usage intensity
      if (hoursPerYear > 300) maintenanceRate += 0.01; // Heavy usage
      
      // Adjust for condition
      if (equip.condition === "Excellent") maintenanceRate *= 0.8;
      else if (equip.condition === "Poor") maintenanceRate *= 1.5;
      
      // Calculate annual cost
      const annualCost = Math.round(equip.purchase_price * maintenanceRate);
      
      // Factor in major maintenance events
      let majorRepair = false;
      let majorRepairDesc = "";
      
      if (age >= 3 && age % 3 === 0) {
        // Major service required every 3 years
        majorRepair = true;
        majorRepairDesc = "Major service interval";
      } else if (equip.hours_used > 2000 && equip.hours_used % 1000 < 200) {
        // Major repair around every 1000 hours
        majorRepair = true;
        majorRepairDesc = "Usage threshold service";
      }
      
      // Add major repair cost if needed
      const majorRepairCost = majorRepair ? Math.round(equip.purchase_price * 0.05) : 0;
      
      return {
        equipment_id: equip.id,
        type: equip.type,
        model: equip.model,
        age_years: age,
        annual_maintenance_cost: annualCost,
        major_repair_needed: majorRepair,
        major_repair_description: majorRepairDesc,
        major_repair_cost: majorRepairCost,
        total_annual_cost: annualCost + majorRepairCost
      };
    });
    
    // Calculate total costs
    const totalAnnualCost = maintenanceCosts.reduce((sum, item) => sum + item.total_annual_cost, 0);
    const totalMajorRepairCost = maintenanceCosts.reduce((sum, item) => sum + item.major_repair_cost, 0);
    
    // Prepare forecast
    const result = {
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      time_horizon: timeHorizon,
      equipment_count: borrowerEquipment.length,
      equipment_details: maintenanceCosts,
      annual_maintenance_budget: totalAnnualCost,
      immediate_major_repairs_cost: totalMajorRepairCost,
      total_annual_budget: totalAnnualCost,
      maintenance_recommendations: []
    };
    
    // Add recommendations based on analysis
    if (totalMajorRepairCost > 0) {
      result.maintenance_recommendations.push(`Budget ${totalMajorRepairCost} for major repairs in the coming year.`);
    }
    
    // Add recommendation for very old equipment
    const oldEquipment = borrowerEquipment.filter(e => new Date().getFullYear() - e.year > 7);
    if (oldEquipment.length > 0) {
      result.maintenance_recommendations.push(`Consider replacing ${oldEquipment.length} equipment items over 7 years old to reduce maintenance costs.`);
    }
    
    // Add recommendation for preventive maintenance
    result.maintenance_recommendations.push(`Schedule regular preventive maintenance to avoid unexpected repairs.`);
    
    LogService.info(`Equipment maintenance forecast completed for borrower ${borrowerId}`);
    res.json(result);
  } catch (error) {
    LogService.error(`Error forecasting equipment maintenance for borrower ${borrowerId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to generate equipment maintenance forecast', details: error.message });
  }
});

// Assess crop yield risk
router.get('/crop-yield/:borrower_id', (req, res) => {
  const borrowerId = req.params.borrower_id;
  const cropType = req.query.crop_type;
  const season = req.query.season || 'current';
  
  LogService.info(`Assessing crop yield risk for borrower ${borrowerId}, crop: ${cropType || 'all'}, season: ${season}`);
  
  try {
    // Load data
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    
    // Find borrower
    const borrower = borrowers.find(b => b.borrower_id === borrowerId);
    if (!borrower) {
      LogService.warn(`Borrower not found with ID: ${borrowerId}`);
      return res.status(404).json({ error: 'Borrower not found' });
    }
    
    // Determine crop types based on farm type
    const farmCrops = [];
    if (borrower.farm_type === 'Crop' || borrower.farm_type === 'Mixed') {
      // Default crops based on farm type
      farmCrops.push({ 
        crop: "Corn", 
        acres: Math.round(borrower.farm_size * 0.4),
        yield_per_acre: 175,
        historical_yield_avg: 165,
        yield_variability: 0.15
      });
      
      farmCrops.push({ 
        crop: "Soybeans", 
        acres: Math.round(borrower.farm_size * 0.3),
        yield_per_acre: 55,
        historical_yield_avg: 50,
        yield_variability: 0.12
      });
      
      if (borrower.farm_type === 'Mixed') {
        farmCrops.push({ 
          crop: "Wheat", 
          acres: Math.round(borrower.farm_size * 0.15),
          yield_per_acre: 65,
          historical_yield_avg: 60,
          yield_variability: 0.10
        });
      }
    }
    
    if (borrower.farm_type === 'Livestock' || borrower.farm_type === 'Mixed') {
      farmCrops.push({ 
        crop: "Hay", 
        acres: Math.round(borrower.farm_size * (borrower.farm_type === 'Livestock' ? 0.5 : 0.15)),
        yield_per_acre: 4.5,
        historical_yield_avg: 4.2,
        yield_variability: 0.08
      });
    }
    
    // Filter by crop type if specified
    let assessedCrops = farmCrops;
    if (cropType) {
      assessedCrops = farmCrops.filter(c => c.crop.toLowerCase() === cropType.toLowerCase());
    }
    
    // Analyze yield risks for each crop
    const cropRisks = assessedCrops.map(crop => {
      // Calculate risk factors
      
      // Historical yield variance
      const yieldVariance = crop.yield_variability;
      
      // Weather risk factor (simplified)
      let weatherRiskFactor = 0.1; // Base risk
      
      // Add seasonal factors
      if (season === 'current') {
        const currentMonth = new Date().getMonth();
        
        // Spring planting risk (March-May)
        if (currentMonth >= 2 && currentMonth <= 4) {
          weatherRiskFactor = 0.18;
        }
        // Summer drought risk (June-August)
        else if (currentMonth >= 5 && currentMonth <= 7) {
          weatherRiskFactor = 0.22;
        }
        // Harvest risk (September-November)
        else if (currentMonth >= 8 && currentMonth <= 10) {
          weatherRiskFactor = 0.15;
        }
        // Winter (minimal risk for most crops)
        else {
          weatherRiskFactor = 0.05;
        }
      }
      
      // Calculate break-even yield
      const productionCostsPerAcre = crop.crop === "Corn" ? 750 : 
                                    crop.crop === "Soybeans" ? 550 : 
                                    crop.crop === "Wheat" ? 450 : 400;
      
      const cropPricePerUnit = crop.crop === "Corn" ? 5.60 : 
                              crop.crop === "Soybeans" ? 13.20 : 
                              crop.crop === "Wheat" ? 7.50 : 180;
      
      const breakEvenYield = productionCostsPerAcre / cropPricePerUnit;
      
      // Calculate overall risk
      const yieldRisk = yieldVariance + weatherRiskFactor;
      
      // Calculate risk of falling below break-even
      const standardDeviations = (crop.yield_per_acre - breakEvenYield) / (crop.historical_yield_avg * crop.yield_variability);
      
      // Convert to probability using simplified approach
      // Negative SD means yield is already below break-even
      let belowBreakEvenRisk = 0;
      if (standardDeviations < 0) {
        belowBreakEvenRisk = 0.95; // Already below break-even
      } else if (standardDeviations < 0.5) {
        belowBreakEvenRisk = 0.7; // High risk
      } else if (standardDeviations < 1) {
        belowBreakEvenRisk = 0.5; // Moderate risk
      } else if (standardDeviations < 2) {
        belowBreakEvenRisk = 0.2; // Lower risk
      } else {
        belowBreakEvenRisk = 0.05; // Low risk
      }
      
      // Risk level based on probability
      let riskLevel = "low";
      if (belowBreakEvenRisk > 0.7) riskLevel = "high";
      else if (belowBreakEvenRisk > 0.3) riskLevel = "medium";
      
      return {
        crop: crop.crop,
        acres: crop.acres,
        expected_yield: crop.yield_per_acre,
        break_even_yield: Math.round(breakEvenYield * 100) / 100,
        yield_risk_score: Math.round(yieldRisk * 100) / 100,
        below_break_even_probability: Math.round(belowBreakEvenRisk * 100) / 100,
        risk_level: riskLevel,
        estimated_profit_per_acre: Math.round((crop.yield_per_acre * cropPricePerUnit - productionCostsPerAcre) * 100) / 100
      };
    });
    
    // Calculate weighted average risk
    const totalAcres = cropRisks.reduce((sum, crop) => sum + crop.acres, 0);
    const weightedRiskSum = cropRisks.reduce((sum, crop) => sum + (crop.below_break_even_probability * crop.acres), 0);
    const averageRisk = totalAcres > 0 ? weightedRiskSum / totalAcres : 0;
    
    // Determine overall risk level
    let overallRiskLevel = "low";
    if (averageRisk > 0.7) overallRiskLevel = "high";
    else if (averageRisk > 0.3) overallRiskLevel = "medium";
    
    // Generate recommendations
    const recommendations = [];
    
    // High risk crops recommendations
    const highRiskCrops = cropRisks.filter(c => c.risk_level === 'high');
    if (highRiskCrops.length > 0) {
      const cropNames = highRiskCrops.map(c => c.crop).join(', ');
      recommendations.push(`Consider crop insurance for ${cropNames} to mitigate high yield risk.`);
    }
    
    // Diversification recommendation
    if (cropRisks.length < 2) {
      recommendations.push("Consider diversifying crops to reduce overall yield risk.");
    }
    
    // Add recommendation based on season
    if (season === 'current') {
      const currentMonth = new Date().getMonth();
      if (currentMonth >= 2 && currentMonth <= 4) {
        recommendations.push("Monitor spring planting conditions closely to adjust as needed.");
      } else if (currentMonth >= 5 && currentMonth <= 7) {
        recommendations.push("Consider irrigation strategies to mitigate potential drought impacts.");
      }
    }
    
    // Prepare result
    const result = {
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      season: season,
      farm_type: borrower.farm_type,
      total_acres: borrower.farm_size,
      crop_risk_assessments: cropRisks,
      overall_risk_level: overallRiskLevel,
      overall_break_even_risk: Math.round(averageRisk * 100) / 100,
      recommendations: recommendations
    };
    
    LogService.info(`Crop yield risk assessment completed for borrower ${borrowerId}`);
    res.json(result);
  } catch (error) {
    LogService.error(`Error assessing crop yield risk for borrower ${borrowerId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to assess crop yield risk', details: error.message });
  }
});

// Analyze market price impact
router.get('/market-impact/:borrower_id', (req, res) => {
  const borrowerId = req.params.borrower_id;
  const commoditiesParam = req.query.commodities;
  
  // Parse commodities if provided
  let specificCommodities = [];
  if (commoditiesParam) {
    specificCommodities = commoditiesParam.split(',').map(c => c.trim().toLowerCase());
  }
  
  LogService.info(`Analyzing market price impact for borrower ${borrowerId}, commodities: ${specificCommodities.length > 0 ? specificCommodities.join(', ') : 'all'}`);
  
  try {
    // Load data
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    
    // Find borrower
    const borrower = borrowers.find(b => b.borrower_id === borrowerId);
    if (!borrower) {
      LogService.warn(`Borrower not found with ID: ${borrowerId}`);
      return res.status(404).json({ error: 'Borrower not found' });
    }
    
    // Determine commodities based on farm type
    const commodities = [];
    if (borrower.farm_type === 'Crop' || borrower.farm_type === 'Mixed') {
      commodities.push({
        name: "Corn",
        production_units: Math.round(borrower.farm_size * 0.4 * 175), // acres * yield
        unit_type: "bushels",
        current_price: 5.60,
        price_trend: -0.10, // 10% downward trend
        historical_volatility: 0.22,
        price_sensitivity: 0.85 // correlation with borrower income
      });
      
      commodities.push({
        name: "Soybeans",
        production_units: Math.round(borrower.farm_size * 0.3 * 55), // acres * yield
        unit_type: "bushels",
        current_price: 13.20,
        price_trend: 0.05, // 5% upward trend
        historical_volatility: 0.19,
        price_sensitivity: 0.80
      });
    }
    
    if (borrower.farm_type === 'Livestock' || borrower.farm_type === 'Mixed') {
      commodities.push({
        name: "Cattle",
        production_units: Math.round(borrower.farm_size * 0.5), // simplified unit calculation
        unit_type: "head",
        current_price: 1350.00,
        price_trend: 0.08, // 8% upward trend
        historical_volatility: 0.15,
        price_sensitivity: 0.90
      });
      
      // Add feed as input cost for livestock
      commodities.push({
        name: "Feed",
        production_units: Math.round(borrower.farm_size * 2), // simplified feed requirements
        unit_type: "tons",
        current_price: 225.00,
        price_trend: 0.03, // 3% upward trend
        historical_volatility: 0.18,
        price_sensitivity: -0.75, // negative because it's an input cost
        is_input_cost: true
      });
    }
    
    // Filter commodities if specific ones requested
    let relevantCommodities = commodities;
    if (specificCommodities.length > 0) {
      relevantCommodities = commodities.filter(c => 
        specificCommodities.includes(c.name.toLowerCase())
      );
    }
    
    // Analyze price impacts
    const priceImpacts = relevantCommodities.map(commodity => {
      // Current revenue or cost
      const currentValue = commodity.production_units * commodity.current_price;
      
      // Projected price changes
      const projectedPrice = commodity.current_price * (1 + commodity.price_trend);
      const projectedValue = commodity.production_units * projectedPrice;
      
      // Impact on borrower's income
      const financialImpact = (projectedValue - currentValue) * 
                              (commodity.is_input_cost ? -1 : 1); // Reverse for input costs
      
      // Sensitivity-adjusted impact (how much it affects borrower's income)
      const adjustedImpact = financialImpact * Math.abs(commodity.price_sensitivity);
      
      // Impact as percentage of income
      const incomeImpactPercent = (adjustedImpact / borrower.income) * 100;
      
      // Risk scenarios
      const downside10Percent = -0.1 * currentValue * Math.abs(commodity.price_sensitivity);
      const downside20Percent = -0.2 * currentValue * Math.abs(commodity.price_sensitivity);
      
      return {
        commodity: commodity.name,
        is_input_cost: commodity.is_input_cost || false,
        current_price: commodity.current_price,
        price_trend_percent: Math.round(commodity.price_trend * 100),
        projected_price: Math.round(projectedPrice * 100) / 100,
        current_value: Math.round(currentValue),
        projected_value: Math.round(projectedValue),
        financial_impact: Math.round(financialImpact),
        income_impact_percent: Math.round(incomeImpactPercent * 10) / 10,
        downside_risk_10percent: Math.round(downside10Percent),
        downside_risk_20percent: Math.round(downside20Percent),
        market_volatility: commodity.historical_volatility,
        price_risk_level: commodity.historical_volatility > 0.2 ? "high" : 
                          commodity.historical_volatility > 0.1 ? "medium" : "low"
      };
    });
    
    // Calculate overall impact
    const totalImpact = priceImpacts.reduce((sum, impact) => sum + impact.financial_impact, 0);
    const totalIncomeImpact = totalImpact / borrower.income * 100;
    
    // Calculate worst-case scenario
    const worstCaseImpact = priceImpacts.reduce((sum, impact) => sum + impact.downside_risk_20percent, 0);
    const worstCaseIncomeImpact = worstCaseImpact / borrower.income * 100;
    
    // Determine overall risk level
    let overallRiskLevel = "low";
    if (Math.abs(worstCaseIncomeImpact) > 30) overallRiskLevel = "high";
    else if (Math.abs(worstCaseIncomeImpact) > 15) overallRiskLevel = "medium";
    
    // Generate recommendations
    const recommendations = [];
    
    // Look for high-volatility commodities
    const volatileCommodities = priceImpacts.filter(i => i.market_volatility > 0.2);
    if (volatileCommodities.length > 0) {
      const commodityNames = volatileCommodities.map(i => i.commodity).join(', ');
      recommendations.push(`Consider price hedging strategies for ${commodityNames} due to high price volatility.`);
    }
    
    // Significant downside risk
    if (Math.abs(worstCaseIncomeImpact) > 20) {
      recommendations.push("Develop contingency plan for market price drops to protect farm income.");
    }
    
    // Add recommendation based on overall impact
    if (totalIncomeImpact < -5) {
      recommendations.push("Current market trends suggest negative impact on income. Consider diversifying production.");
    } else if (totalIncomeImpact > 5) {
      recommendations.push("Current market trends favorable. Consider locking in forward contracts at current prices.");
    }
    
    // Prepare result
    const result = {
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      farm_type: borrower.farm_type,
      annual_income: borrower.income,
      commodity_impacts: priceImpacts,
      projected_income_change: Math.round(totalImpact),
      projected_income_change_percent: Math.round(totalIncomeImpact * 10) / 10,
      worst_case_impact: Math.round(worstCaseImpact),
      worst_case_impact_percent: Math.round(worstCaseIncomeImpact * 10) / 10,
      market_risk_level: overallRiskLevel,
      recommendations: recommendations
    };
    
    LogService.info(`Market price impact analysis completed for borrower ${borrowerId}`);
    res.json(result);
  } catch (error) {
    LogService.error(`Error analyzing market price impact for borrower ${borrowerId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to analyze market price impact', details: error.message });
  }
});

// Recommend loan restructuring options
router.get('/restructure/:loan_id', (req, res) => {
  const loanId = req.params.loan_id;
  const optimizationGoal = req.query.goal || 'lower_payments';
  
  LogService.info(`Generating loan restructuring options for loan ${loanId} with goal: ${optimizationGoal}`);
  
  try {
    // Load data
    const loans = dataService.loadData(dataService.paths.loans);
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    const payments = dataService.loadData(dataService.paths.payments);
    
    // Find the loan
    const loan = loans.find(l => l.loan_id === loanId);
    if (!loan) {
      LogService.warn(`Loan not found with ID: ${loanId}`);
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // Find borrower
    const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
    if (!borrower) {
      LogService.warn(`Borrower not found for loan ${loanId}`);
      return res.status(404).json({ error: 'Borrower not found for this loan' });
    }
    
    // Get payment history
    const loanPayments = payments.filter(p => p.loan_id === loanId);
    const latePayments = loanPayments.filter(p => p.status === 'Late').length;
    const paymentPerformance = latePayments > 0 ? 
                              (latePayments / loanPayments.length) > 0.25 ? "poor" : "fair" : 
                              "good";
    
    // Calculate current loan details
    const currentRate = loan.interest_rate;
    const originalTerm = loan.term_length;
    const startDate = new Date(loan.start_date);
    const endDate = new Date(loan.end_date);
    
    // Calculate elapsed time in months
    const now = new Date();
    const elapsedMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                         (now.getMonth() - startDate.getMonth());
    
    // Calculate remaining term in months
    const remainingMonths = Math.max(0, originalTerm - elapsedMonths);
    
    // Estimate remaining balance (simplified calculation)
    const monthlyRate = currentRate / 100 / 12;
    const monthlyPayment = (loan.loan_amount * monthlyRate * Math.pow(1 + monthlyRate, originalTerm)) / 
                          (Math.pow(1 + monthlyRate, originalTerm) - 1);
    
    // Simplified remaining balance calculation
    let remainingBalance = loan.loan_amount;
    if (elapsedMonths > 0 && elapsedMonths < originalTerm) {
      const amortizationFactor = (Math.pow(1 + monthlyRate, originalTerm) - Math.pow(1 + monthlyRate, elapsedMonths)) / 
                                (Math.pow(1 + monthlyRate, originalTerm) - 1);
      remainingBalance = loan.loan_amount * amortizationFactor;
    }
    
    // Generate restructuring options
    const options = [];
    
    // Option 1: Lower interest rate
    // Rate reduction depends on payment performance and credit score
    let rateReduction = 0;
    if (paymentPerformance === "good" && borrower.credit_score >= 700) {
      rateReduction = 0.75; // 0.75% reduction for good payment history and credit
    } else if (paymentPerformance === "fair" && borrower.credit_score >= 650) {
      rateReduction = 0.5; // 0.5% reduction for fair payment history
    } else if (borrower.credit_score >= 600) {
      rateReduction = 0.25; // 0.25% reduction based just on credit score
    }
    
    if (rateReduction > 0) {
      const newRate = Math.max(currentRate - rateReduction, 3.0); // Floor at 3%
      
      // Calculate new payment
      const newMonthlyRate = newRate / 100 / 12;
      const newMonthlyPayment = (remainingBalance * newMonthlyRate * Math.pow(1 + newMonthlyRate, remainingMonths)) / 
                              (Math.pow(1 + newMonthlyRate, remainingMonths) - 1);
      
      // Calculate savings
      const monthlySavings = monthlyPayment - newMonthlyPayment;
      const totalSavings = monthlySavings * remainingMonths;
      
      options.push({
        option_id: "RESTRUCTURE-1",
        description: "Rate reduction",
        current_rate: currentRate,
        new_rate: newRate,
        rate_reduction: rateReduction,
        term_months: remainingMonths,
        current_payment: Math.round(monthlyPayment * 100) / 100,
        new_payment: Math.round(newMonthlyPayment * 100) / 100,
        monthly_savings: Math.round(monthlySavings * 100) / 100,
        total_savings: Math.round(totalSavings * 100) / 100,
        closing_costs: Math.round(remainingBalance * 0.01), // 1% closing cost
        break_even_months: Math.ceil((remainingBalance * 0.01) / monthlySavings)
      });
    }
    
    // Option 2: Term extension
    if (remainingMonths >= 24) {
      // Extend by 25% of remaining term (rounded to nearest year)
      const extensionMonths = Math.round(remainingMonths * 0.25 / 12) * 12;
      const newTerm = remainingMonths + extensionMonths;
      
      // Calculate new payment
      const newMonthlyPayment = (remainingBalance * monthlyRate * Math.pow(1 + monthlyRate, newTerm)) / 
                              (Math.pow(1 + monthlyRate, newTerm) - 1);
      
      // Calculate impact
      const monthlySavings = monthlyPayment - newMonthlyPayment;
      const additionalInterest = (newMonthlyPayment * newTerm) - (monthlyPayment * remainingMonths);
      
      options.push({
        option_id: "RESTRUCTURE-2",
        description: "Term extension",
        current_rate: currentRate,
        new_rate: currentRate,
        current_term_remaining: remainingMonths,
        extension_months: extensionMonths,
        new_term: newTerm,
        current_payment: Math.round(monthlyPayment * 100) / 100,
        new_payment: Math.round(newMonthlyPayment * 100) / 100,
        monthly_payment_reduction: Math.round(monthlySavings * 100) / 100,
        payment_reduction_percent: Math.round((monthlySavings / monthlyPayment) * 100 * 10) / 10,
        additional_interest_cost: Math.round(additionalInterest * 100) / 100,
        closing_costs: Math.round(remainingBalance * 0.005) // 0.5% closing cost
      });
    }
    
    // Option 3: Combined rate reduction and term adjustment
    if (rateReduction > 0 && remainingMonths >= 24) {
      // Optimize based on goal
      let newTerm = remainingMonths;
      let newRate = Math.max(currentRate - rateReduction, 3.0);
      
      if (optimizationGoal === 'lower_payments') {
        // Extend term slightly
        newTerm = remainingMonths + Math.min(12, Math.round(remainingMonths * 0.1));
      } else if (optimizationGoal === 'reduce_interest') {
        // Shorten term if possible
        newTerm = Math.max(remainingMonths - Math.min(12, Math.round(remainingMonths * 0.1)), 12);
      } else if (optimizationGoal === 'shorter_term') {
        // Shorten term more aggressively
        newTerm = Math.max(remainingMonths - Math.min(24, Math.round(remainingMonths * 0.2)), 12);
      }
      
      // Calculate new payment
      const newMonthlyRate = newRate / 100 / 12;
      const newMonthlyPayment = (remainingBalance * newMonthlyRate * Math.pow(1 + newMonthlyRate, newTerm)) / 
                              (Math.pow(1 + newMonthlyRate, newTerm) - 1);
      
      // Calculate current total cost and new total cost
      const currentTotalCost = monthlyPayment * remainingMonths;
      const newTotalCost = newMonthlyPayment * newTerm;
      const totalSavings = currentTotalCost - newTotalCost;
      
      options.push({
        option_id: "RESTRUCTURE-3",
        description: "Optimized restructuring",
        optimization_goal: optimizationGoal,
        current_rate: currentRate,
        new_rate: newRate,
        rate_reduction: rateReduction,
        current_term_remaining: remainingMonths,
        new_term: newTerm,
        term_change_months: newTerm - remainingMonths,
        current_payment: Math.round(monthlyPayment * 100) / 100,
        new_payment: Math.round(newMonthlyPayment * 100) / 100,
        monthly_impact: Math.round((monthlyPayment - newMonthlyPayment) * 100) / 100,
        total_cost_savings: Math.round(totalSavings * 100) / 100,
        closing_costs: Math.round(remainingBalance * 0.015) // 1.5% closing cost
      });
    }
    
    // Generate recommendations
    const recommendations = [];
    
    // Recommend based on payment history
    if (paymentPerformance === "poor") {
      recommendations.push("Focus on payment history improvement before refinancing for better terms.");
    } else if (options.length > 0) {
      if (optimizationGoal === 'lower_payments') {
        recommendations.push("Option 2 (Term Extension) provides the largest monthly payment reduction.");
      } else if (optimizationGoal === 'reduce_interest') {
        recommendations.push("Option 1 (Rate Reduction) offers the best interest savings over the loan term.");
      } else if (optimizationGoal === 'shorter_term') {
        recommendations.push("Option 3 with shorter term will increase monthly payments but reduce overall interest cost.");
      }
    }
    
    // Add recommendation based on credit score
    if (borrower.credit_score < 650) {
      recommendations.push("Consider credit improvement strategies to qualify for better rates in the future.");
    } else if (borrower.credit_score >= 750) {
      recommendations.push("Excellent credit profile may qualify for additional rate discounts or premium products.");
    }
    
    // Prepare result
    const result = {
      loan_id: loanId,
      borrower_id: borrower.borrower_id,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      loan_type: loan.loan_type,
      original_amount: loan.loan_amount,
      current_balance: Math.round(remainingBalance * 100) / 100,
      current_rate: currentRate,
      remaining_term_months: remainingMonths,
      payment_performance: paymentPerformance,
      restructuring_options: options,
      recommendations: recommendations,
      optimization_goal: optimizationGoal
    };
    
    LogService.info(`Loan restructuring options generated for loan ${loanId}: ${options.length} options available`);
    res.json(result);
  } catch (error) {
    LogService.error(`Error generating loan restructuring options for loan ${loanId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to generate loan restructuring options', details: error.message });
  }
});

module.exports = router; 