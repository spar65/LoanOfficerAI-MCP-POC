# shadcn/ui Implementation Example

This document provides a practical example of how to implement [shadcn/ui](https://ui.shadcn.com/) components in accordance with the [shadcn/ui Implementation Standards](../../departments/engineering/frontend/ui-frameworks/200-shadcn-ui-strictness.mdc).

## Project Setup

### 1. Installation

Initialize shadcn/ui in your project using the CLI:

```bash
# For Next.js projects
npx create-next-app@latest my-app --typescript --tailwind --eslint
cd my-app

# Install and initialize shadcn/ui
npx shadcn-ui@latest init
```

When prompted, use the following recommended configuration:

```
✓ Which style would you like to use? › Default
✓ Which color would you like to use as base color? › Slate
✓ Where is your global CSS file? › app/globals.css
✓ Would you like to use CSS variables for colors? › Yes
✓ Where is your tailwind.config.js located? › tailwind.config.js
✓ Configure the import alias for components: › @/components
✓ Configure the import alias for utils: › @/lib/utils
✓ Are you using React Server Components? › Yes
✓ Write configuration to components.json. Proceed? › Yes
```

### 2. Components.json Configuration

The resulting `components.json` file should look like this:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### 3. Adding Components

Install components as needed using the CLI:

```bash
# Add button component
npx shadcn-ui@latest add button

# Add form components
npx shadcn-ui@latest add form
```

## Component Usage Examples

### 1. Basic Button Usage

```tsx
// app/page.tsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">shadcn/ui Example</h1>

      {/* Basic button */}
      <Button>Default Button</Button>

      {/* Button with variant */}
      <Button variant="destructive" className="mt-4">
        Delete Item
      </Button>

      {/* Button with size */}
      <Button variant="outline" size="sm" className="mt-4">
        Small Outline Button
      </Button>

      {/* Button with icon */}
      <Button variant="ghost" className="mt-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          className="mr-2 h-4 w-4"
        >
          <path d="M5 12h14"></path>
          <path d="m12 5 7 7-7 7"></path>
        </svg>
        Continue
      </Button>
    </main>
  );
}
```

### 2. Form Implementation

```tsx
// app/signup/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

// Define form schema with Zod
const formSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

export default function SignupPage() {
  // Initialize form with React Hook Form and Zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  // Form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sign Up</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="johndoe" {...field} />
                </FormControl>
                <FormDescription>
                  This will be your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  We'll never share your email with anyone else.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormDescription>
                  Password must be at least 8 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  );
}
```

### 3. Component Composition Example

```tsx
// app/dashboard/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Project Alpha</CardTitle>
                <CardDescription>Web application redesign</CardDescription>
              </div>
              <Badge>In Progress</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Redesigning the customer portal with a focus on improved usability
              and modern design.
            </p>
            <div className="flex -space-x-2">
              <Avatar className="border-2 border-white">
                <AvatarImage src="/avatars/01.png" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Avatar className="border-2 border-white">
                <AvatarImage src="/avatars/02.png" alt="User" />
                <AvatarFallback>TK</AvatarFallback>
              </Avatar>
              <Avatar className="border-2 border-white">
                <AvatarImage src="/avatars/03.png" alt="User" />
                <AvatarFallback>SM</AvatarFallback>
              </Avatar>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            <Button size="sm">Update</Button>
          </CardFooter>
        </Card>

        {/* Additional cards would go here */}
      </div>
    </div>
  );
}
```

## Component Customization

### 1. Creating a Variant

```tsx
// components/ui/custom-button.tsx
import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ButtonProps } from "@radix-ui/react-button";

// Extend the existing button variants
const customButtonVariants = cva("", {
  variants: {
    customVariant: {
      gradient:
        "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-none",
      bordered: "border-2 border-primary hover:bg-primary/10",
    },
  },
});

// Create a custom button component that extends the shadcn/ui Button
export interface CustomButtonProps extends ButtonProps {
  customVariant?: "gradient" | "bordered";
}

export function CustomButton({
  className,
  customVariant,
  ...props
}: CustomButtonProps) {
  return (
    <Button
      className={cn(
        customVariant && customButtonVariants({ customVariant }),
        className
      )}
      {...props}
    />
  );
}
```

## Best Practices Summary

1. **Installation and Setup**

   - Use the CLI for consistent setup
   - Configure components with the recommended structure
   - Store components in `/components/ui`

2. **Component Usage**

   - Use shadcn/ui components for all basic UI elements
   - Add components only as needed
   - Maintain the original component API

3. **Customization**

   - Use CSS variables for theming
   - Use className prop for additional styling
   - Create variants using class-variance-authority
   - Extend components through composition

4. **Documentation**

   - Document any modifications or custom components
   - Provide usage examples
   - Specify prop types using TypeScript

5. **Testing**
   - Test components for accessibility
   - Write unit tests for custom components
   - Test component interactions
