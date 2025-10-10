'use client';

import { useEffect } from 'react';

export default function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Global error handler for all contexts
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('Failed to fetch') || 
           event.error.message.includes('NetworkError') ||
           event.error.message.includes('TypeError'))) {
        console.warn('🚫 Global Error Boundary caught:', event.error.message);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && 
          (event.reason.message.includes('Failed to fetch') || 
           event.reason.message.includes('NetworkError') ||
           event.reason.message.includes('TypeError'))) {
        console.warn('🚫 Global Error Boundary caught rejection:', event.reason.message);
        event.preventDefault();
        return false;
      }
    };

    // Add event listeners
    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Override console.error to suppress fetch errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      if (message.includes('Failed to fetch') || 
          message.includes('NetworkError') ||
          message.includes('TypeError: Failed to fetch')) {
        console.warn('🚫 Console error suppressed by Error Boundary:', message);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Cleanup
    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, []);

  return <>{children}</>;
}
