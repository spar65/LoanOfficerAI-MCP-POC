# Browser State Management Examples

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide demonstrates practical implementations of the browser state management guidelines from `045-browser-state-management.mdc`.

## Table of Contents

1. [URL Parameter Management](#url-parameter-management)
2. [Cross-Tab Communication](#cross-tab-communication)
3. [Navigation Guards](#navigation-guards)
4. [State Persistence](#state-persistence)

## URL Parameter Management

### Managing Filter State in URL

```tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// Custom hook to sync filter state with URL
function useFilterState(initialFilters = {}) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);

  // Initialize filters from URL on mount
  useEffect(() => {
    if (!router.isReady) return;

    const urlFilters = {};

    // Extract known filter parameters from URL
    if (router.query.status) urlFilters.status = router.query.status;
    if (router.query.sort) urlFilters.sort = router.query.sort;
    if (router.query.page) urlFilters.page = Number(router.query.page);

    // Only update if different from current state
    if (Object.keys(urlFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...urlFilters }));
    }
  }, [router.isReady, router.query]);

  // Update filters and URL
  const updateFilters = (newFilters) => {
    // Merge with existing filters
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // Update URL without adding to history stack
    const query = { ...router.query };

    // Add or remove filter parameters from URL
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        delete query[key];
      } else {
        query[key] = String(value);
      }
    });

    router.replace(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true }
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters(initialFilters);

    // Remove all filter parameters from URL
    router.replace({ pathname: router.pathname }, undefined, { shallow: true });
  };

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}

// Usage example
function ProductFilters() {
  const { filters, updateFilters, resetFilters } = useFilterState({
    status: "active",
    sort: "newest",
    page: 1,
  });

  return (
    <div className="filters">
      <div className="filter-group">
        <label>Status</label>
        <select
          value={filters.status || ""}
          onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Sort</label>
        <select
          value={filters.sort || "newest"}
          onChange={(e) => updateFilters({ sort: e.target.value })}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name</option>
        </select>
      </div>

      <button onClick={resetFilters}>Reset Filters</button>
    </div>
  );
}
```

### Semantic URL Structure

```tsx
// Good URL structure for a complex application

// Users section
/users                                  // List users
/users/:userId                          // User profile
/users/:userId/edit                     // Edit user
/users/:userId/permissions              // User permissions

// Organizations section
/organizations                          // List organizations
/organizations/:orgId                   // Organization details
/organizations/:orgId/members           // Organization members
/organizations/:orgId/settings          // Organization settings
/organizations/:orgId/billing           // Billing information

// Projects section
/organizations/:orgId/projects          // List projects
/organizations/:orgId/projects/:projId  // Project details
/organizations/:orgId/projects/:projId/tasks  // Project tasks

// Filter and sorting parameters
/projects?status=active&sort=deadline&direction=asc&page=2
```

## Cross-Tab Communication

### Session Synchronization

```tsx
import { useEffect, useCallback } from "react";

// Custom hook for synchronizing authentication across tabs
function useAuthSync() {
  const { user, login, logout } = useAuth();

  // Broadcast logout event to other tabs
  const broadcastLogout = useCallback(() => {
    // Store timestamp to ensure event is fresh
    localStorage.setItem(
      "auth:logout",
      JSON.stringify({
        timestamp: Date.now(),
      })
    );

    // Clean up immediately to allow future events
    setTimeout(() => localStorage.removeItem("auth:logout"), 100);
  }, []);

  // Listen for logout events from other tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      // Handle logout event
      if (event.key === "auth:logout" && event.newValue) {
        if (user) {
          logout({ reason: "logged_out_in_other_tab" });
        }
      }

      // Handle login event
      if (event.key === "auth:login" && event.newValue) {
        try {
          const authData = JSON.parse(event.newValue);
          // Refresh the session
          login(authData);
        } catch (err) {
          console.error("Failed to parse auth data", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user, logout, login]);

  // Broadcast login event to other tabs
  const broadcastLogin = useCallback((authData) => {
    localStorage.setItem("auth:login", JSON.stringify(authData));
    setTimeout(() => localStorage.removeItem("auth:login"), 100);
  }, []);

  return {
    broadcastLogout,
    broadcastLogin,
  };
}

// Usage in login component
function LoginForm() {
  const { login } = useAuth();
  const { broadcastLogin } = useAuthSync();

  const handleSubmit = async (credentials) => {
    try {
      const authData = await loginApi(credentials);

      // Update current tab
      login(authData);

      // Notify other tabs
      broadcastLogin(authData);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      handleLoginError(error);
    }
  };

  // Form implementation...
}

// Usage in header component with logout button
function Header() {
  const { user, logout } = useAuth();
  const { broadcastLogout } = useAuthSync();

  const handleLogout = () => {
    // Log out current tab
    logout();

    // Notify other tabs
    broadcastLogout();

    // Redirect to login page
    router.push("/login");
  };

  return (
    <header>{user && <button onClick={handleLogout}>Logout</button>}</header>
  );
}
```

### Shared Application State

```tsx
import { useState, useEffect, useCallback } from "react";

// Custom hook for syncing theme across tabs
function useThemeSync() {
  const [theme, setThemeState] = useState(() => {
    // Initialize from localStorage if available
    try {
      const savedTheme = localStorage.getItem("app:theme");
      return savedTheme || "light";
    } catch (err) {
      return "light";
    }
  });

  // Update theme and broadcast to other tabs
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("app:theme", newTheme);
  }, []);

  // Listen for theme changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "app:theme" && event.newValue) {
        setThemeState(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return [theme, setTheme];
}

function ThemeToggle() {
  const [theme, setTheme] = useThemeSync();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
```

## Navigation Guards

### Form with Unsaved Changes Protection

```tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { isEqual } from "lodash";

function EditForm({ initialData, onSave }) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData);
  const [originalData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if form has unsaved changes
  const hasUnsavedChanges = !isEqual(formData, originalData);

  // Set up navigation guard
  useEffect(() => {
    // Don't add guard if no unsaved changes or during submission
    if (!hasUnsavedChanges || isSubmitting) return;

    const message =
      "You have unsaved changes. Are you sure you want to leave this page?";

    // For browser tab close or reload
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    // For Next.js routing
    const handleRouteChangeStart = (url) => {
      if (window.confirm(message)) {
        return;
      }

      // Cancel navigation and reset URL
      router.events.emit("routeChangeError");
      router.replace(router.asPath);
      throw new Error("Navigation cancelled by user");
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    router.events.on("routeChangeStart", handleRouteChangeStart);

    // Clean up
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [hasUnsavedChanges, isSubmitting, router]);

  // Form submission handler
  const handleSubmit = async (event) => {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      await onSave(formData);
      // Navigation is now safe since changes are saved
      router.push("/success-page");
    } catch (error) {
      console.error("Failed to save:", error);
      setIsSubmitting(false);
      // Show error message to user
    }
  };

  // Form input change handler
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Discard changes and navigate away
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("Discard unsaved changes?")) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      {/* Form actions */}
      <div className="form-actions">
        <button type="button" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </button>

        <button type="submit" disabled={isSubmitting || !hasUnsavedChanges}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
```

## State Persistence

### Persistent Form State with Auto-Save

```tsx
import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";

// Custom hook for form state with auto-save
function usePersistedForm(formId, initialValues) {
  // Try to load from localStorage first
  const [values, setValues] = useState(() => {
    try {
      const savedValues = localStorage.getItem(`form:${formId}`);
      return savedValues ? JSON.parse(savedValues) : initialValues;
    } catch (err) {
      console.error("Failed to load saved form:", err);
      return initialValues;
    }
  });

  // Auto-save form values with debounce
  const saveForm = useCallback(
    debounce((formData) => {
      try {
        localStorage.setItem(`form:${formId}`, JSON.stringify(formData));
      } catch (err) {
        console.error("Failed to save form:", err);
      }
    }, 500),
    [formId]
  );

  // Update values and trigger save
  useEffect(() => {
    saveForm(values);
  }, [values, saveForm]);

  // Form input change handler
  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Clear form and localStorage
  const resetForm = (newValues = initialValues) => {
    setValues(newValues);
    localStorage.removeItem(`form:${formId}`);
  };

  return {
    values,
    handleChange,
    resetForm,
    setValues,
  };
}

// Usage example
function ContactForm() {
  const { values, handleChange, resetForm } = usePersistedForm("contact", {
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await submitContactForm(values);
      alert("Form submitted successfully!");
      resetForm(); // Clear form after successful submission
    } catch (error) {
      alert("Failed to submit form. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          value={values.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          value={values.message}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={() => resetForm()}>
          Clear
        </button>
        <button type="submit">Submit</button>
      </div>

      <p className="form-note">
        <small>Your form is automatically saved as you type.</small>
      </p>
    </form>
  );
}
```
