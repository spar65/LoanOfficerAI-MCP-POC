# Testing Duplication Issues

## Overview

This document tracks testing files that appear to be duplicates or need better organization in the LoanOfficerAI-MCP-POC project.

## Analysis of Test Files

| Test File                             | Already in Client/Server Tests? | Issues                                                                 | Recommendation |
| ------------------------------------- | ------------------------------- | ---------------------------------------------------------------------- | -------------- |
| run-logging-tests.sh                  | No                              | Shell script for running logging tests, not in standard test framework | Move to BKUP   |
| run-unified-tests-improved.js         | No                              | Improved version of run-unified-tests.js, not integrated with Jest     | Move to BKUP   |
| run-unified-tests.js                  | No                              | Standalone test runner, not integrated with Jest                       | Move to BKUP   |
| server.js (root)                      | No                              | Duplicate of server/server.js but with differences                     | Move to BKUP   |
| test-borrower-default-risk.js         | Partial                         | Similar to tests in server/tests/unit but standalone                   | Move to BKUP   |
| test-both-risk-functions.js           | Partial                         | Similar to tests in server/tests/unit but standalone                   | Move to BKUP   |
| test-chatbot-queries-comprehensive.js | No                              | Comprehensive E2E test not integrated with Jest                        | Move to BKUP   |
| test-logging-validation.js            | Partial                         | Similar to tests in server/tests/helpers/logging-test.js               | Move to BKUP   |
| test-logging.js                       | Partial                         | Similar to tests in server/tests/helpers/logging-test.js               | Move to BKUP   |
| test-mcp-functions.js                 | Partial                         | Similar to tests in server/tests/unit/mcpServiceWithLogging.test.js    | Move to BKUP   |
| test-openai-route.js                  | No                              | Standalone test not integrated with Jest                               | Move to BKUP   |
| test-openai-with-logging.js           | No                              | Standalone test not integrated with Jest                               | Move to BKUP   |
| test-results-2025-05-29.json          | No                              | Test results data, not a test file                                     | Move to BKUP   |
| test-risk-functions.js                | Partial                         | Similar to tests in server/tests/unit but standalone                   | Move to BKUP   |
| test-ui-integration.html              | No                              | HTML UI test, not part of automated test suite                         | Move to BKUP   |
| test-validation.js                    | Partial                         | Similar to validation tests in server tests                            | Move to BKUP   |

## Core Issues

1. **Test Framework Consistency**: Many tests are standalone scripts rather than using the Jest framework that's configured for the project.

2. **Duplicate Testing Logic**: Some tests cover similar functionality as existing Jest tests but in different formats.

3. **Test Organization**: Tests are scattered across the root directory instead of being properly organized in the test directories.

4. **Non-Standardized Test Running**: Multiple custom test runners instead of using Jest's built-in capabilities.

## Action Items

1. Create BKUP folder and move all standalone tests there
2. Consider integrating valuable test logic from standalone tests into the Jest framework
3. Standardize on Jest for all testing
4. Update documentation to clarify the testing strategy
