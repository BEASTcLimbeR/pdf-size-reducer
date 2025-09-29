'use client';

import { useCallback, useEffect } from 'react';
import { predictiveProcessingAI, UserAction } from '@/utils/predictiveProcessingAI';

export interface ActivityTrackerOptions {
  enableTracking?: boolean;
  trackPageViews?: boolean;
  trackClicks?: boolean;
  trackFormInteractions?: boolean;
  trackFileOperations?: boolean;
}

export function useUserActivityTracker(options: ActivityTrackerOptions = {}) {
  const {
    enableTracking = true,
    trackPageViews = true,
    trackClicks = false,
    trackFormInteractions = true,
    trackFileOperations = true
  } = options;

  const trackAction = useCallback((
    toolId: string, 
    action: string, 
    metadata?: Record<string, any>
  ) => {
    if (!enableTracking) return;

    const userAction: UserAction = {
      toolId,
      action,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`
      }
    };

    predictiveProcessingAI.trackUserAction(userAction);
  }, [enableTracking]);

  const trackFileOperation = useCallback((
    toolId: string,
    operation: string,
    fileInfo: {
      fileName: string;
      fileSize: number;
      fileType: string;
      success: boolean;
      processingTime?: number;
      error?: string;
    }
  ) => {
    if (!enableTracking || !trackFileOperations) return;

    trackAction(toolId, operation, {
      ...fileInfo,
      operationType: 'file_processing'
    });
  }, [trackAction, trackFileOperations]);

  const trackWorkflowStep = useCallback((
    toolId: string,
    step: string,
    stepData: {
      stepNumber: number;
      totalSteps: number;
      stepDuration?: number;
      success: boolean;
      error?: string;
    }
  ) => {
    if (!enableTracking) return;

    trackAction(toolId, `workflow_${step}`, {
      ...stepData,
      operationType: 'workflow_step'
    });
  }, [trackAction]);

  const trackUserPreference = useCallback((
    toolId: string,
    preference: string,
    value: any,
    context?: string
  ) => {
    if (!enableTracking) return;

    trackAction(toolId, 'preference_changed', {
      preference,
      value,
      context,
      operationType: 'user_preference'
    });
  }, [trackAction]);

  const trackError = useCallback((
    toolId: string,
    errorType: string,
    errorMessage: string,
    context?: Record<string, any>
  ) => {
    if (!enableTracking) return;

    trackAction(toolId, 'error_occurred', {
      errorType,
      errorMessage,
      context,
      operationType: 'error_tracking'
    });
  }, [trackAction]);

  const trackPerformance = useCallback((
    toolId: string,
    operation: string,
    metrics: {
      duration: number;
      memoryUsage?: number;
      fileSize?: number;
      success: boolean;
    }
  ) => {
    if (!enableTracking) return;

    trackAction(toolId, 'performance_metric', {
      operation,
      ...metrics,
      operationType: 'performance_tracking'
    });
  }, [trackAction]);

  // Track page views
  useEffect(() => {
    if (!enableTracking || !trackPageViews) return;

    const trackPageView = () => {
      const currentPath = window.location.pathname;
      const toolId = currentPath.includes('/') ? currentPath.split('/').pop() || 'home' : 'home';
      
      trackAction(toolId, 'page_view', {
        path: currentPath,
        referrer: document.referrer,
        operationType: 'navigation'
      });
    };

    // Track initial page view
    trackPageView();

    // Track subsequent page views (for SPA navigation)
    const handlePopState = () => trackPageView();
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enableTracking, trackPageViews, trackAction]);

  // Track clicks on important elements
  useEffect(() => {
    if (!enableTracking || !trackClicks) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Only track clicks on buttons, links, and interactive elements
      if (target.matches('button, a, [role="button"], input[type="submit"], input[type="button"]')) {
        const toolId = target.closest('[data-tool-id]')?.getAttribute('data-tool-id') || 'unknown';
        const action = target.getAttribute('data-action') || 'click';
        const elementText = target.textContent?.trim() || target.getAttribute('aria-label') || 'unknown';
        
        trackAction(toolId, action, {
          elementText,
          elementType: target.tagName.toLowerCase(),
          operationType: 'user_interaction'
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [enableTracking, trackClicks, trackAction]);

  // Track form interactions
  useEffect(() => {
    if (!enableTracking || !trackFormInteractions) return;

    const handleFormSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      const toolId = form.closest('[data-tool-id]')?.getAttribute('data-tool-id') || 'unknown';
      const formId = form.id || form.className || 'unknown';
      
      trackAction(toolId, 'form_submitted', {
        formId,
        operationType: 'form_interaction'
      });
    };

    const handleInputChange = (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.type === 'file') {
        const toolId = input.closest('[data-tool-id]')?.getAttribute('data-tool-id') || 'unknown';
        const fileCount = input.files?.length || 0;
        
        trackAction(toolId, 'file_selected', {
          fileCount,
          operationType: 'file_selection'
        });
      }
    };

    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('change', handleInputChange);
    
    return () => {
      document.removeEventListener('submit', handleFormSubmit);
      document.removeEventListener('change', handleInputChange);
    };
  }, [enableTracking, trackFormInteractions, trackAction]);

  return {
    trackAction,
    trackFileOperation,
    trackWorkflowStep,
    trackUserPreference,
    trackError,
    trackPerformance,
    isTrackingEnabled: enableTracking
  };
}
