'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Download, FileText, Sparkles, Trophy } from 'lucide-react';

export interface SuccessAnimationProps {
  title: string;
  message: string;
  stats?: {
    label: string;
    value: string;
    icon?: React.ReactNode;
  }[];
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  showConfetti?: boolean;
  className?: string;
}

export default function SuccessAnimation({
  title,
  message,
  stats = [],
  onAction,
  actionLabel = 'Download',
  actionIcon = <Download className="h-5 w-5" />,
  showConfetti = true,
  className = ''
}: SuccessAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    delay: number;
  }>>([]);

  useEffect(() => {
    setShowAnimation(true);
    
    if (showConfetti) {
      generateConfetti();
    }
  }, []);

  const generateConfetti = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2
    }));
    setConfettiParticles(particles);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {confettiParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                backgroundColor: particle.color,
                animationDelay: `${particle.delay}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        {/* Success Icon with Animation */}
        <div className="relative mb-6">
          <div className={`w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center transition-all duration-1000 ${
            showAnimation ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}>
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          
          {/* Ripple Effect */}
          <div className={`absolute inset-0 rounded-full border-4 border-green-300 dark:border-green-600 transition-all duration-1000 ${
            showAnimation ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
          }`} />
        </div>

        {/* Title with Typewriter Effect */}
        <h2 className={`text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-all duration-1000 delay-300 ${
          showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {title}
        </h2>

        {/* Message */}
        <p className={`text-gray-600 dark:text-gray-300 mb-6 transition-all duration-1000 delay-500 ${
          showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {message}
        </p>

        {/* Stats */}
        {stats.length > 0 && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 transition-all duration-1000 delay-700 ${
            showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {stat.icon || <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stat.label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        {onAction && (
          <div className={`transition-all duration-1000 delay-1000 ${
            showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <button
              onClick={onAction}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {actionIcon}
              <span className="ml-2">{actionLabel}</span>
              <Sparkles className="h-5 w-5 ml-2 animate-pulse" />
            </button>
          </div>
        )}

        {/* Celebration Elements */}
        <div className={`absolute top-4 right-4 transition-all duration-1000 delay-1200 ${
          showAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        }`}>
          <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />
        </div>

        <div className={`absolute top-4 left-4 transition-all duration-1000 delay-1400 ${
          showAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        }`}>
          <Sparkles className="h-8 w-8 text-purple-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
