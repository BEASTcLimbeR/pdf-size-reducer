'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 dark:text-blue-400`} />
        <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800 animate-pulse"></div>
      </div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
        {message}
      </p>
    </div>
  );
}

// Specialized loading components for different tool types
export function PDFToolLoading() {
  return (
    <LoadingSpinner 
      message="Loading PDF tool..." 
      size="lg"
      className="min-h-[400px]"
    />
  );
}

export function AIToolLoading() {
  return (
    <LoadingSpinner 
      message="Initializing AI capabilities..." 
      size="lg"
      className="min-h-[400px]"
    />
  );
}

export function ConversionToolLoading() {
  return (
    <LoadingSpinner 
      message="Preparing conversion tool..." 
      size="lg"
      className="min-h-[400px]"
    />
  );
}

export function SecurityToolLoading() {
  return (
    <LoadingSpinner 
      message="Loading security features..." 
      size="lg"
      className="min-h-[400px]"
    />
  );
}
