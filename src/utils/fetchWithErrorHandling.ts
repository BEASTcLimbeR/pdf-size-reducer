/**
 * Centralized fetch utility with comprehensive error handling
 */

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface FetchResult<T = any> {
  data?: T;
  error?: string;
  status?: number;
  success: boolean;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public url?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Enhanced fetch with error handling, timeout, and retries
 */
export async function fetchWithErrorHandling<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const {
    timeout = 10000, // 10 seconds default timeout
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url
        );
      }

      // Try to parse JSON, fallback to text if it fails
      let data: T;
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, return the text response
        data = (await response.text()) as unknown as T;
      }

      return {
        data,
        success: true,
        status: response.status,
      };

    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error instanceof FetchError && error.status && error.status >= 400 && error.status < 500) {
        // Client errors (4xx) shouldn't be retried
        break;
      }

      // Don't retry on the last attempt
      if (attempt === retries) {
        break;
      }

      // Wait before retrying
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }

      console.warn(`Fetch attempt ${attempt + 1} failed for ${url}:`, error);
    }
  }

  // All retries failed
  const errorMessage = lastError?.message || 'Unknown fetch error';
  console.error(`All fetch attempts failed for ${url}:`, lastError);

  return {
    success: false,
    error: errorMessage,
    status: lastError instanceof FetchError ? lastError.status : undefined,
  };
}

/**
 * Check if a URL is reachable (for health checks)
 */
export async function checkUrlReachability(url: string): Promise<boolean> {
  try {
    const result = await fetchWithErrorHandling(url, {
      method: 'HEAD',
      timeout: 5000,
      retries: 1,
    });
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Safe fetch that never throws - always returns a result object
 */
export async function safeFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  try {
    return await fetchWithErrorHandling<T>(url, options);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch fetch multiple URLs
 */
export async function batchFetch<T = any>(
  urls: string[],
  options: FetchOptions = {}
): Promise<FetchResult<T>[]> {
  const promises = urls.map(url => safeFetch<T>(url, options));
  return Promise.all(promises);
}
