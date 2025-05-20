# CSS Architecture Examples

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide provides concrete examples of CSS architecture following the guidelines in [050-css-architecture.mdc](mdc:departments/product/050-css-architecture.mdc).

## Table of Contents

1. [Design Token System](#design-token-system)
2. [Component Styling Approaches](#component-styling-approaches)
3. [Layout Patterns](#layout-patterns)
4. [Responsive Design Implementation](#responsive-design-implementation)
5. [White-Label Theming](#white-label-theming)
6. [Testing-Friendly Patterns](#testing-friendly-patterns)

## Design Token System

A well-organized design token system is the foundation of consistent styling:

```css
/* globals.css */
:root {
  /* Color scale - Use semantic naming */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  --color-gray-950: #030712;

  --color-blue-50: #eff6ff;
  --color-blue-100: #dbeafe;
  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  --color-blue-700: #1d4ed8;

  /* Add other color scales as needed */

  /* Semantic tokens - map to color scale */
  --color-background: var(--color-gray-50);
  --color-foreground: var(--color-gray-900);
  --color-muted: var(--color-gray-500);
  --color-primary: var(--color-blue-600);
  --color-primary-hover: var(--color-blue-700);
  --color-border: var(--color-gray-200);
  --color-focus-ring: rgba(59, 130, 246, 0.5);

  /* Typography */
  --font-family-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-family-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;

  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  /* Spacing and layout */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;

  /* Layout-specific tokens */
  --header-height: 4rem;
  --sidebar-width: 16rem;
  --sidebar-width-collapsed: 4rem;
  --content-max-width: 1280px;
  --content-padding: var(--spacing-6);

  /* Animation */
  --transition-fast: 150ms;
  --transition-normal: 250ms;
  --transition-slow: 350ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-index layers */
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
}

/* Dark theme tokens */
.dark-theme {
  --color-background: var(--color-gray-900);
  --color-foreground: var(--color-gray-50);
  --color-muted: var(--color-gray-400);
  --color-border: var(--color-gray-700);
  /* Override other tokens as needed */
}
```

## Component Styling Approaches

Below are examples of different component styling approaches - choose the one that best fits your project:

### CSS Modules Approach

```css
/* Button.module.css */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: 0.375rem;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: background-color var(--transition-fast) var(--easing-default);
}

.primary {
  background-color: var(--color-primary);
  color: white;
}

.primary:hover {
  background-color: var(--color-primary-hover);
}

.secondary {
  background-color: var(--color-gray-200);
  color: var(--color-gray-800);
}

.secondary:hover {
  background-color: var(--color-gray-300);
}

/* Size variations */
.small {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-xs);
}

.large {
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-md);
}
```

```jsx
// Button.jsx
import styles from "./Button.module.css";
import clsx from "clsx";

export function Button({
  children,
  variant = "primary",
  size = "medium",
  className,
  ...props
}) {
  return (
    <button
      className={clsx(
        styles.button,
        styles[variant],
        size === "small" && styles.small,
        size === "large" && styles.large,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Tailwind CSS Approach

```jsx
// TailwindButton.jsx
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        primary: "bg-brand-primary text-white hover:bg-brand-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

## Layout Patterns

Consistent layout patterns help maintain structure across the application:

```css
/* layout.module.css */
.pageLayout {
  display: grid;
  min-height: 100vh;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: var(--header-height) 1fr auto;
}

.pageHeader {
  grid-area: header;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-4);
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.pageSidebar {
  grid-area: sidebar;
  height: calc(100vh - var(--header-height));
  position: sticky;
  top: var(--header-height);
  overflow-y: auto;
  background-color: var(--color-background);
  border-right: 1px solid var(--color-border);
  padding: var(--spacing-4);
}

.pageMain {
  grid-area: main;
  padding: var(--spacing-6);
}

.pageFooter {
  grid-area: footer;
  padding: var(--spacing-4);
  background-color: var(--color-background);
  border-top: 1px solid var(--color-border);
}

/* Collapsed sidebar variant */
.pageLayout--sidebarCollapsed {
  grid-template-columns: var(--sidebar-width-collapsed) 1fr;
}

/* Mobile layout */
@media (max-width: 768px) {
  .pageLayout {
    grid-template-areas:
      "header"
      "main"
      "footer";
    grid-template-columns: 1fr;
  }

  .pageSidebar {
    display: none;
  }

  .pageSidebar--mobileVisible {
    display: block;
    position: fixed;
    top: var(--header-height);
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-fixed);
    background-color: var(--color-background);
    height: calc(100vh - var(--header-height));
  }
}
```

## Responsive Design Implementation

Mobile-first responsive design implementation:

```jsx
// ResponsiveCard.jsx
import styles from "./ResponsiveCard.module.css";

export function ResponsiveCardGrid({ children }) {
  return <div className={styles.responsiveGrid}>{children}</div>;
}
```

```css
/* ResponsiveCard.module.css */
.responsiveGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

/* Mobile-first responsive breakpoints */
@media (min-width: 640px) {
  .responsiveGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .responsiveGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .responsiveGrid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

Using Tailwind's responsive utilities:

```jsx
// ResponsiveCardTailwind.jsx
export function ResponsiveCardGrid({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
```

## White-Label Theming

Implementation of white-label theming with CSS variables:

```css
/* theme-tokens.css */
:root {
  /* Base theme (fallback) */
  --brand-primary: #3b82f6;
  --brand-secondary: #e5e7eb;
  --brand-accent: #10b981;

  --brand-header-bg: var(--brand-primary);
  --brand-header-text: white;

  --brand-sidebar-bg: white;
  --brand-sidebar-text: #1f2937;

  --brand-button-radius: 0.375rem;
  --brand-font-heading: var(--font-family-sans);
}

/* Organization-specific theme overrides using data attributes */
[data-organization="acme"] {
  --brand-primary: #ff5733;
  --brand-secondary: #33ff57;
  --brand-accent: #3357ff;
  --brand-button-radius: 0.25rem;
}

[data-organization="globex"] {
  --brand-primary: #8a2be2;
  --brand-secondary: #20b2aa;
  --brand-accent: #ffa500;
  --brand-button-radius: 2rem; /* Pill-shaped buttons */
  --brand-font-heading: "Georgia", serif;
}
```

```jsx
// ThemeProvider.jsx
export function ThemeProvider({ children, organization = "default" }) {
  return <div data-organization={organization}>{children}</div>;
}

// Usage
<ThemeProvider organization="acme">
  <App />
</ThemeProvider>;
```

## Testing-Friendly Patterns

Patterns that make components easier to test:

```jsx
// TestableComponent.jsx
import styles from "./TestableComponent.module.css";

export function UserProfile({ user, isLoading, error }) {
  if (isLoading) {
    return (
      <div
        className={styles.profileCard}
        data-testid="user-profile"
        data-state="loading"
      >
        <div className={styles.profileSkeleton} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={styles.profileCard}
        data-testid="user-profile"
        data-state="error"
      >
        <div className={styles.errorMessage}>
          Failed to load profile: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.profileCard}
      data-testid="user-profile"
      data-state="loaded"
    >
      <img
        src={user.avatar}
        alt={`${user.name}'s avatar`}
        className={styles.profileAvatar}
      />
      <h2 className={styles.profileName}>{user.name}</h2>
      <p className={styles.profileBio}>{user.bio}</p>
    </div>
  );
}
```

```css
/* TestableComponent.module.css */
.profileCard {
  padding: var(--spacing-4);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
}

/* Loading state */
.profileSkeleton {
  display: grid;
  gap: var(--spacing-4);
}

.profileSkeleton::before {
  content: "";
  display: block;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--color-gray-200);
  margin: 0 auto;
}

.profileSkeleton::after {
  content: "";
  display: block;
  height: 100px;
  background-color: var(--color-gray-200);
  border-radius: 0.25rem;
}

/* Error state */
.errorMessage {
  color: var(--color-error);
  text-align: center;
  padding: var(--spacing-4);
}

/* Loaded state */
.profileAvatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto var(--spacing-4);
}

.profileName {
  font-size: var(--font-size-xl);
  font-weight: 600;
  text-align: center;
  margin-bottom: var(--spacing-2);
}

.profileBio {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  text-align: center;
}
```

## Tailwind Theme Configuration

```js
// tailwind.config.js
const plugin = require("tailwindcss/plugin");

module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map design token names to CSS variables
        brand: {
          primary: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
          accent: "var(--brand-accent)",
        },
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
      },
      spacing: {
        header: "var(--header-height)",
        sidebar: "var(--sidebar-width)",
        "sidebar-collapsed": "var(--sidebar-width-collapsed)",
      },
      borderRadius: {
        brand: "var(--brand-button-radius)",
      },
      fontFamily: {
        heading: "var(--brand-font-heading)",
      },
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-md)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
        "3xl": "var(--font-size-3xl)",
        "4xl": "var(--font-size-4xl)",
      },
      zIndex: {
        base: "var(--z-base)",
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        fixed: "var(--z-fixed)",
        "modal-backdrop": "var(--z-modal-backdrop)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        tooltip: "var(--z-tooltip)",
      },
    },
  },
  plugins: [
    // Custom plugin for text styles
    plugin(({ addUtilities }) => {
      addUtilities({
        ".text-heading-1": {
          fontSize: "var(--font-size-4xl)",
          lineHeight: "1.2",
          fontWeight: "700",
          fontFamily: "var(--brand-font-heading)",
        },
        ".text-heading-2": {
          fontSize: "var(--font-size-3xl)",
          lineHeight: "1.25",
          fontWeight: "700",
          fontFamily: "var(--brand-font-heading)",
        },
        ".text-heading-3": {
          fontSize: "var(--font-size-2xl)",
          lineHeight: "1.3",
          fontWeight: "600",
          fontFamily: "var(--brand-font-heading)",
        },
      });
    }),
  ],
};
```

## Additional Resources

- [CSS Variables Best Practices](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [The BEM Methodology](http://getbem.com/introduction/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [CSS Modules Documentation](https://github.com/css-modules/css-modules)
