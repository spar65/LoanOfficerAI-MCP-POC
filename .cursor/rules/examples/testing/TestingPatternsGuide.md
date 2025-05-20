# Testing Patterns and Anti-patterns Guide

This guide outlines proven testing patterns to follow and anti-patterns to avoid when implementing tests across the enterprise.

## Effective Testing Patterns

### 1. Arrange-Act-Assert (AAA)

**Pattern**: Structure tests in three distinct phases.

```typescript
it("should calculate total with tax", () => {
  // Arrange
  const cart = { items: [{ price: 10 }, { price: 20 }] };
  const taxRate = 0.1;

  // Act
  const result = calculateTotal(cart, taxRate);

  // Assert
  expect(result).toBe(33); // (10 + 20) * 1.1
});
```

**Benefits**:

- Improves test readability
- Makes test structure consistent
- Separates setup from verification

### 2. Test Data Builders

**Pattern**: Create builder classes for test data creation.

```typescript
class OrderBuilder {
  private order: Partial<Order> = {
    id: "order-123",
    customerId: "customer-456",
    items: [],
    status: "pending",
    createdAt: new Date(),
  };

  withId(id: string): OrderBuilder {
    this.order.id = id;
    return this;
  }

  withStatus(status: OrderStatus): OrderBuilder {
    this.order.status = status;
    return this;
  }

  withItems(items: OrderItem[]): OrderBuilder {
    this.order.items = items;
    return this;
  }

  build(): Order {
    if (this.order.items!.length > 0) {
      this.order.total = this.order.items!.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }

    return this.order as Order;
  }
}

// Usage
const completedOrder = new OrderBuilder()
  .withStatus("completed")
  .withItems([{ productId: "prod-1", price: 29.99, quantity: 2 }])
  .build();
```

**Benefits**:

- Creates consistent test data
- Supports test readability
- Centralizes test data creation
- Makes tests more maintainable

### 3. Test Fixtures

**Pattern**: Use shared setup code for common test scenarios.

```typescript
describe("Order processing", () => {
  let testDb: TestDatabase;
  let orderService: OrderService;
  let testOrder: Order;

  beforeEach(async () => {
    // Common setup
    testDb = await TestDatabase.create();
    orderService = new OrderService(testDb);
    testOrder = new OrderBuilder().build();
    await testDb.orders.insert(testOrder);
  });

  afterEach(async () => {
    // Common teardown
    await testDb.close();
  });

  it("should mark order as shipped", async () => {
    // Test-specific logic
    await orderService.shipOrder(testOrder.id);
    const updatedOrder = await orderService.getOrder(testOrder.id);
    expect(updatedOrder.status).toBe("shipped");
  });

  // More tests using the same fixture...
});
```

**Benefits**:

- Reduces code duplication
- Ensures consistent test state
- Improves test maintenance

### 4. Parameterized Tests

**Pattern**: Run the same test logic with different inputs.

```typescript
describe("validateEmail", () => {
  test.each([
    ["test@example.com", true],
    ["invalid-email", false],
    ["test@example", false],
    ["@example.com", false],
    ["test@.com", false],
  ])("validateEmail(%s) should return %s", (email, expected) => {
    expect(validateEmail(email)).toBe(expected);
  });
});
```

**Benefits**:

- Reduces code duplication
- Improves test coverage
- Makes edge cases explicit

### 5. Stub External Dependencies

**Pattern**: Replace external dependencies with controlled test doubles.

```typescript
describe("Payment processing", () => {
  // Create a stub for the payment gateway
  const paymentGatewayStub = {
    processPayment: jest.fn(),
  };

  const paymentService = new PaymentService(paymentGatewayStub);

  it("should process successful payment", async () => {
    // Configure the stub for this test case
    paymentGatewayStub.processPayment.mockResolvedValue({
      success: true,
      transactionId: "tx-123",
    });

    // Test the service with the stub
    const result = await paymentService.chargeCustomer(100, "USD", "card-123");

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe("tx-123");
    expect(paymentGatewayStub.processPayment).toHaveBeenCalledWith(
      100,
      "USD",
      "card-123"
    );
  });

  it("should handle payment failures", async () => {
    // Configure the stub for a different scenario
    paymentGatewayStub.processPayment.mockResolvedValue({
      success: false,
      error: "Insufficient funds",
    });

    const result = await paymentService.chargeCustomer(100, "USD", "card-123");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Insufficient funds");
  });
});
```

**Benefits**:

- Makes tests deterministic
- Isolates system under test
- Allows testing error scenarios
- Improves test reliability

### 6. Contract Testing

**Pattern**: Verify that interfaces conform to their contracts.

```typescript
// Consumer contract test
describe("ProductService as API consumer", () => {
  it("should handle the product API response correctly", async () => {
    // Setup a mock that returns data matching the expected contract
    mockAxios.get.mockResolvedValue({
      data: {
        id: "123",
        name: "Test Product",
        price: 19.99,
        inStock: true,
      },
    });

    const service = new ProductService();
    const product = await service.getProduct("123");

    expect(product).toEqual({
      id: "123",
      name: "Test Product",
      price: 19.99,
      inStock: true,
    });
  });
});

// Provider contract test
describe("ProductAPI as provider", () => {
  it("should return product data in the expected format", async () => {
    const response = await request(app)
      .get("/api/products/123")
      .set("Accept", "application/json");

    expect(response.status).toBe(200);

    // Verify the response matches the expected contract
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        price: expect.any(Number),
        inStock: expect.any(Boolean),
      })
    );
  });
});
```

**Benefits**:

- Ensures compatibility between systems
- Detects breaking changes early
- Provides clear interface documentation
- Supports independent development

### 7. Test Hooks for Data Setup/Cleanup

**Pattern**: Use before/after hooks for test data management.

```typescript
describe("Database operations", () => {
  // Setup before all tests in this suite
  beforeAll(async () => {
    await db.connect();
  });

  // Teardown after all tests
  afterAll(async () => {
    await db.disconnect();
  });

  // Reset data before each test
  beforeEach(async () => {
    await db.collection("users").deleteMany({});
    await db.collection("users").insertMany(testUsers);
  });

  it("should find users by email domain", async () => {
    const users = await userRepository.findByEmailDomain("example.com");
    expect(users).toHaveLength(2);
  });

  // More tests...
});
```

**Benefits**:

- Ensures clean test state
- Prevents test interdependence
- Improves test reliability

### 8. UI Component Testing Patterns

**Pattern**: Test UI components in isolation with realistic props and user interactions.

```tsx
describe("Button component", () => {
  it("should render correctly with default props", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("btn-primary");
  });

  it("should handle click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
```

**Benefits**:

- Tests components in isolation
- Focuses on component behavior
- Verifies accessibility
- Supports test-driven UI development

## Testing Anti-patterns to Avoid

### 1. The "Ice Cream Cone" Testing

**Anti-pattern**: Having more end-to-end tests than integration and unit tests.

**Problem**: E2E tests are slow, fragile, and difficult to maintain. Having too many leads to slow test suites and delayed feedback.

**Solution**: Follow the test pyramid with most tests at the unit level, fewer integration tests, and even fewer E2E tests.

### 2. "Mockist" Testing

**Anti-pattern**: Excessive mocking of dependencies, creating tests that verify implementation details rather than behavior.

```typescript
// Anti-pattern: Too much mocking
it("should process order", async () => {
  // Excessive mocks
  orderRepository.findById = jest.fn().mockResolvedValue(mockOrder);
  paymentService.processPayment = jest.fn().mockResolvedValue(mockPayment);
  notificationService.sendOrderConfirmation = jest.fn().mockResolvedValue(true);
  inventoryService.updateStock = jest.fn().mockResolvedValue(true);

  await orderProcessor.process("order-123");

  // Testing implementation details
  expect(orderRepository.findById).toHaveBeenCalledWith("order-123");
  expect(paymentService.processPayment).toHaveBeenCalledWith(
    mockOrder,
    mockOrder.total
  );
  expect(notificationService.sendOrderConfirmation).toHaveBeenCalledWith(
    mockOrder.email
  );
  expect(inventoryService.updateStock).toHaveBeenCalledWith(mockOrder.items);
});
```

**Solution**: Focus on testing behavior and outcomes, not implementation details. Mock only what's necessary.

### 3. "Brittle Tests"

**Anti-pattern**: Tests that break when implementation details change, even if the behavior doesn't.

```typescript
// Anti-pattern: Testing implementation details
it("should calculate total", () => {
  const calculator = new OrderCalculator();

  // Brittle: depends on specific internal method that might change
  const subtotal = calculator._calculateSubtotal([
    { price: 10 },
    { price: 20 },
  ]);
  const tax = calculator._calculateTax(subtotal);

  expect(subtotal).toBe(30);
  expect(tax).toBe(3);
});
```

**Solution**: Test through public interfaces and focus on observable behavior.

```typescript
// Better: Test through public interface
it("should calculate order total with tax", () => {
  const calculator = new OrderCalculator();
  const items = [{ price: 10 }, { price: 20 }];

  const total = calculator.calculateTotal(items);

  expect(total).toBe(33); // 30 + 10% tax
});
```

### 4. "The Local Hero"

**Anti-pattern**: Tests that pass locally but fail in CI or other environments due to environment-specific assumptions.

```typescript
// Anti-pattern: Assumes local environment configuration
it("should connect to database", async () => {
  const db = new Database();
  await db.connect();

  // Assumes local DB is running and has specific data
  const users = await db.query("SELECT * FROM users");
  expect(users.length).toBeGreaterThan(0);
});
```

**Solution**: Make tests environment-agnostic using dependency injection, environment abstractions, and proper test data setup.

### 5. "The Giant Setup"

**Anti-pattern**: Tests with excessive setup code that obscures the test's purpose.

```typescript
// Anti-pattern: Giant setup
it("should process refund", async () => {
  // 50+ lines of setup code...
  const user = await createUser({
    /* lots of data */
  });
  const product = await createProduct({
    /* lots of data */
  });
  const order = await createOrder(user, [product], {
    /* more data */
  });
  const payment = await processPayment(order, {
    /* payment data */
  });
  // More setup...

  // Actual test is buried
  const result = await refundService.processRefund(order.id);
  expect(result.success).toBe(true);
});
```

**Solution**: Use test data builders, fixtures, and factory functions to encapsulate setup logic.

### 6. "The Flaky Test"

**Anti-pattern**: Tests that sometimes pass and sometimes fail without code changes.

```typescript
// Anti-pattern: Flaky test
it("should fetch user profile", async () => {
  const result = await userService.getUserProfile("user123");

  // Test depends on external service and timing
  expect(result).not.toBeNull();
  expect(result.lastLoginDate).toBeDefined();
});
```

**Solution**: Eliminate non-deterministic elements from tests. Use mocks for external dependencies, avoid timing issues, and ensure test isolation.

### 7. "Excessive DRY in Tests"

**Anti-pattern**: Over-abstracting test code to avoid duplication, making tests hard to understand.

```typescript
// Anti-pattern: Excessive DRY
// Complex helper function with many parameters
function testOrderOperation(operation, input, expectedStatus, expectedEvents) {
  // Abstracted logic...
  // Complex setup and verification...
}

// Tests become cryptic and hard to understand
it("should update order", () => {
  testOrderOperation("update", { status: "shipped" }, 200, ["OrderUpdated"]);
});
```

**Solution**: Prioritize readability and explicitness in tests over DRY principles. Some duplication in tests is acceptable if it improves clarity.

### 8. "Testing the Framework"

**Anti-pattern**: Writing tests that verify behavior of the framework or library instead of your code.

```typescript
// Anti-pattern: Testing React itself
it("should render with props", () => {
  const { getByText } = render(<MyComponent title="Hello" />);
  expect(getByText("Hello")).toBeInTheDocument();
});
```

**Solution**: Focus on testing your application logic and behavior, not the underlying framework.

## Best Practices Summary

1. **Write clear test descriptions** that explain the expected behavior
2. **Follow AAA pattern** for consistent test structure
3. **Test behavior over implementation** details
4. **Use test data builders** for consistent test data
5. **Properly isolate tests** to prevent interdependence
6. **Mock external dependencies** but not the system under test
7. **Use appropriate test types** for different testing needs
8. **Write tests for failure cases** not just happy paths
9. **Keep tests fast** to maintain quick feedback loops
10. **Make tests deterministic** by eliminating flakiness

## Related Documentation

- [Test-First Implementation Guide](mdc:examples/testing/TestFirstImplementationGuide.md)
- [Enterprise Test Strategy](mdc:examples/testing/EnterpriseTestStrategy.md)
- [Test Data Management Guide](mdc:examples/testing/TestDataManagementGuide.md)
- [Testing Environments Architecture](mdc:examples/testing/TestingEnvironmentsArchitecture.md)
