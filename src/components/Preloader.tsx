'use client';

import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import preloaderAnimation from '../../public/docs-changing-preloader.json';

interface PreloaderProps {
  onComplete?: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Calculate animation duration: 123 frames / 29.97 fps ≈ 4.1 seconds
    const animationDuration = 4100; // 4.1 seconds in milliseconds

    // Hide preloader after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, animationDuration);

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  const handleAnimationComplete = () => {
    // This will be called when the animation completes one cycle
    // Since we have loop=true, this won't be called, but we keep it for safety
    if (!isVisible) return;
    
    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 100); // Small delay to ensure smooth transition
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" style={{ zoom: '1.5' }}>
      <div className="w-80 h-80 md:w-96 md:h-96">
        <Lottie
          animationData={preloaderAnimation}
          loop={false}
          autoplay={true}
          onComplete={handleAnimationComplete}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
