# Client Tests

This directory contains the test suite for the Loan Officer AI client application.

## Test Structure

The tests are organized into the following directories:

- `unit/`: Unit tests for individual React components
- `integration/`: Integration tests for component interactions
- `mocks/`: Mock files and data used by tests

## Running the Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### Coverage Report

```bash
npm run test:coverage
```

## Testing Stack

- **Jest**: Testing framework
- **@testing-library/react**: React component testing
- **@testing-library/jest-dom**: Custom DOM element matchers
- **@testing-library/user-event**: User event simulation

## Test Guidelines

- Every React component should have unit tests
- Key user flows should have integration tests
- Tests should verify both UI rendering and functionality
- Follow the test-first approach by writing tests before implementation
- Mock API calls and external dependencies

## Component Testing Approach

1. **Rendering Tests**: Verify components render correctly with different props
2. **User Interaction Tests**: Simulate user actions and verify the results
3. **State Changes**: Verify state updates correctly based on interactions
4. **Edge Cases**: Test loading states, error states, and boundary conditions

## Adding New Tests

When adding new tests, follow these guidelines:

1. Create a test file that matches the name of the component (e.g., `Button.test.js` for `Button.js`)
2. Import required testing utilities and the component
3. Mock any external dependencies
4. Structure tests using `describe` and `it` blocks
5. Test both the rendered output and component behavior
