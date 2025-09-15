'use client';

import { LucideIcon } from 'lucide-react';

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: 'available' | 'coming-soon';
  onClick: () => void;
}

export default function ToolCard({ icon: Icon, title, description, status, onClick }: ToolCardProps) {
  // Determine animation type based on title
  const getAnimationClass = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('merge') || lowerTitle.includes('split')) return 'icon-float';
    if (lowerTitle.includes('compress') || lowerTitle.includes('repair')) return 'icon-pulse';
    if (lowerTitle.includes('rotate') || lowerTitle.includes('organize')) return 'icon-spin';
    if (lowerTitle.includes('extract') || lowerTitle.includes('remove')) return 'icon-bounce';
    if (lowerTitle.includes('watermark') || lowerTitle.includes('crop')) return 'icon-wiggle';
    if (lowerTitle.includes('unlock') || lowerTitle.includes('protect')) return 'icon-glow';
    if (lowerTitle.includes('sign') || lowerTitle.includes('redact')) return 'icon-pulse';
    if (lowerTitle.includes('compare')) return 'icon-float';
    if (lowerTitle.includes('ocr') || lowerTitle.includes('scan')) return 'icon-bounce';
    if (lowerTitle.includes('convert') || lowerTitle.includes('to')) return 'icon-spin';
    return 'icon-float'; // default animation
  };

  return (
    <div
      onClick={onClick}
      className={`
        tool-card relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 cursor-pointer transition-all duration-300 ease-smooth hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 group touch-manipulation
        ${status === 'available' ? 'hover:scale-105 active:scale-95 hover:shadow-2xl hover:shadow-blue-500/10' : 'opacity-75'}
      `}
    >
      {/* Status Badge */}
      {status === 'available' && (
        <div className="absolute top-4 right-4">
          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2 py-1 rounded-full">
            Available
          </div>
        </div>
      )}
      
      {status === 'coming-soon' && (
        <div className="absolute top-4 right-4">
          <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-medium px-2 py-1 rounded-full">
            Coming Soon
          </div>
        </div>
      )}

      {/* Icon */}
      <div className={`
        w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-500 ease-elastic relative overflow-hidden
        ${status === 'available' 
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-blue-500/25' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
        }
      `}>
        {/* Animated Background Glow */}
        {status === 'available' && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
        )}
        
        {/* Icon with Dynamic Advanced Animations */}
        <Icon className={`
          h-6 w-6 relative z-10 transition-all duration-500 ease-elastic
          ${status === 'available' 
            ? `${getAnimationClass(title)} group-hover:scale-125 group-hover:rotate-12 group-hover:drop-shadow-lg group-hover:drop-shadow-blue-500/50` 
            : ''
          }
        `} 
        style={{
          filter: status === 'available' ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))' : 'none',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }} />
        
        {/* Enhanced Floating Particles Effect */}
        {status === 'available' && (
          <>
            <div className="absolute top-1 left-1 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 particle-float transition-opacity duration-500 delay-100"></div>
            <div className="absolute top-2 right-2 w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 particle-float transition-opacity duration-500 delay-200"></div>
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 particle-float transition-opacity duration-500 delay-300"></div>
            <div className="absolute top-3 left-3 w-0.5 h-0.5 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 particle-float transition-opacity duration-500 delay-400"></div>
            <div className="absolute bottom-3 right-3 w-0.5 h-0.5 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 particle-float transition-opacity duration-500 delay-500"></div>
          </>
        )}
        
        {/* Ripple Effect */}
        {status === 'available' && (
          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500">
            <div className="w-full h-full bg-blue-400/20 rounded-lg"></div>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <h3 className={`
          text-base sm:text-lg font-semibold mb-2 transition-colors
          ${status === 'available' 
            ? 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400' 
            : 'text-gray-500 dark:text-gray-400'
          }
        `}>
          {title}
        </h3>
        <p className={`
          text-xs sm:text-sm leading-relaxed
          ${status === 'available' 
            ? 'text-gray-600 dark:text-gray-300' 
            : 'text-gray-400 dark:text-gray-500'
          }
        `}>
          {description}
        </p>
      </div>

      {/* Hover Arrow */}
      {status === 'available' && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
