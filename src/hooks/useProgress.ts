'use client';

import { useState, useCallback, useRef } from 'react';
import { ProgressStep } from '@/components/ProgressIndicator';

export interface UseProgressOptions {
  steps: Omit<ProgressStep, 'status'>[];
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

export interface UseProgressReturn {
  steps: ProgressStep[];
  currentStep: number;
  isProcessing: boolean;
  isCancelled: boolean;
  error: string | null;
  totalTime: number;
  estimatedTime: number;
  startProcessing: () => void;
  completeStep: (stepId: string) => void;
  setStepError: (stepId: string, error: string) => void;
  cancelProcessing: () => Promise<void>;
  resetProgress: () => void;
  updateStep: (stepId: string, updates: Partial<ProgressStep>) => void;
}

export function useProgress({
  steps: initialSteps,
  onComplete,
  onError,
  onCancel
}: UseProgressOptions): UseProgressReturn {
  const [steps, setSteps] = useState<ProgressStep[]>(
    initialSteps.map(step => ({ ...step, status: 'pending' as const }))
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const cancelRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startProcessing = useCallback(() => {
    setSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index === 0 ? 'active' : 'pending'
    })));
    setCurrentStep(0);
    setIsProcessing(true);
    setIsCancelled(false);
    setError(null);
    setTotalTime(0);
    setEstimatedTime(initialSteps.length * 2000); // Estimate 2 seconds per step
    startTimeRef.current = Date.now();
    cancelRef.current = new AbortController();
    
    // Start timer
    intervalRef.current = setInterval(() => {
      setTotalTime(Date.now() - startTimeRef.current);
    }, 100);
  }, [initialSteps.length]);

  const completeStep = useCallback((stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status: 'completed' as const }
        : step
    ));

    const currentStepIndex = steps.findIndex(step => step.id === stepId);
    const nextStepIndex = currentStepIndex + 1;
    
    if (nextStepIndex < steps.length) {
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === nextStepIndex ? 'active' as const : step.status
      })));
      setCurrentStep(nextStepIndex);
    } else {
      // All steps completed
      setIsProcessing(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      onComplete?.();
    }
  }, [steps, onComplete]);

  const setStepError = useCallback((stepId: string, errorMessage: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status: 'error' as const }
        : step
    ));
    setError(errorMessage);
    setIsProcessing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onError?.(new Error(errorMessage));
  }, [onError]);

  const cancelProcessing = useCallback(async () => {
    if (cancelRef.current) {
      cancelRef.current.abort();
    }
    setIsCancelled(true);
    setIsProcessing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setSteps(prev => prev.map(step => ({
      ...step,
      status: step.status === 'active' ? 'pending' as const : step.status
    })));
    await onCancel?.();
  }, [onCancel]);

  const resetProgress = useCallback(() => {
    setSteps(initialSteps.map(step => ({ ...step, status: 'pending' as const })));
    setCurrentStep(0);
    setIsProcessing(false);
    setIsCancelled(false);
    setError(null);
    setTotalTime(0);
    setEstimatedTime(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    cancelRef.current = null;
  }, [initialSteps]);

  const updateStep = useCallback((stepId: string, updates: Partial<ProgressStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, ...updates }
        : step
    ));
  }, []);

  return {
    steps,
    currentStep,
    isProcessing,
    isCancelled,
    error,
    totalTime,
    estimatedTime,
    startProcessing,
    completeStep,
    setStepError,
    cancelProcessing,
    resetProgress,
    updateStep
  };
}
