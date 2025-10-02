'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, Sparkles, Trophy } from 'lucide-react';
import Lottie from 'lottie-react';
import successAnimationData from '../../public/success-animation.json';

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
  const [animationData, setAnimationData] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    delay: number;
  }>>([]);

  useEffect(() => {
    console.log('SuccessAnimation mounted, animation data:', successAnimationData);
    setShowAnimation(true);
    setAnimationData(successAnimationData);
    setAnimationStarted(true);
    
    // Ensure animation plays for at least 2 seconds
    const minAnimationTime = setTimeout(() => {
      if (!animationComplete) {
        console.log('Minimum animation time reached, showing results');
        setShowResults(true);
        if (showConfetti) {
          generateConfetti();
        }
      }
    }, 2000);
    
    return () => clearTimeout(minAnimationTime);
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

  const handleAnimationComplete = () => {
    console.log('Animation completed!');
    setAnimationComplete(true);
    
    // If minimum time has passed, show results immediately
    if (animationStarted) {
      setTimeout(() => {
        console.log('Showing results after animation completion');
        setShowResults(true);
        if (showConfetti) {
          generateConfetti();
        }
      }, 500); // Short delay after animation completes
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Confetti Animation */}
      {showConfetti && showResults && (
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

      {/* Google Pay Style: Animation First */}
      {!showResults && (
        <div className="flex items-center justify-center min-h-[500px] bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className={`w-96 h-96 mx-auto transition-all duration-1000 ease-out ${
            showAnimation ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}>
            {animationData ? (
              <Lottie
                animationData={animationData}
                loop={false}
                autoplay={true}
                onComplete={handleAnimationComplete}
                onLoad={() => console.log('Lottie animation loaded successfully')}
                onError={(error) => console.error('Lottie animation error:', error)}
                style={{ width: '100%', height: '100%' }}
                rendererSettings={{
                  preserveAspectRatio: 'xMidYMid slice'
                }}
              />
            ) : (
              <div className="w-full h-full bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-green-600 dark:border-green-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Section - Slides up after animation */}
      {showResults && (
        <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center transform transition-all duration-1000 ease-out ${
          showResults ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
        }`}>
          {/* Success Icon (Static) */}
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <div className="w-8 h-8 text-green-600 dark:text-green-400">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {message}
          </p>

          {/* Stats */}
          {stats.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 transform transition-all duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
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
            <div className="transform transition-all duration-500 delay-300">
              <button
                onClick={onAction}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                {actionIcon}
                <span className="ml-2">{actionLabel}</span>
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
