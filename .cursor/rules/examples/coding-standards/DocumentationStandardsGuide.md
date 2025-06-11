# Code Documentation Standards Guide

This guide provides practical examples and templates for implementing the documentation standards specified in rule 135-code-documentation-standards.mdc.

## Table of Contents

1. [File Headers](#file-headers)
2. [Function and Method Documentation](#function-and-method-documentation)
3. [Component Documentation](#component-documentation)
4. [Interface and Type Documentation](#interface-and-type-documentation)
5. [API Documentation](#api-documentation)
6. [Documentation Tools and Integrations](#documentation-tools-and-integrations)
7. [Documentation Review Checklist](#documentation-review-checklist)

## File Headers

Every file should begin with a header comment that explains its purpose, responsibilities, and any other relevant information.

### TypeScript/JavaScript Example

```typescript
/**
 * UserAuthentication.ts
 *
 * Handles user authentication flows including login, registration,
 * password reset, and session management.
 *
 * This service integrates with:
 * - Clerk Authentication (primary auth provider)
 * - Legacy database for user profile data
 *
 * Key responsibilities:
 * - Managing authentication state
 * - Validating user credentials
 * - Handling auth-related error scenarios
 * - Syncing user data between auth provider and database
 */
```

### React Component Example

```tsx
/**
 * AuthenticationForm.tsx
 *
 * A multipurpose authentication form component that can be configured for:
 * - Login
 * - Registration
 * - Password reset
 *
 * Features:
 * - Field validation with error messages
 * - Social login integration
 * - Configurable fields and submission behavior
 * - Loading states and error handling
 *
 * Usage contexts:
 * - Authentication modal
 * - Dedicated authentication pages
 * - Embedded in other components
 */
```

## Function and Method Documentation

Functions and methods should be documented using JSDoc format, explaining their purpose, parameters, return values, and any exceptions they might throw.

### Basic Function Documentation

```typescript
/**
 * Authenticates a user with provided credentials
 *
 * @param username - The user's email or username
 * @param password - The user's password
 * @returns Promise resolving to the authenticated user object
 * @throws AuthenticationError if credentials are invalid
 */
async function authenticateUser(
  username: string,
  password: string
): Promise<User> {
  // Implementation...
}
```

### Complex Function Documentation

```typescript
/**
 * Merges user data from authentication provider with local database profile
 *
 * This function reconciles user information between our authentication provider
 * and our database, ensuring any changes in one system are reflected in the other.
 * It handles conflict resolution with the following priorities:
 * 1. Auth provider data for authentication-specific fields
 * 2. Database data for application-specific fields
 * 3. Most recently updated data for shared fields
 *
 * @param authProviderUser - User data from the authentication provider
 * @param databaseUser - User data from the local database
 * @param options - Configuration options for the merge process
 * @param options.forceSync - Whether to force all fields to sync regardless of update time
 * @param options.preferSource - Which source to prefer when update times are identical
 * @returns The merged user object that reflects the synchronized state
 * @throws UserSyncError if reconciliation fails due to data inconsistencies
 */
function mergeUserData(
  authProviderUser: AuthProviderUser,
  databaseUser: DatabaseUser,
  options: {
    forceSync?: boolean;
    preferSource?: "auth" | "database";
  } = {}
): MergedUser {
  // Implementation...
}
```

## Component Documentation

React components should have comprehensive documentation that explains their purpose, props, behavior, and usage examples.

### Component Documentation Template

```tsx
/**
 * DataGrid - A configurable grid component for displaying tabular data
 *
 * This component provides a flexible way to display, sort, filter, and paginate
 * tabular data with support for customizable columns, cell rendering, and row actions.
 *
 * Features:
 * - Column resizing and reordering
 * - Client and server-side sorting
 * - Advanced filtering
 * - Pagination with configurable page sizes
 * - Row selection and bulk actions
 * - Customizable cell rendering
 * - Keyboard navigation and accessibility
 *
 * Performance considerations:
 * - Uses virtualization for handling large datasets
 * - Implements memoization to prevent unnecessary renders
 * - Supports data chunking for server-side operations
 *
 * Accessibility:
 * - Proper ARIA attributes for interactive elements
 * - Keyboard navigation between cells and rows
 * - Screen reader announcements for sorting and filtering changes
 * - High contrast mode support
 *
 * @example
 * // Basic usage
 * <DataGrid
 *   data={users}
 *   columns={[
 *     { field: 'name', header: 'Name' },
 *     { field: 'email', header: 'Email' },
 *     { field: 'role', header: 'Role' }
 *   ]}
 * />
 *
 * @example
 * // Advanced usage with custom rendering and actions
 * <DataGrid
 *   data={products}
 *   columns={[
 *     {
 *       field: 'name',
 *       header: 'Product',
 *       renderCell: (row) => (
 *         <div className="flex items-center">
 *           <img src={row.thumbnail} className="w-8 h-8 mr-2" />
 *           <span>{row.name}</span>
 *         </div>
 *       )
 *     },
 *     { field: 'price', header: 'Price', align: 'right' },
 *     {
 *       field: 'actions',
 *       header: 'Actions',
 *       renderCell: (row) => (
 *         <ButtonGroup>
 *           <Button onClick={() => editProduct(row.id)}>Edit</Button>
 *           <Button onClick={() => deleteProduct(row.id)}>Delete</Button>
 *         </ButtonGroup>
 *       )
 *     }
 *   ]}
 *   onRowClick={handleRowClick}
 *   sortable
 *   paginated
 * />
 */
```

### Component Props Documentation

```tsx
type DataGridProps<T> = {
  /** Array of data items to display in the grid */
  data: T[];

  /** Column definitions that determine what and how data is displayed */
  columns: Array<{
    /** Unique identifier for the column */
    field: string;
    /** Display name shown in the column header */
    header: string;
    /** Width of the column (px, %, or 'auto') */
    width?: string | number;
    /** Whether the column can be sorted */
    sortable?: boolean;
    /** Text alignment within cells */
    align?: "left" | "center" | "right";
    /** Custom renderer for cell content */
    renderCell?: (row: T) => React.ReactNode;
    /** Custom renderer for the header */
    renderHeader?: (column: Column<T>) => React.ReactNode;
  }>;

  /** Whether rows can be selected */
  selectable?: boolean;

  /** Whether grid will show pagination controls */
  paginated?: boolean;

  /** Initial number of rows per page (if paginated) */
  pageSize?: number;

  /** Available page size options (if paginated) */
  pageSizeOptions?: number[];

  /** Handler called when row selection changes */
  onSelectionChange?: (selectedRows: T[]) => void;

  /** Handler called when a row is clicked */
  onRowClick?: (row: T) => void;

  /** Handler called when sort configuration changes */
  onSortChange?: (sortField: string, direction: "asc" | "desc") => void;

  /** Custom CSS class names */
  className?: string;

  /** Indicates if data is currently loading */
  loading?: boolean;

  /** Component to display when data is empty */
  emptyComponent?: React.ReactNode;
};
```

## Interface and Type Documentation

Interfaces and TypeScript types should be thoroughly documented to explain their purpose and the meaning of each property.

### Interface Documentation Example

```typescript
/**
 * User profile information retrieved from the authentication system
 *
 * This interface represents the core user data structure used throughout
 * the application. It contains personal information, preferences, and
 * system-specific identifiers.
 */
interface User {
  /** Unique identifier for the user */
  id: string;

  /** User's display name as shown in the UI */
  displayName: string;

  /** User's email address (must be verified for certain operations) */
  email: string;

  /** URL to the user's profile picture */
  avatarUrl?: string;

  /**
   * User's role in the system
   * - 'admin': Full system access
   * - 'manager': Team management capabilities
   * - 'user': Standard permissions
   */
  role: "admin" | "manager" | "user";

  /**
   * Account verification status
   * An unverified account has limited functionality
   */
  verified: boolean;

  /** Timestamp of the last successful login */
  lastLoginAt: string;

  /** User's preferred theme (defaults to system) */
  theme?: "light" | "dark" | "system";

  /**
   * Authentication provider that manages this user
   * May affect available operations and data fields
   */
  authProvider: "email" | "google" | "github" | "microsoft";
}
```

### Type Documentation Example

```typescript
/**
 * Configuration options for authentication flows
 *
 * These options control the behavior of authentication processes
 * including redirects, session management, and security features.
 */
type AuthenticationOptions = {
  /**
   * URL to redirect to after successful authentication
   * If not provided, will redirect to the requested page or home
   */
  redirectUrl?: string;

  /**
   * How long the session should remain valid in seconds
   * Default is 3600 (1 hour)
   */
  sessionDuration?: number;

  /**
   * Whether to remember the user across browser sessions
   * Sets a persistent cookie instead of a session cookie
   */
  rememberMe?: boolean;

  /**
   * Whether to require MFA verification regardless of user settings
   * Useful for accessing sensitive information or performing critical actions
   */
  forceMfa?: boolean;

  /**
   * Authentication methods to offer the user
   * If not specified, all configured methods will be available
   */
  allowedMethods?: Array<"password" | "social" | "sso" | "magic-link">;
};
```

## API Documentation

API endpoints should be documented using a consistent format that describes the endpoint's purpose, request parameters, response format, and potential error cases.

### REST API Documentation Example

```typescript
/**
 * User Authentication API
 * Base path: /api/auth
 */

/**
 * User Login
 *
 * Authenticates a user and creates a new session.
 *
 * @endpoint POST /api/auth/login
 *
 * @requestBody
 * {
 *   "email": string,    // User's email address
 *   "password": string, // User's password
 *   "rememberMe": boolean // Whether to extend session duration
 * }
 *
 * @responseBody
 * {
 *   "user": {
 *     "id": string,         // User's unique identifier
 *     "displayName": string, // User's display name
 *     "email": string,      // User's email address
 *     "role": string        // User's role
 *   },
 *   "token": string,       // JWT authentication token
 *   "expiresAt": string    // Token expiration timestamp
 * }
 *
 * @errorResponses
 * - 400 Bad Request: Missing or invalid parameters
 *   {
 *     "error": "INVALID_PARAMETERS",
 *     "message": "Email and password are required"
 *   }
 *
 * - 401 Unauthorized: Invalid credentials
 *   {
 *     "error": "INVALID_CREDENTIALS",
 *     "message": "Invalid email or password"
 *   }
 *
 * - 403 Forbidden: Account locked
 *   {
 *     "error": "ACCOUNT_LOCKED",
 *     "message": "Account locked due to too many failed attempts",
 *     "unlockTime": string  // When the account will be unlocked
 *   }
 *
 * @rateLimit 10 requests per minute per IP
 *
 * @security This endpoint is not protected, but implements rate limiting
 * and account lockout to prevent brute force attacks
 */

/**
 * User Registration
 *
 * Creates a new user account and sends a verification email.
 *
 * @endpoint POST /api/auth/register
 *
 * @requestBody
 * {
 *   "email": string,       // User's email address
 *   "password": string,    // User's desired password
 *   "displayName": string, // User's display name
 *   "acceptedTerms": boolean // Must be true to create account
 * }
 *
 * @responseBody
 * {
 *   "user": {
 *     "id": string,         // User's unique identifier
 *     "displayName": string, // User's display name
 *     "email": string,      // User's email address
 *     "verified": boolean   // Whether email is verified (initially false)
 *   },
 *   "message": string      // Success message
 * }
 *
 * @errorResponses
 * - 400 Bad Request: Missing or invalid parameters
 *   {
 *     "error": "INVALID_PARAMETERS",
 *     "message": "All fields are required",
 *     "fields": string[]   // List of missing or invalid fields
 *   }
 *
 * - 409 Conflict: Email already exists
 *   {
 *     "error": "EMAIL_EXISTS",
 *     "message": "An account with this email already exists"
 *   }
 *
 * @rateLimit 5 accounts per day per IP
 *
 * @security This endpoint is not protected, but implements rate limiting
 * to prevent abuse. Email verification is required before full account access.
 */
```

### GraphQL API Documentation Example

```typescript
/**
 * User GraphQL Schema
 *
 * Defines types and operations related to user accounts and profiles.
 */

/**
 * User Type
 * Represents a user account in the system
 *
 * @type User
 * @description Core user information including profile and account details
 *
 * @field id ID! - Unique identifier for the user
 * @field email String! - User's email address
 * @field displayName String! - User's display name shown in the UI
 * @field avatarUrl String - URL to the user's profile picture
 * @field role UserRole! - User's role in the system
 * @field verified Boolean! - Whether the user's email has been verified
 * @field createdAt DateTime! - When the account was created
 * @field lastLoginAt DateTime - When the user last logged in
 * @field teams [Team!] - Teams the user belongs to
 */

/**
 * UserRole Enum
 * Possible user roles in the system
 *
 * @enum UserRole
 * @description Defines permission levels for users
 *
 * @value ADMIN - Full system access
 * @value MANAGER - Team management capabilities
 * @value USER - Standard permissions
 */

/**
 * Login Mutation
 * Authenticates a user and creates a new session
 *
 * @mutation login
 * @description Authenticates a user with email and password
 *
 * @param email String! - User's email address
 * @param password String! - User's password
 * @param rememberMe Boolean - Whether to extend session duration
 *
 * @returns AuthPayload! - Authentication result with user and token
 *
 * @error INVALID_CREDENTIALS - If email or password is incorrect
 * @error ACCOUNT_LOCKED - If the account is temporarily locked
 * @error EMAIL_NOT_VERIFIED - If email verification is required
 *
 * @rateLimit 10 requests per minute per IP
 */

/**
 * Register Mutation
 * Creates a new user account
 *
 * @mutation register
 * @description Registers a new user account and sends verification email
 *
 * @param email String! - User's email address
 * @param password String! - User's desired password
 * @param displayName String! - User's display name
 * @param acceptedTerms Boolean! - Must be true to create account
 *
 * @returns RegisterPayload! - Registration result with user info
 *
 * @error EMAIL_EXISTS - If the email is already registered
 * @error PASSWORD_TOO_WEAK - If the password doesn't meet requirements
 * @error TERMS_NOT_ACCEPTED - If terms weren't accepted
 *
 * @rateLimit 5 accounts per day per IP
 */
```

## Documentation Tools and Integrations

Use these tools to improve documentation quality and consistency:

### ESLint Documentation Rules

Add these rules to your ESLint configuration to enforce documentation standards:

```json
{
  "plugins": ["jsdoc", "eslint-plugin-tsdoc"],
  "rules": {
    "jsdoc/require-jsdoc": [
      "warn",
      {
        "publicOnly": true,
        "require": {
          "FunctionDeclaration": true,
          "MethodDefinition": true,
          "ClassDeclaration": true,
          "ArrowFunctionExpression": false
        }
      }
    ],
    "jsdoc/require-param": "warn",
    "jsdoc/require-param-type": "off", // Type is provided by TypeScript
    "jsdoc/require-param-description": "warn",
    "jsdoc/require-returns": "warn",
    "jsdoc/require-returns-type": "off", // Type is provided by TypeScript
    "jsdoc/require-returns-description": "warn",
    "tsdoc/syntax": "warn"
  }
}
```

### Documentation Generation

Set up automated documentation generation with tools like:

- **TypeDoc**: For TypeScript projects
- **JSDoc**: For JavaScript projects
- **Swagger/OpenAPI**: For REST APIs
- **Storybook**: For UI components

### VS Code Extensions

Recommended extensions to help with documentation:

- **Document This**: Automatically generates JSDoc comments
- **Better Comments**: Highlights different types of comments for better visibility
- **Error Lens**: Shows errors inline for immediate feedback
- **ESLint**: Highlights documentation issues identified by linting rules

## Documentation Review Checklist

Use this checklist during code reviews to ensure documentation quality:

1. **Completeness**

   - [ ] All required elements are documented (file headers, exported functions, classes, interfaces)
   - [ ] All parameters, return values, and exceptions are documented
   - [ ] Complex logic has explanatory comments

2. **Accuracy**

   - [ ] Documentation accurately reflects the current implementation
   - [ ] Examples match the current API
   - [ ] No contradictions between code and documentation

3. **Clarity**

   - [ ] Documentation is clear and understandable
   - [ ] Technical terms are used consistently
   - [ ] No redundant or obvious information

4. **Format**

   - [ ] Documentation follows standard formats (JSDoc, TSDoc, etc.)
   - [ ] Consistent style and formatting
   - [ ] No spelling or grammatical errors

5. **Maintenance**
   - [ ] Documentation is easy to maintain when code changes
   - [ ] No duplicated information that could become inconsistent
   - [ ] Version information included if API changes are expected
