# Stable Interfaces Implementation Guide

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide provides comprehensive examples of implementing stable interfaces as described in [104-stable-interfaces.mdc](mdc:departments/engineering/coding-standards/104-stable-interfaces.mdc).

## Table of Contents

1. [Interface Classification System](#interface-classification-system)
2. [Implementation Patterns by Type](#implementation-patterns-by-type)
3. [Versioning Approaches](#versioning-approaches)
4. [Contract Testing](#contract-testing)
5. [Interface Registry Management](#interface-registry-management)
6. [Deprecation Strategies](#deprecation-strategies)

## Interface Classification System

### Classification Taxonomy

Interfaces in the enterprise should be classified according to this system:

| Classification   | Description                                                      | Change Policy                              | Required Processes                                       |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| **Locked**       | Critical, widely-used interfaces where changes have major impact | No changes without formal approval         | RFC, Review Board Approval, Full Testing, Registry Entry |
| **Stable**       | Production interfaces with established consumers                 | Additive-only changes, no breaking changes | Change Documentation, Testing, Registry Entry            |
| **Experimental** | New interfaces still being refined                               | Changes allowed, must be communicated      | Change Notification, Testing                             |
| **Internal**     | Implementation details not exposed outside module                | Can change as needed                       | Normal code review                                       |

### Identifying Classification Needs

When determining interface classification, consider:

1. **Scope of Usage**: How many systems/teams consume the interface?
2. **Business Impact**: What would be the impact of a breaking change?
3. **Regulatory Requirements**: Are there compliance reasons to lock an interface?
4. **SLA Requirements**: Does the interface support critical service level agreements?
5. **Integration Complexity**: How difficult would it be for consumers to adapt to changes?

### Documentation Patterns

#### JavaScript/TypeScript Interface Classification

```typescript
/**
 * @api PaymentProcessingAPI
 * @stability LOCKED
 * @version 1.3.2
 * @since 2022-06-15
 * @owners payments-team@example.com
 * @changeProcess RFC required, approval from Payments and Finance teams
 * @reviewCycle Quarterly
 *
 * @ai-preserve
 * This API is LOCKED and requires formal approval process for any changes.
 * See RFC process at https://internal.example.com/rfc/payment-api
 */
export interface PaymentProcessingAPI {
  // Interface definition...
}
```

#### Java Interface Classification

```java
/**
 * Data access layer for customer information.
 *
 * @stability STABLE
 * @version 2.4.1
 * @since 2023-01-10
 * @owners customer-data-team@example.com
 */
public interface CustomerRepository {
    /**
     * Finds a customer by their unique identifier.
     *
     * @stable since v1.0.0
     * @param id The customer ID
     * @return The customer or empty if not found
     */
    Optional<Customer> findById(UUID id);

    /**
     * Creates a new customer record.
     *
     * @stable since v1.0.0
     * @param customer The customer to create
     * @return The created customer with generated ID
     */
    Customer create(Customer customer);

    /**
     * Updates an existing customer record.
     *
     * @stable since v1.5.0
     * @param id The customer ID
     * @param customer The updated customer data
     * @return The updated customer
     * @throws NotFoundException if customer doesn't exist
     */
    Customer update(UUID id, Customer customer);

    /**
     * Deletes a customer record.
     *
     * @experimental since v2.3.0
     * @stabilityTarget v2.5.0
     * @param id The customer ID
     * @throws NotFoundException if customer doesn't exist
     */
    void delete(UUID id);
}
```

#### Python Interface Classification

```python
class UserService:
    """User management service for account operations.

    Attributes:
        None

    Stability:
        STABLE since 2022-11-05
        Version: 3.1.0
        Owners: user-team@example.com
    """

    def get_user(self, user_id: str) -> User:
        """Retrieves a user by ID.

        Args:
            user_id: The unique identifier of the user

        Returns:
            The user object

        Raises:
            UserNotFoundError: If user doesn't exist

        Stability:
            Stable since v1.0.0
        """
        # Implementation

    def create_user(self, user_data: dict) -> User:
        """Creates a new user.

        Args:
            user_data: Dictionary containing user information

        Returns:
            The created user object

        Raises:
            ValidationError: If user data is invalid

        Stability:
            Stable since v1.0.0
        """
        # Implementation
```

## Implementation Patterns by Type

### API Interface Implementation

#### RESTful API with Versioning

```typescript
/**
 * @api UserAPI
 * @stability STABLE
 * @version 2.0.0
 * @since 2022-05-15
 * @owners user-team@example.com
 */
export class UserController {
  /**
   * Get user by ID
   * @stable since v1.0.0
   */
  @Get("/api/v2/users/:id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "User found", type: UserResponseV2 })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserById(@Param("id") id: string): Promise<UserResponseV2> {
    // Implementation
  }

  /**
   * Create a new user
   * @stable since v1.0.0
   */
  @Post("/api/v2/users")
  @ApiOperation({ summary: "Create user" })
  @ApiResponse({
    status: 201,
    description: "User created",
    type: UserResponseV2,
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  async createUser(@Body() user: CreateUserRequestV2): Promise<UserResponseV2> {
    // Implementation
  }

  /**
   * Update user by ID
   * @stable since v1.5.0
   */
  @Put("/api/v2/users/:id")
  @ApiOperation({ summary: "Update user" })
  @ApiResponse({
    status: 200,
    description: "User updated",
    type: UserResponseV2,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async updateUser(
    @Param("id") id: string,
    @Body() user: UpdateUserRequestV2
  ): Promise<UserResponseV2> {
    // Implementation
  }

  /**
   * Delete user by ID (admin only)
   * @experimental since v2.0.0
   * @stabilityTarget v2.2.0
   */
  @Delete("/api/v2/users/:id")
  @ApiOperation({ summary: "Delete user" })
  @ApiResponse({ status: 204, description: "User deleted" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async deleteUser(@Param("id") id: string): Promise<void> {
    // Implementation
  }
}
```

### UI Component Interface Implementation

```tsx
/**
 * @component Form
 * @stability STABLE
 * @version 3.2.1
 * @since 2022-08-10
 * @owners ui-platform@example.com
 */
export interface FormProps {
  /**
   * Initial values for form fields
   * @stable since v1.0.0
   */
  initialValues?: Record<string, any>;

  /**
   * Handler called when form is submitted
   * @stable since v1.0.0
   */
  onSubmit: (values: Record<string, any>) => void | Promise<void>;

  /**
   * Validation schema for form fields
   * @stable since v1.2.0
   */
  validationSchema?: any;

  /**
   * Children render prop or JSX
   * @stable since v1.0.0
   */
  children: React.ReactNode | ((formProps: FormChildProps) => React.ReactNode);

  /**
   * Auto-save form changes while editing
   * @experimental since v3.1.0
   * @stabilityTarget v3.3.0
   */
  autoSave?: boolean;

  /**
   * Interval (ms) for auto-save
   * @experimental since v3.1.0
   * @stabilityTarget v3.3.0
   */
  autoSaveInterval?: number;
}

/**
 * Form component for managed form state
 */
export const Form: React.FC<FormProps> = (props) => {
  // Implementation
};
```

## Versioning Approaches

### Semantic Versioning for Interfaces

For interfaces using semantic versioning:

```typescript
/**
 * @api DataProcessingService
 * @stability STABLE
 * @version 2.4.1 (major.minor.patch)
 * @versionPolicy Semantic Versioning
 * @breakingChanges Require major version bump
 * @since 2022-12-15
 * @owners data-team@example.com
 */
export interface DataProcessingService {
  // Interface definition...
}
```

Version bump rules:

- **MAJOR** (2.4.1 → 3.0.0): Breaking changes (removing methods, changing signatures)
- **MINOR** (2.4.1 → 2.5.0): New features, backward compatible additions
- **PATCH** (2.4.1 → 2.4.2): Bug fixes, documentation, non-functional changes

### URL Path Versioning for APIs

```typescript
// Original API (v1)
@Controller("/api/v1/products")
export class ProductControllerV1 {
  @Get("/")
  getAllProducts(): Promise<ProductV1[]> {
    /* ... */
  }

  @Get("/:id")
  getProductById(@Param("id") id: string): Promise<ProductV1> {
    /* ... */
  }
}

// New API version with breaking changes (v2)
@Controller("/api/v2/products")
export class ProductControllerV2 {
  @Get("/")
  getAllProducts(
    @Query("category") category?: string,
    @Query("limit") limit = 20,
    @Query("page") page = 1
  ): Promise<PaginatedResponse<ProductV2>> {
    /* ... */
  }

  @Get("/:id")
  getProductById(@Param("id") id: string): Promise<ProductV2> {
    /* ... */
  }

  @Get("/:id/related")
  getRelatedProducts(@Param("id") id: string): Promise<ProductV2[]> {
    /* ... */
  }
}
```

### Interface Evolution Strategies

#### 1. Inheritance for Interface Evolution

```typescript
// Base interface - remains stable
export interface PaymentProcessorV1 {
  processPayment(amount: number, cardToken: string): Promise<PaymentResult>;
  refundPayment(paymentId: string): Promise<RefundResult>;
}

// Extended interface with new capabilities
export interface PaymentProcessorV2 extends PaymentProcessorV1 {
  processSubscription(
    planId: string,
    cardToken: string
  ): Promise<SubscriptionResult>;
}
```

#### 2. Composition for Interface Evolution

```typescript
// Original interface - remains stable
export interface UserManagementV1 {
  getUser(id: string): Promise<User>;
  createUser(data: CreateUserInput): Promise<User>;
  updateUser(id: string, data: UpdateUserInput): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

// New capability as separate interface
export interface UserPermissionsManagement {
  getUserPermissions(userId: string): Promise<Permission[]>;
  grantPermission(userId: string, permission: Permission): Promise<void>;
  revokePermission(userId: string, permissionId: string): Promise<void>;
}

// Composite service that implements both interfaces
export class UserService
  implements UserManagementV1, UserPermissionsManagement {
  // Implementation of all methods
}
```

## Contract Testing

### Consumer-Driven Contract Tests

```typescript
// Interface definition
/**
 * @api OrderProcessingService
 * @stability LOCKED
 * @version 1.5.0
 */
export interface OrderProcessingService {
  submitOrder(order: Order): Promise<OrderResult>;
  getOrderStatus(orderId: string): Promise<OrderStatus>;
  cancelOrder(orderId: string): Promise<void>;
}

// Contract test for the interface
describe("OrderProcessingService Contract", () => {
  let service: OrderProcessingService;

  beforeEach(() => {
    service = createOrderProcessingService();
  });

  describe("submitOrder()", () => {
    it("should accept a valid order and return success result", async () => {
      const order: Order = {
        items: [{ productId: "p123", quantity: 2 }],
        customer: { id: "c456" },
        shippingAddress: { country: "US", zipCode: "10001" },
      };

      const result = await service.submitOrder(order);

      expect(result).toBeDefined();
      expect(result.orderId).toMatch(/^ord_/);
      expect(result.status).toEqual("confirmed");
      expect(result.estimatedDelivery).toBeInstanceOf(Date);
    });

    it("should reject invalid orders with appropriate error", async () => {
      const invalidOrder: Order = {
        items: [],
        customer: { id: "c456" },
        shippingAddress: { country: "US", zipCode: "10001" },
      };

      await expect(service.submitOrder(invalidOrder)).rejects.toThrow(
        "Order must contain at least one item"
      );
    });
  });

  // Additional tests for other methods...
});
```

## Interface Registry Management

### Interface Registry Maintenance

The Interface Registry should be maintained through automated processes:

1. Extract interface metadata from code during build process
2. Update centralized registry with discovered interfaces
3. Run compliance checks on interfaces against their declared stability
4. Generate reports for stakeholders

### Registry Implementation Example

```typescript
// Interface registry service
class InterfaceRegistryService {
  /**
   * Register a new interface or update an existing one
   */
  async registerInterface(interfaceInfo: InterfaceInfo): Promise<void> {
    // Implementation
  }

  /**
   * Lock an interface to prevent future changes
   */
  async lockInterface(
    interfaceName: string,
    lockInfo: LockInfo
  ): Promise<void> {
    // Implementation
  }

  /**
   * Request approval for modification of a locked interface
   */
  async requestModificationApproval(
    interfaceName: string,
    changeRequest: ChangeRequest
  ): Promise<string> {
    // Implementation
  }

  /**
   * Generate a report of interfaces by stability classification
   */
  async generateStabilityReport(): Promise<StabilityReport> {
    // Implementation
  }
}
```

## Deprecation Strategies

### Explicit Deprecation Notices

```typescript
export interface PaymentService {
  /**
   * Process a payment
   * @stable since v1.0.0
   */
  processPayment(amount: number, cardToken: string): Promise<PaymentResult>;

  /**
   * Refund a payment
   * @stable since v1.0.0
   */
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;

  /**
   * Authorize a payment without capturing
   * @deprecated since v2.5.0, use createPaymentIntent() instead
   * @removalVersion v3.0.0
   * @stable since v1.5.0
   */
  authorizePayment(
    amount: number,
    cardToken: string
  ): Promise<AuthorizationResult>;

  /**
   * Create a payment intent
   * @stable since v2.0.0
   * @replaces authorizePayment
   */
  createPaymentIntent(
    amount: number,
    paymentMethod: string,
    options?: PaymentIntentOptions
  ): Promise<PaymentIntent>;
}
```

### Deprecation Process Timeline

For stable interfaces, follow this deprecation timeline:

1. **Mark as Deprecated**: Add `@deprecated` tag with alternative and reasoning
2. **Deprecation Period**: Maintain deprecated features for at least 6-12 months
3. **Warning Period**: Generate runtime warnings for 3 months before removal
4. **Removal Notice**: Give minimum 30 days explicit notice before final removal
5. **Removal**: Remove in a major version update with clear documentation

## Best Practices Summary

1. **Classify All Interfaces**: Every interface must have an explicit stability classification
2. **Default to Stable**: When in doubt, classify an interface as Stable
3. **Lock Critical Interfaces**: Use the Locked classification for business-critical or widely-used interfaces
4. **Versioning is Required**: All public interfaces must have explicit version information
5. **Contract Testing**: Implement comprehensive contract tests for all interfaces
6. **Registry Documentation**: Keep the interface registry updated with all tracked interfaces
7. **Change Management**: Follow proper change processes based on interface classification
8. **CI Verification**: Automate interface contract verification in CI/CD pipelines
