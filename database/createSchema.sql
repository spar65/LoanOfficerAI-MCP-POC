-- Enhanced Database Schema for MCP Loan Management System

-- Core Tables (Enhanced from Original)

-- Users table with MCP enhancements
CREATE TABLE Users (
    id NVARCHAR(50) PRIMARY KEY,
    username NVARCHAR(50) UNIQUE NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    passwordHash NVARCHAR(100) NOT NULL,
    firstName NVARCHAR(50),
    lastName NVARCHAR(50),
    role NVARCHAR(50) DEFAULT 'loan_officer',
    tenantId NVARCHAR(50) NOT NULL,
    active BIT DEFAULT 1,
    lastLogin DATETIME,
    preferredAIModel NVARCHAR(50) DEFAULT 'claude-sonnet-4',
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Borrowers with calculated AI fields
CREATE TABLE Borrowers (
    borrower_id NVARCHAR(50) PRIMARY KEY,
    first_name NVARCHAR(50) NOT NULL,
    last_name NVARCHAR(50) NOT NULL,
    address NVARCHAR(255),
    phone NVARCHAR(20),
    email NVARCHAR(100),
    credit_score INT CHECK (credit_score >= 300 AND credit_score <= 850),
    income DECIMAL(15,2),
    farm_size INT,
    farm_type NVARCHAR(50),
    debt_to_income_ratio DECIMAL(5,2),
    risk_score DECIMAL(5,2),
    ai_risk_assessment NVARCHAR(MAX), -- JSON field for AI analysis
    last_risk_update DATETIME,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Loans with enhanced tracking
CREATE TABLE Loans (
    loan_id NVARCHAR(50) PRIMARY KEY,
    borrower_id NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Borrowers(borrower_id),
    loan_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    term_length INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    loan_type NVARCHAR(50),
    payment_history_score DECIMAL(5,2),
    ai_approval_recommendation NVARCHAR(MAX), -- JSON field
    ai_confidence_score DECIMAL(5,2),
    underwriter_override BIT DEFAULT 0,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Enhanced Equipment tracking
CREATE TABLE Equipment (
    equipment_id NVARCHAR(50) PRIMARY KEY,
    borrower_id NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Borrowers(borrower_id),
    type NVARCHAR(50) NOT NULL,
    purchase_date DATE,
    condition NVARCHAR(20),
    purchase_price DECIMAL(15,2),
    current_value DECIMAL(15,2),
    depreciation_rate DECIMAL(5,2),
    maintenance_cost_ytd DECIMAL(15,2) DEFAULT 0,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- New MCP-Specific Tables

-- Track AI conversations and interactions
CREATE TABLE MCPConversations (
    conversation_id NVARCHAR(50) PRIMARY KEY,
    user_id NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Users(id),
    session_id NVARCHAR(100),
    context_type NVARCHAR(50), -- 'loan_analysis', 'risk_assessment', 'payment_review'
    context_id NVARCHAR(50), -- ID of the loan, borrower, etc.
    model_used NVARCHAR(50),
    started_at DATETIME DEFAULT GETDATE(),
    ended_at DATETIME,
    total_tokens INT DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'active'
);

-- Store AI-generated insights and recommendations
CREATE TABLE AIRecommendations (
    recommendation_id NVARCHAR(50) PRIMARY KEY,
    conversation_id NVARCHAR(50) FOREIGN KEY REFERENCES MCPConversations(conversation_id),
    target_type NVARCHAR(50), -- 'loan', 'borrower', 'equipment'
    target_id NVARCHAR(50),
    recommendation_type NVARCHAR(50), -- 'approval', 'denial', 'risk_mitigation', 'payment_plan'
    recommendation_text NVARCHAR(MAX),
    confidence_score DECIMAL(5,2),
    reasoning NVARCHAR(MAX), -- JSON field with AI reasoning
    implemented BIT DEFAULT 0,
    implemented_by NVARCHAR(50),
    implemented_at DATETIME,
    createdAt DATETIME DEFAULT GETDATE()
);

-- Audit trail for all AI decisions and human overrides
CREATE TABLE AuditLog (
    audit_id NVARCHAR(50) PRIMARY KEY,
    user_id NVARCHAR(50) FOREIGN KEY REFERENCES Users(id),
    action_type NVARCHAR(50), -- 'ai_recommendation', 'human_override', 'data_change'
    target_table NVARCHAR(50),
    target_id NVARCHAR(50),
    old_values NVARCHAR(MAX), -- JSON
    new_values NVARCHAR(MAX), -- JSON
    ai_involved BIT DEFAULT 0,
    confidence_score DECIMAL(5,2),
    reason NVARCHAR(MAX),
    timestamp DATETIME DEFAULT GETDATE()
);

-- Store loan analysis results from AI
CREATE TABLE LoanAnalysis (
    analysis_id NVARCHAR(50) PRIMARY KEY,
    loan_id NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Loans(loan_id),
    analysis_type NVARCHAR(50), -- 'initial_assessment', 'periodic_review', 'default_risk'
    risk_factors NVARCHAR(MAX), -- JSON array of risk factors
    approval_probability DECIMAL(5,2),
    recommended_interest_rate DECIMAL(5,2),
    recommended_terms NVARCHAR(MAX), -- JSON
    collateral_assessment NVARCHAR(MAX), -- JSON
    model_version NVARCHAR(50),
    analyzed_at DATETIME DEFAULT GETDATE(),
    expires_at DATETIME
);

-- Enhanced collateral tracking
CREATE TABLE Collateral (
    collateral_id NVARCHAR(50) PRIMARY KEY,
    loan_id NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Loans(loan_id),
    description NVARCHAR(255),
    value DECIMAL(15,2),
    appraised_value DECIMAL(15,2),
    appraisal_date DATE,
    depreciation_rate DECIMAL(5,2),
    current_condition NVARCHAR(50),
    ai_valuation DECIMAL(15,2),
    ai_valuation_confidence DECIMAL(5,2),
    last_ai_valuation_date DATETIME,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Enhanced payments with AI analysis
CREATE TABLE Payments (
    payment_id NVARCHAR(50) PRIMARY KEY,
    loan_id NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Loans(loan_id),
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    payment_method NVARCHAR(50),
    late_fee DECIMAL(15,2) DEFAULT 0,
    days_late INT DEFAULT 0,
    ai_risk_flag BIT DEFAULT 0,
    ai_risk_reason NVARCHAR(MAX),
    createdAt DATETIME DEFAULT GETDATE()
);

-- Enhanced maintenance records
CREATE TABLE MaintenanceRecords (
    record_id INT PRIMARY KEY IDENTITY(1,1),
    equipment_id NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Equipment(equipment_id),
    date DATE NOT NULL,
    type NVARCHAR(50),
    cost DECIMAL(15,2),
    description NVARCHAR(MAX),
    predicted_next_maintenance DATE,
    ai_maintenance_score DECIMAL(5,2),
    createdAt DATETIME DEFAULT GETDATE()
);

-- Performance Indexes for MCP operations
CREATE INDEX IX_Loans_Status_Date ON Loans(status, start_date);
CREATE INDEX IX_Loans_BorrowerId_Status ON Loans(borrower_id, status);
CREATE INDEX IX_Payments_LoanId_Date ON Payments(loan_id, payment_date DESC);
CREATE INDEX IX_Payments_Status_Date ON Payments(status, payment_date);
CREATE INDEX IX_AIRecommendations_Target ON AIRecommendations(target_type, target_id);
CREATE INDEX IX_MCPConversations_User_Context ON MCPConversations(user_id, context_type, started_at DESC);
CREATE INDEX IX_AuditLog_User_Time ON AuditLog(user_id, timestamp DESC);
CREATE INDEX IX_LoanAnalysis_Loan_Type ON LoanAnalysis(loan_id, analysis_type, analyzed_at DESC);
CREATE INDEX IX_Borrowers_Risk_Score ON Borrowers(risk_score DESC);
CREATE INDEX IX_Equipment_Borrower_Value ON Equipment(borrower_id, current_value DESC); 