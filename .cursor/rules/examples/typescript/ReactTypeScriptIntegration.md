# React TypeScript Integration

This guide provides practical patterns for using TypeScript with React, supporting the standards defined in the [TypeScript Linter Standards](mdc:../../departments/engineering/coding-standards/105-typescript-linter-standards.mdc) rule.

## Table of Contents

- [Component Props Typing](#component-props-typing)
- [Event Handling](#event-handling)
- [Hooks With TypeScript](#hooks-with-typescript)
- [Generic Components](#generic-components)
- [Context API Typing](#context-api-typing)
- [Higher-Order Components](#higher-order-components)
- [Performance Considerations](#performance-considerations)

## Component Props Typing

### Function Components with TypeScript

Define explicit interfaces for your component props:

```tsx
// ✅ Good: Well-typed component props
interface ButtonProps {
  primary?: boolean;
  size?: "small" | "medium" | "large";
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  primary = false,
  size = "medium",
  label,
  onClick,
  disabled = false,
}) => {
  const buttonClass = `btn ${
    primary ? "btn-primary" : "btn-secondary"
  } btn-${size}`;

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {label}
    </button>
  );
};

// ❌ Bad: Untyped props
export const Button = ({ primary, size, label, onClick, disabled }) => {
  // TypeScript can't validate these props
  const buttonClass = `btn ${
    primary ? "btn-primary" : "btn-secondary"
  } btn-${size}`;

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {label}
    </button>
  );
};
```

### Extending HTML Element Props

When building wrapper components for HTML elements, extend the built-in HTML attributes:

```tsx
// ✅ Good: Extending HTML attributes
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  label?: string;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "medium",
  label,
  isLoading = false,
  children,
  ...props // All remaining HTML button attributes
}) => {
  const buttonClass = `btn btn-${variant} btn-${size}`;

  return (
    <button
      className={buttonClass}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <LoadingSpinner /> : label || children}
    </button>
  );
};

// Usage
<Button
  variant="primary"
  size="large"
  onClick={() => console.log("clicked")}
  aria-label="Submit form"
  type="submit"
>
  Submit
</Button>;
```

### React Component Return Types

Use explicit return types for React components:

```tsx
// ✅ Good: Explicit return type
function Header(): React.ReactElement {
  return <header>My Application</header>;
}

// Alternative typing styles
const Sidebar = (): JSX.Element => {
  return <aside>Sidebar content</aside>;
};

const Main: React.FC = () => {
  return <main>Main content</main>;
};

// ✅ Good: Return type for components that might return null
function ConditionalComponent(props: {
  showComponent: boolean;
}): React.ReactElement | null {
  if (!props.showComponent) {
    return null;
  }

  return <div>Only shown conditionally</div>;
}
```

## Event Handling

### Properly Typed Event Handlers

React provides specific event types for different events:

```tsx
// ✅ Good: Properly typed event handlers
function LoginForm(): React.ReactElement {
  // Form submit event
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    // Form handling logic
  };

  // Input change event
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    console.log(event.target.value);
  };

  // Button click event
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    console.log("Button clicked", event.currentTarget);
  };

  // Keyboard event
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (event.key === "Enter") {
      console.log("Enter key pressed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" onChange={handleChange} onKeyDown={handleKeyDown} />
      <button type="submit" onClick={handleClick}>
        Login
      </button>
    </form>
  );
}
```

### Event Type Cheat Sheet

Common React event types:

```tsx
// Form Events
React.FormEvent<HTMLFormElement>; // Form submission
React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>; // Input changes

// Mouse Events
React.MouseEvent<HTMLButtonElement | HTMLDivElement | HTMLAnchorElement>; // Mouse clicks
React.MouseEvent<HTMLElement, MouseEvent>; // Generic mouse event

// Keyboard Events
React.KeyboardEvent<HTMLInputElement | HTMLDivElement>; // Keyboard events

// Focus Events
React.FocusEvent<HTMLInputElement>; // Focus/blur events

// Drag Events
React.DragEvent<HTMLDivElement>; // Drag and drop

// Clipboard Events
React.ClipboardEvent<HTMLInputElement>; // Copy, cut, paste
```

## Hooks With TypeScript

### useState with Type Safety

Provide explicit types for useState to enforce type safety:

```tsx
// ✅ Good: Properly typed state
function UserProfile(): React.ReactElement {
  // Simple state types
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);

  // Complex state type
  interface User {
    id: string;
    name: string;
    email: string;
    preferences: {
      theme: "light" | "dark";
      notifications: boolean;
    };
  }

  // State with complex type
  const [user, setUser] = useState<User | null>(null);

  // TypeScript infers the initial state type when provided
  const [count, setCount] = useState(0); // Inferred as number
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Inferred as boolean

  // Type inference with object literals
  const [userState, setUserState] = useState({
    name: "",
    isAdmin: false,
    loginCount: 0,
  }); // TypeScript infers the shape

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      {user && (
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <p>Theme: {user.preferences.theme}</p>
        </div>
      )}
    </div>
  );
}
```

### useRef with Type Safety

Type useRef correctly to match its usage:

```tsx
// ✅ Good: Typed useRef for DOM elements
function SearchInput(): React.ReactElement {
  // DOM element ref
  const inputRef = useRef<HTMLInputElement>(null);

  // Mutable value ref (not for DOM elements)
  const countRef = useRef<number>(0);

  // Focus the input
  const focusInput = (): void => {
    // Safe usage with null check
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Update mutable ref
  const incrementCount = (): void => {
    countRef.current += 1;
    console.log(`Clicked ${countRef.current} times`);
  };

  return (
    <div>
      <input ref={inputRef} type="text" placeholder="Search..." />
      <button onClick={focusInput}>Focus</button>
      <button onClick={incrementCount}>Count</button>
    </div>
  );
}
```

### useReducer with TypeScript

Create strongly typed reducers with TypeScript:

```tsx
// ✅ Good: Typed reducer pattern
// Define state type
interface CounterState {
  count: number;
  step: number;
  isActive: boolean;
}

// Define action types with discriminated union
type CounterAction =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET_COUNT"; payload: number }
  | { type: "SET_STEP"; payload: number }
  | { type: "TOGGLE_ACTIVE" };

// Implement the reducer with proper type annotations
function counterReducer(
  state: CounterState,
  action: CounterAction
): CounterState {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + state.step };
    case "DECREMENT":
      return { ...state, count: state.count - state.step };
    case "SET_COUNT":
      return { ...state, count: action.payload };
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "TOGGLE_ACTIVE":
      return { ...state, isActive: !state.isActive };
    default:
      // Use exhaustiveness checking
      const _exhaustiveCheck: never = action;
      return state;
  }
}

function Counter(): React.ReactElement {
  const [state, dispatch] = useReducer(counterReducer, {
    count: 0,
    step: 1,
    isActive: true,
  });

  return (
    <div>
      <p>Count: {state.count}</p>
      <p>Step: {state.step}</p>
      <p>Status: {state.isActive ? "Active" : "Inactive"}</p>

      <button onClick={() => dispatch({ type: "INCREMENT" })}>Increment</button>

      <button onClick={() => dispatch({ type: "DECREMENT" })}>Decrement</button>

      <button onClick={() => dispatch({ type: "SET_STEP", payload: 5 })}>
        Set Step to 5
      </button>

      <button onClick={() => dispatch({ type: "TOGGLE_ACTIVE" })}>
        Toggle Active
      </button>
    </div>
  );
}
```

## Generic Components

### Creating Reusable Generic Components

Use generics for flexible, reusable components:

```tsx
// ✅ Good: Generic list component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = "No items to display",
}: ListProps<T>): React.ReactElement {
  if (items.length === 0) {
    return <p className="empty-message">{emptyMessage}</p>;
  }

  return (
    <ul className="list">
      {items.map((item) => (
        <li key={keyExtractor(item)} className="list-item">
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

// Usage with different types
interface User {
  id: string;
  name: string;
  email: string;
}

const users: User[] = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
];

<List<User>
  items={users}
  keyExtractor={(user) => user.id}
  renderItem={(user) => (
    <div>
      <strong>{user.name}</strong>
      <p>{user.email}</p>
    </div>
  )}
/>;
```

## Context API Typing

### Type-Safe Context Provider and Consumer

Create strongly typed context with default values:

```tsx
// ✅ Good: Typed context
// First, define the context value type
interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

// Create context with a default value (for type safety)
// The as keyword is used to type assert the default value
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {}, // Noop function to satisfy the type
} as ThemeContextType);

// Context provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }, []);

  // Create the value object
  const value: ThemeContextType = {
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Custom hook for consuming the context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

// Usage in a component
function ThemedButton(): React.ReactElement {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className={`btn btn-${theme}`} onClick={toggleTheme}>
      Toggle Theme (Current: {theme})
    </button>
  );
}
```

## Higher-Order Components

### Type-Safe HOCs in TypeScript

Create higher-order components with proper typing:

```tsx
// ✅ Good: Typed higher-order component
// Define the props the HOC adds
interface WithLoadingProps {
  loading: boolean;
}

// The HOC itself
function withLoading<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & WithLoadingProps> {
  // Return the enhanced component
  return ({ loading, ...props }: WithLoadingProps & P) => {
    // Cast props to satisfy TypeScript
    if (loading) {
      return <div className="loading-spinner">Loading...</div>;
    }

    return <Component {...(props as P)} />;
  };
}

// The original component
interface UserListProps {
  users: Array<{ id: string; name: string }>;
  onUserClick: (id: string) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onUserClick }) => {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id} onClick={() => onUserClick(user.id)}>
          {user.name}
        </li>
      ))}
    </ul>
  );
};

// Create the enhanced component
const UserListWithLoading = withLoading(UserList);

// Usage
<UserListWithLoading
  loading={isLoading}
  users={users}
  onUserClick={handleUserClick}
/>;
```

## Performance Considerations

### React.memo with TypeScript

Use React.memo with proper typing:

```tsx
// ✅ Good: Typed memo component
interface PriceDisplayProps {
  value: number;
  currency: string;
  locale?: string;
}

// Explicit typing for memoized component
const PriceDisplay = React.memo<PriceDisplayProps>(
  ({ value, currency, locale = "en-US" }) => {
    // Expensive calculation to format price
    const formattedPrice = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(value);

    return <span className="price">{formattedPrice}</span>;
  }
);

// With custom equality function
const PriceDisplay2 = React.memo<PriceDisplayProps>(
  ({ value, currency, locale = "en-US" }) => {
    // Component implementation
    const formattedPrice = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(value);

    return <span className="price">{formattedPrice}</span>;
  },
  (prevProps, nextProps) => {
    // Custom comparison function
    // Only re-render if the price changes by more than 1
    return (
      prevProps.currency === nextProps.currency &&
      prevProps.locale === nextProps.locale &&
      Math.abs(prevProps.value - nextProps.value) <= 1
    );
  }
);
```

### useCallback with TypeScript

Type useCallback properly:

```tsx
// ✅ Good: Typed callback
function UserList(): React.ReactElement {
  // Define state
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  // Typed callback with parameters
  const handleUserClick = useCallback((userId: string): void => {
    console.log(`User clicked: ${userId}`);
  }, []);

  // Typed callback with dependencies
  const fetchUsers = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  }, []);

  // Dependency array with values
  const [filter, setFilter] = useState<string>("");

  const filteredUsers = useCallback((): Array<{ id: string; name: string }> => {
    return users.filter((user) =>
      user.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [users, filter]);

  return (
    <div>
      <button onClick={() => fetchUsers()}>Load Users</button>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter users..."
      />
      <ul>
        {filteredUsers().map((user) => (
          <li key={user.id} onClick={() => handleUserClick(user.id)}>
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Additional Resources

- [TypeScript React Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React TypeScript Documentation](https://reactjs.org/docs/static-type-checking.html#typescript)
- [React TypeScript Starter Templates](https://create-react-app.dev/docs/adding-typescript/)
- [TypeScript Playground for React](https://www.typescriptlang.org/play?jsx=2&esModuleInterop=true&e=196#example/typescript-with-react)
