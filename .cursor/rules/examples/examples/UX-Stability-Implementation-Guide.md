# Implementing UX Stability Guidelines - Practical Guide

> **DOCUMENTATION EXAMPLE ONLY**: This guide contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This documentation provides a practical guide to implementing the UX stability guidelines from `040-ux-stability.mdc` in your React components.

## Table of Contents

1. [Key Principles](#key-principles)
2. [Implementation Overview](#implementation-overview)
3. [Example Components](#example-components)
4. [Testing UX Stability](#testing-ux-stability)
5. [Common Pitfalls](#common-pitfalls)
6. [Best Practices Checklist](#best-practices-checklist)

## Key Principles

The UX stability guidelines focus on four key areas:

1. **State Management Stability**: Properly handling loading, error, and empty states
2. **Layout Stability**: Preventing layout shifts during state transitions
3. **Interaction Stability**: Providing clear feedback for user actions
4. **Navigation Stability**: Preventing unexpected navigation and data loss

## Implementation Overview

### State Management Stability

- Track loading, error, and success states explicitly
- Use cleanup functions in useEffect to prevent state updates after unmounting
- Handle errors gracefully with retry options
- Provide helpful guidance for empty states

### Layout Stability

- Use minimum heights/widths for containers with dynamic content
- Implement skeleton loaders that match the final content layout
- Maintain consistent dimensions across different states
- Use CSS Grid or Flexbox for predictable layouts

### Interaction Stability

- Disable buttons during form submission
- Debounce high-frequency events like search inputs
- Provide visual feedback for all interactions
- Confirm destructive actions

### Navigation Stability

- Track form "dirty" state to detect unsaved changes
- Prompt users before navigating away from unsaved changes
- Preserve form values when navigating back
- Handle browser history properly

## Example Components

Our repository includes example components implementing these guidelines:

### DataFetching Component

`DataFetchingExample.tsx` demonstrates:

- Complete state handling (loading, error, empty, success)
- Layout stability with skeleton placeholders
- Debounced search with visual feedback
- Clean unmounting with isMounted flag

Key features:

```tsx
// Important pattern: Track component mount state
useEffect(() => {
  let isMounted = true;

  const loadData = async () => {
    // ... fetch logic ...

    // Only update state if still mounted
    if (isMounted) {
      setData(result);
      setIsLoading(false);
    }
  };

  loadData();

  // Cleanup to prevent state updates after unmount
  return () => {
    isMounted = false;
  };
}, [dependencies]);

// Skeleton loader matches final layout
{
  isLoading ? (
    <div className="skeleton-container">
      <div className="grid grid-cols-3 gap-4">
        {/* Skeleton items with same structure as actual content */}
      </div>
    </div>
  ) : (
    <div className="grid grid-cols-3 gap-4">{/* Actual content */}</div>
  );
}
```

## Testing UX Stability

The test file `DataFetchingExample.test.tsx` shows how to:

1. Test all component states (loading, error, empty, populated)
2. Verify layout stability during transitions
3. Test interaction behaviors like debouncing
4. Test error recovery flows

Key test patterns:

```tsx
// Testing layout stability
it("maintains layout stability during state transitions", async () => {
  // Render with empty data first
  const { container, rerender } = render(<Component />);

  // Get initial container height in empty state
  const initialHeight = container.getBoundingClientRect().height;

  // Re-render with data
  rerender(<Component />);

  // Get height after data loads
  const finalHeight = container.getBoundingClientRect().height;

  // Heights should be the same or very similar
  expect(Math.abs(finalHeight - initialHeight)).toBeLessThanOrEqual(5);
});

// Testing debouncing
it("debounces search input to prevent excessive API calls", async () => {
  jest.useFakeTimers();

  // Rapid changes shouldn't trigger multiple API calls
  fireEvent.change(searchInput, { target: { value: "t" } });
  fireEvent.change(searchInput, { target: { value: "te" } });

  // Should not have triggered additional API calls yet
  expect(mockFetch).toHaveBeenCalledTimes(1);

  // Advance timers to trigger debounced function
  jest.advanceTimersByTime(300);

  // Now it should have triggered a new API call
  expect(mockFetch).toHaveBeenCalledTimes(2);
});
```

## Common Pitfalls

1. **Memory Leaks**: Forgetting to clean up after component unmounting

   ```tsx
   // WRONG - Can cause memory leaks and errors
   useEffect(() => {
     fetchData().then(setData);
   }, []);

   // CORRECT - Clean up properly
   useEffect(() => {
     let isMounted = true;
     fetchData().then((data) => {
       if (isMounted) setData(data);
     });
     return () => {
       isMounted = false;
     };
   }, []);
   ```

2. **Layout Shifts**: Not providing placeholders with matching dimensions

   ```tsx
   // WRONG - Will cause layout shift
   {
     isLoading ? <Spinner /> : <DataTable rows={data} />;
   }

   // CORRECT - Maintains layout stability
   {
     isLoading ? (
       <div className="min-h-[300px]">
         <TableSkeleton rows={5} />
       </div>
     ) : (
       <div className="min-h-[300px]">
         <DataTable rows={data} />
       </div>
     );
   }
   ```

3. **Double Form Submissions**: Not disabling buttons during submission

   ```tsx
   // WRONG - Allows multiple clicks
   <button type="submit">Submit</button>

   // CORRECT - Prevents double submission
   <button type="submit" disabled={isSubmitting}>
     {isSubmitting ? 'Submitting...' : 'Submit'}
   </button>
   ```

## Best Practices Checklist

Use this checklist to verify your components follow UX stability guidelines:

- [ ] Component handles loading state with appropriate placeholder
- [ ] Error states include recovery options (retry button)
- [ ] Empty states provide helpful guidance to users
- [ ] Layout dimensions are consistent across all states
- [ ] Component cleans up resources on unmount
- [ ] Forms disable submission during processing
- [ ] Forms warn before navigating away with unsaved changes
- [ ] Search and filter inputs use debouncing
- [ ] Destructive actions require confirmation
- [ ] Tests verify all component states and transitions

## Related Resources

- [040-ux-stability.mdc](../departments/product/040-ux-stability.mdc) - Complete UX stability guidelines
- [DataFetchingExample.tsx](./components/DataFetchingExample.tsx) - Example implementation
- [DataFetchingExample.test.tsx](./components/DataFetchingExample.test.tsx) - Example tests
