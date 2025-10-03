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
          message = event.reason.message || JSON.stringify(event.reason) || 'Unknown rejection';
        }
      }
      
      this.handleError({
        type,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle general errors
    window.addEventListener('error', (event) => {
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
          message = event.error.message || JSON.stringify(event.error) || 'Unknown error';
        }
      } else if (event.message) {
        message = event.message;
      }
      
      this.handleError({
        type,
        message,
        timestamp: new Date().toISOString(),
      });
    });
  }

  handleError(error: ErrorInfo) {
    // Validate error object
    if (!error || typeof error !== 'object') {
      console.warn('Invalid error object received:', error);
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

  handleFetchError(error: Error, url?: string, status?: number): void {
    let type: ErrorInfo['type'] = 'fetch';
    let message = error.message;

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
    globalErrorHandler.handleFetchError(
      error as Error,
      url,
      (error as any)?.status
    );
    return null;
  }
}

// Initialize global error handling only in browser
if (typeof window !== 'undefined') {
  // Error handler is already initialized when imported
  console.log('Global error handler initialized');
}
