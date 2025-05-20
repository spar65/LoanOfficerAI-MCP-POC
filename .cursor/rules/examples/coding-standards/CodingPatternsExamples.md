# Coding Patterns & Best Practices Examples

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide provides concrete examples of coding patterns and best practices following the guidelines in [100-coding-patterns.mdc](mdc:departments/engineering/coding-standards/100-coding-patterns.mdc).

## Table of Contents

1. [Code Organization](#code-organization)
2. [Function & Method Design](#function-and-method-design)
3. [Error Handling](#error-handling)
4. [Language-Specific Patterns](#language-specific-patterns)
5. [Clean Code Examples](#clean-code-examples)
6. [Testing Patterns](#testing-patterns)
7. [Performance Considerations](#performance-considerations)
8. [Large File Refactoring](#large-file-refactoring)

## Code Organization

### Module Structure

Well-organized code clearly separates concerns:

```typescript
// Bad: Mixed responsibilities in a single file
export function fetchUserData() {
  /* ... */
}
export function validateUserData() {
  /* ... */
}
export function renderUserProfile() {
  /* ... */
}
export function handleUserEvents() {
  /* ... */
}

// Good: Separated concerns in specialized modules
// userApi.ts
export function fetchUserData() {
  /* ... */
}
export function updateUserData() {
  /* ... */
}

// userValidation.ts
export function validateUserData() {
  /* ... */
}
export function validateUserPermissions() {
  /* ... */
}

// userComponent.ts
export function renderUserProfile() {
  /* ... */
}
export function handleUserEvents() {
  /* ... */
}
```

### Directory Organization

Structure directories by feature or domain:

```
// Bad: Organizing by type
src/
  components/
    Button.tsx
    UserProfile.tsx
    ProductCard.tsx
    SearchBar.tsx
  hooks/
    useAuth.ts
    useProducts.ts
    useSearch.ts
  utils/
    auth.ts
    products.ts
    search.ts

// Good: Organizing by feature
src/
  shared/
    components/
      Button.tsx
    hooks/
      useOutsideClick.ts
    utils/
      formatting.ts
  features/
    auth/
      components/
        LoginForm.tsx
      hooks/
        useAuth.ts
      utils/
        auth.ts
    products/
      components/
        ProductCard.tsx
      hooks/
        useProducts.ts
      utils/
        productTransforms.ts
    search/
      components/
        SearchBar.tsx
      hooks/
        useSearch.ts
```

## Function and Method Design

### Function Size and Responsibility

Functions should do one thing well:

```typescript
// Bad: Function doing multiple things
function processUserData(userData) {
  // Validate data
  if (!userData.name) {
    throw new Error("Name is required");
  }
  if (!userData.email || !userData.email.includes("@")) {
    throw new Error("Valid email is required");
  }

  // Transform data
  const transformedData = {
    displayName: userData.name.trim(),
    emailAddress: userData.email.toLowerCase(),
    createdAt: new Date().toISOString(),
  };

  // Save to database
  const db = connectToDatabase();
  const result = db.users.insert(transformedData);

  // Send welcome email
  const emailService = new EmailService();
  emailService.sendWelcomeEmail(
    transformedData.emailAddress,
    transformedData.displayName
  );

  return result;
}

// Good: Single responsibility functions with composition
function validateUserData(userData) {
  if (!userData.name) {
    throw new Error("Name is required");
  }
  if (!userData.email || !userData.email.includes("@")) {
    throw new Error("Valid email is required");
  }
  return userData;
}

function transformUserData(userData) {
  return {
    displayName: userData.name.trim(),
    emailAddress: userData.email.toLowerCase(),
    createdAt: new Date().toISOString(),
  };
}

function saveUserToDatabase(transformedData) {
  const db = connectToDatabase();
  return db.users.insert(transformedData);
}

function sendWelcomeEmail(user) {
  const emailService = new EmailService();
  return emailService.sendWelcomeEmail(user.emailAddress, user.displayName);
}

// Orchestration function
async function processUserData(userData) {
  const validatedData = validateUserData(userData);
  const transformedData = transformUserData(validatedData);
  const savedUser = await saveUserToDatabase(transformedData);
  await sendWelcomeEmail(transformedData);
  return savedUser;
}
```

### Parameter Handling

Use object destructuring for clarity:

```typescript
// Bad: Many parameters without clear purpose
function createUser(name, email, age, role, isActive, createdBy) {
  // ...
}

// Good: Destructured object parameters
function createUser({
  name,
  email,
  age,
  role = "user",
  isActive = true,
  createdBy = "system",
}) {
  // ...
}

// Calling with named parameters
createUser({
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  role: "admin",
});
```

## Error Handling

### Centralized Error Handling

Create a consistent error handling approach:

```typescript
// api.ts - Centralized error handling
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      // Handle different error status codes
      switch (response.status) {
        case 401:
          throw new AuthenticationError("Authentication required");
        case 403:
          throw new AuthorizationError("Not authorized");
        case 404:
          throw new NotFoundError(`Resource not found: ${url}`);
        default:
          throw new ApiError(`API error: ${response.status}`, response.status);
      }
    }

    return await response.json();
  } catch (error) {
    // Convert fetch errors to our custom error types
    if (error.name === "AbortError") {
      throw new RequestTimeoutError("Request timed out");
    }
    if (error.name === "TypeError" && error.message.includes("NetworkError")) {
      throw new NetworkError("Network error occurred");
    }

    // Rethrow our custom errors
    throw error;
  }
}

// Usage in application code
async function getUserProfile(userId) {
  try {
    return await apiRequest(`/api/users/${userId}`);
  } catch (error) {
    if (error instanceof NotFoundError) {
      // Handle specific error type
      return { status: "not_found", userId };
    }
    if (error instanceof AuthenticationError) {
      // Redirect to login
      router.push("/login");
      return null;
    }
    // General error handling
    console.error("Failed to fetch user profile:", error);
    return { status: "error", message: error.message };
  }
}
```

### Try-Catch Best Practices

```typescript
// Bad: Overly broad catch block
try {
  // Many operations
  const data = JSON.parse(rawData);
  const transformedData = transform(data);
  const result = saveToDatabase(transformedData);
  return result;
} catch (error) {
  console.error("Error occurred", error);
  return null;
}

// Good: Specific try-catch blocks
function processData(rawData) {
  // Parse JSON in its own try-catch
  let data;
  try {
    data = JSON.parse(rawData);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    throw new InvalidDataError("Invalid JSON data");
  }

  // Process in its own try-catch
  let transformedData;
  try {
    transformedData = transform(data);
  } catch (error) {
    console.error("Failed to transform data:", error);
    throw new ProcessingError("Data transformation failed");
  }

  // Database operations in its own try-catch
  try {
    return saveToDatabase(transformedData);
  } catch (error) {
    console.error("Failed to save to database:", error);
    throw new DatabaseError("Database operation failed");
  }
}
```

## Language-Specific Patterns

### TypeScript / JavaScript

#### Using TypeScript Interfaces

```typescript
// Define clear interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
  createdAt: Date;
}

interface UserCreateParams {
  name: string;
  email: string;
  role?: "admin" | "user" | "guest";
}

// Use interfaces in functions
function createUser(params: UserCreateParams): User {
  return {
    id: generateId(),
    name: params.name,
    email: params.email,
    role: params.role || "user",
    createdAt: new Date(),
  };
}

// Function with generic types
function sortCollection<T>(
  items: T[],
  sortKey: keyof T,
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...items].sort((a, b) => {
    if (direction === "asc") {
      return a[sortKey] > b[sortKey] ? 1 : -1;
    } else {
      return a[sortKey] < b[sortKey] ? 1 : -1;
    }
  });
}

// Usage
const users: User[] = [
  /* ... */
];
const sortedUsers = sortCollection(users, "name", "asc");
```

#### React Hooks Organization

```typescript
// Bad: Mixed concerns in a component
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  // Rest of component...
}

// Good: Custom hook for data fetching
function useUser(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();

        if (isMounted) {
          setUser(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { user, loading, error };
}

// Usage in component
function UserProfile({ userId }) {
  const { user, loading, error } = useUser(userId);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <NotFound />;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      {/* ... */}
    </div>
  );
}
```

### Python

#### Class Structure

```python
# Well-structured Python class
class UserService:
    """Service for managing user-related operations."""

    def __init__(self, db_connection, logger, config):
        """Initialize the UserService.

        Args:
            db_connection: Database connection object
            logger: Logger instance
            config: Configuration dictionary
        """
        self.db = db_connection
        self.logger = logger
        self.config = config
        self.cache_ttl = config.get('cache_ttl', 300)  # 5 minutes default

    def get_user(self, user_id):
        """Retrieve a user by ID.

        Args:
            user_id: The unique identifier of the user

        Returns:
            dict: User data if found, None otherwise

        Raises:
            ValueError: If user_id is invalid
            DatabaseError: If a database error occurs
        """
        if not user_id:
            raise ValueError("User ID cannot be empty")

        try:
            query = "SELECT * FROM users WHERE id = %s"
            result = self.db.execute(query, (user_id,))
            user = result.fetchone()

            if user:
                self.logger.info(f"User {user_id} retrieved successfully")
                return dict(user)
            else:
                self.logger.info(f"User {user_id} not found")
                return None

        except Exception as e:
            self.logger.error(f"Error retrieving user {user_id}: {str(e)}")
            raise DatabaseError(f"Failed to retrieve user: {str(e)}")

    def create_user(self, user_data):
        """Create a new user.

        Args:
            user_data (dict): User data containing name, email, etc.

        Returns:
            dict: Created user with ID

        Raises:
            ValidationError: If user data is invalid
            DatabaseError: If creation fails
        """
        self._validate_user_data(user_data)

        # Implementation details...

    def _validate_user_data(self, user_data):
        """Validate user data before creation/update.

        Args:
            user_data (dict): User data to validate

        Raises:
            ValidationError: If validation fails
        """
        # Private validation method
        if not user_data.get('name'):
            raise ValidationError("Name is required")

        if not user_data.get('email'):
            raise ValidationError("Email is required")

        # More validation...
```

## Clean Code Examples

### Descriptive Naming

```typescript
// Bad: Unclear naming
function calc(a, d) {
  return a + a * (d / 100);
}

// Good: Descriptive naming
function calculatePriceWithTax(basePrice, taxPercentage) {
  return basePrice + basePrice * (taxPercentage / 100);
}
```

### Boolean Simplification

```typescript
// Bad: Complex boolean expressions
if (
  user !== null &&
  user !== undefined &&
  user.isActive === true &&
  (user.role === "admin" || user.role === "moderator")
) {
  // Allow access
}

// Good: Simplified with helper functions
function isActiveAdminOrModerator(user) {
  if (!user) return false;
  return user.isActive && ["admin", "moderator"].includes(user.role);
}

if (isActiveAdminOrModerator(user)) {
  // Allow access
}
```

### Removing Magic Numbers

```typescript
// Bad: Using magic numbers
function calculateShipping(weight, distance) {
  if (weight < 5) {
    return distance * 0.5;
  } else if (weight < 20) {
    return distance * 0.75;
  } else {
    return distance * 1.2;
  }
}

// Good: Using named constants
const SHIPPING_RATES = {
  LIGHT_PACKAGE_WEIGHT: 5,
  MEDIUM_PACKAGE_WEIGHT: 20,
  LIGHT_PACKAGE_RATE: 0.5,
  MEDIUM_PACKAGE_RATE: 0.75,
  HEAVY_PACKAGE_RATE: 1.2,
};

function calculateShipping(weight, distance) {
  if (weight < SHIPPING_RATES.LIGHT_PACKAGE_WEIGHT) {
    return distance * SHIPPING_RATES.LIGHT_PACKAGE_RATE;
  } else if (weight < SHIPPING_RATES.MEDIUM_PACKAGE_WEIGHT) {
    return distance * SHIPPING_RATES.MEDIUM_PACKAGE_RATE;
  } else {
    return distance * SHIPPING_RATES.HEAVY_PACKAGE_RATE;
  }
}
```

## Testing Patterns

### Unit Test Organization

```typescript
// Good test organization using describe blocks
describe("UserService", () => {
  // Setup and teardown
  beforeEach(() => {
    // Setup test environment
  });

  afterEach(() => {
    // Clean up after tests
  });

  // Group related tests
  describe("getUser()", () => {
    it("should return user data when valid ID is provided", async () => {
      // Test implementation
    });

    it("should return null when user does not exist", async () => {
      // Test implementation
    });

    it("should throw an error when database fails", async () => {
      // Test implementation
    });
  });

  describe("createUser()", () => {
    it("should create a new user with valid data", async () => {
      // Test implementation
    });

    it("should validate required fields", async () => {
      // Test implementation
    });

    // More tests...
  });
});
```

### Test Doubles

```typescript
// Using test doubles (mocks, stubs, etc.)
describe("UserController", () => {
  // Mock dependencies
  let mockUserService;
  let controller;

  beforeEach(() => {
    // Create test doubles
    mockUserService = {
      getUser: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
    };

    // Inject mocks into the system under test
    controller = new UserController(mockUserService);
  });

  describe("getUserProfile()", () => {
    it("should return user profile when user exists", async () => {
      // Arrange
      const mockUser = { id: "123", name: "Test User" };
      mockUserService.getUser.mockResolvedValue(mockUser);

      // Act
      const result = await controller.getUserProfile("123");

      // Assert
      expect(mockUserService.getUser).toHaveBeenCalledWith("123");
      expect(result).toEqual({
        success: true,
        data: mockUser,
      });
    });

    it("should return not found when user does not exist", async () => {
      // Arrange
      mockUserService.getUser.mockResolvedValue(null);

      // Act
      const result = await controller.getUserProfile("not-found");

      // Assert
      expect(mockUserService.getUser).toHaveBeenCalledWith("not-found");
      expect(result).toEqual({
        success: false,
        error: "User not found",
      });
    });
  });
});
```

## Performance Considerations

### Expensive Operation Optimization

```typescript
// Bad: Recalculating expensive operations unnecessarily
function processItems(items) {
  return items.map((item) => {
    const processedData = expensiveCalculation(item.data);
    return {
      id: item.id,
      result: processedData * 2,
    };
  });
}

// Good: Optimizing with memoization
const memoizedExpensiveCalculation = memoize(expensiveCalculation);

function processItems(items) {
  return items.map((item) => {
    const processedData = memoizedExpensiveCalculation(item.data);
    return {
      id: item.id,
      result: processedData * 2,
    };
  });
}

// Simple memoization implementation
function memoize(fn) {
  const cache = new Map();

  return function (arg) {
    const key = JSON.stringify(arg);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(arg);
    cache.set(key, result);
    return result;
  };
}
```

### Efficient Data Structures

```typescript
// Bad: Linear search in array
function findUserById(users, id) {
  return users.find((user) => user.id === id);
}

// Good: Using a Map for O(1) lookups
function createUserMap(users) {
  return new Map(users.map((user) => [user.id, user]));
}

function findUserById(userMap, id) {
  return userMap.get(id);
}

// Usage
const users = [
  /* Array of user objects */
];
const userMap = createUserMap(users);

// Fast lookup
const user = findUserById(userMap, "123");
```

## Large File Refactoring

### Breaking Up Large Files

#### Before: Large UserManager.js (300+ lines)

```typescript
// UserManager.js - Too large file with mixed responsibilities
export class UserManager {
  constructor(database, authService, emailService) {
    this.database = database;
    this.authService = authService;
    this.emailService = emailService;
  }

  // Authentication methods
  async login(email, password) {
    // Login implementation...
  }

  async logout(userId) {
    // Logout implementation...
  }

  async resetPassword(email) {
    // Reset password implementation...
  }

  // User profile methods
  async getUserProfile(userId) {
    // Get profile implementation...
  }

  async updateUserProfile(userId, profileData) {
    // Update profile implementation...
  }

  async uploadProfilePicture(userId, picture) {
    // Upload picture implementation...
  }

  // User administration methods
  async getAllUsers(page, limit) {
    // List users implementation...
  }

  async createUser(userData) {
    // Create user implementation...
  }

  async deleteUser(userId) {
    // Delete user implementation...
  }

  async changeUserRole(userId, newRole) {
    // Change role implementation...
  }

  // Notification methods
  async sendWelcomeEmail(userId) {
    // Send welcome email implementation...
  }

  async notifyPasswordChanged(userId) {
    // Send password change notification...
  }

  async sendWeeklyDigest(userId) {
    // Send weekly digest implementation...
  }

  // Utility methods
  validateUserData(userData) {
    // Validation implementation...
  }

  sanitizeUserInput(input) {
    // Sanitization implementation...
  }

  formatUserResponse(user) {
    // Response formatting...
  }
}
```

#### After: Refactored into Smaller Modules

```typescript
// auth/AuthService.js
export class AuthService {
  constructor(database, tokenManager) {
    this.database = database;
    this.tokenManager = tokenManager;
  }

  async login(email, password) {
    // Login implementation...
  }

  async logout(userId) {
    // Logout implementation...
  }

  async resetPassword(email) {
    // Reset password implementation...
  }
}

// users/UserProfileService.js
export class UserProfileService {
  constructor(database, fileStorage) {
    this.database = database;
    this.fileStorage = fileStorage;
  }

  async getUserProfile(userId) {
    // Get profile implementation...
  }

  async updateUserProfile(userId, profileData) {
    // Update profile implementation...
  }

  async uploadProfilePicture(userId, picture) {
    // Upload picture implementation...
  }
}

// users/UserAdminService.js
export class UserAdminService {
  constructor(database, validator) {
    this.database = database;
    this.validator = validator;
  }

  async getAllUsers(page, limit) {
    // List users implementation...
  }

  async createUser(userData) {
    // Create user implementation...
  }

  async deleteUser(userId) {
    // Delete user implementation...
  }

  async changeUserRole(userId, newRole) {
    // Change role implementation...
  }
}

// notifications/NotificationService.js
export class NotificationService {
  constructor(emailService, userProfileService) {
    this.emailService = emailService;
    this.userProfileService = userProfileService;
  }

  async sendWelcomeEmail(userId) {
    // Send welcome email implementation...
  }

  async notifyPasswordChanged(userId) {
    // Send password change notification...
  }

  async sendWeeklyDigest(userId) {
    // Send weekly digest implementation...
  }
}

// utils/UserDataValidator.js
export class UserDataValidator {
  validateUserData(userData) {
    // Validation implementation...
  }

  sanitizeUserInput(input) {
    // Sanitization implementation...
  }
}

// utils/UserResponseFormatter.js
export class UserResponseFormatter {
  formatUserResponse(user) {
    // Response formatting...
  }
}

// Facade that composes the services if needed
export class UserManager {
  constructor(dependencies) {
    this.authService = new AuthService(
      dependencies.database,
      dependencies.tokenManager
    );

    this.profileService = new UserProfileService(
      dependencies.database,
      dependencies.fileStorage
    );

    this.adminService = new UserAdminService(
      dependencies.database,
      new UserDataValidator()
    );

    this.notificationService = new NotificationService(
      dependencies.emailService,
      this.profileService
    );

    this.formatter = new UserResponseFormatter();
  }

  // Facade methods that delegate to appropriate services
  // This keeps the public API the same while refactoring the implementation
}
```

## Related Documents

- [JavaScript Coding Standards](mdc:departments/engineering/coding-standards/105-typescript-linter-standards.mdc)
- [UI Component Architecture](mdc:technologies/frameworks/042-ui-component-architecture.mdc)
- [Test Resilience Guidelines](mdc:departments/engineering/testing/320-test-resilience.mdc)
