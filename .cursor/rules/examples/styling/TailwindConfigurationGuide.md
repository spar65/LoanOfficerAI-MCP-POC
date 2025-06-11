# Tailwind Configuration Guide

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide provides a detailed approach to configuring Tailwind CSS for your enterprise project, following the guidelines in [050-css-architecture.mdc](mdc:departments/product/050-css-architecture.mdc).

## Table of Contents

1. [Basic Configuration](#basic-configuration)
2. [Design Token Integration](#design-token-integration)
3. [Custom Plugins](#custom-plugins)
4. [Organization-Specific Theming](#organization-specific-theming)
5. [Component-Specific Extensions](#component-specific-extensions)
6. [Performance Optimization](#performance-optimization)

## Basic Configuration

Start with a well-structured basic configuration:

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Specify files to scan for classes
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
  ],

  // Adjust dark mode strategy
  darkMode: "class", // or 'media' for system preferences

  theme: {
    // Theme extensions will go here
    extend: {},
  },

  // Plugins
  plugins: [],
};
```

## Design Token Integration

Integrate your design tokens with Tailwind's configuration:

```js
// tailwind.config.js
module.exports = {
  // ... other config
  theme: {
    extend: {
      // Colors mapped to CSS variables
      colors: {
        // Brand colors
        brand: {
          primary: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
          accent: "var(--brand-accent)",
        },

        // UI colors
        ui: {
          background: "var(--color-background)",
          foreground: "var(--color-foreground)",
          muted: "var(--color-muted)",
          border: "var(--color-border)",
        },

        // Semantic colors
        status: {
          error: "var(--color-error)",
          warning: "var(--color-warning)",
          success: "var(--color-success)",
          info: "var(--color-info)",
        },
      },

      // Spacing
      spacing: {
        // Layout spacing
        header: "var(--header-height)",
        sidebar: "var(--sidebar-width)",
        "sidebar-collapsed": "var(--sidebar-width-collapsed)",
        "content-padding": "var(--content-padding)",

        // Add any other specific spacing values that are not covered by
        // the default Tailwind spacing scale
      },

      // Font families
      fontFamily: {
        sans: "var(--font-family-sans)",
        mono: "var(--font-family-mono)",
        heading: "var(--brand-font-heading, var(--font-family-sans))",
      },

      // Font sizes
      fontSize: {
        // Prefer CSS variables for font sizes
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-md)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
        "3xl": "var(--font-size-3xl)",
        "4xl": "var(--font-size-4xl)",
      },

      // Border radius
      borderRadius: {
        button: "var(--button-radius, 0.375rem)",
        card: "var(--card-radius, 0.5rem)",
      },

      // Z-index layers
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

      // Transition options
      transitionDuration: {
        fast: "var(--transition-fast)",
        normal: "var(--transition-normal)",
        slow: "var(--transition-slow)",
      },
    },
  },
};
```

## Custom Plugins

Create custom plugins for reusable patterns:

```js
// tailwind.config.js
const plugin = require("tailwindcss/plugin");

module.exports = {
  // ... other config
  plugins: [
    // Typography plugin for text styles
    plugin(({ addUtilities }) => {
      addUtilities({
        // Headings
        ".text-heading-1": {
          fontSize: "var(--font-size-4xl)",
          lineHeight: "1.2",
          fontWeight: "700",
          fontFamily: "var(--brand-font-heading, var(--font-family-sans))",
        },
        ".text-heading-2": {
          fontSize: "var(--font-size-3xl)",
          lineHeight: "1.25",
          fontWeight: "700",
          fontFamily: "var(--brand-font-heading, var(--font-family-sans))",
        },
        ".text-heading-3": {
          fontSize: "var(--font-size-2xl)",
          lineHeight: "1.3",
          fontWeight: "600",
          fontFamily: "var(--brand-font-heading, var(--font-family-sans))",
        },
        ".text-heading-4": {
          fontSize: "var(--font-size-xl)",
          lineHeight: "1.4",
          fontWeight: "600",
          fontFamily: "var(--brand-font-heading, var(--font-family-sans))",
        },

        // Body text
        ".text-body-large": {
          fontSize: "var(--font-size-lg)",
          lineHeight: "1.5",
          fontWeight: "400",
        },
        ".text-body": {
          fontSize: "var(--font-size-md)",
          lineHeight: "1.5",
          fontWeight: "400",
        },
        ".text-body-small": {
          fontSize: "var(--font-size-sm)",
          lineHeight: "1.5",
          fontWeight: "400",
        },

        // UI text
        ".text-label": {
          fontSize: "var(--font-size-sm)",
          lineHeight: "1.4",
          fontWeight: "500",
        },
        ".text-caption": {
          fontSize: "var(--font-size-xs)",
          lineHeight: "1.4",
          fontWeight: "400",
          color: "var(--color-muted)",
        },
      });
    }),

    // Layout patterns
    plugin(({ addUtilities }) => {
      addUtilities({
        ".layout-container": {
          width: "100%",
          maxWidth: "var(--content-max-width)",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "var(--content-padding)",
          paddingRight: "var(--content-padding)",
        },
        ".layout-flow": {
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-6)",
        },
        ".layout-cluster": {
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--spacing-4)",
          alignItems: "center",
        },
      });
    }),

    // Interactive element states
    plugin(({ addVariant }) => {
      // Add custom state variants
      addVariant("loaded", '&[data-loaded="true"]');
      addVariant("error", '&[data-error="true"]');
      addVariant("expanded", '&[data-expanded="true"]');
      addVariant("selected", '&[data-selected="true"]');

      // Adds group-opened:* for targeting elements when parent has data-opened="true"
      addVariant("group-opened", ':merge(.group)[data-opened="true"] &');
    }),
  ],
};
```

## Organization-Specific Theming

Configure Tailwind to handle organization-specific theming:

```js
// tailwind.config.js
module.exports = {
  // ... other config
  theme: {
    extend: {
      // ... other theme extensions
    },
  },
  plugins: [
    // ... other plugins

    // Custom plugin for organization themes
    plugin(function ({ addBase }) {
      addBase({
        // Define organization-specific theme attributes
        '[data-organization="default"]': {
          "--brand-primary": "#3b82f6",
          "--brand-secondary": "#e5e7eb",
          "--brand-accent": "#10b981",
          "--button-radius": "0.375rem",
        },
        '[data-organization="acme"]': {
          "--brand-primary": "#FF5733",
          "--brand-secondary": "#33FF57",
          "--brand-accent": "#3357FF",
          "--button-radius": "0.25rem",
        },
        '[data-organization="globex"]': {
          "--brand-primary": "#8A2BE2",
          "--brand-secondary": "#20B2AA",
          "--brand-accent": "#FFA500",
          "--button-radius": "2rem",
        },
      });
    }),
  ],
};
```

## Component-Specific Extensions

For components with specific design needs:

```js
// tailwind.config.js
module.exports = {
  // ... other config
  theme: {
    extend: {
      // ... other theme extensions

      // Example: Card-specific styles
      boxShadow: {
        card: "var(--card-shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06))",
        "card-hover":
          "var(--card-shadow-hover, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))",
      },

      // Example: Button-specific styles
      animation: {
        "button-loading": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
      },
    },
  },
};
```

## Usage Examples

### Using Theme Extensions in Components

```jsx
// Button.jsx
export function Button({
  children,
  variant = "primary",
  size = "default",
  isLoading,
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        rounded-button font-medium
        transition-colors duration-normal
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        
        ${
          variant === "primary"
            ? "bg-brand-primary text-white hover:bg-brand-primary/90"
            : ""
        }
        ${
          variant === "secondary"
            ? "bg-brand-secondary text-ui-foreground hover:bg-brand-secondary/90"
            : ""
        }
        ${
          variant === "outline"
            ? "border border-ui-border bg-transparent hover:bg-ui-background/50"
            : ""
        }
        
        ${size === "small" ? "text-xs py-1 px-3" : ""}
        ${size === "default" ? "text-sm py-2 px-4" : ""}
        ${size === "large" ? "text-base py-3 px-6" : ""}
        
        ${isLoading ? "animate-button-loading" : ""}
      `}
      disabled={isLoading}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Using Custom Utilities

```jsx
// Card.jsx
export function Card({ children, title, className, ...props }) {
  return (
    <div
      className={`
        bg-ui-background
        border border-ui-border
        rounded-card
        shadow-card
        hover:shadow-card-hover
        transition-shadow duration-normal
        overflow-hidden
        ${className || ""}
      `}
      {...props}
    >
      {title && (
        <div className="px-4 py-3 border-b border-ui-border">
          <h3 className="text-heading-4">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
```

### Layout Components

```jsx
// PageLayout.jsx
export function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-ui-background text-ui-foreground">
      <header className="h-header border-b border-ui-border bg-white sticky top-0 z-sticky">
        {/* Header content */}
      </header>

      <div className="layout-container layout-flow py-8">{children}</div>

      <footer className="border-t border-ui-border py-6">
        <div className="layout-container">{/* Footer content */}</div>
      </footer>
    </div>
  );
}
```

## Performance Optimization

To optimize your Tailwind configuration:

```js
// tailwind.config.js
module.exports = {
  // ... other config

  // Optimize for production
  future: {
    hoverOnlyWhenSupported: true, // Only generate hover variants for devices that support hover
  },

  // Disable core plugins you don't use
  corePlugins: {
    // Example: Disable plugins not needed
    float: false,
    clear: false,
    // Add others as needed
  },

  // Reduce variants to those actually used
  variants: {
    extend: {
      // Only activate variants you need for each utility
      backgroundColor: ["hover", "focus", "disabled", "dark"],
      textColor: ["hover", "focus", "disabled", "dark"],
      opacity: ["hover", "disabled"],
      // Limit other properties as needed
    },
  },

  // Safelist critical classes that might be dynamically generated
  safelist: [
    // Dynamically generated classes that should always be included
    "bg-status-error",
    "bg-status-warning",
    "bg-status-success",
    "bg-status-info",
  ],
};
```

## Best Practices

1. **Use CSS Variables for Theming**: Always reference CSS variables in your Tailwind configuration instead of hardcoding values.

2. **Consistent Naming**: Follow a consistent naming pattern for your custom utilities and classes.

3. **Documentation**: Add comments in your Tailwind configuration to explain non-obvious choices.

4. **Component-First Approach**: Design your Tailwind extensions around the components in your system.

5. **Performance**: Regularly audit your Tailwind usage to ensure you're not shipping unused CSS.

6. **Testing Considerations**: Make sure your Tailwind classes follow accessible contrast ratios and are tested across browsers.

7. **Dark Mode Strategy**: Choose either `class` or `media` strategy for dark mode based on your application needs.

8. **Use Official Plugins**: Leverage official Tailwind plugins where appropriate (forms, typography, etc.).

## Recommended Tools

- **Tailwind CSS IntelliSense**: VSCode extension for autocomplete and linting
- **headlessui**: Accessible UI components that pair well with Tailwind
- **tailwindcss/forms**: Plugin for better form styling
- **tailwindcss/typography**: Plugin for rich text content styling
- **tailwind-merge**: Utility for merging Tailwind classes without conflicts
