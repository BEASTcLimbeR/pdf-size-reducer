'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Zap, Loader2 } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
  estimatedTime?: number;
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface EnhancedProgressBarProps {
  steps: ProgressStep[];
  currentStepIndex?: number;
  isProcessing?: boolean;
  showTimeEstimate?: boolean;
  showCancelButton?: boolean;
  onCancel?: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'detailed';
  size?: 'sm' | 'md' | 'lg';
}

export default function EnhancedProgressBar({
  steps,
  currentStepIndex = 0,
  isProcessing = false,
  showTimeEstimate = true,
  showCancelButton = true,
  onCancel,
  className = '',
  variant = 'default',
  size = 'md'
}: EnhancedProgressBarProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Calculate elapsed time
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      const activeStep = steps.find(step => step.status === 'active');
      if (activeStep?.startTime) {
        setElapsedTime(Math.floor((Date.now() - activeStep.startTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing, steps]);

  // Calculate estimated time remaining
  useEffect(() => {
    const activeStep = steps.find(step => step.status === 'active');
    if (activeStep?.estimatedTime && activeStep?.startTime) {
      const elapsed = (Date.now() - activeStep.startTime) / 1000;
      const remaining = Math.max(0, activeStep.estimatedTime - elapsed);
      setEstimatedTimeRemaining(Math.floor(remaining));
    } else {
      setEstimatedTimeRemaining(null);
    }
  }, [steps, elapsedTime]);

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'active':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepProgress = (step: ProgressStep) => {
    if (step.status === 'completed') return 100;
    if (step.status === 'error') return 0;
    if (step.status === 'active') return step.progress || 0;
    return 0;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${(currentStepIndex / steps.length) * 100}%`
            }}
          />
        </div>
        <span className={`text-gray-600 dark:text-gray-400 ${getSizeClasses()}`}>
          {currentStepIndex + 1} / {steps.length}
        </span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Processing Progress
          </h3>
          {showCancelButton && isProcessing && (
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getStepIcon(step)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`font-medium text-gray-900 dark:text-white ${getSizeClasses()}`}>
                    {step.label}
                  </p>
                  {step.status === 'active' && step.progress !== undefined && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {step.progress}%
                    </span>
                  )}
                </div>
                
                {step.status === 'active' && (
                  <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${step.progress || 0}%` }}
                    />
                  </div>
                )}

                {step.error && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {step.error}
                  </p>
                )}

                {step.status === 'active' && step.estimatedTime && showTimeEstimate && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Estimated time: {formatTime(step.estimatedTime)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {showTimeEstimate && (elapsedTime > 0 || estimatedTimeRemaining !== null) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Elapsed: {formatTime(elapsedTime)}</span>
              {estimatedTimeRemaining !== null && (
                <span>Remaining: {formatTime(estimatedTimeRemaining)}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blue-500" />
          <span className={`font-medium text-gray-900 dark:text-white ${getSizeClasses()}`}>
            {steps[currentStepIndex]?.label || 'Processing...'}
          </span>
        </div>
        {showCancelButton && isProcessing && (
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Overall progress bar */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${((currentStepIndex + 1) / steps.length) * 100}%`
            }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center space-x-1 ${
                index <= currentStepIndex ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                step.status === 'completed' ? 'bg-green-500' :
                step.status === 'error' ? 'bg-red-500' :
                step.status === 'active' ? 'bg-blue-500' : 'bg-gray-300'
              }`} />
              <span className="text-xs hidden sm:block">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Time estimates */}
        {showTimeEstimate && (elapsedTime > 0 || estimatedTimeRemaining !== null) && (
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Elapsed: {formatTime(elapsedTime)}</span>
            {estimatedTimeRemaining !== null && (
              <span>Remaining: {formatTime(estimatedTimeRemaining)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
