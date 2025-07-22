# README-12c-EXCUTIVE-MCP-BUSINESS-SPEC.md

## Tier 1 MCP Agents: Detailed Requirements Specifications

Below is a restated and organized requirements document for the 5 Tier 1 MCP Agents, based on the provided README documents (e.g., architecture from README-02, AI integration from README-05, DB strategy from README-07, advanced dev guide from README-11, testing from README-08, and MCP-DB flows from README-15 series). Each agent extends existing MCP patterns: OpenAI-compatible schemas for validation; server-side execution with DB queries (SQL Server exclusive, no fallback); logging/monitoring; and integration with the MCP registry. Specs emphasize high-ROI focus on default prevention, timely payments, and dual success (bank/farmer), aligned with FCBT's low-default context.

### 1. Predictive Default Monitor MCP

**Overview**: Extends `getBorrowerDefaultRisk`/`getHighRiskFarmers` for proactive forecasting using ML on payments, farmer data, and externalities. Targets 20-30% default reduction in low-rate environments (e.g., FCBT's 0.20% baseline).

**Functionality Specs**:

- Predicts default probability (3-12 months) with confidence scores.
- Analyzes: Payment history, cash flow, external risks (e.g., commodity drops).
- Outputs: Risk score (0-1), factors array (e.g., "Missed payments: 2/12"), recommendations (e.g., "Extend grace period").
- Inputs: Borrower ID (string, required), horizon (months, default: 6), include_externals (bool, default: true).
- Outputs: JSON {risk_score: float, factors: array, recommendations: array}.

**Integration Requirements**:

- MCP Registry: Register as schema (name: "predictiveDefaultMonitor"); handler executes ML + DB query (repository pattern).
- DB Service: Joins Borrowers/Loans/Payments; add ML features (CTE for aggregation).
- OpenAI Proxy: Two-phase (call → execution → formatting).
- Logging/Monitoring: 'mcp' level for calls; Prometheus for duration/success.

**Key Questions**: "What signals 3-6 month defaults?" "How to intervene for this farmer?"

**ROI Justification**: 20-30% reduction (Zest AI, 2025); $75K savings/$10M portfolio (Oraczen, 2025). High: Frees reserves in FCBT-like portfolios ($7.5M annual upside).

**Technical Specs**:

- AI Model: Random forests/ML; train on historical data (migration scripts).
- Data Sources: Internal DB + alt (weather APIs).
- Compliance: Bias checks (ECOA); explainable outputs (FCA).
- Performance: <200ms response; scale to 100 concurrent (pool max:10).

**Testing & Deployment**: 100% unit/integration; pilot on high-risk loans; Docker microservice.

### 2. Collateral & Land Valuator MCP

**Overview**: Builds on `evaluateCollateralSufficiency` for real-time valuation via satellite/IoT, updating LTV ratios for Southeast volatility (e.g., post-hurricane).

**Functionality Specs**:

- Valuates land/equipment; computes LTV.
- Factors: Crop health, soil, market comps.
- Outputs: Valuation ($), confidence (%), changes (e.g., "10% drop due to drought").
- Inputs: Asset ID (string, required), valuation_date (date, default: current), include_satellite (bool, default: true).
- Outputs: JSON {valuation: float, ltv_ratio: float, factors: array}.

**Integration Requirements**:

- MCP Registry: Schema with asset params; handler fetches alt data + DB collateral.
- DB Service: Query Collateral; join Loans for LTV (parameterized queries).
- OpenAI Proxy: Call → External API + DB → Format.
- Logging/Monitoring: Track API calls; metrics for accuracy.

**Key Questions**: "Current farmland value amid weather risks?" "Is collateral sufficient post-event?"

**ROI Justification**: 20% accuracy gain (Auburn, 2024); $100K avoidance in over-lending (EOS, 2023). High: Reduces FCBT-like exposure ($1.3B hurricane losses).

**Technical Specs**:

- AI Model: CNN for imagery; EOS/SatSure APIs.
- Data Sources: Satellite + Collateral DB.
- Compliance: Transparent valuations (ECOA); audit logs (FCA).
- Performance: <500ms with caching.

**Testing & Deployment**: E2E for alt data; dashboard slider integration.

### 3. Weather Impact Analyzer MCP

**Overview**: Extends planned `assessCropYieldRisk` for weather risk assessment, using FCBT-like data for parametric adjustments in hurricanes.

**Functionality Specs**:

- Analyzes forecast impacts on loans (e.g., yield drops).
- Simulates scenarios (drought/flood).
- Outputs: Impact score (0-1), mitigations (e.g., "Delay payment 30 days").
- Inputs: Loan ID (string, required), forecast_horizon (days, default: 90), severity_threshold (float, default: 0.5).
- Outputs: JSON {impact_score: float, scenarios: array, mitigations: array}.

**Integration Requirements**:

- MCP Registry: Schema for weather params; handler pulls NOAA + DB.
- DB Service: Join Loans/Borrowers with weather CTEs.
- OpenAI Proxy: Call → API/DB → Scenario format.
- Logging/Monitoring: Alert on high impacts; duration metrics.

**Key Questions**: "Hurricane effects on this loan?" "How to mitigate weather risks?"

**ROI Justification**: 20-40% exposure cut (Munich Re, 2025); $100K claims avoidance (GSMA, 2024). Very High: Addresses Southeast volatility (FCBT pilots).

**Technical Specs**:

- AI Model: Time-series ML (LSTM); NOAA/DTN APIs.
- Data Sources: Weather APIs + DB farm locations.
- Compliance: Risk disclosures (FCA); bias-free (ECOA).
- Performance: <200ms queries.

**Testing & Deployment**: Integration for APIs; phased ACA pilots.

### 4. Cash Flow Predictor MCP

**Overview**: Enhances `analyzePaymentPatterns` for repayment forecasting, aligning with FCBT modeling for seasonal farming.

**Functionality Specs**:

- Predicts cash flows from payments/revenues/cycles.
- Flags mismatches (e.g., "Harvest delay: High").
- Outputs: Monthly forecast array, repayment probability (%), adjustments.
- Inputs: Borrower ID (string, required), prediction_horizon (months, default: 12), include_seasonal (bool, default: true).
- Outputs: JSON {forecast: array, repayment_prob: float, adjustments: array}.

**Integration Requirements**:

- MCP Registry: Schema for temporal params; handler runs ML on DB.
- DB Service: Aggregate Payments/Borrowers with time-series.
- OpenAI Proxy: Call → Prediction → Adjustment format.
- Logging/Monitoring: Track forecast accuracy.

**Key Questions**: "Align payments with cycles?" "What patterns predict issues?"

**ROI Justification**: 15-25% on-time boost (Conduent, 2025); $50K retention (Kyriba, 2025). High: Supports FCBT debt ratios.

**Technical Specs**:

- AI Model: ARIMA/LSTM; train on DB payments.
- Data Sources: Internal Payments + revenues.
- Compliance: Transparent predictions (ECOA); audit logs (FCA).
- Performance: <500ms with pooling.

**Testing & Deployment**: Unit for forecasts; ACA pilots.

### 5. Regulatory Compliance Assistant MCP

**Overview**: New for AI audits, ensuring FCA/ECOA compliance (e.g., bias checks) in decisions.

**Functionality Specs**:

- Scans MCP outputs for compliance (fair lending, explainability).
- Flags issues (e.g., "Bias in scoring").
- Outputs: Compliance score (0-1), issues array, remediations.
- Inputs: MCP_call_id (string, required), check_types (array, default: ["bias", "transparency"]).
- Outputs: JSON {compliance_score: float, issues: array, remediations: array}.

**Integration Requirements**:

- MCP Registry: Schema for audit params; handler reviews logs/DB.
- DB Service: Query AuditLog for decisions.
- OpenAI Proxy: Post-call audit → Report format.
- Logging/Monitoring: Meta-logs for audits.

**Key Questions**: "Compliant with FCA/ECOA?" "How to address bias?"

**ROI Justification**: 50% costs down (BoE/FCA, 2024); avoids $200K fines (CFPB, 2023). Moderate: Essential for FCBT caution.

**Technical Specs**:

- AI Model: Rule-based + ML for bias.
- Data Sources: MCP logs/DB audits.
- Compliance: Built-in ECOA/FCA checks.
- Performance: <200ms scans.

**Testing & Deployment**: Compliance tests; FCA reviews.
