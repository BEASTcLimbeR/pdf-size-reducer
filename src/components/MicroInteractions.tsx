'use client';

import React, { useState, useEffect } from 'react';
import { Heart, ThumbsUp, Star, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface MicroInteractionsProps {
  type: 'like' | 'favorite' | 'rating' | 'feedback';
  onAction?: (value: any) => void;
  initialValue?: any;
  disabled?: boolean;
}

export default function MicroInteractions({ 
  type, 
  onAction, 
  initialValue = false, 
  disabled = false 
}: MicroInteractionsProps) {
  const [isActive, setIsActive] = useState(initialValue);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    setIsActive(!isActive);
    setShowAnimation(true);
    onAction?.(!isActive);
    
    // Reset animation after 600ms
    setTimeout(() => setShowAnimation(false), 600);
  };

  const getIcon = () => {
    switch (type) {
      case 'like':
        return <ThumbsUp className="w-5 h-5" />;
      case 'favorite':
        return <Heart className="w-5 h-5" />;
      case 'rating':
        return <Star className="w-5 h-5" />;
      case 'feedback':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'like':
        return isActive 
          ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20' 
          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10';
      case 'favorite':
        return isActive 
          ? 'text-red-600 bg-red-100 dark:bg-red-900/20' 
          : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10';
      case 'rating':
        return isActive 
          ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20' 
          : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/10';
      case 'feedback':
        return isActive 
          ? 'text-green-600 bg-green-100 dark:bg-green-900/20' 
          : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10';
      default:
        return isActive 
          ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/20' 
          : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative p-3 rounded-full transition-all duration-200 transform ${
        showAnimation ? 'scale-110' : 'hover:scale-105'
      } ${getColors()} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {/* Icon */}
      <div className={`transition-all duration-200 ${
        showAnimation ? 'animate-pulse' : ''
      }`}>
        {getIcon()}
      </div>

      {/* Ripple Effect */}
      {showAnimation && (
        <div className="absolute inset-0 rounded-full bg-current opacity-20 animate-ping"></div>
      )}

      {/* Success Checkmark */}
      {showAnimation && isActive && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
}

// Loading Skeleton Component
export function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  );
}

// Pulse Loading Component
export function PulseLoading({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <div className={`${sizeClasses[size]} rounded-full bg-blue-500 animate-ping absolute`}></div>
      <div className={`${sizeClasses[size]} rounded-full bg-blue-600 animate-pulse`}></div>
    </div>
  );
}

// Shimmer Loading Component
export function ShimmerLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-full bg-[length:200%_100%] animate-shimmer"></div>
    </div>
  );
}

// Bounce Loading Component
export function BounceLoading() {
  return (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  );
}

// Progress Ring Component
export function ProgressRing({ 
  progress, 
  size = 60, 
  strokeWidth = 4, 
  color = '#3b82f6' 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number; 
  color?: string; 
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-in-out"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-medium text-gray-900 dark:text-white">
        {Math.round(progress)}%
      </span>
    </div>
  );
}
