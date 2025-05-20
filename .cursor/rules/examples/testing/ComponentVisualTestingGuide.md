# Component Visual Testing Guide

This guide provides detailed recommendations and patterns for implementing effective visual testing for UI components in enterprise applications.

## Visual Testing Fundamentals

Visual testing is the process of verifying that UI components appear correctly and consistently by capturing and comparing visual snapshots or screenshots of components in various states.

### Types of Visual Testing

1. **Snapshot Testing**

   - Captures component DOM or rendered output as serialized text
   - Lightweight and fast to run
   - Limited ability to detect visual regressions

2. **Screenshot Testing**

   - Captures actual visual appearance as images
   - Can detect pixel-level differences
   - More comprehensive but requires more infrastructure

3. **Visual Diffing**

   - Compares screenshots to detect visual changes
   - Shows visual differences between baseline and current implementation
   - Requires approval workflow for intended changes

4. **Cross-Browser Testing**
   - Tests visual appearance across different browsers and devices
   - Detects rendering inconsistencies
   - Usually integrated with screenshot testing

## Setting Up Visual Testing

### Storybook Configuration

Storybook is the recommended tool for component visual testing:

```javascript
// .storybook/main.js
module.exports = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
    "storybook-addon-designs",
    "storybook-addon-pseudo-states",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  staticDirs: ["../public"],
  features: {
    interactionsDebugger: true,
  },
};
```

### Integrating Chromatic

For cloud-based visual testing with approval workflows:

1. **Installation**

```bash
npm install --save-dev chromatic
```

2. **Configuration** (package.json)

```json
{
  "scripts": {
    "chromatic": "chromatic --exit-zero-on-changes"
  }
}
```

3. **GitHub Actions Integration**

```yaml
name: Visual Testing

on:
  pull_request:
    branches: [main, develop]

jobs:
  visual-test:
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

      - name: Run Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitOnceUploaded: true
```

### Alternative: Percy Integration

For teams using Percy for visual testing:

1. **Installation**

```bash
npm install --save-dev @percy/cli @percy/storybook
```

2. **Configuration** (package.json)

```json
{
  "scripts": {
    "percy": "percy storybook ./storybook-static"
  }
}
```

### Local Visual Testing with Loki

For teams preferring local visual testing:

1. **Installation**

```bash
npm install --save-dev loki
```

2. **Configuration** (package.json)

```json
{
  "loki": {
    "configurations": {
      "chrome.laptop": {
        "target": "chrome.docker",
        "width": 1366,
        "height": 768
      },
      "chrome.mobile": {
        "target": "chrome.docker",
        "width": 375,
        "height": 667
      }
    }
  }
}
```

## Writing Effective Visual Tests

### Component Story Structure

Follow this structure for component stories:

```typescript
// Card.stories.tsx
import { Card } from "./Card";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Card> = {
  component: Card,
  title: "Components/Card",
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outlined", "elevated"],
    },
    clickable: { control: "boolean" },
    loading: { control: "boolean" },
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/example/card-component",
    },
    chromatic: {
      viewports: [375, 768, 1440],
      diffThreshold: 0.2,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

// Base variant
export const Default: Story = {
  args: {
    title: "Card Title",
    description: "Card description text goes here.",
    image: "/placeholder.jpg",
    variant: "default",
  },
};

// Variations
export const Outlined: Story = {
  args: {
    ...Default.args,
    variant: "outlined",
  },
};

export const Elevated: Story = {
  args: {
    ...Default.args,
    variant: "elevated",
  },
};

// States
export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
};

export const Clickable: Story = {
  args: {
    ...Default.args,
    clickable: true,
  },
};

// Content variations
export const LongContent: Story = {
  args: {
    ...Default.args,
    title:
      "This is a very long card title that might wrap to multiple lines and affect the layout",
    description:
      "This is a much longer description text that contains more content to test how the card handles overflow and expansion when there is a significant amount of content inside it.",
  },
};

export const NoImage: Story = {
  args: {
    ...Default.args,
    image: undefined,
  },
};
```

### Testing Interaction States

Use pseudo-state addon for hover, active, focus states:

```js
// Button.stories.tsx
export const WithPseudoStates = {
  parameters: {
    pseudoStates: {
      selector: "button",
      pseudos: ["hover", "focus", "active", "focus-visible"],
    },
  },
  args: {
    children: "Hover Me",
    variant: "primary",
  },
};
```

### Testing Responsive Behavior

Test components across different viewports:

```js
// ResponsiveComponent.stories.tsx
export const Responsive = {
  parameters: {
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
    chromatic: {
      viewports: [375, 768, 1440],
    },
  },
};
```

### Theming and Brand Testing

Test components across themes and brand configurations:

```js
// ThemedComponent.stories.tsx
export const WithDefaultTheme = {
  parameters: {
    themes: {
      theme: "default",
    },
  },
};

export const WithDarkTheme = {
  parameters: {
    themes: {
      theme: "dark",
    },
  },
};

export const BrandA = {
  parameters: {
    themes: {
      brand: "brand-a",
    },
  },
};

export const BrandB = {
  parameters: {
    themes: {
      brand: "brand-b",
    },
  },
};
```

## Integrating with Jest Snapshots

For teams using Jest snapshots alongside Storybook:

```typescript
// Button.spec.tsx
import { render } from "@testing-library/react";
import { composeStories } from "@storybook/react";
import * as stories from "./Button.stories";

// Import all stories
const { Primary, Secondary, Disabled } = composeStories(stories);

describe("Button snapshots", () => {
  it("Primary button matches snapshot", () => {
    const { container } = render(<Primary />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Secondary button matches snapshot", () => {
    const { container } = render(<Secondary />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Disabled button matches snapshot", () => {
    const { container } = render(<Disabled />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## Visual Testing in Design Systems

For enterprise design systems, follow these additional best practices:

1. **Component Catalog**

   - Maintain a visual catalog of all approved components
   - Document each component's variants and states
   - Link visual tests to design specifications

2. **Design Token Testing**
   - Test design token application across components
   - Verify color, spacing, typography tokens are applied correctly
   - Create specific stories for token verification

```typescript
// DesignTokens.stories.tsx
export const ColorTokens = {
  render: () => (
    <div>
      {Object.entries(colorTokens).map(([name, value]) => (
        <div key={name} style={{ display: "flex", marginBottom: "8px" }}>
          <div
            style={{
              backgroundColor: value,
              width: "48px",
              height: "48px",
              marginRight: "16px",
            }}
          />
          <div>
            <div>{name}</div>
            <div>{value}</div>
          </div>
        </div>
      ))}
    </div>
  ),
};
```

3. **Accessibility Compliance**
   - Integrate a11y checks with visual tests
   - Test color contrast across themes
   - Verify keyboard focus indicators

```typescript
// a11y tests with Storybook
export const WithA11yChecks = {
  parameters: {
    a11y: {
      config: {
        rules: [{ id: "color-contrast", enabled: true }],
      },
    },
  },
};
```

## Visual Test Review Process

Establish a clear process for reviewing visual test failures:

1. **Triage Process**

   - Determine if changes are intentional or regressions
   - Assign appropriate reviewers for visual changes
   - Document decision in PR comments

2. **Update Baselines**

   - For intended changes, update the baseline
   - Require design review for significant visual changes
   - Document the rationale for changes

3. **Fix Regressions**
   - Fix code rather than updating baselines for unintended changes
   - Investigate root causes for recurring issues
   - Add test cases for discovered edge cases

## Performance Optimization

Optimize visual testing performance:

1. **Selective Testing**

   - Only run visual tests for affected components
   - Tag stories with components for efficient selection
   - Use git diff to determine affected components

2. **Parallel Test Execution**
   - Run visual tests in parallel
   - Use sharding for large component libraries
   - Implement caching for faster execution

```yaml
# GitHub Actions with test sharding
jobs:
  visual-test:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    runs-on: ubuntu-latest
    steps:
      # Setup steps...
      - name: Run Chromatic (sharded)
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitOnceUploaded: true
          storybookBuildDir: storybook-static
          onlyChanged: true
          externals: "src/**/*.{css,scss,sass}"
          traceChanged: true
          skip: ${{ github.ref != 'refs/heads/main' && github.event_name == 'push' }}
          frameworkOptions: "--shard ${{ matrix.shard }}/4"
```

## Conclusion

Visual testing is a critical part of UI component development, ensuring consistency, preventing regressions, and enhancing collaboration between design and development. By following the patterns in this guide, you can establish a robust visual testing strategy that integrates with your design system and development workflow.

## Related Documentation

- [Storybook Best Practices](mdc:examples/testing/StorybookBestPractices.md)
- [Visual Test Automation](mdc:examples/testing/VisualTestAutomation.md)
- [Test-First Implementation Guide](mdc:examples/testing/TestFirstImplementationGuide.md)
