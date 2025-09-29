'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  estimatedTime?: number; // in seconds
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  isProcessing: boolean;
  onCancel?: () => void;
  showTimeEstimate?: boolean;
  showCancelButton?: boolean;
  className?: string;
}

export default function ProgressIndicator({
  steps,
  currentStep,
  isProcessing,
  onCancel,
  showTimeEstimate = true,
  showCancelButton = true,
  className = ''
}: ProgressIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isCancelling, setIsCancelling] = useState(false);

  // Calculate total estimated time
  const totalEstimatedTime = steps.reduce((total, step) => total + (step.estimatedTime || 0), 0);
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const remainingSteps = steps.filter(step => step.status === 'pending' || step.status === 'active');
  const remainingTime = remainingSteps.reduce((total, step) => total + (step.estimatedTime || 0), 0);

  useEffect(() => {
    if (isProcessing && remainingTime > 0) {
      setTimeRemaining(remainingTime);
      
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeRemaining(0);
    }
  }, [isProcessing, remainingTime, currentStep]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepStatusColor = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-500';
      case 'active':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300 dark:bg-gray-600';
    }
  };

  const handleCancel = async () => {
    if (onCancel) {
      setIsCancelling(true);
      try {
        await onCancel();
      } finally {
        setIsCancelling(false);
      }
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Loader2 className={`h-5 w-5 text-blue-600 dark:text-blue-400 ${isProcessing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isProcessing ? 'Processing...' : 'Ready to Process'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Step {completedSteps + 1} of {steps.length}
            </p>
          </div>
        </div>
        
        {showCancelButton && isProcessing && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round((completedSteps / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(completedSteps / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Time Estimate */}
      {showTimeEstimate && isProcessing && timeRemaining > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Estimated time remaining: {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 ${
              step.status === 'active'
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : step.status === 'completed'
                ? 'bg-green-50 dark:bg-green-900/20'
                : step.status === 'error'
                ? 'bg-red-50 dark:bg-red-900/20'
                : 'bg-gray-50 dark:bg-gray-700'
            }`}
          >
            {/* Step Icon */}
            <div className="flex-shrink-0">
              {getStepIcon(step)}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${
                  step.status === 'active'
                    ? 'text-blue-900 dark:text-blue-100'
                    : step.status === 'completed'
                    ? 'text-green-900 dark:text-green-100'
                    : step.status === 'error'
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {step.label}
                </p>
                {step.estimatedTime && step.status === 'active' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ~{step.estimatedTime}s
                  </span>
                )}
              </div>
              
              {/* Step Status Indicator */}
              <div className="mt-1 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getStepStatusColor(step)}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {step.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Processing Animation */}
      {isProcessing && (
        <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Processing your request...</span>
        </div>
      )}
    </div>
  );
}
