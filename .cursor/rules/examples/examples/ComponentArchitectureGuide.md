# UI Component Architecture Guide

> **DOCUMENTATION EXAMPLE ONLY**: This guide contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide provides comprehensive patterns and best practices for building React UI components following the architecture guidelines from `042-ui-component-architecture.mdc`.

## Table of Contents

1. [Component Hierarchy](#component-hierarchy)
2. [Component Organization](#component-organization)
3. [Design Patterns](#design-patterns)
4. [Anti-Patterns](#anti-patterns)
5. [Testing Strategies](#testing-strategies)

## Component Hierarchy

The component hierarchy follows a clear progression from pre-built to custom components, allowing for maximum reuse and consistency:

### Level 1: Basic UI Components

These are the primitive UI components from libraries like shadcn/ui or other UI libraries:

```tsx
// Using basic components directly
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  return (
    <form>
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Button type="submit">Log In</Button>
    </form>
  );
}
```

### Level 2: Composed Components

Combine multiple basic components to create more complex UI patterns:

```tsx
// Composed from multiple basic components
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Password" />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Log In</Button>
      </CardFooter>
    </Card>
  );
}
```

### Level 3: Extended Components

Add functionality to existing components through extension:

```tsx
// Extended component with additional functionality
import { Button, ButtonProps } from "@/components/ui/button";

interface LoadingButtonProps extends ButtonProps {
  isLoading: boolean;
  loadingText?: string;
}

export function LoadingButton({
  isLoading,
  loadingText = "Loading...",
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={isLoading || disabled} {...props}>
      {isLoading ? (
        <>
          <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
```

### Level 4: Fully Custom Components

Create custom components only when other approaches are insufficient:

```tsx
// Custom component for specialized needs
import React from "react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStep: number;
  onChange?: (step: number) => void;
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  onChange,
  className,
}: StepperProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
              index === currentStep
                ? "bg-primary text-primary-foreground"
                : index < currentStep
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            )}
            onClick={() => onChange?.(index)}
            role={onChange ? "button" : undefined}
            tabIndex={onChange ? 0 : undefined}
          >
            {index < currentStep ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-1 w-10",
                index < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
```

## Component Organization

A well-organized component structure improves maintainability and discoverability:

```
src/
├── components/
│   ├── ui/                  # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── index.ts         # Re-export all UI components
│   │
│   ├── common/              # Common components used across features
│   │   ├── ErrorBoundary.tsx
│   │   ├── PageHeader.tsx
│   │   └── SearchBar.tsx
│   │
│   ├── layout/              # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navbar.tsx
│   │
│   └── [feature]/           # Feature-specific components
│       ├── [FeatureComponent].tsx
│       └── [SubComponent].tsx
│
├── hooks/                   # Custom hooks
│   ├── useForm.ts
│   └── useAuth.ts
│
└── utils/                   # Utility functions
    ├── formatters.ts
    └── validators.ts
```

### Naming Conventions

- **Component Files**: PascalCase for component files (e.g., `Button.tsx`, `UserProfile.tsx`)
- **Utility Files**: camelCase for utility and hook files (e.g., `useForm.ts`, `formatDate.ts`)
- **Index Files**: Use index files to re-export components, simplifying imports
- **Test Files**: Co-locate tests with components using `.test.tsx` or `.spec.tsx` suffix

## Design Patterns

### Compound Components

Create related components that work together through a shared context:

```tsx
// Compound component pattern
import { createContext, useContext, useState } from "react";

// Create context
const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (id: string) => void;
}>({ activeTab: "", setActiveTab: () => {} });

// Parent component
export function Tabs({
  defaultTab,
  children,
}: {
  defaultTab: string;
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

// Tab list component
export function TabList({ children }: { children: React.ReactNode }) {
  return <div className="tab-list">{children}</div>;
}

// Tab component
export function Tab({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { activeTab, setActiveTab } = useContext(TabsContext);

  return (
    <button
      className={`tab ${activeTab === id ? "tab-active" : ""}`}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
}

// Tab panel component
export function TabPanel({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== id) return null;

  return <div className="tab-panel">{children}</div>;
}

// Usage
function MyTabs() {
  return (
    <Tabs defaultTab="tab1">
      <TabList>
        <Tab id="tab1">First Tab</Tab>
        <Tab id="tab2">Second Tab</Tab>
      </TabList>
      <TabPanel id="tab1">Content for first tab</TabPanel>
      <TabPanel id="tab2">Content for second tab</TabPanel>
    </Tabs>
  );
}
```

### Render Props

Pass rendering logic as a function prop:

```tsx
// Render props pattern
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

function List<T>({
  items,
  renderItem,
  renderEmpty = () => <div>No items found</div>,
}: ListProps<T>) {
  if (items.length === 0) {
    return renderEmpty();
  }

  return (
    <ul className="list">
      {items.map((item, index) => (
        <li key={index} className="list-item">
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

// Usage
function UserList({ users }) {
  return (
    <List
      items={users}
      renderItem={(user) => (
        <div className="flex items-center">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full mr-2"
          />
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      )}
      renderEmpty={() => (
        <div className="text-center p-4">
          <div className="text-gray-500">No users found</div>
          <Button variant="outline" size="sm" className="mt-2">
            Add User
          </Button>
        </div>
      )}
    />
  );
}
```

### Custom Hooks

Extract reusable logic into custom hooks:

```tsx
// Custom hook for form state
function useForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    reset,
    setValues,
    setErrors,
  };
}

// Usage
function LoginForm() {
  const { values, handleChange, handleBlur } = useForm({
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      <Input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      <Button type="submit">Log In</Button>
    </form>
  );
}
```

## Anti-Patterns

### Anti-Pattern 1: Prop Drilling

Passing props through multiple levels of components makes code hard to maintain:

```tsx
// Anti-pattern: Prop drilling
function App({ user }) {
  return (
    <Layout user={user}>
      <Header user={user} />
      <Sidebar user={user}>
        <Navigation user={user} />
      </Sidebar>
      <Content>
        <Dashboard user={user} />
      </Content>
    </Layout>
  );
}

// Better: Use context
const UserContext = createContext(null);

function App({ user }) {
  return (
    <UserContext.Provider value={user}>
      <Layout>
        <Header />
        <Sidebar>
          <Navigation />
        </Sidebar>
        <Content>
          <Dashboard />
        </Content>
      </Layout>
    </UserContext.Provider>
  );
}

// Components can now access user directly
function Header() {
  const user = useContext(UserContext);
  return <header>Welcome, {user.name}</header>;
}
```

### Anti-Pattern 2: Huge Components

Large components are difficult to understand and maintain:

```tsx
// Anti-pattern: Huge component
function UserDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  // ... many more states and handlers

  // ... 200+ lines of component logic

  return <div>{/* ... lots of JSX */}</div>;
}

// Better: Split into smaller components and custom hooks
function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch logic

  return { users, loading, error };
}

function UserDashboard() {
  const { users, loading, error } = useUsers();
  const [selectedUser, setSelectedUser] = useState(null);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div>
      <UserSearchBar />
      <UserList users={users} onSelectUser={setSelectedUser} />
      {selectedUser && <UserDetails user={selectedUser} />}
    </div>
  );
}
```

### Anti-Pattern 3: Inline Styles

Using inline styles instead of classnames:

```tsx
// Anti-pattern: Inline styles
function Card() {
  return (
    <div
      style={{
        padding: "16px",
        margin: "8px",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        backgroundColor: "#fff",
      }}
    >
      {/* Card content */}
    </div>
  );
}

// Better: Tailwind classes
function Card() {
  return (
    <div className="p-4 m-2 rounded-md shadow bg-white">
      {/* Card content */}
    </div>
  );
}
```

### Anti-Pattern 4: Business Logic in Components

Mixing business logic with presentation makes components hard to test and reuse:

```tsx
// Anti-pattern: Business logic in component
function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        // Complex business logic for processing products
        const processedProducts = data.map((product) => ({
          ...product,
          discountedPrice: calculateDiscount(product),
          inStock: product.inventory > 0,
          // ... more processing
        }));

        // Sort by popularity
        processedProducts.sort((a, b) => b.popularity - a.popularity);

        setProducts(processedProducts);
      });
  }, []);

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Better: Separate business logic from presentation
function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProducts()
      .then(processProducts)
      .then(sortByPopularity)
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  return { products, loading };
}

function ProductList() {
  const { products, loading } = useProducts();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## Testing Strategies

### Component Testing

```tsx
// Component to test
function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);

  return (
    <div>
      <p data-testid="count">Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}

// Test file
import { render, screen, fireEvent } from "@testing-library/react";
import { Counter } from "./Counter";

describe("Counter", () => {
  it("renders with default count", () => {
    render(<Counter />);
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 0");
  });

  it("renders with initial count", () => {
    render(<Counter initialCount={10} />);
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 10");
  });

  it("increments count when increment button is clicked", () => {
    render(<Counter />);
    fireEvent.click(screen.getByText("Increment"));
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 1");
  });

  it("decrements count when decrement button is clicked", () => {
    render(<Counter initialCount={5} />);
    fireEvent.click(screen.getByText("Decrement"));
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 4");
  });
});
```

### Testing Patterns

1. **Arrange-Act-Assert (AAA)**:

   - Arrange: Set up the component with necessary props
   - Act: Perform actions (clicks, inputs, etc.)
   - Assert: Check that the expected outcome occurred

2. **Test Different States**:

   - Loading state
   - Error state
   - Empty state
   - Populated state
   - Various prop combinations

3. **Test Accessibility**:

   - Use jest-axe for automated accessibility testing
   - Test keyboard navigation
   - Verify proper ARIA attributes

4. **Mock External Dependencies**:
   - Mock API calls
   - Mock context providers
   - Mock complex child components
