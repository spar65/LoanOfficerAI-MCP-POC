# Component Organization Examples

> **DOCUMENTATION EXAMPLE ONLY**: This document contains directory structures and code examples for reference purposes. These examples demonstrate organization patterns but are not meant to be implemented exactly as shown or imported directly.

This guide demonstrates practical examples of component organization following the guidelines from `042-ui-component-architecture.mdc`.

## Directory Structure

Below is a complete example of a well-organized component structure for a React application:

```
src/
├── components/
│   ├── ui/                       # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   └── index.ts              # Re-exports all UI components
│   │
│   ├── common/                   # Shared application components
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Card/                 # Complex components can have their own directory
│   │   │   ├── Card.tsx
│   │   │   ├── CardHeader.tsx
│   │   │   ├── CardBody.tsx
│   │   │   ├── CardFooter.tsx
│   │   │   └── index.ts
│   │   ├── ErrorBoundary.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts              # Re-exports common components
│   │
│   ├── layout/                   # Application layout components
│   │   ├── AppShell.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarItem.tsx
│   │   │   ├── SidebarSection.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── forms/                    # Form-related components
│   │   ├── TextField.tsx
│   │   ├── SelectField.tsx
│   │   ├── Checkbox.tsx
│   │   ├── RadioGroup.tsx
│   │   ├── FormSection.tsx
│   │   └── index.ts
│   │
│   ├── data-display/             # Data visualization components
│   │   ├── DataTable/
│   │   │   ├── DataTable.tsx
│   │   │   ├── TableHeader.tsx
│   │   │   ├── TablePagination.tsx
│   │   │   ├── TableFilters.tsx
│   │   │   └── index.ts
│   │   ├── Chart.tsx
│   │   ├── KPI.tsx
│   │   └── index.ts
│   │
│   └── features/                 # Feature-specific components
│       ├── authentication/
│       │   ├── LoginForm.tsx
│       │   ├── SignupForm.tsx
│       │   ├── ForgotPasswordForm.tsx
│       │   └── index.ts
│       │
│       ├── users/
│       │   ├── UserList.tsx
│       │   ├── UserCard.tsx
│       │   ├── UserProfile.tsx
│       │   └── index.ts
│       │
│       └── dashboard/
│           ├── DashboardMetrics.tsx
│           ├── ActivityFeed.tsx
│           ├── RecentItems.tsx
│           └── index.ts
│
├── hooks/                        # Custom hooks
│   ├── useForm.ts
│   ├── useAuth.ts
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   ├── useMediaQuery.ts
│   └── index.ts
│
├── context/                      # React context definitions
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   ├── ToastContext.tsx
│   └── index.ts
│
├── utils/                        # Utility functions
│   ├── api.ts                    # API client
│   ├── format.ts                 # Formatting utilities
│   ├── validation.ts             # Form validation
│   ├── storage.ts                # Local storage helpers
│   └── index.ts
│
├── pages/                        # Page components (for routing)
│   ├── Dashboard.tsx
│   ├── Users.tsx
│   ├── Settings.tsx
│   └── Profile.tsx
│
└── styles/                       # Global styles and themes
    ├── globals.css
    └── theme.ts
```

## File Naming Conventions

### Component Files

Use PascalCase for React component files:

```
Button.tsx
UserProfile.tsx
DashboardMetrics.tsx
```

### Utility Files

Use camelCase for utility and hook files:

```
useAuth.ts
formatDate.ts
apiClient.ts
```

### Test Files

Co-locate test files with the component they test:

```
Button.tsx
Button.test.tsx  // or Button.spec.tsx
```

### Index Files

Use index files to simplify imports:

```typescript
// components/ui/index.ts
export { Button } from "./button";
export { Input } from "./input";
export { Select } from "./select";
export { Checkbox } from "./checkbox";

// Usage in another file
import { Button, Input, Select } from "@/components/ui";
```

## Component Types and Organization

### 1. UI Components

Simple, reusable UI components - building blocks of the application:

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

### 2. Form Components

Components specifically designed for forms:

```typescript
// components/forms/TextField.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export function TextField({
  label,
  helperText,
  error,
  startIcon,
  endIcon,
  className,
  id,
  ...props
}: TextFieldProps) {
  const [inputId] = useState(
    id || `text-field-${Math.random().toString(36).substr(2, 9)}`
  );

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium leading-none">
          {label}
        </label>
      )}

      <div className="relative">
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {startIcon}
          </div>
        )}

        <Input
          id={inputId}
          className={cn(
            startIcon && "pl-10",
            endIcon && "pr-10",
            error && "border-destructive",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          {...props}
        />

        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {endIcon}
          </div>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
```

### 3. Feature Components

Components specific to application features:

```typescript
// components/features/users/UserList.tsx
import { useState } from "react";
import { User } from "@/types";
import { DataTable } from "@/components/data-display/DataTable";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/useUsers";

interface UserListProps {
  onSelectUser: (user: User) => void;
  onCreateUser: () => void;
}

export function UserList({ onSelectUser, onCreateUser }: UserListProps) {
  const { users, loading, error } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");

  const columns = [
    {
      header: "Name",
      accessor: "name",
      cell: (user) => (
        <div className="flex items-center gap-2">
          <img
            src={user.avatar}
            alt={user.name}
            className="h-8 w-8 rounded-full"
          />
          <span>{user.name}</span>
        </div>
      ),
    },
    {
      header: "Email",
      accessor: "email",
    },
    {
      header: "Role",
      accessor: "role",
    },
    {
      header: "Actions",
      cell: (user) => (
        <Button variant="outline" size="sm" onClick={() => onSelectUser(user)}>
          View
        </Button>
      ),
    },
  ];

  const filteredUsers =
    users?.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  if (error) {
    return <div>Error loading users: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Users</h2>
        <Button onClick={onCreateUser}>Add User</Button>
      </div>

      <DataTable
        data={filteredUsers}
        columns={columns}
        loading={loading}
        onSearch={setSearchQuery}
        searchPlaceholder="Search users..."
      />
    </div>
  );
}
```

### 4. Layout Components

Components that define the application layout:

```typescript
// components/layout/AppShell.tsx
import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>

      <Footer />
    </div>
  );
}
```

## Exports and Imports

### Export Patterns

```typescript
// Named exports for multiple items
export function Button() {
  /* ... */
}
export function IconButton() {
  /* ... */
}

// Default export for single items
export default function Avatar() {
  /* ... */
}

// Re-exports in index files
export { Button } from "./Button";
export { Avatar } from "./Avatar";
export * from "./icons"; // Export everything from a module
```

### Import Patterns

```typescript
// Import from index files for cleaner imports
import { Button, Input, Select } from "@/components/ui";

// Absolute imports with path aliases
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/formatDate";
```

## Best Practices Summary

1. **Consistent Structure**: Follow a consistent directory structure across the project
2. **Component Hierarchy**: Progress from basic to complex components
3. **Co-location**: Keep related files together (component, tests, styles)
4. **Index Files**: Use index files to simplify imports
5. **Clear Naming**: Use descriptive names and consistent casing conventions
6. **Feature Folders**: Group components by feature or domain when appropriate
7. **Separation of Concerns**: Keep UI components separate from business logic
