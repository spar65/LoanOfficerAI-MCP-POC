# Storybook Best Practices

This guide outlines best practices for using Storybook as part of the enterprise component development and visual testing workflow.

## Storybook Setup

### Project Structure

Organize your Storybook configuration for maintainability:

```
project/
├── .storybook/
│   ├── main.js        # Main configuration
│   ├── preview.js     # Global decorators and parameters
│   ├── preview-head.html # Global HTML additions
│   ├── manager.js     # UI customization
│   └── theme.js       # Custom theme
├── src/
│   └── components/
│       └── Button/
│           ├── Button.tsx
│           ├── Button.styles.ts
│           ├── Button.stories.tsx    # Component stories
│           └── Button.test.tsx
```

### Configuration Best Practices

#### main.js

```javascript
// .storybook/main.js
module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  staticDirs: ["../public"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
    "storybook-addon-designs",
    "storybook-addon-pseudo-states",
    "@storybook/addon-viewport",
    "storybook-dark-mode",
    "storybook-addon-performance",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {
      fastRefresh: true,
      strictMode: true,
    },
  },
  features: {
    interactionsDebugger: true,
    buildStoriesJson: true,
    argTypeTargetsV7: true,
  },
  docs: {
    autodocs: true,
  },
  // Ensure all Storybook builds are consistent
  core: {
    disableTelemetry: true,
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
      compilerOptions: {
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      },
    },
  },
};
```

#### preview.js

```javascript
// .storybook/preview.js
import { themes } from "@storybook/theming";
import { initialize, mswDecorator } from "msw-storybook-addon";
import { handlers } from "../src/mocks/handlers";
import "../src/styles/global.css";

// Initialize MSW for API mocking
initialize({
  onUnhandledRequest: "bypass",
});

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
    expanded: true,
    sort: "alpha",
  },
  options: {
    storySort: {
      order: [
        "Introduction",
        "Design System",
        ["Overview", "Colors", "Typography", "Spacing", "Icons", "Shadows"],
        "Components",
        ["Inputs", "Navigation", "Feedback", "Layout", "Data Display"],
        "Templates",
        "Pages",
      ],
    },
  },
  darkMode: {
    dark: { ...themes.dark },
    light: { ...themes.normal },
    current: "light",
  },
  a11y: {
    element: "#root",
    manual: false,
  },
  viewport: {
    viewports: {
      mobile: {
        name: "Mobile",
        styles: {
          width: "375px",
          height: "667px",
        },
      },
      tablet: {
        name: "Tablet",
        styles: {
          width: "768px",
          height: "1024px",
        },
      },
      desktop: {
        name: "Desktop",
        styles: {
          width: "1440px",
          height: "900px",
        },
      },
    },
    defaultViewport: "desktop",
  },
  backgrounds: {
    default: "light",
    values: [
      { name: "light", value: "#FFFFFF" },
      { name: "gray", value: "#F7F7F7" },
      { name: "dark", value: "#2E2E2E" },
    ],
  },
};

// Global decorators
export const decorators = [
  mswDecorator,
  (Story) => (
    <div style={{ margin: "2rem" }}>
      <Story />
    </div>
  ),
];
```

## Writing Effective Stories

### Component Story Format (CSF)

Use modern Component Story Format:

```typescript
// Button.stories.tsx
import { Button } from "./Button";
import type { Meta, StoryObj } from "@storybook/react";

// Metadata for the component
const meta: Meta<typeof Button> = {
  component: Button,
  title: "Components/Button",
  // Common args can be specified here
  args: {
    onClick: () => console.log("Button clicked"),
  },
  // Tag stories for organization and filtering
  tags: ["autodocs", "ui-component"],
};

export default meta;
type Story = StoryObj<typeof Button>;

// Base story - defines the primary use case
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

// Create stories based on the base story with variations
export const Secondary: Story = {
  args: {
    ...Primary.args,
    variant: "secondary",
    children: "Secondary Button",
  },
};

export const Large: Story = {
  args: {
    ...Primary.args,
    size: "large",
  },
};

export const Small: Story = {
  args: {
    ...Primary.args,
    size: "small",
  },
};

// Story with custom render function (when needed)
export const WithIcon: Story = {
  render: (args) => (
    <Button {...args}>
      <Icon name="star" />
      <span>With Icon</span>
    </Button>
  ),
};

// Story with specific testing parameters
export const WithA11yTest: Story = {
  args: {
    ...Primary.args,
  },
  parameters: {
    a11y: {
      config: {
        rules: [{ id: "color-contrast", enabled: true }],
      },
    },
  },
};
```

### Story Organization Patterns

Follow these patterns for organizing stories:

1. **Base + Variations Pattern**

   - Create a base story with default props
   - Derive variations from the base story
   - Use args inheritance to minimize duplication

2. **State Pattern**

   - Create stories for different component states
   - Include loading, error, empty, and success states
   - Ensure all interaction states are covered

3. **Edge Cases Pattern**

   - Create stories for edge cases like long text
   - Test min/max prop values
   - Test internationalization with various content

4. **Responsive Pattern**
   - Test components across different viewports
   - Use viewport addon to verify behavior
   - Create specific stories for responsive behaviors

## Documentation Best Practices

### Component Documentation

Use MDX or JSDoc comments for comprehensive documentation:

````typescript
/**
 * Primary UI component for user interaction
 *
 * @component
 * @example
 * ```tsx
 * <Button variant="primary" size="medium">Click Me</Button>
 * ```
 */
export const Button = ({
  /**
   * Button contents/label
   */
  children,

  /**
   * The visual style of the button
   * @default 'primary'
   */
  variant = "primary",

  /**
   * How large should the button be?
   * @default 'medium'
   */
  size = "medium",

  /**
   * Optional click handler
   */
  onClick,

  /**
   * Disabled state
   * @default false
   */
  disabled = false,
}) => {
  // Implementation
};
````

### Using ArgTypes

Configure controls for better documentation:

```typescript
// Custom arg types for better documentation
const meta: Meta<typeof Button> = {
  component: Button,
  title: "Components/Button",
  argTypes: {
    variant: {
      description: "The visual style of the button",
      control: {
        type: "select",
        options: ["primary", "secondary", "tertiary", "danger"],
      },
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "primary" },
      },
    },
    size: {
      description: "The size of the button",
      control: {
        type: "radio",
        options: ["small", "medium", "large"],
      },
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "medium" },
      },
    },
    disabled: {
      description: "Whether the button is disabled",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: false },
      },
    },
    onClick: {
      description: "Optional click handler",
      action: "clicked",
      table: {
        type: { summary: "function" },
      },
    },
    children: {
      description: "Button contents",
      control: "text",
      table: {
        type: { summary: "React.ReactNode" },
      },
    },
  },
};
```

### Design Integration

Link stories to design files:

```typescript
// Link to design assets
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/example-file/component-id",
    },
  },
};
```

## Testing Integration

### Component Tests with Storybook

Use Storybook stories for testing to avoid duplication:

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { composeStories } from "@storybook/react";
import * as stories from "./Button.stories";

// Import stories for testing
const { Primary, Disabled } = composeStories(stories);

describe("Button", () => {
  it("renders primary button", () => {
    render(<Primary />);
    const button = screen.getByRole("button", { name: /primary button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("btn-primary");
  });

  it("handles clicks", () => {
    const onClick = jest.fn();
    render(<Primary onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("respects disabled state", () => {
    render(<Disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### Accessibility Testing

Integrate accessibility testing with Storybook:

```typescript
// With the a11y addon
export const WithA11yChecks: Story = {
  args: {
    variant: "primary",
    children: "Accessible Button",
  },
  parameters: {
    a11y: {
      // Target element
      element: "#root",
      // Which axe rules to run and which to disable
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
        ],
      },
      // Show results in a panel for manual verification
      manual: true,
    },
  },
};
```

## Interaction Testing

Use Storybook's interaction testing feature:

```typescript
export const WithInteractions: Story = {
  args: {
    variant: "primary",
    children: "Interactive Button",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // Find the button
    const button = canvas.getByRole("button", { name: /Interactive Button/i });

    // Simulate interactions
    await userEvent.hover(button);
    await sleep(300); // For visual inspection
    await userEvent.click(button);

    // Verify the onClick handler was called
    await waitFor(() => {
      expect(args.onClick).toHaveBeenCalled();
    });
  },
};
```

## Mock Data and API Integration

### Using MSW for API Mocking

```typescript
// .storybook/preview.js
import { initialize, mswDecorator } from "msw-storybook-addon";
import { handlers } from "../src/mocks/handlers";

// Initialize MSW
initialize();

// Add the MSW decorator
export const decorators = [
  mswDecorator,
  // other decorators...
];

// src/mocks/handlers.js
import { rest } from "msw";

export const handlers = [
  rest.get("/api/users", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 1, name: "John Doe" },
        { id: 2, name: "Jane Smith" },
      ])
    );
  }),

  rest.post("/api/users", (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: 3, name: "New User" }));
  }),
];
```

### Creating Mock Data Factories

```typescript
// src/mocks/factories.ts
import { faker } from "@faker-js/faker";

export const createUser = (overrides = {}) => ({
  id: faker.datatype.uuid(),
  name: faker.name.fullName(),
  email: faker.internet.email(),
  avatar: faker.image.avatar(),
  role: faker.helpers.arrayElement(["admin", "editor", "viewer"]),
  ...overrides,
});

export const createUserList = (count = 10, overrides = {}) =>
  Array.from({ length: count }, () => createUser(overrides));
```

## Performance Optimization

### Bundle Size Optimization

```
// .storybook/main.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  // ... other config
  webpackFinal: async (config) => {
    // Add optimizations for production builds
    if (process.env.NODE_ENV === 'production') {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true,
              },
            },
          }),
        ],
      };
    }

    return config;
  },
};
```

### Lazy Loading Stories

```typescript
// For large component libraries
export default {
  title: "Components/DataTable",
  component: DataTable,
  parameters: {
    // Don't render this component until its story is selected
    // Helps with performance for complex components
    chromatic: { disableSnapshot: false },
    docs: {
      inlineStories: false,
      iframeHeight: 600,
    },
  },
};
```

## Enterprise Integration

### Design System Integration

Connect Storybook to your design system:

```typescript
// .storybook/preview.js
import { ThemeProvider } from "../src/components/ThemeProvider";
import { themes, tokens } from "../src/design-system";

// Make design tokens available in all stories
export const parameters = {
  // ... other parameters
  designTokens: {
    tokens,
  },
};

// Provide theme context to all stories
export const decorators = [
  (Story) => (
    <ThemeProvider>
      <Story />
    </ThemeProvider>
  ),
  // ... other decorators
];
```

### Multi-Brand Support

```typescript
// .storybook/preview.js
import { themes } from "../src/themes";
import { useMemo } from "react";
import { ThemeProvider } from "../src/components/ThemeProvider";

export const globalTypes = {
  theme: {
    name: "Theme",
    description: "Global theme for components",
    defaultValue: "default",
    toolbar: {
      icon: "paintbrush",
      items: [
        { value: "default", title: "Default" },
        { value: "dark", title: "Dark" },
      ],
    },
  },
  brand: {
    name: "Brand",
    description: "Brand configuration",
    defaultValue: "main",
    toolbar: {
      icon: "bookmark",
      items: [
        { value: "main", title: "Main Brand" },
        { value: "partner1", title: "Partner 1" },
        { value: "partner2", title: "Partner 2" },
      ],
    },
  },
};

// Brand decorator for multi-brand support
export const decorators = [
  (Story, { globals }) => {
    // Combine theme and brand settings
    const { theme: themeKey, brand: brandKey } = globals;
    const theme = useMemo(() => {
      return {
        ...themes[themeKey],
        brandConfig: themes.brands[brandKey],
      };
    }, [themeKey, brandKey]);

    return (
      <ThemeProvider theme={theme}>
        <Story />
      </ThemeProvider>
    );
  },
];
```

### CI/CD Integration

```yaml
# .github/workflows/storybook.yml
name: Storybook Deployment

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

jobs:
  storybook:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build Storybook
        run: npm run build-storybook

      # For main branch, deploy to production Storybook
      - name: Deploy production Storybook
        if: github.ref == 'refs/heads/main'
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: storybook-static
          target-folder: storybook

      # For develop branch, deploy to staging Storybook
      - name: Deploy staging Storybook
        if: github.ref == 'refs/heads/develop'
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: storybook-static
          target-folder: storybook-staging

      # For PRs, run Chromatic
      - name: Run Chromatic
        if: github.event_name == 'pull_request'
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: true
```

## Conclusion

Following these Storybook best practices helps create a maintainable, well-documented component library that serves as both development environment and living documentation. By integrating with visual testing tools, accessibility checks, and your design system, Storybook becomes a central hub for component-driven development in the enterprise.

## Related Documentation

- [Component Visual Testing Guide](mdc:examples/testing/ComponentVisualTestingGuide.md)
- [Visual Test Automation](mdc:examples/testing/VisualTestAutomation.md)
- [Enterprise Test Strategy](mdc:examples/testing/EnterpriseTestStrategy.md)
