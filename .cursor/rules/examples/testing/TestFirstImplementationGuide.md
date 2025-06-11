# Test-First Implementation Guide

This guide provides a detailed approach to implementing test-first development practices across the enterprise.

## Test-First Development Cycle

The test-first development cycle follows these steps:

```
┌───────────────────┐
│ 1. Write Test     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ 2. Run Test       │◄──────────────────┐
│    (Should Fail)  │                   │
└─────────┬─────────┘                   │
          │                             │
          ▼                             │
┌───────────────────┐                   │
│ 3. Write Code     │                   │
└─────────┬─────────┘                   │
          │                             │
          ▼                             │
┌───────────────────┐                   │
│ 4. Run Test       │                   │
│    (Should Pass)  │                   │
└─────────┬─────────┘                   │
          │                             │
          ▼                             │
┌───────────────────┐                   │
│ 5. Refactor       ├───────────────────┘
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ 6. Commit Code    │
└───────────────────┘
```

## Getting Started with Test-First Development

### Step 1: Write the Test

Begin by understanding the requirements and writing a test that defines the expected behavior:

```typescript
// src/features/cart/tests/addToCart.test.ts
import { addToCart } from "../cartService";
import { Cart, CartItem, Product } from "../types";

describe("addToCart", () => {
  // Setup initial test data
  const initialCart: Cart = {
    items: [],
    totalItems: 0,
    subtotal: 0,
  };

  const product: Product = {
    id: "prod-123",
    name: "Test Product",
    price: 19.99,
    inStock: true,
  };

  it("should add a product to an empty cart", () => {
    // Arrange
    const quantity = 1;

    // Act
    const updatedCart = addToCart(initialCart, product, quantity);

    // Assert
    expect(updatedCart.items).toHaveLength(1);
    expect(updatedCart.items[0]).toEqual({
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      price: product.price,
      totalPrice: product.price * quantity,
    });
    expect(updatedCart.totalItems).toBe(1);
    expect(updatedCart.subtotal).toBe(19.99);
  });

  it("should increase quantity if product already in cart", () => {
    // Arrange
    const existingItem: CartItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      totalPrice: product.price,
    };

    const cartWithItem: Cart = {
      items: [existingItem],
      totalItems: 1,
      subtotal: product.price,
    };

    // Act
    const updatedCart = addToCart(cartWithItem, product, 2);

    // Assert
    expect(updatedCart.items).toHaveLength(1);
    expect(updatedCart.items[0].quantity).toBe(3);
    expect(updatedCart.items[0].totalPrice).toBe(product.price * 3);
    expect(updatedCart.totalItems).toBe(3);
    expect(updatedCart.subtotal).toBe(product.price * 3);
  });

  it("should throw an error if product is out of stock", () => {
    // Arrange
    const outOfStockProduct = { ...product, inStock: false };

    // Act & Assert
    expect(() => addToCart(initialCart, outOfStockProduct, 1)).toThrow(
      "Cannot add out-of-stock product to cart"
    );
  });
});
```

### Step 2: Run the Test (It Should Fail)

Run the test and verify it fails because the implementation does not exist yet. This step confirms that your test is actually testing something and not passing incorrectly.

```bash
# Run specific test
npm test -- --testPathPattern=addToCart.test.ts

# Expected output:
# FAIL src/features/cart/tests/addToCart.test.ts
# Cannot find module '../cartService' from 'src/features/cart/tests/addToCart.test.ts'
```

### Step 3: Write the Code

Implement the minimum code necessary to make the test pass:

```typescript
// src/features/cart/cartService.ts
import { Cart, Product } from "./types";

export function addToCart(
  cart: Cart,
  product: Product,
  quantity: number
): Cart {
  // Validate product is in stock
  if (!product.inStock) {
    throw new Error("Cannot add out-of-stock product to cart");
  }

  // Create a copy of the cart to avoid mutation
  const updatedCart = { ...cart };

  // Look for existing item
  const existingItemIndex = updatedCart.items.findIndex(
    (item) => item.productId === product.id
  );

  if (existingItemIndex >= 0) {
    // Update existing item
    const updatedItems = [...updatedCart.items];
    const item = { ...updatedItems[existingItemIndex] };

    item.quantity += quantity;
    item.totalPrice = item.price * item.quantity;

    updatedItems[existingItemIndex] = item;
    updatedCart.items = updatedItems;
  } else {
    // Add new item
    const newItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
      totalPrice: product.price * quantity,
    };

    updatedCart.items = [...updatedCart.items, newItem];
  }

  // Recalculate cart totals
  updatedCart.totalItems = updatedCart.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  updatedCart.subtotal = updatedCart.items.reduce(
    (total, item) => total + item.totalPrice,
    0
  );

  return updatedCart;
}
```

### Step 4: Run the Test (It Should Pass)

Run the tests again and verify they pass with your implementation:

```bash
# Run specific test
npm test -- --testPathPattern=addToCart.test.ts

# Expected output:
# PASS src/features/cart/tests/addToCart.test.ts
# addToCart
#   ✓ should add a product to an empty cart (5ms)
#   ✓ should increase quantity if product already in cart (1ms)
#   ✓ should throw an error if product is out of stock (1ms)
```

### Step 5: Refactor

Improve the code while keeping the tests passing:

```typescript
// src/features/cart/cartService.ts
import { Cart, CartItem, Product } from "./types";

export function addToCart(
  cart: Cart,
  product: Product,
  quantity: number
): Cart {
  validateProduct(product);

  const existingItem = findExistingItem(cart, product.id);
  const updatedItems = existingItem
    ? updateExistingItem(cart.items, existingItem, quantity)
    : addNewItem(cart.items, product, quantity);

  return {
    items: updatedItems,
    totalItems: calculateTotalItems(updatedItems),
    subtotal: calculateSubtotal(updatedItems),
  };
}

function validateProduct(product: Product): void {
  if (!product.inStock) {
    throw new Error("Cannot add out-of-stock product to cart");
  }
}

function findExistingItem(cart: Cart, productId: string): CartItem | undefined {
  return cart.items.find((item) => item.productId === productId);
}

function updateExistingItem(
  items: CartItem[],
  existingItem: CartItem,
  quantity: number
): CartItem[] {
  return items.map((item) => {
    if (item.productId === existingItem.productId) {
      const newQuantity = item.quantity + quantity;
      return {
        ...item,
        quantity: newQuantity,
        totalPrice: item.price * newQuantity,
      };
    }
    return item;
  });
}

function addNewItem(
  items: CartItem[],
  product: Product,
  quantity: number
): CartItem[] {
  const newItem: CartItem = {
    productId: product.id,
    productName: product.name,
    quantity,
    price: product.price,
    totalPrice: product.price * quantity,
  };

  return [...items, newItem];
}

function calculateTotalItems(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.totalPrice, 0);
}
```

### Step 6: Commit Code

Once the tests pass and you're satisfied with the refactoring, commit your changes:

```bash
git add src/features/cart
git commit -m "Implement addToCart functionality with tests"
```

## Test-First for Different Test Types

### Unit Testing

Unit tests focus on isolated functions or components:

```typescript
// src/utils/formatCurrency.test.ts
import { formatCurrency } from "./formatCurrency";

describe("formatCurrency", () => {
  it("should format whole numbers correctly", () => {
    expect(formatCurrency(100, "USD")).toBe("$100.00");
  });

  it("should format decimal numbers correctly", () => {
    expect(formatCurrency(99.99, "USD")).toBe("$99.99");
  });

  it("should handle different currencies", () => {
    expect(formatCurrency(100, "EUR")).toBe("€100.00");
    expect(formatCurrency(100, "GBP")).toBe("£100.00");
  });

  it("should return 0 value formatted for invalid inputs", () => {
    expect(formatCurrency(NaN, "USD")).toBe("$0.00");
    expect(formatCurrency(undefined as any, "USD")).toBe("$0.00");
  });
});
```

### Integration Testing

Integration tests focus on how components work together:

```typescript
// src/features/order/tests/orderProcessing.integration.test.ts
import { processOrder } from "../orderService";
import { cartService } from "../../cart/cartService";
import { paymentService } from "../../payment/paymentService";
import { inventoryService } from "../../inventory/inventoryService";

// Mock dependencies
jest.mock("../../payment/paymentService");
jest.mock("../../inventory/inventoryService");

describe("Order Processing Integration", () => {
  // Setup test data
  const cart = cartService.createCart();
  const product = {
    id: "prod-1",
    name: "Test Product",
    price: 29.99,
    inStock: true,
  };
  const user = { id: "user-1", email: "test@example.com" };
  const paymentDetails = {
    cardNumber: "4111111111111111",
    expiryDate: "12/25",
    cvv: "123",
  };

  // Add product to cart
  const filledCart = cartService.addToCart(cart, product, 2);

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock implementations
    (paymentService.processPayment as jest.Mock).mockResolvedValue({
      success: true,
      transactionId: "tx-12345",
    });

    (inventoryService.updateInventory as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  it("should process an order successfully", async () => {
    // Act
    const result = await processOrder({
      cart: filledCart,
      user,
      paymentDetails,
      shippingAddress: {
        line1: "123 Test St",
        city: "Testville",
        state: "TS",
        zipCode: "12345",
        country: "US",
      },
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.orderId).toBeDefined();
    expect(result.status).toBe("confirmed");

    // Verify interactions with dependencies
    expect(paymentService.processPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: filledCart.subtotal,
        currency: "USD",
        paymentDetails,
      })
    );

    expect(inventoryService.updateInventory).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ productId: product.id, quantity: 2 }],
      })
    );
  });

  it("should handle payment failures", async () => {
    // Setup payment failure
    (paymentService.processPayment as jest.Mock).mockResolvedValue({
      success: false,
      error: "Payment declined",
    });

    // Act
    const result = await processOrder({
      cart: filledCart,
      user,
      paymentDetails,
      shippingAddress: {
        line1: "123 Test St",
        city: "Testville",
        state: "TS",
        zipCode: "12345",
        country: "US",
      },
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe("Payment declined");

    // Verify inventory was not updated
    expect(inventoryService.updateInventory).not.toHaveBeenCalled();
  });
});
```

### End-to-End Testing

E2E tests verify entire workflows:

```typescript
// cypress/integration/checkout.spec.ts
describe("Checkout Flow", () => {
  beforeEach(() => {
    // Setup test state
    cy.task("db:seed", "test-products");
    cy.task("db:seed", "test-user");

    // Log in
    cy.visit("/login");
    cy.get("#email").type("test@example.com");
    cy.get("#password").type("TestPassword123!");
    cy.get('button[type="submit"]').click();

    // Navigate to product page
    cy.visit("/products/test-product-1");
  });

  it("should allow a user to complete checkout", () => {
    // Add product to cart
    cy.get('[data-test="add-to-cart-button"]').click();

    // Verify cart updated
    cy.get('[data-test="cart-count"]').should("have.text", "1");

    // Go to cart
    cy.get('[data-test="cart-icon"]').click();

    // Verify product in cart
    cy.get('[data-test="cart-item"]').should("have.length", 1);
    cy.get('[data-test="product-name"]').should("contain", "Test Product");

    // Proceed to checkout
    cy.get('[data-test="checkout-button"]').click();

    // Fill shipping information
    cy.get("#shipping-address-line1").type("123 Test St");
    cy.get("#shipping-address-city").type("Testville");
    cy.get("#shipping-address-state").select("CA");
    cy.get("#shipping-address-zip").type("12345");
    cy.get('[data-test="continue-to-payment"]').click();

    // Fill payment information
    cy.get("#card-number").type("4111111111111111");
    cy.get("#card-expiry").type("12/25");
    cy.get("#card-cvc").type("123");
    cy.get('[data-test="place-order-button"]').click();

    // Verify order confirmation
    cy.url().should("include", "/order-confirmation");
    cy.get('[data-test="order-number"]').should("exist");
    cy.get('[data-test="order-status"]').should("contain", "Confirmed");
  });
});
```

## Test-First for Different Domains

### API Endpoints

```typescript
// src/api/products/tests/getProduct.test.ts
import request from "supertest";
import { app } from "../../../app";
import { prisma } from "../../../db";

describe("GET /api/products/:id", () => {
  const testProduct = {
    id: "test-product-id",
    name: "Test Product",
    price: 19.99,
    description: "A test product",
    inStock: true,
  };

  beforeAll(async () => {
    // Seed test database
    await prisma.product.create({
      data: testProduct,
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.product.delete({
      where: { id: testProduct.id },
    });
  });

  it("should return a product by id", async () => {
    const response = await request(app)
      .get(`/api/products/${testProduct.id}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: testProduct.id,
      name: testProduct.name,
      price: testProduct.price,
    });
  });

  it("should return 404 for non-existent product", async () => {
    const response = await request(app)
      .get("/api/products/non-existent-id")
      .set("Accept", "application/json");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: "Product not found",
    });
  });
});
```

### UI Components

```typescript
// src/components/Button/Button.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("should render with default variant", () => {
    render(<Button>Click Me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("btn-primary");
  });

  it("should render with specified variant", () => {
    render(<Button variant="secondary">Click Me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveClass("btn-secondary");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Click Me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeDisabled();
  });

  it("should call onClick handler when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick when disabled", () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click Me
      </Button>
    );

    const button = screen.getByRole("button", { name: /click me/i });
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

## Common Challenges and Solutions

### Challenge: "I don't know what to test"

**Solution**: Start by identifying the requirements and acceptance criteria. Each requirement should have at least one test. Consider the following test categories:

- **Functional correctness**: Does the code do what it's supposed to?
- **Error handling**: Does it handle invalid inputs and edge cases?
- **Performance**: Does it meet performance requirements?
- **Security**: Does it prevent security vulnerabilities?

### Challenge: "Tests take too long to write"

**Solution**: Start with the most critical paths and build your test suite incrementally. Use test generators and utilities to reduce boilerplate. As you gain experience, you'll find that tests become faster to write and save time in the long run by preventing bugs.

### Challenge: "Tests are fragile and break too often"

**Solution**: Focus on testing behavior rather than implementation details. Use test doubles (mocks, stubs) judiciously. Refactor tests when they become brittle. Follow these principles:

- Test public APIs, not private implementation
- Prefer shallow rendering for UI components
- Use data-test attributes for UI selectors instead of CSS classes
- Avoid excessive mocking

### Challenge: "What about legacy code without tests?"

**Solution**: Use the "Legacy Code Change Algorithm":

1. Identify change points
2. Find test points
3. Break dependencies
4. Write characterization tests
5. Make changes
6. Refactor

Start by adding tests for the code you need to change, then implement your changes while keeping the tests passing.

## Measuring Testing Effectiveness

### Coverage Metrics

Set up test coverage reporting to track:

- **Line coverage**: Percentage of executable lines that are executed
- **Branch coverage**: Percentage of branches (if/else, switch) that are executed
- **Function coverage**: Percentage of functions that are called
- **Statement coverage**: Percentage of statements that are executed

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    "src/features/payment/**/*.ts": {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
```

### Mutation Testing

Use mutation testing to verify the quality of your tests:

```bash
npx stryker run
```

Mutation testing makes small changes to your code and verifies that your tests detect these changes. If a mutation survives, it indicates a gap in your test coverage.

## Integration with CI/CD

Configure your CI/CD pipeline to enforce test-first practices:

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test -- --coverage

      - name: Check coverage thresholds
        run: npm run test:coverage:check

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

      - name: Run mutation testing
        run: npx stryker run
```

## Common Test Patterns

### Arrange-Act-Assert

Structure your tests with the AAA pattern:

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

### Given-When-Then (BDD)

For behavior-driven development:

```typescript
describe("Shopping Cart", () => {
  it("should calculate correct totals when adding products", () => {
    // Given
    const cart = new ShoppingCart();
    const product = { id: "p1", name: "Product 1", price: 29.99 };

    // When
    cart.addItem(product, 2);

    // Then
    expect(cart.itemCount).toBe(2);
    expect(cart.subtotal).toBe(59.98);
  });
});
```

### Test Data Builders

Create reusable test data builders:

```typescript
class UserBuilder {
  private user: Partial<User> = {
    id: "user-123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "customer",
  };

  withId(id: string): UserBuilder {
    this.user.id = id;
    return this;
  }

  withEmail(email: string): UserBuilder {
    this.user.email = email;
    return this;
  }

  withRole(role: string): UserBuilder {
    this.user.role = role;
    return this;
  }

  build(): User {
    return this.user as User;
  }
}

// Usage in tests
const adminUser = new UserBuilder().withRole("admin").build();
```

### Parameterized Tests

Run the same test with different inputs:

```typescript
describe("validateEmail", () => {
  test.each([
    ["test@example.com", true],
    ["invalid-email", false],
    ["test@example", false],
    ["test@.com", false],
    ["@example.com", false],
  ])("validateEmail(%s) should return %s", (email, expected) => {
    expect(validateEmail(email)).toBe(expected);
  });
});
```

## Conclusion

Test-first development is a powerful approach that improves code quality, reduces defects, and provides documentation of system behavior. By writing tests before implementation, you ensure that your code is testable, meets requirements, and handles edge cases appropriately. Follow the test-first workflow and use the patterns described in this guide to implement effective test-first development in your projects.
