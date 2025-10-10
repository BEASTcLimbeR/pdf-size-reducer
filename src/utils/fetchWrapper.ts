// Global fetch wrapper to prevent "Failed to fetch" errors
// This replaces the native fetch with a more robust version

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  silent?: boolean; // If true, won't log errors
}

class FetchWrapper {
  private static instance: FetchWrapper;
  private originalFetch: typeof fetch;

  constructor() {
    this.originalFetch = window.fetch;
    this.overrideFetch();
  }

  static getInstance(): FetchWrapper {
    if (!FetchWrapper.instance) {
      FetchWrapper.instance = new FetchWrapper();
    }
    return FetchWrapper.instance;
  }

  private overrideFetch() {
    // Only override in browser environment
    if (typeof window === 'undefined') return;

    const self = this;
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const options: FetchOptions = {
        timeout: 10000,
        retries: 0,
        retryDelay: 1000,
        silent: false,
        ...init
      };

      return self.safeFetch(input, options);
    };
  }

  private async safeFetch(
    input: RequestInfo | URL, 
    options: FetchOptions
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();
    
    for (let attempt = 0; attempt <= (options.retries || 0); attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

        const response = await this.originalFetch(input, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // If response is not ok, throw error only if not silent
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          if (!options.silent) {
            console.warn(`Fetch failed for ${url}:`, error.message);
          }
          throw error;
        }

        return response;

      } catch (error: any) {
        const isLastAttempt = attempt === (options.retries || 0);
        
        // Handle different types of errors
        if (error.name === 'AbortError') {
          if (!options.silent) {
            console.warn(`Fetch timeout for ${url} (attempt ${attempt + 1})`);
          }
        } else if (error.message?.includes('Failed to fetch')) {
          if (!options.silent) {
            console.warn(`Network error for ${url} (attempt ${attempt + 1}):`, error.message);
          }
        } else {
          if (!options.silent) {
            console.warn(`Fetch error for ${url} (attempt ${attempt + 1}):`, error.message);
          }
        }

        // If this is the last attempt, return a mock response instead of throwing
        if (isLastAttempt) {
          if (options.silent) {
            // Return a mock response for silent failures
            return new Response(JSON.stringify({ error: 'Network request failed' }), {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            });
          } else {
            // For non-silent failures, still throw but with better error handling
            throw new Error(`Network request failed: ${error.message || 'Unknown error'}`);
          }
        }

        // Wait before retry
        if (options.retryDelay && attempt < (options.retries || 0)) {
          await new Promise(resolve => setTimeout(resolve, options.retryDelay));
        }
      }
    }

    // This should never be reached, but just in case
    throw new Error('Unexpected error in fetch wrapper');
  }

  // Method to restore original fetch
  restoreOriginalFetch() {
    if (typeof window !== 'undefined' && this.originalFetch) {
      window.fetch = this.originalFetch;
    }
  }

  // Method to enable silent mode for all fetches
  enableSilentMode() {
    this.overrideFetch();
  }
}

// Initialize the fetch wrapper
let fetchWrapper: FetchWrapper | null = null;

if (typeof window !== 'undefined') {
  fetchWrapper = FetchWrapper.getInstance();
}

export { fetchWrapper, FetchWrapper };
export type { FetchOptions };
