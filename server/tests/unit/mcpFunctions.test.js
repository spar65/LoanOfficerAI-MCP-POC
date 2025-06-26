const { expect } = require('chai');
const sinon = require('sinon');
const mcpFunctionRegistry = require('../../services/mcpFunctionRegistry');
const dataService = require('../../services/dataService');

describe('MCP Function Registry', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getLoanStatus Function', () => {
    it('should return loan status for valid loan ID', async () => {
      // Arrange
      const mockLoans = [
        { 
          loan_id: 'L001', 
          status: 'Active', 
          last_updated: '2024-01-01',
          borrower_id: 'B001',
          loan_amount: 50000,
          interest_rate: 3.5
        }
      ];
      sandbox.stub(dataService, 'loadData').returns(mockLoans);

      // Act
      const result = await mcpFunctionRegistry.executeFunction('getLoanStatus', {
        loan_id: 'L001'
      });

      // Assert
      expect(result.success).to.be.true;
      expect(result.data.loan_id).to.equal('L001');
      expect(result.data.status).to.equal('Active');
      expect(result.data).to.have.property('last_updated');
      expect(result.data).to.have.property('status_history');
    });

    it('should handle non-existent loan ID', async () => {
      // Arrange
      sandbox.stub(dataService, 'loadData').returns([]);

      // Act
      const result = await mcpFunctionRegistry.executeFunction('getLoanStatus', {
        loan_id: 'NONEXISTENT'
      });

      // Assert
      expect(result.success).to.be.false;
      expect(result.error.message).to.include('not found');
    });

    it('should handle missing loan_id parameter', async () => {
      // Act
      const result = await mcpFunctionRegistry.executeFunction('getLoanStatus', {});

      // Assert
      expect(result.success).to.be.false;
      expect(result.error.message).to.include('required');
    });
  });

  describe('getLoanSummary Function', () => {
    it('should return portfolio summary with correct calculations', async () => {
      // Arrange
      const mockLoans = [
        { loan_id: 'L001', status: 'Active', loan_amount: 50000, interest_rate: 3.5, last_updated: '2023-12-01' },
        { loan_id: 'L002', status: 'Active', loan_amount: 30000, interest_rate: 4.0, last_updated: '2023-12-15' },
        { loan_id: 'L003', status: 'Pending', loan_amount: 20000, interest_rate: 3.0, last_updated: '2024-01-05' },
        { loan_id: 'L004', status: 'Closed', loan_amount: 40000, interest_rate: 3.8, last_updated: '2023-11-20' }
      ];
      sandbox.stub(dataService, 'loadData').returns(mockLoans);

      // Act
      const result = await mcpFunctionRegistry.executeFunction('getLoanSummary', {});

      // Assert
      expect(result.success).to.be.true;
      expect(result.data.total_loans).to.equal(4);
      expect(result.data.active_loans).to.equal(2);
      expect(result.data.pending_loans).to.equal(1);
      expect(result.data.closed_loans).to.equal(1);
      expect(result.data.total_loan_amount).to.equal(140000);
      expect(result.data.average_interest_rate).to.be.closeTo(3.58, 0.01);
      expect(result.data).to.have.property('summary_generated_at');
      expect(result.data).to.have.property('portfolio_health');
      expect(result.data.portfolio_health).to.have.property('default_rate');
      expect(result.data.portfolio_health).to.have.property('active_rate');
      expect(result.data).to.have.property('data_freshness');
    });

    it('should handle empty loan portfolio', async () => {
      // Arrange
      sandbox.stub(dataService, 'loadData').returns([]);

      // Act
      const result = await mcpFunctionRegistry.executeFunction('getLoanSummary', {});

      // Assert
      expect(result.success).to.be.true;
      expect(result.data.total_loans).to.equal(0);
      expect(result.data.message).to.include('No loan data available');
    });
  });

  describe('getActiveLoans Function', () => {
    it('should return only active loans', async () => {
      // Arrange
      const mockLoans = [
        { loan_id: 'L001', status: 'Active', loan_amount: 50000 },
        { loan_id: 'L002', status: 'Active', loan_amount: 30000 },
        { loan_id: 'L003', status: 'Pending', loan_amount: 20000 },
        { loan_id: 'L004', status: 'Closed', loan_amount: 40000 }
      ];
      sandbox.stub(dataService, 'loadData').returns(mockLoans);

      // Act
      const result = await mcpFunctionRegistry.executeFunction('getActiveLoans', {});

      // Assert
      expect(result.success).to.be.true;
      expect(result.data).to.be.an('array');
      expect(result.data.length).to.equal(2);
      expect(result.data.every(loan => loan.status === 'Active')).to.be.true;
      expect(result.data.map(loan => loan.loan_id)).to.include.members(['L001', 'L002']);
    });

    it('should return empty array when no active loans exist', async () => {
      // Arrange
      const mockLoans = [
        { loan_id: 'L003', status: 'Pending', loan_amount: 20000 },
        { loan_id: 'L004', status: 'Closed', loan_amount: 40000 }
      ];
      sandbox.stub(dataService, 'loadData').returns(mockLoans);

      // Act
      const result = await mcpFunctionRegistry.executeFunction('getActiveLoans', {});

      // Assert
      expect(result.success).to.be.true;
      expect(result.data).to.be.an('array');
      expect(result.data.length).to.equal(0);
    });
  });
}); 