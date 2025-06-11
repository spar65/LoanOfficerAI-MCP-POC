/**
 * Simple validation utility for MCP function arguments
 * Perfect for POC - lightweight but effective
 */

function validateRequired(data, requiredFields) {
  const missing = [];
  
  for (const field of requiredFields) {
    // Check if any of the possible field name variants is present
    const camelCase = field;
    const snakeCase = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    const hasField = (data && (
      data[camelCase] !== undefined && data[camelCase] !== null && data[camelCase] !== '' ||
      data[snakeCase] !== undefined && data[snakeCase] !== null && data[snakeCase] !== ''
    ));
    
    if (!hasField) {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    errors: missing.length > 0 ? missing.map(field => ({
      field,
      message: `${field} is required`
    })) : null
  };
}

function validateBorrowerId(borrowerId) {
  // Log the exact value we're validating
  console.log('Validating borrower ID:', borrowerId, 'Type:', typeof borrowerId);
  
  // Basic null/undefined check
  if (!borrowerId || typeof borrowerId !== 'string') {
    return {
      valid: false,
      errors: [{ field: 'borrowerId', message: 'Valid borrower ID is required' }]
    };
  }
  
  // Normalize to uppercase and trim whitespace
  const normalizedId = borrowerId.toString().toUpperCase().trim();
  console.log('Normalized borrower ID:', normalizedId);
  
  // Basic format check (starts with B followed by digits)
  if (!/^B\d+$/.test(normalizedId)) {
    return {
      valid: false,
      errors: [{ field: 'borrowerId', message: 'Borrower ID must be in format B001, B002, etc.' }]
    };
  }
  
  return { valid: true, errors: null, normalized: normalizedId };
}

function validateLoanId(loanId) {
  console.log('Validating loan ID:', loanId, 'Type:', typeof loanId);
  
  if (!loanId || typeof loanId !== 'string') {
    return {
      valid: false,
      errors: [{ field: 'loanId', message: 'Valid loan ID is required' }]
    };
  }
  
  // Normalize and trim
  const normalizedId = loanId.toString().toUpperCase().trim();
  console.log('Normalized loan ID:', normalizedId);
  
  // Basic format check (starts with L followed by digits)
  if (!/^L\d+$/.test(normalizedId)) {
    return {
      valid: false,
      errors: [{ field: 'loanId', message: 'Loan ID must be in format L001, L002, etc.' }]
    };
  }
  
  return { valid: true, errors: null, normalized: normalizedId };
}

function validateTimeHorizon(timeHorizon) {
  const validValues = ['3m', '6m', '1y', 'short_term', 'medium_term', 'long_term'];
  
  if (timeHorizon && !validValues.includes(timeHorizon)) {
    return {
      valid: false,
      errors: [{ field: 'timeHorizon', message: `Time horizon must be one of: ${validValues.join(', ')}` }]
    };
  }
  
  return { valid: true, errors: null };
}

/**
 * Normalize an entity ID by:
 * 1. Converting to uppercase
 * 2. Trimming whitespace
 * 3. Ensuring it's a string
 * 
 * @param {string|number} id - The ID to normalize
 * @returns {string} - Normalized ID
 */
function normalizeId(id) {
  if (id === null || id === undefined) {
    return '';
  }
  
  return id.toString().trim().toUpperCase();
}

/**
 * Validate MCP function arguments against expected schema
 * @param {string} functionName - Name of the MCP function
 * @param {Object} args - Arguments to validate
 * @returns {Object} - Validation result with normalized arguments
 */
function validateMcpArgs(functionName, args) {
  // Default to valid
  const result = {
    valid: true,
    errors: [],
    normalized: null
  };
  
  // Return early if args are missing
  if (!args) {
    result.valid = false;
    result.errors.push({
      field: 'all',
      message: 'Missing arguments'
    });
    return result;
  }
  
  // Normalize common IDs based on function
  switch (functionName) {
    case 'getBorrowerDetails':
    case 'getBorrowerDefaultRisk':
    case 'getBorrowerNonAccrualRisk':
    case 'getLoansByBorrower':
      // Normalize borrower ID
      const borrowerId = args.borrowerId || args.borrower_id;
      if (!borrowerId) {
        result.valid = false;
        result.errors.push({
          field: 'borrower_id',
          message: 'Borrower ID is required'
        });
      } else {
        result.normalized = normalizeId(borrowerId);
      }
      break;
      
    case 'getLoanDetails':
    case 'getLoanStatus':
    case 'evaluateCollateralSufficiency':
      // Normalize loan ID
      const loanId = args.loanId || args.loan_id;
      if (!loanId) {
        result.valid = false;
        result.errors.push({
          field: 'loan_id',
          message: 'Loan ID is required'
        });
      } else {
        result.normalized = normalizeId(loanId);
      }
      break;
  }
  
  return result;
}

module.exports = {
  validateRequired,
  validateBorrowerId,
  validateLoanId,
  validateTimeHorizon,
  normalizeId,
  validateMcpArgs
}; 