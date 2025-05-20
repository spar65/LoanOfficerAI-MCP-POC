# Navigation Guard Implementation Guide

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide provides detailed implementations of navigation guards to protect users from losing unsaved changes when navigating away from forms or editors.

## Table of Contents

1. [Basic Navigation Guard Hook](#basic-navigation-guard-hook)
2. [Form-Specific Protection](#form-specific-protection)
3. [Multi-Step Form Protection](#multi-step-form-protection)
4. [Global Navigation Protection](#global-navigation-protection)
5. [Testing Navigation Guards](#testing-navigation-guards)

## Basic Navigation Guard Hook

The most common use case for navigation guards is to prevent accidental navigation away from forms with unsaved changes.

```tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Custom hook to prevent navigation when there are unsaved changes
 *
 * @param hasUnsavedChanges Boolean indicating if there are unsaved changes
 * @param message Custom message to show the user (optional)
 */
function useNavigationGuard(hasUnsavedChanges, message) {
  const router = useRouter();
  const defaultMessage =
    "You have unsaved changes. Are you sure you want to leave this page?";
  const promptMessage = message || defaultMessage;

  useEffect(() => {
    // Only add listeners if there are unsaved changes
    if (!hasUnsavedChanges) return;

    // Handle browser back/forward buttons and tab/window close
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = promptMessage;
      return promptMessage;
    };

    // Handle Next.js route changes
    const handleRouteChange = (url) => {
      if (window.confirm(promptMessage)) {
        return;
      }

      // Prevent navigation and reset URL
      router.events.emit("routeChangeError");

      // This throws an error, but that's expected to abort the navigation
      throw new Error("Navigation cancelled by user");
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    router.events.on("routeChangeStart", handleRouteChange);

    // Clean up event listeners
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [hasUnsavedChanges, promptMessage, router]);
}

// Usage example
function EditForm() {
  const [formData, setFormData] = useState({
    /* initial data */
  });
  const [originalData] = useState({
    /* initial data */
  });

  // Determine if form has unsaved changes
  const hasUnsavedChanges = !isEqual(formData, originalData);

  // Set up the navigation guard
  useNavigationGuard(hasUnsavedChanges);

  // Form implementation...
}
```

## Form-Specific Protection

For more complex forms, you might want more control over when to allow navigation.

```tsx
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { isEqual } from "lodash";

function AdvancedForm({ initialData, onSave }) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData);
  const [originalData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Determine if form has unsaved changes
  const hasUnsavedChanges =
    !isSubmitting && !isSaved && !isEqual(formData, originalData);

  // Set up navigation protection
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    let isConfirmed = false;

    // Handle browser actions
    const handleBeforeUnload = (e) => {
      if (isConfirmed) return;
      e.preventDefault();
      e.returnValue = "You have unsaved changes.";
      return "You have unsaved changes.";
    };

    // Handle Next.js routing
    const handleRouteChangeStart = (url) => {
      // Skip protection for specific routes
      if (url.includes("/auto-save/") || url === "/error-page") {
        return;
      }

      // Allow navigation if changes are already confirmed
      if (isConfirmed) return;

      // Ask user for confirmation
      if (window.confirm("You have unsaved changes. Discard them?")) {
        isConfirmed = true;
        return;
      }

      // Prevent navigation
      router.events.emit("routeChangeError");
      router.replace(router.asPath);
      throw new Error("Navigation cancelled");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    router.events.on("routeChangeStart", handleRouteChangeStart);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [hasUnsavedChanges, router]);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave(formData);
      setIsSaved(true);
      // Safe to navigate now
      router.push("/success");
    } catch (error) {
      setIsSubmitting(false);
      alert("Failed to save changes.");
    }
  };

  // Form input change handler
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Reset saved state when user makes changes
    setIsSaved(false);
  };

  // Explicitly allow navigation without saving
  const handleDiscard = () => {
    if (window.confirm("Discard all changes?")) {
      // Clear protection and navigate
      setIsSaved(true);
      router.push("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form inputs */}
      <div className="form-controls">
        <button type="button" onClick={handleDiscard}>
          Discard Changes
        </button>
        <button type="submit" disabled={isSubmitting || !hasUnsavedChanges}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
```

## Multi-Step Form Protection

For multi-step forms or wizards, you may want to protect the entire process until completion.

```tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

function MultiStepForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    step1: {},
    step2: {},
    step3: {},
  });
  const [isComplete, setIsComplete] = useState(false);

  // Navigation protection for the entire form process
  useEffect(() => {
    // Only protect if the form has started but not completed
    if (currentStep === 1 && !Object.keys(formData.step1).length) return;
    if (isComplete) return;

    const message =
      "You haven't completed the form. If you leave now, your progress will be lost.";

    // Browser navigation/close
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    // In-app navigation
    const handleRouteChange = (url) => {
      // Allow navigation between form steps
      if (url.startsWith("/form/step")) return;

      if (window.confirm(message)) {
        return;
      }

      router.events.emit("routeChangeError");
      router.replace(router.asPath);
      throw new Error("Navigation cancelled");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [currentStep, formData, isComplete, router]);

  // Handle step navigation
  const goToStep = (step) => {
    // Validate current step before allowing navigation
    if (isStepValid(currentStep)) {
      setCurrentStep(step);
      // Update URL without triggering navigation guard
      router.push(`/form/step${step}`, undefined, { shallow: true });
    } else {
      alert("Please complete the current step before proceeding.");
    }
  };

  // Handle form completion
  const completeForm = async () => {
    try {
      await submitFormData(formData);
      setIsComplete(true);
      router.push("/form/complete");
    } catch (error) {
      console.error("Form submission failed:", error);
    }
  };

  // Form implementation with steps...
}

// Helper function to validate a step
function isStepValid(step, data) {
  // Step-specific validation logic
  switch (step) {
    case 1:
      return data.name && data.email;
    case 2:
      return data.address && data.city && data.zipCode;
    case 3:
      return data.payment && data.terms;
    default:
      return false;
  }
}
```

## Global Navigation Protection

For applications with complex state management, you might want a global navigation guard.

```tsx
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";

// Create a context for navigation protection
const NavigationGuardContext = createContext({
  registerUnsavedChanges: () => {},
  unregisterUnsavedChanges: () => {},
  confirmNavigation: () => false,
});

// Provider component to manage navigation protection
function NavigationGuardProvider({ children }) {
  const router = useRouter();
  const [pendingComponents, setPendingComponents] = useState(new Set());

  // Register a component with unsaved changes
  const registerUnsavedChanges = (componentId) => {
    setPendingComponents((prev) => {
      const updated = new Set(prev);
      updated.add(componentId);
      return updated;
    });
  };

  // Unregister a component when changes are saved or discarded
  const unregisterUnsavedChanges = (componentId) => {
    setPendingComponents((prev) => {
      const updated = new Set(prev);
      updated.delete(componentId);
      return updated;
    });
  };

  // Check if navigation should be confirmed
  const confirmNavigation = () => {
    if (pendingComponents.size === 0) return true;

    return window.confirm(
      `You have unsaved changes in ${pendingComponents.size} component(s). ` +
        `Are you sure you want to leave?`
    );
  };

  // Set up global navigation protection
  useEffect(() => {
    if (pendingComponents.size === 0) return;

    // Browser navigation handler
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "You have unsaved changes.";
      return "You have unsaved changes.";
    };

    // Next.js navigation handler
    const handleRouteChange = (url) => {
      if (confirmNavigation()) {
        // Allow navigation, clear all pending
        setPendingComponents(new Set());
      } else {
        // Prevent navigation
        router.events.emit("routeChangeError");
        router.replace(router.asPath);
        throw new Error("Navigation cancelled");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [pendingComponents, router, confirmNavigation]);

  return (
    <NavigationGuardContext.Provider
      value={{
        registerUnsavedChanges,
        unregisterUnsavedChanges,
        confirmNavigation,
      }}
    >
      {children}
    </NavigationGuardContext.Provider>
  );
}

// Hook to use navigation protection in any component
function useNavigationProtection(componentId, hasUnsavedChanges) {
  const { registerUnsavedChanges, unregisterUnsavedChanges } = useContext(
    NavigationGuardContext
  );

  useEffect(() => {
    if (hasUnsavedChanges) {
      registerUnsavedChanges(componentId);
    } else {
      unregisterUnsavedChanges(componentId);
    }

    return () => {
      unregisterUnsavedChanges(componentId);
    };
  }, [
    componentId,
    hasUnsavedChanges,
    registerUnsavedChanges,
    unregisterUnsavedChanges,
  ]);
}

// Usage example
function MyForm({ id }) {
  const [isDirty, setIsDirty] = useState(false);

  // Register this form with the navigation guard
  useNavigationProtection(`form-${id}`, isDirty);

  // Form implementation...
}
```

## Testing Navigation Guards

Testing navigation guards requires mocking browser behaviors and router events.

```tsx
// Testing navigation guard hooks
import { renderHook, act } from "@testing-library/react-hooks";
import { useNavigationGuard } from "./useNavigationGuard";

// Mock Next.js router
const mockRouter = {
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  push: jest.fn(),
  replace: jest.fn(),
  asPath: "/current-path",
};

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

// Mock event listeners
const addEventListener = jest.spyOn(window, "addEventListener");
const removeEventListener = jest.spyOn(window, "removeEventListener");

describe("useNavigationGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not set up listeners when there are no unsaved changes", () => {
    renderHook(() => useNavigationGuard(false, "Test message", mockRouter));

    expect(addEventListener).not.toHaveBeenCalled();
    expect(mockRouter.events.on).not.toHaveBeenCalled();
  });

  it("should set up listeners when there are unsaved changes", () => {
    renderHook(() => useNavigationGuard(true, "Test message", mockRouter));

    expect(addEventListener).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );
    expect(mockRouter.events.on).toHaveBeenCalledWith(
      "routeChangeStart",
      expect.any(Function)
    );
  });

  it("should remove listeners on cleanup", () => {
    const { unmount } = renderHook(() =>
      useNavigationGuard(true, "Test message", mockRouter)
    );

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );
    expect(mockRouter.events.off).toHaveBeenCalledWith(
      "routeChangeStart",
      expect.any(Function)
    );
  });

  it("should block navigation when user cancels", () => {
    mockConfirm.mockReturnValueOnce(false);

    renderHook(() => useNavigationGuard(true, "Test message", mockRouter));

    // Get the handler function passed to router.events.on
    const routeChangeHandler = mockRouter.events.on.mock.calls[0][1];

    // Call the handler directly
    expect(() => {
      routeChangeHandler("/new-path");
    }).toThrow("Navigation cancelled by user");

    expect(mockConfirm).toHaveBeenCalledWith("Test message");
    expect(mockRouter.events.emit).toHaveBeenCalledWith("routeChangeError");
  });

  it("should allow navigation when user confirms", () => {
    mockConfirm.mockReturnValueOnce(true);

    renderHook(() => useNavigationGuard(true, "Test message", mockRouter));

    // Get the handler function passed to router.events.on
    const routeChangeHandler = mockRouter.events.on.mock.calls[0][1];

    // Call the handler directly
    expect(() => {
      routeChangeHandler("/new-path");
    }).not.toThrow();

    expect(mockConfirm).toHaveBeenCalledWith("Test message");
    expect(mockRouter.events.emit).not.toHaveBeenCalled();
  });
});
```

## Best Practices

1. **Progressive Enhancement**: Add navigation protection progressively - start with ensuring it works for simple forms before implementing complex solutions.

2. **Clear Messaging**: Provide clear messages to users about what will happen if they navigate away.

3. **Context-Appropriate Prompts**: Adjust your prompts based on the importance of the data:

   - Critical data: "You have unsaved changes that will be permanently lost"
   - Draft content: "Your draft will be saved automatically, but recent changes might be lost"

4. **Auto-Save Support**: For long forms, consider implementing auto-save to reduce the need for navigation protection.

5. **Escape Hatches**: Always provide clear ways for users to both save their work or intentionally discard changes.

6. **Testing**: Test navigation guards thoroughly across different browsers and navigation patterns.

7. **Route-Based Exclusions**: Consider exempting certain routes from navigation protection (like help pages or preview routes).
