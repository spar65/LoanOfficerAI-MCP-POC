# Accessibility Implementation Guide

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide provides concrete examples of accessibility implementation following the guidelines in [054-accessibility-requirements.mdc](mdc:technologies/languages/javascript/054-accessibility-requirements.mdc).

## Table of Contents

1. [Semantic HTML Structure](#semantic-html-structure)
2. [Keyboard Navigation](#keyboard-navigation)
3. [Screen Reader Support](#screen-reader-support)
4. [Color and Contrast](#color-and-contrast)
5. [Form Accessibility](#form-accessibility)
6. [Focus Management](#focus-management)
7. [ARIA Implementation](#aria-implementation)
8. [Testing Techniques](#testing-techniques)

## Semantic HTML Structure

Proper semantic HTML is the foundation of accessible applications:

```jsx
// Example: Semantic page structure
function AccessiblePage() {
  return (
    <>
      <header>
        <h1>Application Title</h1>
        <nav aria-label="Main Navigation">
          <ul>
            <li>
              <a href="/">Dashboard</a>
            </li>
            <li>
              <a href="/features">Features</a>
            </li>
            <li>
              <a href="/settings">Settings</a>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <section aria-labelledby="dashboard-title">
          <h2 id="dashboard-title">Dashboard Overview</h2>

          <article>
            <h3>Recent Activity</h3>
            <ul>
              <li>Item added to project</li>
              <li>User invited to workspace</li>
            </ul>
          </article>

          <aside aria-labelledby="tips-heading">
            <h3 id="tips-heading">Tips & Recommendations</h3>
            <p>Complete your profile to unlock additional features.</p>
          </aside>
        </section>
      </main>

      <footer>
        <p>&copy; 2025 Company Name</p>
        <nav aria-label="Footer Navigation">
          <ul>
            <li>
              <a href="/terms">Terms</a>
            </li>
            <li>
              <a href="/privacy">Privacy</a>
            </li>
          </ul>
        </nav>
      </footer>
    </>
  );
}
```

## Keyboard Navigation

Ensure all interactive elements are fully keyboard accessible:

```jsx
// Example: Custom keyboard navigation component
function KeyboardNavigableMenu() {
  const [activeIndex, setActiveIndex] = useState(0);
  const menuItems = ["Home", "Products", "Services", "Contact"];
  const menuRefs = useRef([]);

  useEffect(() => {
    // Focus the active item when it changes
    menuRefs.current[activeIndex]?.focus();
  }, [activeIndex]);

  const handleKeyDown = (e, index) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex === menuItems.length - 1 ? 0 : prevIndex + 1
        );
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex === 0 ? menuItems.length - 1 : prevIndex - 1
        );
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(menuItems.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <ul role="menu" className="keyboard-menu">
      {menuItems.map((item, index) => (
        <li key={item} role="none">
          <button
            ref={(el) => (menuRefs.current[index] = el)}
            role="menuitem"
            tabIndex={index === activeIndex ? 0 : -1}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onClick={() => setActiveIndex(index)}
            className={index === activeIndex ? "active" : ""}
          >
            {item}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

## Screen Reader Support

Implement proper labeling and ARIA attributes for screen reader users:

```jsx
// Example: Accessible chart with screen reader support
function AccessibleChart({ data, title }) {
  return (
    <div className="chart-container">
      <h3 id="chart-title">{title}</h3>

      {/* Visual chart for sighted users */}
      <div className="visual-chart" aria-hidden="true">
        {/* Chart implementation */}
      </div>

      {/* Hidden table for screen readers */}
      <table className="sr-only" aria-labelledby="chart-title">
        <caption>Data table for {title}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <th scope="row">{item.category}</th>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary for screen readers */}
      <div className="sr-only">
        <p>
          Chart summary: The highest value is{" "}
          {Math.max(...data.map((d) => d.value))}
          in the {
            data.find((d) => d.value === Math.max(...data.map((d) => d.value)))
              .category
          } category.
        </p>
      </div>
    </div>
  );
}
```

## Color and Contrast

Implement accessible color schemes and contrast:

```jsx
// Example: Color-independent status indicators
function AccessibleStatusIndicator({ status, message }) {
  const statusConfig = {
    success: {
      icon: "✓",
      label: "Success",
      className: "bg-green-100 text-green-800 border-green-500",
      ariaLive: "polite",
    },
    warning: {
      icon: "⚠️",
      label: "Warning",
      className: "bg-yellow-100 text-yellow-800 border-yellow-500",
      ariaLive: "polite",
    },
    error: {
      icon: "✕",
      label: "Error",
      className: "bg-red-100 text-red-800 border-red-500",
      ariaLive: "assertive",
    },
    info: {
      icon: "ℹ️",
      label: "Information",
      className: "bg-blue-100 text-blue-800 border-blue-500",
      ariaLive: "polite",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`border rounded-md p-3 flex items-start ${config.className}`}
      role="status"
      aria-live={config.ariaLive}
    >
      <span className="sr-only">{config.label}:</span>
      <span className="text-lg mr-2" aria-hidden="true">
        {config.icon}
      </span>
      <div>{message}</div>
    </div>
  );
}
```

## Form Accessibility

Create accessible form elements with proper validation:

```jsx
// Example: Accessible form component
function AccessibleForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    preference: "option1",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      // Focus the first field with an error
      document.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitResult({
        status: "success",
        message: "Form submitted successfully!",
      });
    } catch (error) {
      setSubmitResult({
        status: "error",
        message: "Failed to submit form. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 id="form-title" className="text-xl mb-4">
        Contact Form
      </h2>

      {submitResult && (
        <div
          className={`mb-4 p-3 rounded ${
            submitResult.status === "success" ? "bg-green-100" : "bg-red-100"
          }`}
          role="status"
          aria-live="polite"
        >
          {submitResult.message}
        </div>
      )}

      <form onSubmit={handleSubmit} aria-labelledby="form-title" noValidate>
        <div className="mb-4">
          <label htmlFor="name" className="block mb-1 font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={`w-full p-2 border rounded ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.name && (
            <p
              id="name-error"
              className="mt-1 text-red-600 text-sm"
              role="alert"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block mb-1 font-medium">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`w-full p-2 border rounded ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.email && (
            <p
              id="email-error"
              className="mt-1 text-red-600 text-sm"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>

        <fieldset className="mb-4">
          <legend className="font-medium mb-1">Preferences</legend>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="option1"
                name="preference"
                type="radio"
                value="option1"
                checked={formData.preference === "option1"}
                onChange={handleChange}
                className="mr-2"
              />
              <label htmlFor="option1">Option 1</label>
            </div>

            <div className="flex items-center">
              <input
                id="option2"
                name="preference"
                type="radio"
                value="option2"
                checked={formData.preference === "option2"}
                onChange={handleChange}
                className="mr-2"
              />
              <label htmlFor="option2">Option 2</label>
            </div>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white py-2 px-4 rounded 
                   hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 
                   focus:outline-none disabled:opacity-50"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
```

## Focus Management

Implement proper focus management for modals and dynamic content:

```jsx
// Example: Accessible modal with proper focus management
function AccessibleModal({ isOpen, onClose, title, children }) {
  const [previousFocus, setPreviousFocus] = useState(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Store the current active element to restore focus later
      setPreviousFocus(document.activeElement);

      // Focus the close button when modal opens
      closeButtonRef.current?.focus();

      // Add event listener for escape key
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);

      // Disable scrolling on the main page
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, onClose]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previousFocus) {
      previousFocus.focus();
    }
  }, [isOpen, previousFocus]);

  // Handle focus trapping
  const handleTabKey = (e) => {
    if (e.key !== "Tab" || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleTabKey}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-xl font-bold">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Close dialog"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="modal-content">{children}</div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

## ARIA Implementation

Proper ARIA implementation for custom components:

```jsx
// Example: Accessible tabs implementation
function AccessibleTabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabRefs = useRef([]);

  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  const handleKeyDown = (e, index) => {
    let newIndex;

    switch (e.key) {
      case "ArrowRight":
        newIndex = (index + 1) % tabs.length;
        setActiveTab(newIndex);
        tabRefs.current[newIndex].focus();
        break;
      case "ArrowLeft":
        newIndex = (index - 1 + tabs.length) % tabs.length;
        setActiveTab(newIndex);
        tabRefs.current[newIndex].focus();
        break;
      case "Home":
        setActiveTab(0);
        tabRefs.current[0].focus();
        break;
      case "End":
        newIndex = tabs.length - 1;
        setActiveTab(newIndex);
        tabRefs.current[newIndex].focus();
        break;
      default:
        break;
    }
  };

  return (
    <div className="tabs-container">
      <div role="tablist" aria-label="Content tabs" className="flex border-b">
        {tabs.map((tab, index) => (
          <button
            key={index}
            ref={(el) => (tabRefs.current[index] = el)}
            role="tab"
            id={`tab-${index}`}
            aria-selected={activeTab === index}
            aria-controls={`panel-${index}`}
            tabIndex={activeTab === index ? 0 : -1}
            onClick={() => handleTabClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`py-2 px-4 ${
              activeTab === index
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={index}
          role="tabpanel"
          id={`panel-${index}`}
          aria-labelledby={`tab-${index}`}
          hidden={activeTab !== index}
          tabIndex={0}
          className="p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

## Testing Techniques

Here are some testing techniques to ensure accessibility:

```jsx
// Example: Accessibility testing utilities
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

// Add jest-axe custom matchers
expect.extend(toHaveNoViolations);

// Testing a component for accessibility
describe("Button component", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(
      <Button onClick={() => {}} aria-label="Test Button">
        Click Me
      </Button>
    );

    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("can be used with keyboard", async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    // Focus the button and press space
    const button = screen.getByRole("button", { name: /click me/i });
    button.focus();
    expect(document.activeElement).toBe(button);

    // Press Space key
    await userEvent.keyboard(" ");
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Press Enter key
    await userEvent.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it("shows a focus indicator when tabbed to", async () => {
    const { container } = render(<Button onClick={() => {}}>Click Me</Button>);

    // Use CSS testing library or check computed styles
    const button = screen.getByRole("button", { name: /click me/i });

    // Simulate tab navigation
    button.focus();

    // Check focus ring
    const styles = window.getComputedStyle(button);
    expect(styles.outline).not.toBe("none");
  });
});
```

## Additional Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [The A11Y Project](https://a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
