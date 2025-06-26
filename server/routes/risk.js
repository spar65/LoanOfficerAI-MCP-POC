const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const LogService = require('../services/logService');

// Get default risk assessment for borrower
router.get('/default/:borrower_id', (req, res) => {
  const borrowerId = req.params.borrower_id;
  const timeHorizon = req.query.time_horizon || 'medium_term';
  
  LogService.info(`Assessing default risk for borrower ${borrowerId} with time horizon: ${timeHorizon}`);
  
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
      risk_score: 0,
      risk_factors: ["No loans found for this borrower"],
      recommendations: ["N/A"]
    });
  }
  
  // Get payment history
  const allPayments = [];
  borrowerLoans.forEach(loan => {
    const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
    allPayments.push(...loanPayments);
  });
  
  // Calculate risk score (simplified algorithm)
  // In a real system, this would be much more sophisticated
  let riskScore = 50; // Base score
  
  // Credit score factor
  if (borrower.credit_score >= 750) riskScore -= 15;
  else if (borrower.credit_score >= 700) riskScore -= 10;
  else if (borrower.credit_score >= 650) riskScore -= 5;
  else if (borrower.credit_score < 600) riskScore += 20;
  
  // Late payments factor
  const latePayments = allPayments.filter(p => p.status === 'Late');
  if (latePayments.length > 3) riskScore += 25;
  else if (latePayments.length > 0) riskScore += latePayments.length * 5;
  
  // Loan to income ratio factor
  const totalLoanAmount = borrowerLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
  const loanToIncomeRatio = totalLoanAmount / borrower.income;
  if (loanToIncomeRatio > 5) riskScore += 25;
  else if (loanToIncomeRatio > 3) riskScore += 15;
  else if (loanToIncomeRatio > 2) riskScore += 5;
  
  // Farm size and diversity factor (simplified)
  if (borrower.farm_size < 50) riskScore += 10; // Small farms often have less buffer
  
  // Cap risk score between 0-100
  riskScore = Math.max(0, Math.min(100, riskScore));
  
  // Identify risk factors
  const riskFactors = [];
  if (latePayments.length > 0) {
    riskFactors.push(`${latePayments.length} late payment(s) in history`);
  }
  if (loanToIncomeRatio > 2) {
    riskFactors.push(`High loan-to-income ratio: ${loanToIncomeRatio.toFixed(1)}`);
  }
  if (borrower.credit_score < 650) {
    riskFactors.push(`Below average credit score: ${borrower.credit_score}`);
  }
  if (borrower.farm_size < 50) {
    riskFactors.push(`Small farm size may limit production capacity`);
  }
  
  // Generate recommendations
  const recommendations = [];
  if (riskScore > 70) {
    recommendations.push("Consider requiring additional collateral");
    recommendations.push("Implement more frequent payment monitoring");
  } else if (riskScore > 50) {
    recommendations.push("Monitor seasonal payment patterns closely");
    recommendations.push("Discuss risk mitigation strategies with borrower");
  } else {
    recommendations.push("Standard monitoring procedures are sufficient");
  }
  
  // Adjust recommendations based on time horizon
  if (timeHorizon === 'short_term' && riskScore > 60) {
    recommendations.push("Immediate review of payment schedule recommended");
  } else if (timeHorizon === 'long_term' && riskScore > 40) {
    recommendations.push("Consider loan restructuring to improve long-term viability");
  }
  
  const result = {
    borrower_id: borrowerId,
    borrower_name: `${borrower.first_name} ${borrower.last_name}`,
    risk_score: riskScore,
    risk_level: riskScore > 70 ? "high" : (riskScore > 40 ? "medium" : "low"),
    time_horizon: timeHorizon,
    risk_factors: riskFactors,
    recommendations: recommendations
  };
  
  // Log result
  LogService.info(`Risk assessment completed for borrower ${borrowerId}: Score ${riskScore}`);
  res.json(result);
});

// Find farmers at risk based on criteria
router.get('/farmers-at-risk', (req, res) => {
  const cropType = req.query.crop_type;
  const season = req.query.season;
  const riskLevel = req.query.risk_level || 'high';
  
  LogService.info(`Finding farmers at risk with params: crop=${cropType}, season=${season}, risk=${riskLevel}`);
  
  // Load data
  const borrowers = dataService.loadData(dataService.paths.borrowers);
  const loans = dataService.loadData(dataService.paths.loans);
  const payments = dataService.loadData(dataService.paths.payments);
  
  // Calculate risk for each borrower (simplified algorithm)
  const borrowersWithRisk = borrowers.map(borrower => {
    // Get borrower's loans
    const borrowerLoans = loans.filter(l => l.borrower_id === borrower.borrower_id);
    
    // Skip borrowers with no loans
    if (borrowerLoans.length === 0) {
      return {
        ...borrower,
        risk_score: 0,
        risk_level: 'low',
        risk_factors: []
      };
    }
    
    // Get payment history
    const allPayments = [];
    borrowerLoans.forEach(loan => {
      const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
      allPayments.push(...loanPayments);
    });
    
    // Calculate risk score (simplified)
    let riskScore = 50; // Base score
    
    // Credit score factor
    if (borrower.credit_score >= 750) riskScore -= 15;
    else if (borrower.credit_score >= 700) riskScore -= 10;
    else if (borrower.credit_score >= 650) riskScore -= 5;
    else if (borrower.credit_score < 600) riskScore += 20;
    
    // Late payments factor
    const latePayments = allPayments.filter(p => p.status === 'Late');
    if (latePayments.length > 3) riskScore += 25;
    else if (latePayments.length > 0) riskScore += latePayments.length * 5;
    
    // Loan to income ratio
    const totalLoanAmount = borrowerLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
    const loanToIncomeRatio = totalLoanAmount / borrower.income;
    if (loanToIncomeRatio > 5) riskScore += 25;
    else if (loanToIncomeRatio > 3) riskScore += 15;
    else if (loanToIncomeRatio > 2) riskScore += 5;
    
    // Farm size factor
    if (borrower.farm_size < 50) riskScore += 10;
    
    // Seasonal risk adjustment
    if (season) {
      // These are simplified seasonal factors
      if (season === 'winter' && borrower.farm_type === 'Crop') riskScore += 15;
      else if (season === 'spring' && borrower.farm_type === 'Crop') riskScore += 10;
      else if (season === 'summer' && borrower.farm_type === 'Livestock') riskScore += 5;
    }
    
    // Cap risk score between 0-100
    riskScore = Math.max(0, Math.min(100, riskScore));
    
    // Risk level
    let riskLevel = 'low';
    if (riskScore > 70) riskLevel = 'high';
    else if (riskScore > 40) riskLevel = 'medium';
    
    // Risk factors
    const riskFactors = [];
    if (latePayments.length > 0) {
      riskFactors.push(`${latePayments.length} late payment(s) in history`);
    }
    if (loanToIncomeRatio > 2) {
      riskFactors.push(`High loan-to-income ratio: ${loanToIncomeRatio.toFixed(1)}`);
    }
    if (borrower.credit_score < 650) {
      riskFactors.push(`Below average credit score: ${borrower.credit_score}`);
    }
    if (borrower.farm_size < 50) {
      riskFactors.push(`Small farm size may limit production capacity`);
    }
    
    return {
      borrower_id: borrower.borrower_id,
      name: `${borrower.first_name} ${borrower.last_name}`,
      farm_type: borrower.farm_type,
      farm_size: borrower.farm_size,
      risk_score: riskScore,
      risk_level: riskLevel,
      risk_factors: riskFactors
    };
  });
  
  // Filter results
  let results = borrowersWithRisk;
  
  // Filter by risk level
  if (riskLevel === 'high') {
    results = results.filter(b => b.risk_level === 'high');
  } else if (riskLevel === 'medium') {
    results = results.filter(b => b.risk_level === 'medium' || b.risk_level === 'high');
  }
  
  // Filter by crop type (using farm_type as proxy)
  if (cropType) {
    if (cropType.toLowerCase() === 'corn' || 
        cropType.toLowerCase() === 'wheat' || 
        cropType.toLowerCase() === 'soybeans') {
      results = results.filter(b => b.farm_type === 'Crop');
    } else if (cropType.toLowerCase() === 'livestock') {
      results = results.filter(b => b.farm_type === 'Livestock');
    }
  }
  
  // Sort by risk score (highest first)
  results.sort((a, b) => b.risk_score - a.risk_score);
  
  // Log result
  LogService.info(`Found ${results.length} farmers matching risk criteria`);
  res.json(results);
});

// Evaluate collateral sufficiency
router.get('/collateral/:loan_id', (req, res) => {
  const loanId = req.params.loan_id;
  const marketConditions = req.query.market_conditions || 'stable';
  
  LogService.info(`Evaluating collateral for loan ${loanId} with market conditions: ${marketConditions}`);
  
  // Load data
  const loans = dataService.loadData(dataService.paths.loans);
  const collaterals = dataService.loadData(dataService.paths.collateral);
  
  LogService.debug(`Loaded ${loans.length} loans and ${collaterals.length} collateral items`);
  
  // Find the loan
  const loan = loans.find(l => l.loan_id === loanId);
  if (!loan) {
    LogService.warn(`Loan not found with ID: ${loanId}`);
    return res.status(404).json({ error: 'Loan not found' });
  }
  
  LogService.debug(`Found loan ${loanId}: ${loan.loan_type}, amount: ${loan.loan_amount}`);
  
  // Get collateral for this loan
  const loanCollateral = collaterals.filter(c => c.loan_id === loanId);
  LogService.debug(`Found ${loanCollateral.length} collateral items for loan ${loanId}`);
  
  if (loanCollateral.length === 0) {
    LogService.warn(`No collateral found for loan ${loanId}`);
    return res.json({
      loan_id: loanId,
      is_sufficient: false,
      current_loan_balance: loan.loan_amount,
      collateral_value: 0,
      loan_to_value_ratio: Infinity,
      assessment: "No collateral found for this loan."
    });
  }
  
  // Calculate total collateral value
  let collateralValue = loanCollateral.reduce((sum, c) => sum + c.value, 0);
  LogService.debug(`Initial collateral value: ${collateralValue}`);
  
  // Adjust for market conditions
  let marketAdjustment = 1.0;
  if (marketConditions === 'declining') {
    marketAdjustment = 0.8; // 20% reduction in declining markets
  } else if (marketConditions === 'improving') {
    marketAdjustment = 1.1; // 10% increase in improving markets
  }
  
  const adjustedCollateralValue = collateralValue * marketAdjustment;
  LogService.debug(`Market conditions '${marketConditions}' apply ${marketAdjustment} adjustment, resulting in adjusted value: ${adjustedCollateralValue}`);
  
  // Current loan balance (simplified - in reality would be calculated from payments)
  const currentLoanBalance = loan.loan_amount;
  
  // Loan to value ratio
  const loanToValueRatio = currentLoanBalance / adjustedCollateralValue;
  LogService.debug(`Calculated loan-to-value ratio: ${loanToValueRatio.toFixed(2)}`);
  
  // Industry standard sufficiency threshold
  const sufficiencyThreshold = 0.8; // 80% LTV threshold
  const isSufficient = loanToValueRatio < sufficiencyThreshold;
  
  // Generate assessment
  let assessment = '';
  if (loanToValueRatio < 0.5) {
    assessment = "Collateral is highly sufficient with significant equity buffer.";
  } else if (loanToValueRatio < 0.7) {
    assessment = "Collateral is adequate with reasonable equity margin.";
  } else if (loanToValueRatio < 0.8) {
    assessment = "Collateral is minimally sufficient. Consider monitoring valuations.";
  } else if (loanToValueRatio < 1.0) {
    assessment = "Collateral is below recommended levels but still covers the loan. Consider requesting additional security.";
  } else {
    assessment = "Insufficient collateral. Loan is under-secured based on current valuations.";
  }
  
  // Add collateral margin percentage
  const collateralMargin = ((adjustedCollateralValue - currentLoanBalance) / currentLoanBalance) * 100;
  
  const result = {
    loan_id: loanId,
    loan_type: loan.loan_type,
    is_sufficient: isSufficient,
    industry_standard_threshold: sufficiencyThreshold,
    current_loan_balance: currentLoanBalance,
    collateral_value: adjustedCollateralValue,
    collateral_margin_percentage: Math.round(collateralMargin * 10) / 10,
    loan_to_value_ratio: Number(loanToValueRatio.toFixed(2)),
    market_conditions: marketConditions,
    market_adjustment_factor: marketAdjustment,
    collateral_items: loanCollateral.length,
    collateral_details: loanCollateral.map(c => ({ 
      id: c.collateral_id,
      description: c.description,
      value: c.value 
    })),
    assessment: assessment
  };
  
  // Log result
  LogService.info(`Collateral evaluation completed for loan ${loanId}: ${isSufficient ? 'Sufficient' : 'Insufficient'} with LTV ${loanToValueRatio.toFixed(2)}`);
  res.json(result);
});

// Evaluate non-accrual risk for a borrower
router.get('/non-accrual/:borrower_id', (req, res) => {
  const borrowerId = req.params.borrower_id;
  
  LogService.info(`Evaluating non-accrual risk for borrower ${borrowerId}`);
  
  try {
    // Load data
    LogService.debug(`Loading data for non-accrual risk assessment for borrower ${borrowerId}`);
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
        non_accrual_risk: "low",
        risk_score: 0,
        risk_factors: ["No loans found for this borrower"],
        recommendations: ["No action required"]
      });
    }
    
    // Get payment history
    const allPayments = [];
    borrowerLoans.forEach(loan => {
      const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
      LogService.debug(`Found ${loanPayments.length} payments for loan ${loan.loan_id}`);
      allPayments.push(...loanPayments);
    });
    
    LogService.debug(`Total payments for all loans: ${allPayments.length}`);
    
    // Calculate non-accrual risk score (simplified algorithm)
    let riskScore = 30; // Base score
    
    // Late payments are a strong indicator
    const latePayments = allPayments.filter(p => p.status === 'Late');
    const lateProportion = allPayments.length > 0 ? latePayments.length / allPayments.length : 0;
    
    LogService.debug(`Late payments: ${latePayments.length}, Proportion: ${lateProportion.toFixed(2)}`);
    
    if (lateProportion > 0.5) riskScore += 50;
    else if (lateProportion > 0.3) riskScore += 30;
    else if (lateProportion > 0.1) riskScore += 15;
    
    // Factor in credit score
    if (borrower.credit_score < 600) riskScore += 20;
    else if (borrower.credit_score < 650) riskScore += 10;
    
    LogService.debug(`Credit score: ${borrower.credit_score}, Initial risk score: ${riskScore}`);
    
    // Cap risk score
    riskScore = Math.max(0, Math.min(100, riskScore));
    
    // Determine risk level
    let riskLevel = "low";
    if (riskScore > 70) riskLevel = "high";
    else if (riskScore > 40) riskLevel = "medium";
    
    // Identify risk factors
    const riskFactors = [];
    if (latePayments.length > 0) {
      riskFactors.push(`${latePayments.length} late payment(s) out of ${allPayments.length} total payments`);
    }
    if (borrower.credit_score < 650) {
      riskFactors.push(`Below average credit score: ${borrower.credit_score}`);
    }
    
    // Generate recommendations
    const recommendations = [];
    if (riskScore > 70) {
      recommendations.push("Implement enhanced monitoring procedures");
      recommendations.push("Consider restructuring loans to reduce default risk");
    } else if (riskScore > 40) {
      recommendations.push("Schedule review of payment patterns");
      recommendations.push("Early intervention to prevent potential issues");
    } else {
      recommendations.push("Standard monitoring procedures are sufficient");
    }
    
    const result = {
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      non_accrual_risk: riskLevel,
      risk_score: riskScore,
      risk_factors: riskFactors,
      recommendations: recommendations
    };
    
    LogService.info(`Non-accrual risk assessment completed for borrower ${borrowerId}: ${riskLevel} (${riskScore})`);
    res.json(result);
  } catch (error) {
    LogService.error(`Error assessing non-accrual risk for borrower ${borrowerId}:`, {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to assess non-accrual risk',
      details: error.message
    });
  }
});

// Get high risk farmers
router.get('/high-risk-farmers', (req, res) => {
  LogService.info('Fetching high-risk farmers');
  
  try {
    // Load data
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    const loans = dataService.loadData(dataService.paths.loans);
    const payments = dataService.loadData(dataService.paths.payments);
    
    // Calculate risk for each borrower (simplified algorithm)
    const borrowersWithRisk = borrowers.map(borrower => {
      // Get borrower's loans
      const borrowerLoans = loans.filter(l => l.borrower_id === borrower.borrower_id);
      
      // Skip borrowers with no loans
      if (borrowerLoans.length === 0) {
        return {
          ...borrower,
          risk_score: 0,
          risk_level: 'low',
          risk_factors: []
        };
      }
      
      // Get payment history
      const allPayments = [];
      borrowerLoans.forEach(loan => {
        const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
        allPayments.push(...loanPayments);
      });
      
      // Calculate risk score (simplified)
      let riskScore = 50; // Base score
      
      // Credit score factor
      if (borrower.credit_score >= 750) riskScore -= 15;
      else if (borrower.credit_score >= 700) riskScore -= 10;
      else if (borrower.credit_score >= 650) riskScore -= 5;
      else if (borrower.credit_score < 600) riskScore += 20;
      
      // Late payments factor
      const latePayments = allPayments.filter(p => p.status === 'Late');
      if (latePayments.length > 3) riskScore += 25;
      else if (latePayments.length > 0) riskScore += latePayments.length * 5;
      
      // Loan to income ratio
      const totalLoanAmount = borrowerLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
      const loanToIncomeRatio = totalLoanAmount / borrower.income;
      if (loanToIncomeRatio > 5) riskScore += 25;
      else if (loanToIncomeRatio > 3) riskScore += 15;
      else if (loanToIncomeRatio > 2) riskScore += 5;
      
      // Cap risk score between 0-100
      riskScore = Math.max(0, Math.min(100, riskScore));
      
      // Risk level
      let riskLevel = 'low';
      if (riskScore > 70) riskLevel = 'high';
      else if (riskScore > 40) riskLevel = 'medium';
      
      // Risk factors
      const riskFactors = [];
      if (latePayments.length > 0) {
        riskFactors.push(`${latePayments.length} late payment(s) in history`);
      }
      if (loanToIncomeRatio > 2) {
        riskFactors.push(`High loan-to-income ratio: ${loanToIncomeRatio.toFixed(1)}`);
      }
      if (borrower.credit_score < 650) {
        riskFactors.push(`Below average credit score: ${borrower.credit_score}`);
      }
      
      return {
        borrower_id: borrower.borrower_id,
        name: `${borrower.first_name} ${borrower.last_name}`,
        farm_type: borrower.farm_type,
        farm_size: borrower.farm_size,
        risk_score: riskScore,
        risk_level: riskLevel,
        risk_factors: riskFactors
      };
    });
    
    // Filter for high risk farmers
    const highRiskFarmers = borrowersWithRisk.filter(b => b.risk_level === 'high');
    
    // Sort by risk score (highest first)
    highRiskFarmers.sort((a, b) => b.risk_score - a.risk_score);
    
    // Log result
    LogService.info(`Found ${highRiskFarmers.length} high risk farmers`);
    
    res.json({
      count: highRiskFarmers.length,
      farmers: highRiskFarmers,
      risk_level: 'high'
    });
  } catch (error) {
    LogService.error('Error fetching high-risk farmers', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to retrieve high-risk farmers', 
      details: error.message 
    });
  }
});

// Evaluate collateral sufficiency
router.get('/collateral-sufficiency/:loan_id', (req, res) => {
  const loanId = req.params.loan_id;
  const marketConditions = req.query.market_conditions || 'stable';
  
  LogService.info(`Evaluating collateral sufficiency for loan ${loanId} with market conditions: ${marketConditions}`);
  
  try {
    // Load data
    const loans = dataService.loadData(dataService.paths.loans);
    const collaterals = dataService.loadData(dataService.paths.collateral);
    
    // Find the loan
    const loan = loans.find(l => l.loan_id === loanId);
    if (!loan) {
      LogService.warn(`Loan not found with ID: ${loanId}`);
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // Get collateral for this loan
    const loanCollateral = collaterals.filter(c => c.loan_id === loanId);
    
    if (loanCollateral.length === 0) {
      LogService.warn(`No collateral found for loan ${loanId}`);
      return res.json({
        loan_id: loanId,
        is_sufficient: false,
        loan_amount: loan.loan_amount,
        collateral_value: 0,
        sufficiency_ratio: 0,
        assessment: "No collateral found for this loan."
      });
    }
    
    // Calculate total collateral value
    const collateralValue = loanCollateral.reduce((sum, c) => sum + c.value, 0);
    
    // Calculate sufficiency ratio (collateral value / loan amount)
    const sufficiencyRatio = collateralValue / loan.loan_amount;
    
    // Determine if collateral is sufficient (typically 1.0 or greater is considered sufficient)
    const isSufficient = sufficiencyRatio >= 1.0;
    
    // Generate assessment
    let assessment = '';
    if (sufficiencyRatio >= 1.5) {
      assessment = "Collateral is highly sufficient with significant equity buffer.";
    } else if (sufficiencyRatio >= 1.2) {
      assessment = "Collateral is adequate with reasonable equity margin.";
    } else if (sufficiencyRatio >= 1.0) {
      assessment = "Collateral is minimally sufficient. Consider monitoring valuations.";
    } else if (sufficiencyRatio >= 0.8) {
      assessment = "Collateral is below recommended levels but close to loan value. Consider requesting additional security.";
    } else {
      assessment = "Insufficient collateral. Loan is under-secured based on current valuations.";
    }
    
    const result = {
      loan_id: loanId,
      is_sufficient: isSufficient,
      loan_amount: loan.loan_amount,
      collateral_value: collateralValue,
      sufficiency_ratio: Number(sufficiencyRatio.toFixed(2)),
      collateral_items: loanCollateral.map(c => ({
        id: c.collateral_id,
        description: c.description,
        value: c.value
      })),
      assessment: assessment
    };
    
    LogService.info(`Collateral sufficiency evaluated for loan ${loanId}: ${isSufficient ? 'Sufficient' : 'Insufficient'} with ratio ${sufficiencyRatio.toFixed(2)}`);
    res.json(result);
  } catch (error) {
    LogService.error(`Error evaluating collateral sufficiency for loan ${loanId}`, { error: error.message });
    res.status(500).json({ 
      error: 'Failed to evaluate collateral sufficiency', 
      details: error.message 
    });
  }
});

module.exports = router; 