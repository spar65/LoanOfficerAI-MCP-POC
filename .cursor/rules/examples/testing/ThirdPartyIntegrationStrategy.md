# Third-Party Integration Testing Strategy

This guide outlines strategies for effectively testing integrations with third-party systems and services.

## Overview

Third-party integrations present unique testing challenges due to:

1. External control of service behavior and availability
2. API versioning and breaking changes
3. Rate limiting and throttling
4. Authentication and authorization complexity
5. Inconsistent environments (dev, staging, production)
6. Callback/webhook-based asynchronous flows

A comprehensive testing strategy for third-party integrations requires specialized approaches beyond standard unit and integration testing.

## Testing Layers

### 1. Mock-Based Unit Testing

The foundation of third-party testing starts with well-designed mocks:

```typescript
// payment-service.test.ts
import { PaymentService } from "./payment-service";
import { PaymentProviderMock } from "./mocks/payment-provider";

describe("PaymentService", () => {
  let paymentService: PaymentService;
  let paymentProviderMock: PaymentProviderMock;

  beforeEach(() => {
    paymentProviderMock = new PaymentProviderMock();
    paymentService = new PaymentService(paymentProviderMock);
  });

  test("processes payment successfully", async () => {
    // Arrange
    paymentProviderMock.mockCreatePaymentSuccess({
      id: "payment_123",
      status: "succeeded",
    });

    // Act
    const result = await paymentService.processPayment({
      amount: 1000,
      currency: "USD",
      cardToken: "tok_visa",
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.paymentId).toBe("payment_123");
    expect(paymentProviderMock.createPayment).toHaveBeenCalledWith({
      amount: 1000,
      currency: "USD",
      source: "tok_visa",
    });
  });
});
```

### 2. Contract Testing

Verify that your implementation correctly integrates with the third-party API contract:

```typescript
// payment-contract.test.ts
import { schema } from "./schemas/payment-api.schema.json";
import { PaymentService } from "./payment-service";
import { validate } from "jsonschema";

describe("Payment API Contract", () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    // Use a request capturing mock
    const requestCaptor = new RequestCaptor();
    paymentService = new PaymentService(requestCaptor);
  });

  test("payment request conforms to API schema", async () => {
    // Arrange & Act
    await paymentService.processPayment({
      amount: 1000,
      currency: "USD",
      cardToken: "tok_visa",
    });

    // Assert - validate the captured request against the schema
    const capturedRequest = requestCaptor.getLastRequest();
    const validationResult = validate(
      capturedRequest,
      schema.requests.createPayment
    );

    expect(validationResult.valid).toBe(true);
    if (!validationResult.valid) {
      console.error("Validation errors:", validationResult.errors);
    }
  });
});
```

### 3. Sandbox Integration Testing

Test against actual third-party sandbox/test environments:

```typescript
// payment-sandbox.test.ts
import { PaymentService } from "./payment-service";
import { StripeProvider } from "./providers/stripe";

// Only run in CI or when explicitly enabled
describe("Stripe Sandbox Tests", () => {
  let paymentService: PaymentService;

  beforeAll(() => {
    // Use actual sandbox implementation with test API keys
    const stripeProvider = new StripeProvider({
      apiKey: process.env.STRIPE_TEST_KEY,
      environment: "test",
    });

    paymentService = new PaymentService(stripeProvider);
  });

  test("creates and refunds a real payment", async () => {
    // Create test payment
    const payment = await paymentService.processPayment({
      amount: 1000,
      currency: "USD",
      cardToken: "tok_visa", // Stripe test token
    });

    expect(payment.success).toBe(true);
    expect(payment.paymentId).toBeDefined();

    // Refund the payment
    const refund = await paymentService.refundPayment(payment.paymentId);

    expect(refund.success).toBe(true);
    expect(refund.refundId).toBeDefined();
  });
});
```

### 4. Webhook/Callback Testing

Test asynchronous flows involving webhooks:

```typescript
// webhook-handler.test.ts
import { WebhookHandler } from "./webhook-handler";
import { createHmacSignature } from "./test-utils";

describe("Webhook Handler", () => {
  let webhookHandler: WebhookHandler;
  const webhookSecret = "webhook_signing_secret_test";

  beforeEach(() => {
    webhookHandler = new WebhookHandler(webhookSecret);
  });

  test("validates authentic webhook signature", () => {
    // Create test event payload
    const payload = JSON.stringify({
      id: "evt_123",
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123" } },
    });

    // Generate valid signature
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmacSignature(timestamp, payload, webhookSecret);
    const signatureHeader = `t=${timestamp},v1=${signature}`;

    // Verify handling
    expect(webhookHandler.verifySignature(payload, signatureHeader)).toBe(true);
  });

  test("processes payment success webhook", async () => {
    // Create test event
    const event = {
      id: "evt_123",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_123",
          status: "succeeded",
          amount: 1000,
          currency: "usd",
        },
      },
    };

    // Mock database for verification
    const mockDb = new MockDatabase();
    webhookHandler.setDatabase(mockDb);

    // Process webhook
    await webhookHandler.handleEvent(event);

    // Verify order was updated
    expect(mockDb.updateOrder).toHaveBeenCalledWith("pi_123", "paid");
  });
});
```

### 5. Resilience Testing

Test behavior when third-party services fail or degrade:

```typescript
// resilience.test.ts
import { PaymentService } from "./payment-service";
import { ChaosProxy } from "./test-utils/chaos-proxy";

describe("Payment Service Resilience", () => {
  let paymentService: PaymentService;
  let chaosProxy: ChaosProxy;

  beforeAll(async () => {
    // Setup proxy to intercept API calls
    chaosProxy = new ChaosProxy({
      targetUrl: "https://api.stripe.com",
      port: 9000,
    });
    await chaosProxy.start();

    // Configure service to use proxy
    paymentService = new PaymentService({
      apiUrl: "http://localhost:9000",
      apiKey: "test_key",
      timeout: 2000,
      retries: 3,
    });
  });

  afterAll(async () => {
    await chaosProxy.stop();
  });

  test("handles temporary outages with retry", async () => {
    // Configure proxy to fail twice, then succeed
    chaosProxy.failNextRequests(2, 500);

    // This should eventually succeed after retries
    const result = await paymentService.processPayment({
      amount: 1000,
      currency: "USD",
      cardToken: "tok_visa",
    });

    expect(result.success).toBe(true);
    expect(chaosProxy.getRequestCount()).toBe(3);
  });

  test("handles timeout with appropriate error", async () => {
    // Configure proxy with high latency
    chaosProxy.setLatency(5000); // 5 seconds

    // Should timeout and throw specific error
    await expect(
      paymentService.processPayment({
        amount: 1000,
        currency: "USD",
        cardToken: "tok_visa",
      })
    ).rejects.toThrow("Request timed out");
  });
});
```

## Environment Configuration

### 1. CI/CD Setup

Configure CI environments to properly handle third-party testing:

```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    services:
      # Local mocking service
      wiremock:
        image: wiremock/wiremock
        ports:
          - 8080:8080
        volumes:
          - ./test/wiremock:/home/wiremock

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run mock tests
        run: npm run test:integrations:mock

      - name: Run sandbox tests
        env:
          STRIPE_TEST_KEY: ${{ secrets.STRIPE_TEST_KEY }}
          PAYPAL_SANDBOX_CLIENT_ID: ${{ secrets.PAYPAL_SANDBOX_CLIENT_ID }}
          PAYPAL_SANDBOX_SECRET: ${{ secrets.PAYPAL_SANDBOX_SECRET }}
        run: npm run test:integrations:sandbox

      - name: Run chaos tests
        run: npm run test:integrations:chaos
```

### 2. Local Development Configuration

Provide developers with easy ways to test third-party integrations locally:

```typescript
// development-setup.js
const { execSync } = require("child_process");
const fs = require("fs");
const inquirer = require("inquirer");

async function setupIntegrationTesting() {
  console.log("Setting up third-party integration testing...");

  // 1. Check if Docker is available
  try {
    execSync("docker -v");
  } catch (e) {
    console.error(
      "Docker is required for integration testing. Please install Docker first."
    );
    process.exit(1);
  }

  // 2. Configure API keys
  const config = await inquirer.prompt([
    {
      type: "input",
      name: "stripeTestKey",
      message: "Enter Stripe test API key (or leave empty to use mock):",
    },
    {
      type: "confirm",
      name: "startMockServices",
      message: "Start mock services for offline development?",
      default: true,
    },
  ]);

  // 3. Save configuration
  fs.writeFileSync(
    ".env.test.local",
    `
STRIPE_TEST_KEY=${config.stripeTestKey}
USE_MOCK=${!config.stripeTestKey}
  `
  );

  // 4. Start mock services if requested
  if (config.startMockServices) {
    console.log("Starting mock services...");
    execSync("docker-compose -f docker-compose.test.yml up -d");
  }

  console.log("Integration testing environment ready!");
}

setupIntegrationTesting().catch(console.error);
```

## Testing Patterns for Specific Challenges

### 1. Rate Limiting

Test how your application handles rate limits:

```typescript
// rate-limiting.test.ts
test("handles rate limiting correctly", async () => {
  // Configure mock to simulate rate limiting after 3 requests
  mockProvider.enableRateLimiting({
    limit: 3,
    resetAfter: 2000, // 2 seconds
    statusCode: 429,
    headers: {
      "Retry-After": "2",
    },
  });

  // Successful requests within limit
  for (let i = 0; i < 3; i++) {
    const result = await paymentService.processPayment({
      amount: 1000,
      currency: "USD",
      cardToken: `tok_${i}`,
    });
    expect(result.success).toBe(true);
  }

  // Should be rate limited now
  await expect(
    paymentService.processPayment({
      amount: 1000,
      currency: "USD",
      cardToken: "tok_limit",
    })
  ).rejects.toMatchObject({
    code: "rate_limited",
    retryAfter: 2,
  });

  // After waiting, it should work again
  jest.advanceTimersByTime(2100);

  const finalResult = await paymentService.processPayment({
    amount: 1000,
    currency: "USD",
    cardToken: "tok_after",
  });
  expect(finalResult.success).toBe(true);
});
```

### 2. Version Compatibility Testing

Test compatibility with multiple API versions:

```typescript
// version-compatibility.test.ts
const supportedVersions = ["2020-08-27", "2022-11-15", "2023-10-16"];

test.each(supportedVersions)(
  "works with API version %s",
  async (apiVersion) => {
    // Create provider configured for this version
    const provider = new PaymentProvider({
      apiKey: "test_key",
      apiVersion,
    });

    const paymentService = new PaymentService(provider);

    // Configure version-specific mock responses
    setupMockForVersion(apiVersion);

    // Run the test for this version
    const result = await paymentService.processPayment({
      amount: 1000,
      currency: "USD",
      cardToken: "tok_visa",
    });

    expect(result.success).toBe(true);
    expect(result.paymentId).toBeDefined();
  }
);
```

### 3. Handling Authentication Flows

Test OAuth and other authentication mechanisms:

```typescript
// oauth-flow.test.ts
test("completes OAuth authorization flow", async () => {
  // Mock OAuth endpoints
  mockServer.post("/oauth/token", (req, res) => {
    if (
      req.body.grant_type === "authorization_code" &&
      req.body.client_id === "test_client_id" &&
      req.body.client_secret === "test_client_secret" &&
      req.body.code === "test_auth_code"
    ) {
      res.json({
        access_token: "test_access_token",
        refresh_token: "test_refresh_token",
        expires_in: 3600,
      });
    } else {
      res.status(400).json({ error: "invalid_request" });
    }
  });

  // Test completing the flow
  const oauthClient = new OAuthClient({
    clientId: "test_client_id",
    clientSecret: "test_client_secret",
    redirectUri: "https://example.com/callback",
  });

  const tokens = await oauthClient.exchangeCodeForTokens("test_auth_code");

  expect(tokens.accessToken).toBe("test_access_token");
  expect(tokens.refreshToken).toBe("test_refresh_token");
  expect(tokens.expiresIn).toBe(3600);
});

test("refreshes expired access token", async () => {
  // Mock token refresh endpoint
  mockServer.post("/oauth/token", (req, res) => {
    if (
      req.body.grant_type === "refresh_token" &&
      req.body.client_id === "test_client_id" &&
      req.body.client_secret === "test_client_secret" &&
      req.body.refresh_token === "test_refresh_token"
    ) {
      res.json({
        access_token: "new_access_token",
        refresh_token: "new_refresh_token",
        expires_in: 3600,
      });
    } else {
      res.status(400).json({ error: "invalid_request" });
    }
  });

  const oauthClient = new OAuthClient({
    clientId: "test_client_id",
    clientSecret: "test_client_secret",
    redirectUri: "https://example.com/callback",
  });

  // Set expired token
  oauthClient.setTokens({
    accessToken: "expired_token",
    refreshToken: "test_refresh_token",
    expiresAt: Date.now() - 1000, // Expired
  });

  // This should trigger a refresh
  const apiResponse = await oauthClient.callApi("/some/endpoint");

  // Verify tokens were refreshed
  const currentTokens = oauthClient.getTokens();
  expect(currentTokens.accessToken).toBe("new_access_token");
  expect(currentTokens.refreshToken).toBe("new_refresh_token");
});
```

## Monitoring and Alerting

Integrate testing with monitoring for ongoing validation:

```typescript
// synthetic-monitor.ts
import { Monitor } from "./monitoring-framework";
import { PaymentService } from "./payment-service";
import { logger } from "./logger";
import { alerting } from "./alerting";

export class PaymentProviderMonitor extends Monitor {
  private paymentService: PaymentService;

  constructor(config) {
    super({
      name: "payment-provider",
      interval: config.interval || 60000, // 1 minute
      timeout: config.timeout || 10000,
    });

    this.paymentService = new PaymentService({
      apiKey: config.apiKey,
      environment: "test",
    });
  }

  async check() {
    const startTime = Date.now();

    try {
      // Test token creation
      const token = await this.paymentService.createTestToken();

      // Test charge creation
      const charge = await this.paymentService.processPayment({
        amount: 100,
        currency: "USD",
        cardToken: token.id,
        description: "Synthetic monitoring test",
      });

      // Test refund
      const refund = await this.paymentService.refundPayment(charge.paymentId);

      const duration = Date.now() - startTime;

      if (duration > 5000) {
        logger.warn(`Payment provider response time high: ${duration}ms`);
      }

      return {
        status: "ok",
        duration,
        data: {
          paymentId: charge.paymentId,
          refundId: refund.refundId,
        },
      };
    } catch (error) {
      logger.error("Payment provider check failed", error);

      alerting.sendAlert({
        name: "payment_provider_failure",
        severity: "critical",
        message: `Payment provider integration failed: ${error.message}`,
        details: error,
      });

      return {
        status: "error",
        error: {
          message: error.message,
          code: error.code,
          type: error.type,
        },
      };
    }
  }
}
```

## Conclusion

A comprehensive third-party integration testing strategy involves multiple testing layers, from unit tests with mocks to synthetic monitoring in production. By implementing these patterns, you can ensure reliable interaction with external services, robust error handling, and visibility into integration health.

## Related Documentation

- [Third-Party Integration Testing Rule](mdc:departments/engineering/testing/330-third-party-integration-testing.mdc)
- [API Contract Testing Guide](mdc:examples/testing/APIContractTestingGuide.md)
- [Resilient Integration Patterns](mdc:examples/testing/ResilientIntegrationPatterns.md)
