# DataFetching Component - UX Stability Example

> **DOCUMENTATION EXAMPLE ONLY**: This file contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This example demonstrates implementation of the UX stability guidelines from `040-ux-stability.mdc`.

## Key Stability Features

1. **Complete state handling**: Loading, error, empty, and success states
2. **Layout stability**: Fixed minimum heights and skeleton placeholders matching final layout
3. **Debounced search**: Preventing excessive API calls
4. **Proper unmounting**: Preventing memory leaks with cleanup functions

## Code Example

```tsx
import React, { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";

// Reusable components
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => (
  <div className={`spinner ${size}`} data-testid="loading-spinner">
    <div className="spinner-inner"></div>
  </div>
);

const ErrorMessage = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div className="error-container" data-testid="error-message">
    <div className="error-icon">❌</div>
    <p className="error-text">{message}</p>
    {onRetry && (
      <button className="retry-button" onClick={onRetry} aria-label="Retry">
        Try Again
      </button>
    )}
  </div>
);

const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="empty-state" data-testid="empty-state">
    <h3 className="empty-state-title">{title}</h3>
    <p className="empty-state-description">{description}</p>
    {action && <div className="empty-state-action">{action}</div>}
  </div>
);

// Example component implementing UX stability guidelines
type DataFetchingProps = {
  endpoint: string;
  searchParams?: Record<string, string>;
  renderItem: (item: any) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
};

export function DataFetching({
  endpoint,
  searchParams = {},
  renderItem,
  emptyTitle = "No data available",
  emptyDescription = "Try adjusting your filters or create new items",
  emptyAction,
}: DataFetchingProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Create the fetch function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const queryParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      queryParams.set("search", searchQuery);
    }

    const url = `${endpoint}?${queryParams.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setIsLoading(false);
    } catch (err) {
      setError((err as Error).message || "Failed to load data");
      setIsLoading(false);
      console.error("Data fetching error:", err);
    }
  }, [endpoint, searchParams, searchQuery]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams(searchParams);
        if (searchQuery) {
          queryParams.set("search", searchQuery);
        }

        const url = `${endpoint}?${queryParams.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Only update state if component is still mounted
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        // Only update state if component is still mounted
        if (isMounted) {
          setError((err as Error).message || "Failed to load data");
          setIsLoading(false);
        }
      }
    };

    loadData();

    // Cleanup function prevents state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [endpoint, searchParams, searchQuery]);

  // Debounced search to prevent excessive API calls
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchQuery(term);
    }, 300),
    []
  );

  // Search input handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSearching(true);
    debouncedSearch(e.target.value);
  };

  // Render the component with all required states
  return (
    <div className="data-container min-h-[400px]">
      {/* Search input with loading indicator */}
      <div className="search-container relative mb-4">
        <input
          type="text"
          placeholder="Search..."
          onChange={handleSearchChange}
          className="search-input w-full px-4 py-2 border rounded-md"
          aria-label="Search"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {/* Main content area with fixed minimum height */}
      <div className="content-area min-h-[350px]">
        {isLoading ? (
          // Loading state with skeleton placeholder that matches final layout
          <div className="loading-state flex items-center justify-center h-full">
            <div className="skeleton-container w-full">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="skeleton-item bg-gray-100 rounded-lg p-4 animate-pulse h-[150px]"
                  >
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          // Error state with retry action
          <div className="error-state flex flex-col items-center justify-center h-full">
            <ErrorMessage message={error} onRetry={fetchData} />
          </div>
        ) : data.length === 0 ? (
          // Empty state with helpful messaging
          <div className="empty-state flex flex-col items-center justify-center h-full">
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          </div>
        ) : (
          // Actual content with same layout as skeleton
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-4">
                {renderItem(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Test Example

```tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataFetching from "./DataFetchingExample";

// Mock fetch for testing
global.fetch = jest.fn();

describe("DataFetching Component UX Stability", () => {
  // Setup for tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maintains layout stability during state transitions", async () => {
    // First return empty data
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const { container, rerender } = render(
      <DataFetching
        endpoint="/api/items"
        renderItem={(item) => <div>{item.name}</div>}
      />
    );

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });

    // Get initial container height
    const initialHeight = container
      .querySelector(".content-area")
      ?.getBoundingClientRect().height;

    // Now return data on second fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: "Test Item" }]),
    });

    // Trigger a refetch
    rerender(
      <DataFetching
        endpoint="/api/items?page=2"
        renderItem={(item) => <div>{item.name}</div>}
      />
    );

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText("Test Item")).toBeInTheDocument();
    });

    // Get final container height
    const finalHeight = container
      .querySelector(".content-area")
      ?.getBoundingClientRect().height;

    // Heights should be the same or very similar
    expect(Math.abs(finalHeight - initialHeight)).toBeLessThanOrEqual(5);
  });
});
```
