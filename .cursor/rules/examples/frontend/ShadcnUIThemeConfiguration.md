# shadcn/ui Theme Configuration Guide

This document outlines best practices for configuring and customizing themes in shadcn/ui, following the [shadcn/ui Implementation Standards](../../departments/engineering/frontend/ui-frameworks/200-shadcn-ui-strictness.mdc).

## Introduction to shadcn/ui Theming

shadcn/ui uses CSS variables for theming, allowing for flexible and maintainable theme customization. The framework supports both light and dark modes out of the box, and can be extended to support multiple custom themes.

## Basic Theme Setup

### 1. Default Theme Configuration

When initializing shadcn/ui, select CSS variables for colors. This creates a theme structure in your global CSS file:

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

### 2. Understanding the Color Format

Colors are defined in HSL (Hue, Saturation, Lightness) format as space-separated values:

```css
--primary: 222.2 47.4% 11.2%;
/*         ↑     ↑     ↑     */
/*         hue   sat   light */
```

This format makes it easier to create cohesive color palettes and adjust brightness or saturation uniformly.

## Dark Mode Implementation

### 1. Basic Dark Mode Toggle

Implement a dark mode toggle using the `next-themes` package (for Next.js projects):

```bash
npm install next-themes
```

#### Theme Provider Setup

```tsx
// app/providers.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

#### Wrap Your App with the Provider

```tsx
// app/layout.tsx
import { ThemeProvider } from "@/app/providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Theme Toggle Component

Create a theme toggle button using shadcn/ui components:

```tsx
// components/ui/theme-toggle.tsx
"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Custom Brand Theming

### 1. Updating Primary Colors

To modify the primary color to match your brand:

```css
/* app/globals.css */
@layer base {
  :root {
    /* Brand blue color */
    --primary: 210 100% 50%; /* #0080ff */
    --primary-foreground: 0 0% 100%; /* white text */

    /* Other variables remain unchanged */
    /* ... */
  }

  .dark {
    /* Lighter brand blue for dark mode */
    --primary: 210 100% 60%; /* #3399ff */
    --primary-foreground: 0 0% 100%; /* white text */

    /* Other variables remain unchanged */
    /* ... */
  }
}
```

### 2. Complete Brand Theme

For a comprehensive brand theme, update all color variables:

```css
/* app/globals.css */
@layer base {
  :root {
    /* Brand colors */
    --background: 0 0% 100%;
    --foreground: 210 40% 15%;

    --primary: 210 100% 50%; /* Brand blue */
    --primary-foreground: 0 0% 100%;

    --secondary: 220 30% 95%;
    --secondary-foreground: 210 40% 25%;

    --accent: 150 80% 45%; /* Brand accent green */
    --accent-foreground: 0 0% 100%;

    --destructive: 0 85% 60%;
    --destructive-foreground: 0 0% 100%;

    --muted: 210 20% 95%;
    --muted-foreground: 210 30% 45%;

    --card: 0 0% 100%;
    --card-foreground: 210 40% 15%;

    --popover: 0 0% 100%;
    --popover-foreground: 210 40% 15%;

    --border: 210 20% 90%;
    --input: 210 20% 90%;
    --ring: 210 100% 50%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 210 40% 10%;
    --foreground: 0 0% 95%;

    --primary: 210 100% 60%; /* Lighter brand blue */
    --primary-foreground: 0 0% 100%;

    --secondary: 220 30% 20%;
    --secondary-foreground: 0 0% 95%;

    --accent: 150 80% 45%; /* Same accent green */
    --accent-foreground: 0 0% 100%;

    --destructive: 0 85% 60%;
    --destructive-foreground: 0 0% 100%;

    --muted: 210 30% 20%;
    --muted-foreground: 210 20% 70%;

    --card: 210 40% 13%;
    --card-foreground: 0 0% 95%;

    --popover: 210 40% 13%;
    --popover-foreground: 0 0% 95%;

    --border: 210 30% 25%;
    --input: 210 30% 25%;
    --ring: 210 100% 60%;
  }
}
```

## Multiple Theme Support

You can implement multiple themes beyond just light and dark:

### 1. Define Additional Themes

```css
/* app/globals.css */
@layer base {
  /* Default light theme */
  :root {
    --background: 0 0% 100%;
    /* ... other variables ... */
  }

  /* Dark theme */
  .dark {
    --background: 222.2 84% 4.9%;
    /* ... other variables ... */
  }

  /* Brand theme (blue) */
  .theme-brand {
    --background: 210 40% 98%;
    --foreground: 210 50% 10%;

    --primary: 210 100% 50%;
    --primary-foreground: 0 0% 100%;

    /* ... other variables ... */
  }

  /* High contrast theme */
  .theme-high-contrast {
    --background: 0 0% 100%;
    --foreground: 0 0% 0%;

    --primary: 0 0% 0%;
    --primary-foreground: 0 0% 100%;

    --secondary: 0 0% 90%;
    --secondary-foreground: 0 0% 0%;

    /* ... other variables ... */
  }
}
```

### 2. Extended Theme Toggle

Modify the theme toggle to support multiple themes:

```tsx
// components/ui/theme-toggle.tsx
"use client";

import * as React from "react";
import { MoonIcon, SunIcon, PaletteIcon, EyeIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {/* Icon changes based on current theme */}
          <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 theme-brand:hidden theme-high-contrast:hidden" />
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 theme-brand:hidden theme-high-contrast:hidden" />
          <PaletteIcon className="absolute h-[1.2rem] w-[1.2rem] scale-0 theme-brand:scale-100" />
          <EyeIcon className="absolute h-[1.2rem] w-[1.2rem] scale-0 theme-high-contrast:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("theme-brand")}>
          Brand Theme
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-high-contrast")}>
          High Contrast
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System Default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 3. Configure Next-Themes Provider

Update the provider to recognize the custom themes:

```tsx
// app/providers.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      themes={["light", "dark", "theme-brand", "theme-high-contrast", "system"]}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

## Advanced Theme Configuration

### 1. Dynamic Color Generation

For sophisticated theming needs, you can generate the HSL values from HEX colors:

```tsx
// lib/color-utils.ts
export function hexToHSL(hex: string) {
  // Remove # prefix if present
  hex = hex.replace(/^#/, "");

  // Parse the hex values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  // Find greatest and smallest channel values
  let cmin = Math.min(r, g, b);
  let cmax = Math.max(r, g, b);
  let delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  // Calculate hue
  if (delta === 0) {
    h = 0;
  } else if (cmax === r) {
    h = ((g - b) / delta) % 6;
  } else if (cmax === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  // Calculate lightness
  l = (cmax + cmin) / 2;

  // Calculate saturation
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  // Convert to percentages
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
}
```

### 2. CSS Custom Property Generator

Create a utility to generate theme CSS variables from a color palette:

```tsx
// lib/theme-generator.ts
import { hexToHSL } from "./color-utils";

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  // Add other colors as needed
}

export function generateThemeVariables(palette: ColorPalette, isDark = false) {
  const cssVariables = {
    "--background": hexToHSL(palette.background),
    "--foreground": hexToHSL(palette.foreground),
    "--primary": hexToHSL(palette.primary),
    "--primary-foreground": isDark ? "0 0% 100%" : "0 0% 0%",
    "--secondary": hexToHSL(palette.secondary),
    "--secondary-foreground": isDark ? "0 0% 100%" : "0 0% 0%",
    "--accent": hexToHSL(palette.accent),
    "--accent-foreground": isDark ? "0 0% 100%" : "0 0% 0%",
  };

  // Convert to CSS string
  return Object.entries(cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n");
}
```

### 3. Runtime Theme Switching

For advanced use cases where you need programmatic theme control:

```tsx
// components/ui/theme-customizer.tsx
"use client";

import React, { useState } from "react";
import { hexToHSL } from "@/lib/color-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ThemeCustomizer() {
  const [primaryColor, setPrimaryColor] = useState("#0070f3");

  const applyCustomTheme = () => {
    // Convert hex to HSL
    const primaryHSL = hexToHSL(primaryColor);

    // Apply to document root
    document.documentElement.style.setProperty("--primary", primaryHSL);

    // You can extend this to update other colors and properties
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Customize Theme</h3>

      <div className="grid gap-2">
        <Label htmlFor="primary-color">Primary Color</Label>
        <div className="flex gap-2">
          <Input
            id="primary-color"
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-12 h-10 p-1"
          />
          <Input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="font-mono"
          />
        </div>
      </div>

      <Button onClick={applyCustomTheme}>Apply Theme</Button>
    </div>
  );
}
```

## Best Practices for Theme Management

1. **Consistent Naming Convention**

   - Use clear, descriptive names for CSS variables
   - Follow the pattern of `element-property` for variable names

2. **Organize by Component**

   - Consider grouping variables by component for larger applications
   - Create component-specific variables that reference global theme values

   ```css
   /* Component-specific variables */
   --card-shadow: 0 1px 3px var(--shadow-color);
   --nav-background: var(--primary);
   ```

3. **Document Color System**

   - Create a color palette documentation
   - Show examples of each color and its usage
   - Explain the relationship between colors

4. **Accessibility Considerations**

   - Ensure sufficient contrast between text and backgrounds
   - Test all themes with accessibility tools
   - Provide high-contrast option for users with visual impairments

5. **Transition Animations**

   - Add smooth transitions when switching themes:

   ```css
   /* app/globals.css */
   * {
     transition: background-color 0.3s ease, color 0.3s ease,
       border-color 0.3s ease;
   }

   /* Disable for users who prefer reduced motion */
   @media (prefers-reduced-motion: reduce) {
     * {
       transition: none !important;
     }
   }
   ```

## Integrating with Design Systems

For teams with established design systems, you can connect shadcn/ui themes to your design tokens:

```tsx
// lib/design-tokens.ts
export const designTokens = {
  colors: {
    // Primary palette
    primary50: "#f0f9ff",
    primary100: "#e0f2fe",
    primary200: "#bae6fd",
    primary300: "#7dd3fc",
    primary400: "#38bdf8",
    primary500: "#0ea5e9", // Primary brand color
    primary600: "#0284c7",
    primary700: "#0369a1",
    primary800: "#075985",
    primary900: "#0c4a6e",

    // Neutrals
    neutral50: "#f9fafb",
    neutral100: "#f3f4f6",
    neutral200: "#e5e7eb",
    neutral300: "#d1d5db",
    neutral400: "#9ca3af",
    neutral500: "#6b7280",
    neutral600: "#4b5563",
    neutral700: "#374151",
    neutral800: "#1f2937",
    neutral900: "#111827",

    // Additional brand colors
    accent: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    success: "#10b981",
  },
};

// Convert design tokens to shadcn/ui theme variables
export function generateThemeFromDesignTokens() {
  const { colors } = designTokens;

  return {
    light: {
      "--primary": hexToHSL(colors.primary500),
      "--primary-foreground": hexToHSL(colors.neutral50),
      "--background": hexToHSL(colors.neutral50),
      "--foreground": hexToHSL(colors.neutral900),
      // ... other variables
    },
    dark: {
      "--primary": hexToHSL(colors.primary400), // Lighter in dark mode
      "--primary-foreground": hexToHSL(colors.neutral50),
      "--background": hexToHSL(colors.neutral900),
      "--foreground": hexToHSL(colors.neutral50),
      // ... other variables
    },
  };
}
```

## Conclusion

Proper theme configuration in shadcn/ui enables a consistent visual experience while allowing for customization that aligns with your brand identity. By following these guidelines, you can create maintainable, accessible themes that provide a great user experience across light, dark, and custom themes.
