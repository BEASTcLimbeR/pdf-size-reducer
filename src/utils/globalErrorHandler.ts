/**
 * Global error handler for fetch and other async operations
 */

interface ErrorInfo {
  type: 'fetch' | 'network' | 'timeout' | 'cors' | 'unknown';
  message: string;
  url?: string;
  status?: number;
  timestamp: string;
}

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errors: ErrorInfo[] = [];
  private maxErrors = 50; // Keep only last 50 errors
  private enabled = true; // Flag to enable/disable error logging

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    // Only set up handlers in browser environment
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections (including fetch errors)
    window.addEventListener('unhandledrejection', (event) => {
      // Skip fetch-related errors completely
      if (event.reason && typeof event.reason === 'object' && event.reason.message) {
        const message = event.reason.message;
        if (message.includes('Failed to fetch') || 
            message.includes('fetch') || 
            message.includes('NetworkError') ||
            message.includes('timeout') ||
            message.includes('aborted')) {
          // Silently ignore fetch-related errors
          return;
        }
      }
      
      // Skip empty objects
      if (event.reason && typeof event.reason === 'object' && Object.keys(event.reason).length === 0) {
        return;
      }
      
      console.error('Unhandled promise rejection:', event.reason);
      
      let message = 'Unhandled promise rejection';
      let type: ErrorInfo['type'] = 'unknown';
      
      if (event.reason) {
        if (typeof event.reason === 'string') {
          message = event.reason;
        } else if (event.reason instanceof Error) {
          message = event.reason.message;
          if (message.includes('fetch') || message.includes('Failed to fetch')) {
            type = 'fetch';
          }
        } else if (event.reason && typeof event.reason === 'object') {
          // Check if it's an empty object
          if (Object.keys(event.reason).length === 0) {
            message = 'Empty rejection object received';
          } else {
            message = event.reason.message || JSON.stringify(event.reason) || 'Unknown rejection';
          }
        }
      }
      
      // Only handle meaningful errors
      if (message && message !== 'Unknown rejection' && message !== 'Empty rejection object received') {
        this.handleError({
          type,
          message,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.warn('Skipping empty or invalid rejection:', { type, message, reason: event.reason });
      }
    });

    // Handle general errors
    window.addEventListener('error', (event) => {
      // Skip fetch-related errors completely
      if (event.error && event.error.message) {
        const message = event.error.message;
        if (message.includes('Failed to fetch') || 
            message.includes('fetch') || 
            message.includes('NetworkError') ||
            message.includes('timeout') ||
            message.includes('aborted')) {
          // Silently ignore fetch-related errors
          return;
        }
      }
      
      // Skip empty objects
      if (event.error && typeof event.error === 'object' && Object.keys(event.error).length === 0) {
        return;
      }
      
      console.error('Global error:', event.error);
      
      let message = 'Unknown error';
      let type: ErrorInfo['type'] = 'unknown';
      
      if (event.error) {
        if (event.error instanceof Error) {
          message = event.error.message;
          if (message.includes('fetch') || message.includes('Failed to fetch')) {
            type = 'fetch';
          }
        } else if (typeof event.error === 'string') {
          message = event.error;
        } else if (event.error && typeof event.error === 'object') {
          // Check if it's an empty object
          if (Object.keys(event.error).length === 0) {
            message = 'Empty error object received';
          } else {
            message = event.error.message || JSON.stringify(event.error) || 'Unknown error';
          }
        }
      } else if (event.message) {
        message = event.message;
      }
      
      // Only handle non-empty errors
      if (message && message !== 'Unknown error' && message !== 'Empty error object received') {
        this.handleError({
          type,
          message,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.warn('Skipping empty or invalid error:', { type, message, event });
      }
    });
  }

  handleError(error: ErrorInfo) {
    // Check if error logging is enabled
    if (!this.enabled) {
      return;
    }

    // Validate error object
    if (!error || typeof error !== 'object') {
      console.warn('Invalid error object received:', error);
      return;
    }

    // Check if it's an empty object
    if (Object.keys(error).length === 0) {
      console.warn('Empty error object received, skipping:', error);
      return;
    }

    // Ensure required fields exist
    const validError: ErrorInfo = {
      type: error.type || 'unknown',
      message: error.message || 'Unknown error',
      timestamp: error.timestamp || new Date().toISOString(),
      url: error.url,
      status: error.status,
    };

    this.errors.unshift(validError);
    
    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', validError);
    }
  }

  // Method to disable error logging
  disableErrorLogging() {
    this.enabled = false;
    console.log('Error logging disabled');
  }

  // Method to enable error logging
  enableErrorLogging() {
    this.enabled = true;
    console.log('Error logging enabled');
  }

  handleFetchError(error: Error, url?: string, status?: number): void {
    // Validate error object
    if (!error || typeof error !== 'object') {
      console.warn('Invalid error object in handleFetchError:', error);
      return;
    }

    let type: ErrorInfo['type'] = 'fetch';
    let message = error.message || 'Unknown fetch error';

    // Categorize the error
    if (error.name === 'AbortError' || message.includes('timeout')) {
      type = 'timeout';
      message = 'Request timed out';
    } else if (message.includes('CORS') || message.includes('cross-origin')) {
      type = 'cors';
      message = 'CORS policy blocked the request';
    } else if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      type = 'network';
      message = 'Network connection failed';
    }

    this.handleError({
      type,
      message,
      url,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  getRecentErrors(count: number = 10): ErrorInfo[] {
    return this.errors.slice(0, count);
  }

  clearErrors(): void {
    this.errors = [];
  }

  getErrorSummary(): {
    total: number;
    byType: Record<string, number>;
    recent: ErrorInfo[];
  } {
    const byType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errors.length,
      byType,
      recent: this.getRecentErrors(5),
    };
  }
}

export const globalErrorHandler = GlobalErrorHandler.getInstance();

// Enhanced fetch wrapper with global error handling
export async function safeFetchWithErrorHandling(
  url: string,
  options: RequestInit = {}
): Promise<Response | null> {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    // Only log meaningful errors, not empty objects or common network issues
    if (error && typeof error === 'object' && error.message && !error.message.includes('Failed to fetch')) {
      globalErrorHandler.handleFetchError(
        error as Error,
        url,
        (error as any)?.status
      );
    } else {
      console.warn('Silent fetch error (likely network issue):', url, error);
    }
    return null;
  }
}

// Initialize global error handling only in browser
if (typeof window !== 'undefined') {
  // Error handler is already initialized when imported
  console.log('Global error handler initialized');
}
