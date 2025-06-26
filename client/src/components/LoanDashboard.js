import React, { useState } from 'react';
import { useMcpFunction } from '../hooks/useMcpFunction';

/**
 * Loan Dashboard Component
 * 
 * Displays loan portfolio summary and active loans
 */
export default function LoanDashboard() {
  const [selectedLoanId, setSelectedLoanId] = useState('');
  
  // Fetch portfolio summary
  const {
    data: portfolioSummary,
    error: summaryError,
    isLoading: summaryLoading,
    refresh: refreshSummary,
    fromCache: summaryFromCache
  } = useMcpFunction('getLoanSummary', {}, {
    enableCache: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    maxRetries: 2
  });

  // Fetch active loans
  const {
    data: activeLoans,
    error: loansError,
    isLoading: loansLoading,
    refresh: refreshLoans
  } = useMcpFunction('getActiveLoans', {}, {
    enableCache: true,
    cacheTimeout: 2 * 60 * 1000, // 2 minutes
    maxRetries: 2
  });

  // Fetch selected loan status (only when a loan is selected)
  const {
    data: loanStatus,
    error: statusError,
    isLoading: statusLoading,
    refresh: refreshStatus
  } = useMcpFunction('getLoanStatus', 
    { loan_id: selectedLoanId },
    {
      enableCache: true,
      cacheTimeout: 60 * 1000, // 1 minute
      maxRetries: 2,
      manual: !selectedLoanId // Don't auto-execute if no loan selected
    }
  );

  // Handle refresh all data
  const handleRefreshAll = () => {
    refreshSummary();
    refreshLoans();
    if (selectedLoanId) {
      refreshStatus();
    }
  };

  // Handle loan selection
  const handleLoanSelect = (loanId) => {
    setSelectedLoanId(loanId);
  };

  return (
    <div className="loan-dashboard">
      <div className="dashboard-header">
        <h1>Loan Portfolio Dashboard</h1>
        <div className="actions">
          <button 
            onClick={handleRefreshAll}
            disabled={summaryLoading || loansLoading || statusLoading}
          >
            {(summaryLoading || loansLoading || statusLoading) ? 'Refreshing...' : 'Refresh All'}
          </button>
        </div>
      </div>

      {/* Portfolio Summary Section */}
      <section className="summary-section">
        <h2>Portfolio Summary {summaryFromCache && <span className="cached-badge">Cached</span>}</h2>
        
        {summaryError ? (
          <div className="error-alert">
            <p>Failed to load portfolio summary: {summaryError.message}</p>
            <button onClick={refreshSummary}>Retry</button>
          </div>
        ) : summaryLoading ? (
          <div className="loading-indicator">Loading portfolio summary...</div>
        ) : portfolioSummary ? (
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Loans</h3>
              <p className="metric">{portfolioSummary.total_loans}</p>
            </div>
            <div className="summary-card">
              <h3>Active Loans</h3>
              <p className="metric">{portfolioSummary.active_loans}</p>
            </div>
            <div className="summary-card">
              <h3>Total Amount</h3>
              <p className="metric">
                ${portfolioSummary.total_loan_amount?.toLocaleString()}
              </p>
            </div>
            <div className="summary-card">
              <h3>Avg Interest Rate</h3>
              <p className="metric">{portfolioSummary.average_interest_rate}%</p>
            </div>
          </div>
        ) : (
          <p>No portfolio data available</p>
        )}
        
        {portfolioSummary?.data_freshness && (
          <div className="data-freshness">
            Last updated: {new Date(portfolioSummary.data_freshness.last_data_refresh).toLocaleString()}
            {portfolioSummary.data_freshness.data_age_minutes > 60 && (
              <span className="stale-data-warning"> (Data may be stale)</span>
            )}
          </div>
        )}
      </section>

      {/* Active Loans Section */}
      <section className="loans-section">
        <h2>Active Loans</h2>
        
        {loansError ? (
          <div className="error-alert">
            <p>Failed to load active loans: {loansError.message}</p>
            <button onClick={refreshLoans}>Retry</button>
          </div>
        ) : loansLoading ? (
          <div className="loading-indicator">Loading active loans...</div>
        ) : activeLoans && activeLoans.length > 0 ? (
          <div className="loans-table-container">
            <table className="loans-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Borrower</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map(loan => (
                  <tr 
                    key={loan.loan_id} 
                    className={selectedLoanId === loan.loan_id ? 'selected-row' : ''}
                  >
                    <td>{loan.loan_id}</td>
                    <td>{loan.borrower_name || loan.borrower_id}</td>
                    <td>${loan.loan_amount?.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge status-${loan.status.toLowerCase()}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleLoanSelect(loan.loan_id)}
                        className="view-details-btn"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No active loans found</p>
        )}
      </section>

      {/* Selected Loan Details */}
      {selectedLoanId && (
        <section className="loan-details-section">
          <h2>Loan Details: {selectedLoanId}</h2>
          
          {statusError ? (
            <div className="error-alert">
              <p>Failed to load loan status: {statusError.message}</p>
              <button onClick={refreshStatus}>Retry</button>
            </div>
          ) : statusLoading ? (
            <div className="loading-indicator">Loading loan details...</div>
          ) : loanStatus ? (
            <div className="loan-details-card">
              <div className="detail-row">
                <span className="detail-label">Loan ID:</span>
                <span className="detail-value">{loanStatus.loan_id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`detail-value status-${loanStatus.status.toLowerCase()}`}>
                  {loanStatus.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">
                  {new Date(loanStatus.last_updated).toLocaleString()}
                </span>
              </div>
              
              {loanStatus.status_history && loanStatus.status_history.length > 0 && (
                <div className="status-history">
                  <h3>Status History</h3>
                  <ul>
                    {loanStatus.status_history.map((entry, index) => (
                      <li key={index}>
                        {entry.status} - {new Date(entry.date).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="detail-actions">
                <button onClick={refreshStatus}>Refresh</button>
                <button onClick={() => setSelectedLoanId('')}>Close</button>
              </div>
            </div>
          ) : (
            <p>No loan details available</p>
          )}
        </section>
      )}
      
      {/* CSS Styles */}
      <style jsx>{`
        .loan-dashboard {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .actions button {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .actions button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
        
        section {
          margin-bottom: 30px;
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }
        
        .summary-card {
          background-color: #f8fafc;
          border-radius: 6px;
          padding: 16px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        
        .summary-card h3 {
          margin: 0;
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }
        
        .metric {
          font-size: 24px;
          font-weight: 600;
          margin: 10px 0 0;
          color: #0f172a;
        }
        
        .loans-table-container {
          overflow-x: auto;
          margin-top: 20px;
        }
        
        .loans-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .loans-table th {
          text-align: left;
          padding: 12px 16px;
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          color: #64748b;
          font-weight: 500;
        }
        
        .loans-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .loans-table tr:hover {
          background-color: #f1f5f9;
        }
        
        .selected-row {
          background-color: #eff6ff !important;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-active {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .status-pending {
          background-color: #fef9c3;
          color: #854d0e;
        }
        
        .status-closed {
          background-color: #e2e8f0;
          color: #475569;
        }
        
        .status-default {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .view-details-btn {
          background-color: transparent;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .view-details-btn:hover {
          background-color: #f1f5f9;
        }
        
        .error-alert {
          background-color: #fee2e2;
          border-left: 4px solid #b91c1c;
          padding: 12px 16px;
          margin: 16px 0;
          border-radius: 4px;
        }
        
        .error-alert p {
          margin: 0 0 8px;
          color: #7f1d1d;
        }
        
        .error-alert button {
          background-color: #b91c1c;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .loading-indicator {
          padding: 20px;
          text-align: center;
          color: #64748b;
        }
        
        .loan-details-card {
          background-color: #f8fafc;
          border-radius: 6px;
          padding: 20px;
          margin-top: 16px;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 12px;
        }
        
        .detail-label {
          width: 120px;
          font-weight: 500;
          color: #64748b;
        }
        
        .detail-value {
          flex: 1;
        }
        
        .status-history {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
        
        .status-history h3 {
          font-size: 16px;
          margin: 0 0 12px;
        }
        
        .status-history ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .status-history li {
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .detail-actions {
          display: flex;
          gap: 8px;
          margin-top: 20px;
        }
        
        .detail-actions button {
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .detail-actions button:first-child {
          background-color: #2563eb;
          color: white;
          border: none;
        }
        
        .detail-actions button:last-child {
          background-color: transparent;
          border: 1px solid #cbd5e1;
        }
        
        .cached-badge {
          font-size: 12px;
          background-color: #dbeafe;
          color: #1e40af;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 8px;
          vertical-align: middle;
        }
        
        .data-freshness {
          font-size: 12px;
          color: #64748b;
          margin-top: 16px;
          text-align: right;
        }
        
        .stale-data-warning {
          color: #b91c1c;
        }
      `}</style>
    </div>
  );
} 