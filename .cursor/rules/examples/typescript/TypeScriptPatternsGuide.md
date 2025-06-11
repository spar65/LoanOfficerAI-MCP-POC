# TypeScript Patterns Guide

This guide provides comprehensive examples of TypeScript best practices to help you implement the standards defined in the [TypeScript Linter Standards](mdc:../../departments/engineering/coding-standards/105-typescript-linter-standards.mdc) rule.

## Table of Contents

- [Type System Best Practices](#type-system-best-practices)
- [Common Error Solutions](#common-error-solutions)
- [Performance Optimizations](#performance-optimizations)
- [Advanced TypeScript Features](#advanced-typescript-features)
- [Configuration Patterns](#configuration-patterns)
- [Module Organization](#module-organization)
- [Generic Patterns](#generic-patterns)
- [Utility Types](#utility-types)

## Type System Best Practices

### Explicitly Typed Function Signatures

Always provide explicit type annotations for function parameters and return types:

```typescript
// ✅ Good: Explicit type signature
function calculateTotal(prices: number[], taxRate: number): number {
  return prices.reduce((sum, price) => sum + price, 0) * (1 + taxRate);
}

// ❌ Bad: Implicit types
function calculateTotal(prices, taxRate) {
  return prices.reduce((sum, price) => sum + price, 0) * (1 + taxRate);
}
```

### Union Types for Multiple Possibilities

Use union types when a value can be one of several types:

```typescript
// ✅ Good: Union type
type Status = "pending" | "processing" | "completed" | "failed";

function processOrder(orderId: string, status: Status): void {
  // Implementation
}

// ❌ Bad: Using string type
function processOrder(orderId: string, status: string): void {
  // Implementation
}
```

### Branded Types for Type Safety

Use branded types to create type-safe identifiers:

```typescript
// ✅ Good: Branded types
type UserId = string & { readonly __brand: unique symbol };
type OrderId = string & { readonly __brand: unique symbol };

function createUserId(id: string): UserId {
  return id as UserId;
}

function getUserOrders(userId: UserId): OrderId[] {
  // Implementation
  return [];
}

// Usage
const rawId = "12345";
const userId = createUserId(rawId);
const orders = getUserOrders(userId);

// This would fail compilation:
// const orders = getUserOrders(rawId); // Error: string is not assignable to UserId
```

### Index Signatures with Proper Types

When using index signatures, properly type both the key and value:

```typescript
// ✅ Good: Properly typed dictionary
interface Dictionary<T> {
  [key: string]: T;
}

const userAges: Dictionary<number> = {
  john: 28,
  jane: 32,
};

// ✅ Good: Record utility type
const userRoles: Record<string, "admin" | "user" | "guest"> = {
  john: "admin",
  jane: "user",
};

// ❌ Bad: Using any
interface UntypedMap {
  [key: string]: any;
}
```

## Common Error Solutions

### "Cannot find module" Error

Create proper module declarations for untyped modules:

```typescript
// ✅ Good: Create module declaration in a .d.ts file
// my-types.d.ts
declare module "untyped-library" {
  export interface Options {
    timeout?: number;
    retries?: number;
  }

  export function initialize(options?: Options): void;
  export function process(data: unknown): Promise<unknown>;

  export default {
    initialize,
    process,
  };
}

// Usage
import UntypedLib from "untyped-library";
UntypedLib.initialize({ timeout: 5000 });
```

### "Object is possibly undefined" Error

Use optional chaining and nullish coalescing for safer property access:

```typescript
// ✅ Good: Using optional chaining and nullish coalescing
function getUserDisplayName(user?: User): string {
  return user?.displayName ?? user?.fullName ?? user?.email ?? "Guest User";
}

// ❌ Bad: Unsafe property access
function getUserDisplayName(user?: User): string {
  return user.displayName || user.fullName || user.email || "Guest User"; // Error
}
```

### "No overload matches this call" Error

When working with function overloads, ensure you're providing compatible arguments:

```typescript
// ✅ Good: Properly typed overloads
function createElement(tag: "div"): HTMLDivElement;
function createElement(tag: "span"): HTMLSpanElement;
function createElement(tag: "a", href: string): HTMLAnchorElement;
function createElement(tag: string, ...args: any[]): HTMLElement {
  const element = document.createElement(tag);

  if (tag === "a" && args.length > 0) {
    (element as HTMLAnchorElement).href = args[0];
  }

  return element;
}

// Usage
const div = createElement("div");
const span = createElement("span");
const link = createElement("a", "https://example.com");

// This would fail compilation:
// const invalid = createElement('a'); // Error: No overload matches this call
```

### "Type 'X' is not assignable to type 'Y'" Error

Use type guards to help TypeScript narrow types:

```typescript
// ✅ Good: Using type guards
type FormValue = string | number | boolean;

function isString(value: FormValue): value is string {
  return typeof value === "string";
}

function isNumber(value: FormValue): value is number {
  return typeof value === "number";
}

function processFormValue(value: FormValue): string {
  if (isString(value)) {
    return value.toUpperCase(); // TypeScript knows value is string
  }

  if (isNumber(value)) {
    return value.toFixed(2); // TypeScript knows value is number
  }

  return value ? "Yes" : "No"; // TypeScript knows value is boolean
}
```

## Performance Optimizations

### Const Assertions for Literal Types

Use const assertions to create more specific literal types:

```typescript
// ✅ Good: Using const assertion
const config = {
  endpoint: "https://api.example.com",
  timeout: 5000,
  retries: 3,
  features: ["search", "filter", "sort"] as const,
} as const;

// TypeScript infers:
// config: {
//   readonly endpoint: "https://api.example.com";
//   readonly timeout: 5000;
//   readonly retries: 3;
//   readonly features: readonly ["search", "filter", "sort"];
// }

// ❌ Bad: Without const assertion
const configWithoutConst = {
  endpoint: "https://api.example.com",
  timeout: 5000,
  features: ["search", "filter", "sort"],
};

// TypeScript infers:
// configWithoutConst: {
//   endpoint: string;
//   timeout: number;
//   features: string[];
// }
```

### Lazy Initialization with Type Safety

Use lazy initialization to improve startup performance:

```typescript
// ✅ Good: Lazy initialization with type safety
interface ExpensiveResource {
  data: Record<string, unknown>;
  process(input: string): unknown;
}

let expensiveResource: ExpensiveResource | undefined;

function getExpensiveResource(): ExpensiveResource {
  if (!expensiveResource) {
    expensiveResource = {
      data: {},
      process(input: string) {
        // Expensive computation
        return input;
      },
    };
  }

  return expensiveResource;
}
```

### Type-Only Imports for Cleaner JavaScript Output

Use type-only imports to avoid importing at runtime:

```typescript
// ✅ Good: Type-only imports
import type { User, Order } from "./models";

// Regular imports for runtime dependencies
import { fetchUsers, processOrder } from "./api";

// This will not affect runtime behavior or bundle size
function processUserOrders(userId: User["id"]): Promise<Order[]> {
  return fetchUsers().then((users) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.orders : [];
  });
}
```

## Advanced TypeScript Features

### Template Literal Types

Use template literal types for string manipulation at the type level:

```typescript
// ✅ Good: Template literal types
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
type Endpoint = "/users" | "/orders" | "/products";
type APIRoute = `${HTTPMethod} ${Endpoint}`;

// TypeScript infers: "GET /users" | "GET /orders" | "GET /products" | "POST /users" | ...

function fetchAPI(route: APIRoute): Promise<unknown> {
  const [method, endpoint] = route.split(" ");
  // Implementation
  return Promise.resolve({});
}

// Valid usages
fetchAPI("GET /users");
fetchAPI("POST /orders");

// This would fail compilation:
// fetchAPI('PATCH /users'); // Error: Argument of type 'PATCH /users' is not assignable to parameter of type 'APIRoute'
```

### Mapped Types for Transforming Types

Use mapped types to transform existing types:

```typescript
// ✅ Good: Mapped types for validation schema
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  isAdmin: boolean;
}

// Generate a validation schema type
type ValidationSchema<T> = {
  [K in keyof T]: {
    required: boolean;
    type: "string" | "number" | "boolean";
    validate: (value: T[K]) => boolean;
  };
};

// Use the mapped type
const userValidationSchema: ValidationSchema<User> = {
  id: {
    required: true,
    type: "string",
    validate: (id) => id.length > 0,
  },
  name: {
    required: true,
    type: "string",
    validate: (name) => name.length > 0,
  },
  email: {
    required: true,
    type: "string",
    validate: (email) => /^[^@]+@[^@]+\.[^@]+$/.test(email),
  },
  age: {
    required: true,
    type: "number",
    validate: (age) => age > 0,
  },
  isAdmin: {
    required: false,
    type: "boolean",
    validate: () => true,
  },
};
```

### Conditional Types for Advanced Type Logic

Use conditional types to build complex type relationships:

```typescript
// ✅ Good: Conditional types
type Primitive = string | number | boolean;

// Extract array element type
type ElementType<T> = T extends (infer U)[] ? U : never;

// Examples
type StringArrayElement = ElementType<string[]>; // string
type NumberArrayElement = ElementType<number[]>; // number

// Extracting return type
type AsyncReturnType<T extends (...args: any[]) => Promise<any>> = T extends (
  ...args: any[]
) => Promise<infer R>
  ? R
  : never;

async function fetchUserData(): Promise<User> {
  // Implementation
  return { id: "1", name: "John" };
}

type FetchUserDataReturn = AsyncReturnType<typeof fetchUserData>; // User
```

## Configuration Patterns

### Standardized tsconfig.json

Use a standardized base tsconfig.json and extend for specific environments:

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}

// tsconfig.json for the main application
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "jsx": "react-jsx",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}

// tsconfig.test.json for tests
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "test/*": ["test/*"]
    },
    "jsx": "react-jsx",
    "types": ["jest", "node"]
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["node_modules"]
}
```

### ESLint Configuration for TypeScript

Use a proper ESLint configuration for TypeScript:

```json
// .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module",
    "project": "./tsconfig.json",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks", "import"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript"
  ],
  "rules": {
    // TypeScript specific rules
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      {
        "allowExpressions": true,
        "allowTypedFunctionExpressions": true
      }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        "ts-ignore": "allow-with-description",
        "ts-expect-error": "allow-with-description"
      }
    ],

    // Import organization
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
          "object",
          "type"
        ],
        "newlines-between": "always",
        "alphabetize": { "order": "asc", "caseInsensitive": true }
      }
    ],

    // React rules
    "react/prop-types": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },
  "settings": {
    "react": {
      "version": "detect"
    },
    "import/resolver": {
      "typescript": {
        "alwaysTryTypes": true
      }
    }
  }
}
```

## Module Organization

### Type Declaration Files Structure

Organize your type declaration files for better maintainability:

```typescript
// types/index.ts
// Re-export all types from various domains
export * from "./user";
export * from "./auth";
export * from "./api";

// types/user.ts
// User domain types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type UserRole = "admin" | "user" | "guest";

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  language: string;
}

// types/auth.ts
// Authentication domain types
import type { User } from "./user";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: number;
}

export type AuthStatus = "authenticated" | "unauthenticated" | "loading";
```

### Feature-Based Module Organization

Organize your modules by feature for better code organization:

```typescript
// src/features/users/types.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

// src/features/users/api.ts
import type { User } from "./types";

export async function fetchUsers(): Promise<User[]> {
  // Implementation
  return [];
}

// src/features/users/hooks.ts
import { useState, useEffect } from "react";
import type { User } from "./types";
import { fetchUsers } from "./api";

export function useUsers(): {
  users: User[];
  loading: boolean;
  error: Error | null;
} {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async (): Promise<void> => {
      try {
        const data = await fetchUsers();
        if (isMounted) {
          setUsers(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  return { users, loading, error };
}

// src/features/users/components/UserList.tsx
import React from "react";
import type { User } from "../types";
import { useUsers } from "../hooks";

export function UserList(): React.ReactElement {
  const { users, loading, error } = useUsers();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {user.name} ({user.email})
        </li>
      ))}
    </ul>
  );
}
```

## Generic Patterns

### Generic Components for Reusability

Create generic components to handle various data types:

```typescript
// ✅ Good: Generic data table component
interface TableColumn<T> {
  key: keyof T;
  title: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
}

function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
}: DataTableProps<T>): React.ReactElement {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={String(column.key)}>{column.title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr
            key={keyExtractor(item)}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
          >
            {columns.map((column) => (
              <td key={String(column.key)}>
                {column.render
                  ? column.render(item[column.key], item)
                  : String(item[column.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Usage with strong typing
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

const userColumns: TableColumn<User>[] = [
  { key: "name", title: "Name" },
  { key: "email", title: "Email" },
  {
    key: "role",
    title: "Role",
    render: (value) => (
      <span className={`role-${value}`}>{value.toUpperCase()}</span>
    ),
  },
];

<DataTable<User>
  data={users}
  columns={userColumns}
  keyExtractor={(user) => user.id}
  onRowClick={(user) => console.log("Selected user:", user)}
/>;
```

### Generic Hooks for Type Safety

Create generic hooks for better type inference:

```typescript
// ✅ Good: Generic async state hook
interface AsyncState<T, E = Error> {
  data: T | null;
  loading: boolean;
  error: E | null;
}

function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
): AsyncState<T, E> {
  const [state, setState] = useState<AsyncState<T, E>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    setState((prevState) => ({ ...prevState, loading: true }));

    asyncFunction()
      .then((data) => {
        if (isMounted) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setState({ data: null, loading: false, error: error as E });
        }
      });

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return state;
}

// Usage with strong typing
interface User {
  id: string;
  name: string;
}

function fetchUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then((res) => res.json());
}

function UserProfile({ userId }: { userId: string }): React.ReactElement {
  const {
    data: user,
    loading,
    error,
  } = useAsync<User>(() => fetchUser(userId), [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>User ID: {user.id}</p>
    </div>
  );
}
```

## Utility Types

### Common Utility Types and Their Usage

TypeScript provides useful utility types that can help with common type transformations:

```typescript
// Original interface
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: Date;
  lastLogin?: Date;
}

// Partial - all properties become optional
type PartialUser = Partial<User>;
// Equivalent to:
// {
//   id?: string;
//   name?: string;
//   email?: string;
//   role?: 'admin' | 'user';
//   createdAt?: Date;
//   lastLogin?: Date;
// }

// Required - all properties become required
type RequiredUser = Required<User>;
// Equivalent to:
// {
//   id: string;
//   name: string;
//   email: string;
//   role: 'admin' | 'user';
//   createdAt: Date;
//   lastLogin: Date; // No longer optional
// }

// Pick - select specific properties
type UserCredentials = Pick<User, "email" | "id">;
// Equivalent to:
// {
//   email: string;
//   id: string;
// }

// Omit - remove specific properties
type PublicUser = Omit<User, "email" | "createdAt" | "lastLogin">;
// Equivalent to:
// {
//   id: string;
//   name: string;
//   role: 'admin' | 'user';
// }

// Record - create a dictionary type
type UserMap = Record<string, User>;
// Equivalent to:
// {
//   [key: string]: User;
// }

// ReturnType - extract the return type of a function
function createUser(data: Partial<User>): User {
  // Implementation
  return {} as User;
}

type CreateUserResult = ReturnType<typeof createUser>; // User

// Parameters - extract parameter types as a tuple
function updateUser(id: string, data: Partial<User>): User {
  // Implementation
  return {} as User;
}

type UpdateUserParams = Parameters<typeof updateUser>; // [string, Partial<User>]
```

### Custom Utility Types for Your Project

Create custom utility types for project-specific needs:

```typescript
// DeepReadonly - Make all properties and nested properties readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};

// NonNullable properties
type NonNullableProperties<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

// AsyncFunction type
type AsyncFunction<T = any, R = any> = (arg: T) => Promise<R>;

// Merge two types
type Merge<A, B> = Omit<A, keyof B> & B;

// Examples of usage:
interface User {
  id: string;
  profile: {
    name: string;
    avatar: string | null;
  };
  preferences: {
    theme: "light" | "dark" | null;
    notifications: boolean;
  } | null;
}

// Make everything readonly, including nested objects
type ReadonlyUser = DeepReadonly<User>;

// No null/undefined values
type StrictUser = NonNullableProperties<User>;

// Type merging example
interface BaseOptions {
  timeout: number;
  retries: number;
  logging: boolean;
}

interface AdvancedOptions {
  timeout: number; // Overrides base
  parallelRequests: number;
  customHeaders: Record<string, string>;
}

type MergedOptions = Merge<BaseOptions, AdvancedOptions>;
// Equivalent to:
// {
//   retries: number;
//   logging: boolean;
//   timeout: number; // From AdvancedOptions
//   parallelRequests: number;
//   customHeaders: Record<string, string>;
// }
```

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Effective TypeScript](https://effectivetypescript.com/)
- [TypeScript ESLint](https://typescript-eslint.io/)
