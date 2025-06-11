# Visual Test Automation Guide

This guide outlines approaches for automating visual testing in enterprise applications, focusing on continuous integration and systematic regression detection.

## Visual Testing Automation Overview

Visual testing automation involves systematically capturing, comparing, and tracking visual changes in your UI components. Unlike manual testing, automated visual testing can detect unintended visual changes quickly and consistently across your entire component library.

## Visual Testing Tools Comparison

| Tool               | Type                    | Integration     | Pros                                        | Cons                                   |
| ------------------ | ----------------------- | --------------- | ------------------------------------------- | -------------------------------------- |
| **Chromatic**      | Cloud, Screenshot       | Storybook       | Easy setup, PR workflow, baselines, history | Subscription-based                     |
| **Percy**          | Cloud, Screenshot       | Many frameworks | Cross-browser, responsive testing           | Subscription-based                     |
| **Loki**           | Local, Screenshot       | Storybook       | Free, local testing                         | More complex setup, no cloud dashboard |
| **Playwright**     | E2E, Screenshot         | Any             | Flexible, cross-browser                     | Not component-focused                  |
| **Cypress**        | E2E, Screenshot         | Any             | E2E + component testing                     | Heavier than component-only tools      |
| **Jest Snapshots** | Local, DOM              | React, Vue      | Lightweight, easy setup                     | Not visual (DOM only)                  |
| **BackstopJS**     | Local, Screenshot       | Any             | Free, flexible configuration                | Manual reference creation              |
| **reg-suit**       | Local+Cloud, Screenshot | Any             | Visual diff UI, flexible                    | More complex setup                     |

## Automating Visual Tests in CI/CD

### GitHub Actions Configuration

```yaml
# .github/workflows/visual-testing.yml
name: Visual Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  chromatic:
    name: Visual Tests with Chromatic
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Publish to Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: true # Don't fail CI if there are changes
          exitOnceUploaded: true # Exit once the build is uploaded
          autoAcceptChanges: ${{ github.ref == 'refs/heads/main' }} # Auto-accept on main
```

### GitLab CI Configuration

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - visual-test

visual-test:
  stage: visual-test
  image: node:18
  variables:
    # Environment variables
    CHROMATIC_PROJECT_TOKEN: ${CHROMATIC_PROJECT_TOKEN}
  script:
    - npm ci
    - npm run build-storybook
    - npx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN --exit-zero-on-changes
  artifacts:
    paths:
      - storybook-static/
    expire_in: 1 week
  only:
    - main
    - develop
    - merge_requests
```

### CircleCI Configuration

```yaml
# .circleci/config.yml
version: 2.1

jobs:
  visual-test:
    docker:
      - image: cimg/node:18.16
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "package-lock.json" }}
            - v1-dependencies-
      - run: npm ci
      - save_cache:
          paths:
            - node_modules
          key: v1-dependencies-{{ checksum "package-lock.json" }}
      - run: npm run build-storybook
      - run: npx chromatic --project-token=${CHROMATIC_PROJECT_TOKEN} --exit-zero-on-changes

workflows:
  version: 2
  build-test-deploy:
    jobs:
      - visual-test:
          filters:
            branches:
              only:
                - main
                - develop
```

## Visual Testing Without Storybook

### Using Playwright for Visual Testing

```typescript
// visual.test.ts
import { test, expect } from "@playwright/test";

test.describe("Visual Tests", () => {
  test("homepage visual test", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for any asynchronous elements to load
    await page.waitForSelector(".hero-section", { state: "visible" });

    // Take screenshot for comparison
    expect(await page.screenshot()).toMatchSnapshot("homepage.png");
  });

  test("product list visual test", async ({ page }) => {
    await page.goto("http://localhost:3000/products");

    // Wait for product list to load
    await page.waitForSelector(".product-item", { state: "visible" });

    // Take screenshot for comparison
    expect(await page.screenshot()).toMatchSnapshot("product-list.png");
  });
});
```

### Using Cypress for Visual Testing

```javascript
// cypress/e2e/visual.cy.js
describe("Visual Tests", () => {
  it("should match homepage snapshot", () => {
    cy.visit("/");
    cy.get(".hero-section").should("be.visible");
    cy.matchImageSnapshot("homepage");
  });

  it("should match product list snapshot", () => {
    cy.visit("/products");
    cy.get(".product-item").should("be.visible");
    cy.matchImageSnapshot("product-list");
  });
});
```

## Custom Visual Test Runners

### Simple Custom Visual Testing with Jest

```typescript
// visualTest.js
const { toMatchImageSnapshot } = require("jest-image-snapshot");
const puppeteer = require("puppeteer");

expect.extend({ toMatchImageSnapshot });

describe("Visual Regression Tests", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test("Homepage visual regression", async () => {
    await page.goto("http://localhost:3000");
    await page.waitForSelector(".hero-section");

    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot({
      customSnapshotsDir: "__image_snapshots__",
      customDiffDir: "__image_diff__",
    });
  });
});
```

## Advanced Patterns for Visual Testing

### Parameterized Visual Tests

```typescript
// Storybook + Chromatic
// Button.stories.ts
import { Button } from './Button';

// Define parameters for visual test variations
const themes = ['light', 'dark'];
const sizes = ['small', 'medium', 'large'];
const variants = ['primary', 'secondary', 'tertiary', 'danger'];

// Create matrix of all combinations
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    chromatic: { disableSnapshot: false },
  },
};

// Generate stories for the matrix
themes.forEach(theme => {
  sizes.forEach(size => {
    variants.forEach(variant => {
      export const ${theme}${size}${variant} = {
        args: {
          variant,
          size,
          children: `${theme} ${size} ${variant}`,
        },
        parameters: {
          backgrounds: {
            default: theme === 'dark' ? 'dark' : 'light',
          },
        },
      };
    });
  });
});
```

### Testing Responsive Behavior

```typescript
// Responsive.stories.tsx
export default {
  title: "Pages/Homepage",
  component: Homepage,
  parameters: {
    chromatic: {
      // Capture screenshots at different viewports
      viewports: [375, 768, 1024, 1440],
      diffThreshold: 0.2, // Allow minor pixel differences
    },
  },
};

export const Default = {};
```

### Visual Diff Tolerance Configuration

```typescript
// example with Chromatic
export default {
  title: "Components/Chart",
  component: Chart,
  parameters: {
    chromatic: {
      diffThreshold: 0.3, // 30% difference threshold for animations or charts
      delay: 300, // Wait for animations to complete
    },
  },
};

// example with Jest image snapshots
expect(image).toMatchImageSnapshot({
  failureThreshold: 0.01, // 1% threshold
  failureThresholdType: "percent",
});
```

## Infrastructure for Visual Testing

### Docker-based Visual Testing

```Dockerfile
# Dockerfile.visual-tests
FROM node:18-slim

# Install dependencies needed for browsers
RUN apt-get update && apt-get install -y \
    libgbm-dev \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application files
COPY . .

# Run visual tests
CMD ["npm", "run", "test:visual"]
```

### Scheduled Visual Tests

```yaml
# .github/workflows/scheduled-visual-tests.yml
name: Scheduled Visual Tests

on:
  schedule:
    # Run every night at 2am
    - cron: "0 2 * * *"

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
      - name: Install dependencies
        run: npm ci
      - name: Build Storybook
        run: npm run build-storybook
      - name: Run visual tests
        run: npx chromatic --project-token=${{ secrets.CHROMATIC_PROJECT_TOKEN }} --auto-accept-changes
      - name: Generate report
        run: node scripts/generate-visual-test-report.js
      - name: Send notification
        if: failure()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "⚠️ Scheduled visual tests failed. Please check the report.",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "⚠️ *Scheduled visual tests failed*\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View detailed logs>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Integration with Design Systems

### Design Token Testing

```typescript
// DesignTokens.stories.tsx
import { designTokens } from "../design-system/tokens";

export default {
  title: "Design System/Tokens",
  parameters: {
    chromatic: { disableSnapshot: false },
  },
};

// Test color tokens
export const Colors = () => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "16px",
    }}
  >
    {Object.entries(designTokens.colors).map(([name, value]) => (
      <div
        key={name}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            backgroundColor: value,
            width: "80px",
            height: "80px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />
        <div style={{ marginTop: "8px", fontFamily: "monospace" }}>
          <div>{name}</div>
          <div>{value}</div>
        </div>
      </div>
    ))}
  </div>
);

// Test spacing tokens
export const Spacing = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
    {Object.entries(designTokens.spacing).map(([name, value]) => (
      <div key={name} style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: "100px", fontFamily: "monospace" }}>{name}</div>
        <div style={{ width: "80px", fontFamily: "monospace" }}>{value}</div>
        <div
          style={{
            width: value,
            height: "20px",
            backgroundColor: designTokens.colors.primary,
            borderRadius: "4px",
          }}
        />
      </div>
    ))}
  </div>
);
```

### Multi-Brand Testing

```typescript
// Configure brand themes
const brands = ['main', 'partnerA', 'partnerB'];
const themes = ['light', 'dark'];

// Generate matrix of all combinations
brands.forEach(brand => {
  themes.forEach(theme => {
    export const ${brand}${theme} = {
      parameters: {
        brandConfig: { brand, theme }
      },
      decorators: [
        (Story) => (
          <ThemeProvider brand={brand} theme={theme}>
            <Story />
          </ThemeProvider>
        )
      ]
    };
  });
});
```

## Visual Test Reporting

### Custom Visual Test Report Generation

```typescript
// scripts/generate-visual-test-report.js
const fs = require("fs");
const path = require("path");

// Read Chromatic results from .chromatic-results.json
const results = JSON.parse(fs.readFileSync(".chromatic-results.json", "utf8"));

// Generate HTML report
const generateHTMLReport = () => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Visual Test Report</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
      .header { background: #f4f4f4; padding: 20px; border-bottom: 1px solid #ddd; }
      .summary { margin: 20px 0; }
      .story { border: 1px solid #ddd; margin-bottom: 10px; padding: 10px; }
      .changed { background-color: #fff8e1; }
      .new { background-color: #e8f5e9; }
      .unchanged { background-color: #f5f5f5; }
      .links { margin-top: 10px; }
      .links a { margin-right: 10px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Visual Test Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    <div class="summary">
      <h2>Summary</h2>
      <p>Total stories: ${results.stories.length}</p>
      <p>Changed: ${
        results.stories.filter((s) => s.changeStatus === "changed").length
      }</p>
      <p>New: ${
        results.stories.filter((s) => s.changeStatus === "added").length
      }</p>
      <p>Unchanged: ${
        results.stories.filter((s) => s.changeStatus === "unchanged").length
      }</p>
    </div>
    <div class="stories">
      <h2>Stories</h2>
      ${results.stories
        .map(
          (story) => `
        <div class="story ${story.changeStatus}">
          <h3>${story.title} / ${story.name}</h3>
          <p>Status: ${story.changeStatus}</p>
          ${
            story.changeStatus === "changed"
              ? `
            <div class="links">
              <a href="${story.url}" target="_blank">View Story</a>
              <a href="${story.diffUrl}" target="_blank">View Changes</a>
            </div>
          `
              : ""
          }
        </div>
      `
        )
        .join("")}
    </div>
  </body>
  </html>
  `;

  // Write HTML report
  fs.writeFileSync("visual-test-report.html", html);
  console.log("Visual test report generated: visual-test-report.html");
};

generateHTMLReport();
```

## Error Handling in Visual Tests

### Handling Flaky Tests

```typescript
// strategies to handle flaky visual tests

// 1. Multiple snapshots with average comparison
const takeMultipleSnapshots = async (page, count = 3) => {
  const snapshots = [];
  for (let i = 0; i < count; i++) {
    await page.waitForTimeout(100); // Small delay
    snapshots.push(await page.screenshot());
  }
  return snapshots;
};

// 2. Ignore specific areas
export const Chart = {
  parameters: {
    chromatic: {
      diffIncludeAntiAliasing: false,
      diffThreshold: 0.5,
      // Ignore date/time areas that change
      diffIgnoreElements: [".timestamp", ".chart-tooltip", ".date-display"],
    },
  },
};

// 3. Stabilization techniques
beforeEach(async () => {
  // Set consistent date for tests
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2023-01-01T10:00:00Z"));

  // Mock random functions
  const mockMath = Object.create(global.Math);
  mockMath.random = () => 0.5;
  global.Math = mockMath;
});
```

## Visual Testing Workflow Integration

### Developer Workflow

1. **Local Development**:

   ```bash
   # Run Storybook locally
   npm run storybook

   # Run visual tests locally
   npm run test:visual
   ```

2. **Pre-commit Hooks**:

   ```json
   // package.json
   {
     "husky": {
       "hooks": {
         "pre-commit": "lint-staged"
       }
     },
     "lint-staged": {
       "src/**/*.{js,jsx,ts,tsx}": [
         "eslint --fix",
         "npm run test:visual:changed"
       ]
     }
   }
   ```

3. **PR Workflow**:
   ```bash
   # Submit PR → CI runs visual tests → Review changes → Approve/Reject
   npx chromatic --only-changed  # Only test components changed in PR
   ```

## Conclusion

Automated visual testing is essential for maintaining UI consistency in enterprise applications. By integrating visual testing into your CI/CD pipeline, you can catch visual regressions early, ensure cross-browser compatibility, and maintain a high-quality user experience across your application.

The patterns and examples in this guide provide a foundation for implementing visual testing automation in your organization, from simple component tests to comprehensive design system verification.

## Related Documentation

- [Component Visual Testing Guide](mdc:examples/testing/ComponentVisualTestingGuide.md)
- [Storybook Best Practices](mdc:examples/testing/StorybookBestPractices.md)
- [Enterprise Test Strategy](mdc:examples/testing/EnterpriseTestStrategy.md)
