/**
 * Tests for utility functions
 * These are pure functions that don't rely on external dependencies
 */

// Define the utility functions to test
const utils = {
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },
  
  calculateMonthlyPayment: (principal, rate, termMonths) => {
    const monthlyRate = rate / 100 / 12;
    return principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / 
           (Math.pow(1 + monthlyRate, termMonths) - 1);
  },
  
  calculateTotalInterest: (principal, monthlyPayment, termMonths) => {
    return (monthlyPayment * termMonths) - principal;
  },
  
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },
  
  getFullName: (firstName, lastName) => {
    return `${firstName} ${lastName}`;
  }
};

describe('Utility Functions', () => {
  test('formatCurrency formats amount correctly', () => {
    expect(utils.formatCurrency(1000)).toBe('$1,000.00');
    expect(utils.formatCurrency(1234.56)).toBe('$1,234.56');
    expect(utils.formatCurrency(0)).toBe('$0.00');
  });
  
  test('calculateMonthlyPayment calculates correctly', () => {
    // $100,000 loan at 5% for 30 years (360 months)
    const payment = utils.calculateMonthlyPayment(100000, 5, 360);
    expect(payment).toBeCloseTo(536.82, 1); // Monthly payment of approximately $536.82
  });
  
  test('calculateTotalInterest calculates correctly', () => {
    // For a $100,000 loan with monthly payments of $536.82 for 360 months
    const totalInterest = utils.calculateTotalInterest(100000, 536.82, 360);
    expect(totalInterest).toBeCloseTo(93255.20, 1); // Total interest of approximately $93,255.20
  });
  
  test('formatDate formats date correctly', () => {
    // Note: Since toLocaleDateString may give different results in different time zones,
    // we'll just make sure it produces a string that contains the expected year and month
    const jan2023 = utils.formatDate('2023-01-15');
    expect(jan2023).toMatch(/January/);
    expect(jan2023).toMatch(/2023/);
    
    const dec2022 = utils.formatDate('2022-12-25');
    expect(dec2022).toMatch(/December/);
    expect(dec2022).toMatch(/2022/);
  });
  
  test('getFullName combines names correctly', () => {
    expect(utils.getFullName('John', 'Doe')).toBe('John Doe');
    expect(utils.getFullName('Jane', 'Smith')).toBe('Jane Smith');
    expect(utils.getFullName('', '')).toBe(' ');
  });
}); 