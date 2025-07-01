# Deprecated Tests

This directory contains tests that have been deprecated as part of the test restructuring effort. These tests are primarily API-driven tests that have been replaced by MCP-driven tests.

## Reasons for Deprecation

1. **Redundancy**: Many of these tests duplicate functionality already covered by the MCP core and infrastructure tests.
2. **Maintenance Burden**: API-driven tests are more complex to maintain as they require setting up and tearing down API servers.
3. **Focus Shift**: The project has shifted focus to MCP-driven functionality, making direct API tests less relevant.

## Test Categories

The deprecated tests fall into these categories:

- **API Tests**: Tests that directly call the API endpoints
- **Data Loading Tests**: Tests that verify data loading from JSON files
- **Edge Case Tests**: Tests for edge cases in the API
- **Coverage Tests**: Tests designed primarily to increase code coverage

## Reference

These tests are kept for reference purposes and may be deleted in the future once the MCP-driven tests are fully established.

For more information, see the [HitList-Testing-Review01.md](../../HitList-Testing-Review01.md) document.
