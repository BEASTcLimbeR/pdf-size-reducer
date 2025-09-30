'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Download, Share2, Star, Sparkles, Zap, Trophy, Gift } from 'lucide-react';

interface SuccessCelebrationsProps {
  type: 'upload' | 'compress' | 'merge' | 'convert' | 'repair' | 'ocr' | 'general';
  fileName?: string;
  fileSize?: number;
  originalSize?: number;
  compressionRatio?: number;
  onDownload?: () => void;
  onShare?: () => void;
  onContinue?: () => void;
  showCelebration?: boolean;
}

export default function SuccessCelebrations({
  type,
  fileName,
  fileSize,
  originalSize,
  compressionRatio,
  onDownload,
  onShare,
  onContinue,
  showCelebration = true
}: SuccessCelebrationsProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (showCelebration) {
      setShowConfetti(true);
      setTimeout(() => setShowMessage(true), 500);
      
      // Auto-hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [showCelebration]);

  const getSuccessMessage = () => {
    switch (type) {
      case 'upload':
        return {
          title: 'File Uploaded Successfully!',
          subtitle: 'Your document is ready for processing',
          icon: <FileText className="w-16 h-16 text-green-500" />
        };
      case 'compress':
        return {
          title: 'Compression Complete!',
          subtitle: `Reduced file size by ${compressionRatio}%`,
          icon: <Zap className="w-16 h-16 text-blue-500" />
        };
      case 'merge':
        return {
          title: 'PDFs Merged Successfully!',
          subtitle: 'All documents combined into one file',
          icon: <CheckCircle className="w-16 h-16 text-purple-500" />
        };
      case 'convert':
        return {
          title: 'Conversion Complete!',
          subtitle: 'Your document has been converted successfully',
          icon: <Sparkles className="w-16 h-16 text-pink-500" />
        };
      case 'repair':
        return {
          title: 'Document Repaired!',
          subtitle: 'Your PDF has been fixed and is now readable',
          icon: <Trophy className="w-16 h-16 text-orange-500" />
        };
      case 'ocr':
        return {
          title: 'OCR Processing Complete!',
          subtitle: 'Text has been extracted and made searchable',
          icon: <Star className="w-16 h-16 text-yellow-500" />
        };
      default:
        return {
          title: 'Operation Successful!',
          subtitle: 'Your request has been completed',
          icon: <CheckCircle className="w-16 h-16 text-green-500" />
        };
    }
  };

  const successData = getSuccessMessage();

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Success Card */}
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 text-center transform transition-all duration-500 ${
        showMessage ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Success Icon with Animation */}
        <div className="relative mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 animate-bounce">
            {successData.icon}
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-blue-400 opacity-20 animate-ping"></div>
        </div>

        {/* Success Message */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {successData.title}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          {successData.subtitle}
        </p>

        {/* File Details */}
        {fileName && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">File:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                {fileName}
              </span>
            </div>
            {fileSize && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-400">Size:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {(fileSize / 1024).toFixed(1)} KB
                </span>
              </div>
            )}
            {compressionRatio && originalSize && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-400">Compression:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {compressionRatio}% smaller
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {onDownload && (
            <button
              onClick={onDownload}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download File</span>
            </button>
          )}
          
          {onShare && (
            <button
              onClick={onShare}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-3 rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          )}
          
          {onContinue && (
            <button
              onClick={onContinue}
              className="bg-gray-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Gift className="w-5 h-5" />
              <span>Process Another</span>
            </button>
          )}
        </div>

        {/* Success Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {type === 'compress' ? '90%' : '100%'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {type === 'compress' ? 'Size Reduced' : 'Success Rate'}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {type === 'compress' ? '2.3s' : '1.2s'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Processing Time
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// CSS for confetti animation (add to globals.css)
const confettiCSS = `
@keyframes confetti {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.animate-confetti {
  animation: confetti linear infinite;
}
`;
