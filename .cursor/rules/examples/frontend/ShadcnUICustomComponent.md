# shadcn/ui Custom Component Extension Pattern

This document demonstrates the recommended patterns for extending shadcn/ui components to create custom functionality without modifying the original component source code, in accordance with the [shadcn/ui Implementation Standards](../../departments/engineering/frontend/ui-frameworks/200-shadcn-ui-strictness.mdc).

## Principles of Component Extension

When extending shadcn/ui components, follow these key principles:

1. **Composition over Modification** - Create new components that wrap or compose with shadcn/ui components rather than modifying their source code
2. **Preserve Accessibility** - Maintain accessibility features when extending components
3. **TypeScript Integration** - Use proper TypeScript typing for props and interfaces
4. **Documentation** - Thoroughly document your custom components and their usage

## Extension Patterns

### 1. Wrapper Pattern

The wrapper pattern creates a new component that renders a shadcn/ui component with pre-configured props.

```tsx
// components/ui/primary-button.tsx
import { Button, ButtonProps } from "@/components/ui/button";

// Extension with additional functionality
export function PrimaryButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      variant="default"
      className="bg-brand-primary hover:bg-brand-primary-dark"
      {...props}
    >
      {children}
    </Button>
  );
}
```

**Usage Example:**

```tsx
import { PrimaryButton } from "@/components/ui/primary-button";

export default function ActionPage() {
  return (
    <div>
      <PrimaryButton>Submit Form</PrimaryButton>
    </div>
  );
}
```

### 2. Composition with Additional Props

Extend a component by adding new props while preserving the original component's API.

```tsx
// components/ui/icon-button.tsx
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// Extend the original ButtonProps
export interface IconButtonProps extends ButtonProps {
  icon: ReactNode;
  iconPosition?: "left" | "right";
}

export function IconButton({
  children,
  icon,
  iconPosition = "left",
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button className={cn("flex items-center gap-2", className)} {...props}>
      {iconPosition === "left" && icon}
      {children}
      {iconPosition === "right" && icon}
    </Button>
  );
}
```

**Usage Example:**

```tsx
import { IconButton } from "@/components/ui/icon-button";
import { PlusIcon, ArrowRightIcon } from "lucide-react";

export default function ToolbarComponent() {
  return (
    <div className="flex gap-4">
      <IconButton icon={<PlusIcon className="h-4 w-4" />} variant="outline">
        Add Item
      </IconButton>

      <IconButton
        icon={<ArrowRightIcon className="h-4 w-4" />}
        iconPosition="right"
      >
        Next Step
      </IconButton>
    </div>
  );
}
```

### 3. Compound Component Pattern

Create complex components using the compound component pattern with shadcn/ui components as building blocks.

```tsx
// components/ui/card-action.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// Create types for the compound component
interface CardActionProps {
  className?: string;
  children: ReactNode;
}

interface CardActionComposition {
  Header: typeof CardActionHeader;
  Content: typeof CardActionContent;
  Footer: typeof CardActionFooter;
}

// Main component
export const CardAction = ({ className, children }: CardActionProps) => {
  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      {children}
    </Card>
  );
};

// Subcomponents
interface CardActionHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

const CardActionHeader = ({
  title,
  description,
  className,
}: CardActionHeaderProps) => {
  return (
    <CardHeader className={className}>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
  );
};

interface CardActionContentProps {
  className?: string;
  children: ReactNode;
}

const CardActionContent = ({ className, children }: CardActionContentProps) => {
  return <CardContent className={className}>{children}</CardContent>;
};

interface CardActionFooterProps {
  className?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

const CardActionFooter = ({
  className,
  primaryAction,
  secondaryAction,
  children,
}: CardActionFooterProps) => {
  return (
    <CardFooter className={cn("flex justify-end gap-2", className)}>
      {children ? (
        children
      ) : (
        <>
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </>
      )}
    </CardFooter>
  );
};

// Attach subcomponents
(CardAction as CardActionComposition).Header = CardActionHeader;
(CardAction as CardActionComposition).Content = CardActionContent;
(CardAction as CardActionComposition).Footer = CardActionFooter;

export { CardActionHeader, CardActionContent, CardActionFooter };
```

**Usage Example:**

```tsx
import { CardAction } from "@/components/ui/card-action";

export default function FeatureSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CardAction>
        <CardAction.Header
          title="Premium Plan"
          description="For professional users and teams"
        />
        <CardAction.Content>
          <ul className="space-y-2">
            <li>✓ Unlimited projects</li>
            <li>✓ Priority support</li>
            <li>✓ Custom branding</li>
          </ul>
        </CardAction.Content>
        <CardAction.Footer
          primaryAction={{
            label: "Upgrade",
            onClick: () => console.log("Upgrade clicked"),
          }}
          secondaryAction={{
            label: "Learn More",
            onClick: () => console.log("Learn more clicked"),
          }}
        />
      </CardAction>

      {/* Another card with custom footer content */}
      <CardAction>
        <CardAction.Header
          title="Enterprise Plan"
          description="For large organizations"
        />
        <CardAction.Content>
          <ul className="space-y-2">
            <li>✓ Dedicated account manager</li>
            <li>✓ SLA guarantees</li>
            <li>✓ Advanced security features</li>
          </ul>
        </CardAction.Content>
        <CardAction.Footer>
          <Button variant="outline">Download Brochure</Button>
          <Button variant="secondary">Contact Sales</Button>
        </CardAction.Footer>
      </CardAction>
    </div>
  );
}
```

### 4. Higher-Order Component (HOC) Pattern

Create a higher-order component to add specific functionality to a shadcn/ui component.

```tsx
// components/ui/with-loading.tsx
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ComponentType, ReactElement } from "react";

// Higher-order component to add loading state to buttons
export function withLoading<P extends ButtonProps>(
  Component: ComponentType<P>
): ComponentType<P & { isLoading?: boolean }> {
  return ({
    isLoading,
    disabled,
    children,
    ...props
  }: P & { isLoading?: boolean }) => {
    return (
      <Component disabled={isLoading || disabled} {...(props as P)}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          children
        )}
      </Component>
    );
  };
}

// Create a LoadingButton component using the HOC
export const LoadingButton = withLoading(Button);
```

**Usage Example:**

```tsx
import { LoadingButton } from "@/components/ui/with-loading";
import { useState } from "react";

export default function FormWithSubmit() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      {/* Form fields here */}
      <LoadingButton type="submit" isLoading={isLoading}>
        Submit
      </LoadingButton>
    </form>
  );
}
```

## Advanced Customization with Variants

Use the `class-variance-authority` package to add custom variants to your extended components.

```tsx
// components/ui/status-button.tsx
import { Button, ButtonProps, buttonVariants } from "@/components/ui/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Define status variants
const statusButtonVariants = cva("", {
  variants: {
    status: {
      success: "bg-green-500 hover:bg-green-600 text-white",
      warning: "bg-amber-500 hover:bg-amber-600 text-white",
      error: "bg-red-500 hover:bg-red-600 text-white",
      info: "bg-blue-500 hover:bg-blue-600 text-white",
    },
  },
  defaultVariants: {
    status: "info",
  },
});

// Combine the original ButtonProps with our new status variants
export interface StatusButtonProps
  extends ButtonProps,
    VariantProps<typeof statusButtonVariants> {}

export function StatusButton({
  className,
  status,
  variant,
  ...props
}: StatusButtonProps) {
  // We override the variant if status is provided
  return (
    <Button
      className={cn(status && statusButtonVariants({ status }), className)}
      variant={!status ? variant : undefined}
      {...props}
    />
  );
}
```

**Usage Example:**

```tsx
import { StatusButton } from "@/components/ui/status-button";

export default function NotificationPanel() {
  return (
    <div className="space-y-4">
      <StatusButton status="success">Operation Successful</StatusButton>
      <StatusButton status="warning">Warning: Changes Pending</StatusButton>
      <StatusButton status="error">Error Occurred</StatusButton>
      <StatusButton status="info">Information Available</StatusButton>

      {/* Use original button variants when no status is provided */}
      <StatusButton variant="outline">Default Outline Button</StatusButton>
    </div>
  );
}
```

## Composition with Multiple Components

Combine multiple shadcn/ui components to create complex custom components.

```tsx
// components/ui/search-input.tsx
import { Input, InputProps } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { FormEvent, useState } from "react";

export interface SearchInputProps extends Omit<InputProps, "onChange"> {
  onSearch: (value: string) => void;
  clearable?: boolean;
}

export function SearchInput({
  onSearch,
  clearable = true,
  className,
  ...props
}: SearchInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  return (
    <form className="relative flex w-full items-center" onSubmit={handleSubmit}>
      <Input
        type="search"
        className="pr-20"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search..."
        {...props}
      />
      <div className="absolute right-1 flex gap-1">
        {clearable && value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleClear}
          >
            ✕
          </Button>
        )}
        <Button type="submit" size="sm" variant="ghost" className="h-7 w-7 p-0">
          <SearchIcon className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
```

**Usage Example:**

```tsx
import { SearchInput } from "@/components/ui/search-input";

export default function SearchPanel() {
  const handleSearch = (query: string) => {
    console.log(`Searching for: ${query}`);
    // Implementation of search functionality
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <SearchInput onSearch={handleSearch} />
    </div>
  );
}
```

## Best Practices Summary

1. **Design Intent**

   - Understand the purpose of your extended component
   - Define a clear API that follows the shadcn/ui patterns
   - Consider reusability across the application

2. **Component Structure**

   - Use composition to extend functionality
   - Maintain the original component's API where possible
   - Use TypeScript interfaces to define new props

3. **Styling**

   - Use the `cn` utility from shadcn/ui for class name merging
   - Leverage Tailwind CSS for additional styling
   - Consider using class-variance-authority for variants

4. **Documentation**

   - Document the component's purpose and API
   - Provide usage examples
   - Include details about customization options

5. **Testing**
   - Write unit tests for new functionality
   - Test accessibility
   - Verify that the component works with all its variants and states
