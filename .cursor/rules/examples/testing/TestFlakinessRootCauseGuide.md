# Test Flakiness Root Cause Analysis Guide

This guide provides a systematic approach to diagnosing and fixing flaky tests in enterprise applications.

## Understanding Test Flakiness

A flaky test is one that exhibits both passing and failing outcomes when run with the same code and test inputs. Flaky tests undermine confidence in your test suite, waste developer time, and can lead to real issues being ignored when "flaky test" becomes a common explanation for failures.

### Common Root Causes of Test Flakiness

1. **Timing Issues (36%)**

   - Improper handling of asynchronous operations
   - Race conditions
   - Reliance on arbitrary timeouts

2. **Test Order Dependency (28%)**

   - Tests affecting shared state
   - Tests not properly isolated

3. **External Dependencies (15%)**

   - Network services
   - File system
   - External APIs

4. **Concurrency Issues (9%)**

   - Thread safety violations
   - Resource contention

5. **Platform Differences (7%)**

   - Browser-specific behaviors
   - OS-specific behaviors

6. **Random Behaviors (5%)**
   - Random data generation without seeding
   - Using random functions without control

## Flakiness Detection Strategies

### 1. Multi-run Analysis

Run tests multiple times in sequence to identify flakiness:

```bash
# Script to detect flaky tests by running them multiple times
for i in {1..10}; do
  echo "Run $i"
  npm test -- --json --outputFile=run-$i.json
done

# Analyze results
node analyze-flaky-tests.js
```

Implementation:

```javascript
// analyze-flaky-tests.js
const fs = require("fs");

// Read all run results
const runs = [];
for (let i = 1; i <= 10; i++) {
  const runData = JSON.parse(fs.readFileSync(`run-${i}.json`, "utf8"));
  runs.push(runData);
}

// Analyze test consistency
const testResults = {};
runs.forEach((run, runIndex) => {
  run.testResults.forEach((suiteResult) => {
    suiteResult.testResults.forEach((testResult) => {
      const testId = `${suiteResult.name}::${testResult.title}`;

      if (!testResults[testId]) {
        testResults[testId] = {
          name: testResult.title,
          file: suiteResult.name,
          results: [],
        };
      }

      testResults[testId].results.push({
        status: testResult.status,
        runIndex,
      });
    });
  });
});

// Find flaky tests
const flakyTests = Object.values(testResults).filter((test) => {
  const statusSet = new Set(test.results.map((r) => r.status));
  return statusSet.size > 1;
});

console.log(
  `Found ${flakyTests.length} flaky tests out of ${
    Object.keys(testResults).length
  } total tests:`
);
flakyTests.forEach((test) => {
  const passCount = test.results.filter((r) => r.status === "passed").length;
  const failCount = test.results.filter((r) => r.status === "failed").length;
  console.log(
    `- ${test.file} > ${test.name}: Passed ${passCount}/10, Failed ${failCount}/10`
  );
});
```

### 2. Quarantine Strategy

Implement a quarantine system for flaky tests:

```javascript
// jest-quarantine.config.js
module.exports = {
  // Base Jest configuration...

  // Separate test suites
  projects: [
    {
      displayName: "stable",
      testMatch: ["<rootDir>/src/**/*.test.{js,jsx,ts,tsx}"],
      testPathIgnorePatterns: ["<rootDir>/quarantine/"],
    },
    {
      displayName: "quarantine",
      testMatch: ["<rootDir>/quarantine/**/*.test.{js,jsx,ts,tsx}"],
      // Allow failures in quarantined tests
      setupFilesAfterEnv: ["<rootDir>/quarantine/setup.js"],
    },
  ],
};

// quarantine/setup.js
// Allow failures in quarantined tests but log them
// This prevents CI from failing due to known flaky tests
const originalIt = global.it;
global.it = (name, fn, timeout) => {
  return originalIt(
    name,
    async (...args) => {
      try {
        await fn(...args);
      } catch (error) {
        console.warn(`QUARANTINED TEST FAILED: ${name}`);
        console.warn(error);
        // Don't rethrow error for quarantined tests
      }
    },
    timeout
  );
};
```

## Diagnosing Specific Flakiness Types

### 1. Timing Issues

#### Symptoms:

- Tests pass when run slowly or with debugger attached
- Failures mention elements not found or timing out
- Inconsistent behavior on different hardware

#### Diagnosis Tools:

- Add logging to track event sequence
- Use performance tracing in UI tests
- Add intentional delays to see if issues go away

#### Example:

```typescript
// Before: Flaky test with timing issue
test("submits form data", async () => {
  render(<SubmitForm />);
  fireEvent.click(screen.getByText("Submit"));
  // Directly checks for success message, may fail if processing takes time
  expect(screen.getByText("Success!")).toBeInTheDocument();
});

// After: Fixed test with proper async handling
test("submits form data", async () => {
  render(<SubmitForm />);
  fireEvent.click(screen.getByText("Submit"));

  // Wait for the success message with explicit timeout and failure details
  await waitFor(
    () => {
      expect(screen.getByText("Success!")).toBeInTheDocument();
    },
    {
      timeout: 3000,
      onTimeout: () => {
        console.error("Elements in document:", document.body.innerHTML);
        return new Error("Timed out waiting for success message");
      },
    }
  );
});
```

### 2. Test Order Dependency

#### Symptoms:

- Tests pass in isolation but fail in full suite
- Tests pass or fail depending on which other tests run first
- Different test run orders produce different results

#### Diagnosis Tools:

- Run tests in reverse order
- Run suspected tests in isolation
- Add state logging between tests

#### Example:

```typescript
// Before: Tests with shared state dependency
describe("UserService", () => {
  it("creates a user", async () => {
    const result = await userService.createUser({ name: "Test User" });
    expect(result.id).toBeDefined();
    // No cleanup - leaves user in database
  });

  it("finds no users initially", async () => {
    const users = await userService.getUsers();
    // Will fail if previous test ran first
    expect(users).toHaveLength(0);
  });
});

// After: Independent tests with proper setup and teardown
describe("UserService", () => {
  // Reset state before each test
  beforeEach(async () => {
    await testDb.truncate(["users"]);
  });

  it("creates a user", async () => {
    const result = await userService.createUser({ name: "Test User" });
    expect(result.id).toBeDefined();
  });

  it("finds no users initially", async () => {
    const users = await userService.getUsers();
    expect(users).toHaveLength(0);
  });
});
```

### 3. External Dependencies

#### Symptoms:

- Tests fail with network or connection errors
- Inconsistent behavior depending on external services
- Tests fail on CI but pass locally

#### Diagnosis Tools:

- Network traffic monitoring
- Service dependency mapping
- Environment comparison

#### Example:

```typescript
// Before: Flaky test with direct API dependency
test("displays user profile", async () => {
  render(<UserProfile userId="123" />);
  // Directly depends on real API response time and availability
  expect(await screen.findByText("John Doe")).toBeInTheDocument();
});

// After: Stable test with deterministic mocking
test("displays user profile", async () => {
  // Explicit API mocking
  server.use(
    rest.get("/api/users/123", (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ id: "123", name: "John Doe", email: "john@example.com" })
      );
    })
  );

  render(<UserProfile userId="123" />);
  expect(await screen.findByText("John Doe")).toBeInTheDocument();
});
```

## Remediation Strategies

### 1. Asynchronous Operation Handling

```typescript
// Proper async waiting pattern
test("loads data asynchronously", async () => {
  render(<DataComponent />);

  // Wait for loading indicator first to confirm loading started
  expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();

  // Wait for data with reasonable timeout and diagnostic info
  await waitFor(
    () => {
      expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
      expect(screen.getByTestId("data-container")).toHaveTextContent(
        "Results:"
      );
    },
    {
      timeout: 5000,
      interval: 100, // Check more frequently
      onTimeout: (error) => {
        // Log diagnostic information on timeout
        console.error("Test timed out with DOM state:", {
          html: document.body.innerHTML,
          networkCalls: mockAPI.calls,
        });
        throw error;
      },
    }
  );
});
```

### 2. Test Isolation

```typescript
// Global test isolation pattern for Jest
// setupTests.js
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Reset localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // Reset cookies
  document.cookie.split(";").forEach((cookie) => {
    const [name] = cookie.trim().split("=");
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });

  // Reset any global state in your app
  resetApplicationState();

  // Reset mock server
  server.resetHandlers();
});
```

### 3. Time Control

```typescript
// Reliable date/time testing
import { advanceTo, clear } from "jest-date-mock";

describe("date-dependent component", () => {
  afterEach(() => {
    // Reset mocked time after each test
    clear();
  });

  test("shows relative time", () => {
    // Set specific fixed time for test
    advanceTo(new Date("2023-01-01T12:00:00Z"));

    // Test with item created "now"
    const recentItem = {
      title: "Recent Item",
      createdAt: new Date().toISOString(),
    };
    render(<TimeDisplay item={recentItem} />);
    expect(screen.getByText("just now")).toBeInTheDocument();

    // Advance time by 1 hour
    advanceTo(new Date("2023-01-01T13:00:00Z"));
    render(<TimeDisplay item={recentItem} />);
    expect(screen.getByText("1 hour ago")).toBeInTheDocument();
  });
});
```

### 4. Network/API Control

```typescript
// MSW for API mocking
import { setupServer } from "msw/node";
import { rest } from "msw";

// Setup request handlers
const server = setupServer(
  rest.get("/api/users", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: "1", name: "John Doe" },
        { id: "2", name: "Jane Smith" },
      ])
    );
  }),

  rest.get("/api/users/:id", (req, res, ctx) => {
    const { id } = req.params;
    if (id === "1") {
      return res(
        ctx.status(200),
        ctx.json({ id: "1", name: "John Doe", email: "john@example.com" })
      );
    }

    // Simulate error for other IDs
    return res(ctx.status(404), ctx.json({ error: "User not found" }));
  })
);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());
```

### 5. Retry Logic for Inherently Flaky Operations

```typescript
// Retry utility for inherently flaky operations
const retryOperation = async (operation, maxRetries = 3, delay = 500) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(
        `Operation failed on attempt ${attempt}/${maxRetries}:`,
        error
      );
      lastError = error;

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Use in tests for operations that might have occasional failures
test("uploads a file", async () => {
  render(<FileUploader />);

  // Upload might occasionally fail due to network hiccups
  await retryOperation(async () => {
    fireEvent.change(screen.getByLabelText("Select File"), {
      target: {
        files: [new File(["test content"], "test.txt", { type: "text/plain" })],
      },
    });

    await userEvent.click(screen.getByText("Upload"));

    // Wait for success message
    await screen.findByText("Upload complete");
  });

  // Continue with test assertions
  expect(screen.getByText("File: test.txt")).toBeInTheDocument();
});
```

## Implementing Flakiness Monitoring

### 1. Test Stability Dashboard

Implement a dashboard to track test flakiness over time:

```typescript
// flakiness-report.js
const generateFlakinessReport = (testRuns) => {
  const testStats = {};

  // Process all test runs
  testRuns.forEach((run) => {
    run.results.forEach((test) => {
      const key = `${test.file}:${test.name}`;

      if (!testStats[key]) {
        testStats[key] = {
          name: test.name,
          file: test.file,
          runs: 0,
          passes: 0,
          failures: 0,
        };
      }

      testStats[key].runs += 1;
      if (test.status === "pass") {
        testStats[key].passes += 1;
      } else {
        testStats[key].failures += 1;
      }
    });
  });

  // Calculate flakiness score (0-100)
  Object.values(testStats).forEach((test) => {
    const failRate = test.failures / test.runs;
    const passRate = test.passes / test.runs;

    // A test that always passes or always fails is not flaky
    // Maximum flakiness is 50% pass / 50% fail
    test.flakiness = Math.min(failRate, passRate) * 2 * 100;
  });

  return {
    summary: {
      totalTests: Object.keys(testStats).length,
      totalRuns: testRuns.length,
      flakyTests: Object.values(testStats).filter((t) => t.flakiness > 0)
        .length,
      avgFlakiness:
        Object.values(testStats).reduce((sum, t) => sum + t.flakiness, 0) /
        Object.keys(testStats).length,
    },
    tests: Object.values(testStats).sort((a, b) => b.flakiness - a.flakiness),
  };
};
```

### 2. CI Integration for Flakiness Detection

```yaml
# .github/workflows/flakiness-detection.yml
name: Test Flakiness Detection

on:
  schedule:
    - cron: "0 0 * * 0" # Run weekly on Sundays
  workflow_dispatch: # Allow manual triggering

jobs:
  detect-flaky-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests multiple times
        run: |
          mkdir -p test-results
          for i in {1..20}; do
            echo "Test run $i/20"
            npm test -- --json --outputFile=test-results/run-$i.json || true
          done

      - name: Generate flakiness report
        run: node scripts/generate-flakiness-report.js

      - name: Archive test results
        uses: actions/upload-artifact@v3
        with:
          name: flakiness-report
          path: flakiness-report.html

      - name: Send report to Slack
        if: always()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "Weekly Test Flakiness Report",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Weekly Test Flakiness Report*\nDetected flaky tests: ${{ env.FLAKY_COUNT }}\nAverage flakiness score: ${{ env.FLAKY_SCORE }}%"
                  }
                },
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "View the full report <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|here>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          FLAKY_COUNT: ${{ env.FLAKY_COUNT }}
          FLAKY_SCORE: ${{ env.FLAKY_SCORE }}
```

## Conclusion

Flaky tests can significantly undermine confidence in your test suite and waste valuable engineering time. By systematically identifying, diagnosing, and remediating flaky tests using the patterns in this guide, you can build a resilient test suite that provides reliable feedback and maintains developer confidence in your continuous integration pipeline.

## Related Documentation

- [Test Resilience Rule](mdc:departments/engineering/testing/320-test-resilience.mdc)
- [Asynchronous Testing Best Practices](mdc:examples/testing/AsyncTestingBestPractices.md)
- [Environment Isolation Techniques](mdc:examples/testing/TestEnvironmentIsolation.md)
