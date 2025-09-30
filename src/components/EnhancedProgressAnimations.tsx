'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Clock, Zap, FileText, Download, Sparkles } from 'lucide-react';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon: React.ReactNode;
  duration?: number;
}

interface EnhancedProgressAnimationsProps {
  steps: ProgressStep[];
  currentStep: number;
  isProcessing: boolean;
  totalTime?: number;
  estimatedTime?: number;
}

export default function EnhancedProgressAnimations({ 
  steps, 
  currentStep, 
  isProcessing, 
  totalTime = 0,
  estimatedTime = 0 
}: EnhancedProgressAnimationsProps) {
  const progressPercentage = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  const remainingTime = estimatedTime - totalTime;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header with Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Processing Your Document
          </h3>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {remainingTime > 0 ? `${Math.ceil(remainingTime)}s remaining` : 'Almost done...'}
            </span>
          </div>
        </div>
        
        {/* Animated Progress Bar */}
        <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>
        
        <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{Math.round(progressPercentage)}% Complete</span>
          <span>Step {currentStep + 1} of {steps.length}</span>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`relative flex items-start p-4 rounded-lg border transition-all duration-300 ${
              step.status === 'completed'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : step.status === 'active'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-lg scale-105'
                : step.status === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Step Number & Icon */}
            <div className="flex-shrink-0 mr-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step.status === 'completed'
                    ? 'bg-green-500 text-white'
                    : step.status === 'active'
                    ? 'bg-blue-500 text-white animate-pulse'
                    : step.status === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                {step.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : step.status === 'active' ? (
                  <div className="animate-spin">
                    <Zap className="w-5 h-5" />
                  </div>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium ${
                  step.status === 'completed'
                    ? 'text-green-900 dark:text-green-100'
                    : step.status === 'active'
                    ? 'text-blue-900 dark:text-blue-100'
                    : step.status === 'error'
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {step.title}
                </h4>
                {step.status === 'active' && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
              <p className={`text-sm mt-1 ${
                step.status === 'completed'
                  ? 'text-green-700 dark:text-green-300'
                  : step.status === 'active'
                  ? 'text-blue-700 dark:text-blue-300'
                  : step.status === 'error'
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {step.description}
              </p>
              {step.duration && step.status === 'completed' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Completed in {step.duration}ms
                </p>
              )}
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className="absolute left-9 top-12 w-0.5 h-8 bg-gray-200 dark:bg-gray-700">
                <div className={`w-full h-full transition-all duration-500 ${
                  step.status === 'completed' 
                    ? 'bg-gradient-to-b from-green-500 to-blue-500' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Processing Animation */}
      {isProcessing && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <div className="animate-spin">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">AI is working its magic...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// CSS for shimmer animation (add to globals.css)
const shimmerCSS = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;
