# HitList: Remove JSON Fallback from Codebase

## Problem Statement

The documentation incorrectly showed that the system has a JSON fallback mechanism when the SQL database is unavailable. This is NOT the intended behavior - the system should ONLY use SQL Server with no fallback options.

## Current State Analysis

The codebase contains legacy JSON fallback code that needs to be removed to ensure:

1. System always requires database connection
2. No confusion about data sources
3. Clear error handling when database is unavailable

## Files Requiring Changes

### 1. server/services/mcpDatabaseService.js

**Current Issue**: Contains fallback to dataService when database is not available
**Required Changes**:

- Remove all references to dataService
- Remove fallback logic in query methods
- Ensure proper error throwing when database is unavailable
- Update error messages to be clear about database requirement

### 2. server/mcp/server.js

**Current Issue**: May contain initialization logic that allows JSON fallback
**Required Changes**:

- Ensure database connection is required at startup
- Remove any JSON data loading logic
- Update initialization to fail fast if database unavailable

### 3. server/services/dataService.js

**Current Issue**: Provides JSON file reading as a service
**Required Changes**:

- Evaluate if this service is needed at all
- If kept, ensure it's ONLY used for test data, not production
- Add clear warnings/comments about non-production use

### 4. Test Files

**Files to Review**:

- All test files that might be using JSON data
- Mock data files in tests/mock-data/
  **Required Changes**:
- Ensure tests use proper database mocking
- Keep JSON files ONLY for test fixtures
- Update test setup to be clear about test vs production data

## Implementation Steps

### Step 1: Update mcpDatabaseService.js

```javascript
// Remove this pattern:
if (!pool) {
  return dataService.getAllBorrowers();
}

// Replace with:
if (!pool) {
  throw new Error(
    "Database connection required. Please ensure SQL Server is running and properly configured."
  );
}
```

### Step 2: Update Error Handling

- All database methods should throw clear errors
- No silent fallbacks
- Error messages should guide users to fix database connection

### Step 3: Update server.js Initialization

- Add database connection check at startup
- Fail fast if database unavailable
- Clear console messages about database requirement

### Step 4: Update Documentation

- Remove any references to JSON fallback in README files
- Update setup guides to emphasize database requirement
- Add troubleshooting section for database connection issues

### Step 5: Testing Strategy

- Test that system properly fails without database
- Test error messages are helpful
- Ensure no accidental fallbacks remain

## Validation Checklist

- [ ] mcpDatabaseService.js only uses SQL queries
- [ ] No imports of dataService in production code
- [ ] Server startup fails without database
- [ ] All error messages mention database requirement
- [ ] Documentation accurately reflects SQL-only architecture
- [ ] Tests use proper mocking, not production fallback

## Risk Assessment

- **Low Risk**: Changes are removing fallback, not core functionality
- **Testing Required**: Extensive testing of error paths
- **User Impact**: Users must have database configured (as intended)

## Timeline

- Estimated effort: 4-6 hours
- Testing: 2-3 hours
- Documentation updates: 1 hour

## Success Criteria

1. System requires database connection to start
2. No JSON fallback code in production paths
3. Clear error messages when database unavailable
4. Documentation accurately reflects implementation
5. All tests pass with new structure
