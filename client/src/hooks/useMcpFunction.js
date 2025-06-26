import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Simple in-memory cache
const functionCache = new Map();

/**
 * Get data from cache if available and not expired
 */
function getCachedData(functionName, args, cacheTimeout) {
  const cacheKey = `${functionName}:${JSON.stringify(args)}`;
  const cachedItem = functionCache.get(cacheKey);
  
  if (!cachedItem) return null;
  
  const { timestamp, data } = cachedItem;
  const isExpired = Date.now() - timestamp > cacheTimeout;
  
  return isExpired ? null : data;
}

/**
 * Store data in cache
 */
function setCachedData(functionName, args, data) {
  const cacheKey = `${functionName}:${JSON.stringify(args)}`;
  functionCache.set(cacheKey, {
    timestamp: Date.now(),
    data
  });
}

/**
 * Check if error is likely transient and should be retried
 */
function isTransientError(error) {
  // Network errors are often transient
  if (error.message && (
    error.message.includes('network') || 
    error.message.includes('timeout') ||
    error.message.includes('connection')
  )) {
    return true;
  }
  
  // Server errors (5xx) are often transient
  if (error.response && error.response.status >= 500) {
    return true;
  }
  
  return false;
}

/**
 * Format error for consistent handling
 */
function formatError(error) {
  return {
    message: error.response?.data?.message || error.message || 'Unknown error',
    status: error.response?.status,
    type: error.response?.data?.error?.type || 'unknown',
    timestamp: Date.now()
  };
}

/**
 * React hook for executing MCP functions with enhanced features
 * 
 * @param {string} functionName - Name of the MCP function to execute
 * @param {object} args - Arguments to pass to the function
 * @param {object} options - Configuration options
 * @returns {object} - State and control functions
 */
export function useMcpFunction(functionName, args, options = {}) {
  const [state, setState] = useState({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    lastUpdated: null
  });

  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef(null);
  
  // Execute function with caching, retries and error handling
  const execute = useCallback(async (overrideArgs = null, retryAttempt = 0) => {
    const executeArgs = overrideArgs || args;
    
    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    // Check cache first if enabled
    if (retryAttempt === 0 && options.enableCache) {
      const cachedData = getCachedData(functionName, executeArgs, options.cacheTimeout || 5 * 60 * 1000);
      if (cachedData) {
        setState({
          data: cachedData,
          error: null,
          isLoading: false,
          isSuccess: true,
          lastUpdated: Date.now(),
          fromCache: true
        });
        return cachedData;
      }
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    try {
      // Direct fetch call to OpenAI endpoint
      const response = await axios({
        url: '/api/openai/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          messages: [
            { 
              role: 'user', 
              content: `Call the ${functionName} function with args: ${JSON.stringify(executeArgs)}` 
            }
          ],
          function_call: { name: functionName }
        },
        signal: abortControllerRef.current.signal,
        timeout: options.timeout || 30000
      });

      // Extract the result from the OpenAI response
      const result = response.data.content ? 
        JSON.parse(response.data.content) : 
        response.data;

      // Cache successful result if caching is enabled
      if (options.enableCache) {
        setCachedData(functionName, executeArgs, result);
      }

      setState({
        data: result,
        error: null,
        isLoading: false,
        isSuccess: true,
        lastUpdated: Date.now(),
        fromCache: false
      });

      setRetryCount(0); // Reset retry count on success
      return result;

    } catch (error) {
      // Don't update state if request was aborted
      if (axios.isCancel(error)) {
        return;
      }

      console.error(`MCP function ${functionName} error:`, error);

      // Implement retry logic for transient errors
      const maxRetries = options.maxRetries || 2;
      const shouldRetry = isTransientError(error) && retryAttempt < maxRetries;
      
      if (shouldRetry) {
        const delay = Math.pow(2, retryAttempt) * 1000; // Exponential backoff
        console.log(`Retrying MCP function ${functionName} in ${delay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
        
        setTimeout(() => {
          execute(executeArgs, retryAttempt + 1);
        }, delay);
        
        setRetryCount(retryAttempt + 1);
        return;
      }

      // Try fallback if available
      if (options.fallback && retryAttempt === 0) {
        console.log(`Using fallback for MCP function ${functionName}`);
        try {
          const fallbackResult = await options.fallback(executeArgs);
          
          setState({
            data: fallbackResult,
            error: null,
            isLoading: false,
            isSuccess: true,
            lastUpdated: Date.now(),
            fromFallback: true
          });
          
          return fallbackResult;
        } catch (fallbackError) {
          console.warn(`Fallback also failed for ${functionName}:`, fallbackError);
        }
      }

      setState({
        data: null,
        error: formatError(error),
        isLoading: false,
        isSuccess: false,
        lastUpdated: Date.now()
      });

      if (options.throwError) {
        throw error;
      }
    }
  }, [functionName, args, options]);

  // Auto-execute on mount and dependency changes
  useEffect(() => {
    if (options.manual !== true && functionName && args) {
      execute();
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [functionName, JSON.stringify(args), execute, options.manual]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    ...state,
    execute,
    refresh,
    retryCount,
    isRetrying: retryCount > 0,
    clearCache: () => {
      const cacheKey = `${functionName}:${JSON.stringify(args)}`;
      functionCache.delete(cacheKey);
    }
  };
}

// Example component using the hook
export function LoanStatusExample() {
  const { 
    data: loanStatus, 
    error, 
    isLoading, 
    refresh 
  } = useMcpFunction('getLoanStatus', { loan_id: 'L001' }, {
    enableCache: true,
    cacheTimeout: 60000, // 1 minute
    maxRetries: 2
  });

  if (isLoading) return <div>Loading loan status...</div>;
  if (error) return <div>Error: {error.message} <button onClick={refresh}>Retry</button></div>;

  return (
    <div>
      <h3>Loan Status</h3>
      <p>Loan ID: {loanStatus?.loan_id}</p>
      <p>Status: {loanStatus?.status}</p>
      <p>Last Updated: {new Date(loanStatus?.last_updated).toLocaleString()}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
} 