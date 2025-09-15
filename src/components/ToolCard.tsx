'use client';

import { LucideIcon } from 'lucide-react';

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: 'available' | 'coming-soon';
  onClick: () => void;
}

// Helper function to get animation class based on icon type
const getIconAnimation = (title: string) => {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('merge') || titleLower.includes('combine')) {
    return 'group-hover:scale-110 group-hover:rotate-12 group-hover:translate-x-1';
  } else if (titleLower.includes('split') || titleLower.includes('separate')) {
    return 'group-hover:scale-110 group-hover:-rotate-12 group-hover:-translate-x-1';
  } else if (titleLower.includes('compress') || titleLower.includes('reduce')) {
    return 'group-hover:scale-110 group-hover:rotate-6 group-hover:translate-y-1';
  } else if (titleLower.includes('rotate')) {
    return 'group-hover:scale-110 group-hover:rotate-180';
  } else if (titleLower.includes('edit') || titleLower.includes('add') || titleLower.includes('crop')) {
    return 'group-hover:scale-110 group-hover:rotate-6 group-hover:translate-y-0.5';
  } else if (titleLower.includes('protect') || titleLower.includes('unlock') || titleLower.includes('sign')) {
    return 'group-hover:scale-110 group-hover:rotate-3 group-hover:translate-y-1';
  } else if (titleLower.includes('convert') || titleLower.includes('to')) {
    return 'group-hover:scale-110 group-hover:rotate-6 group-hover:translate-x-0.5';
  } else if (titleLower.includes('compare') || titleLower.includes('redact')) {
    return 'group-hover:scale-110 group-hover:rotate-3 group-hover:-translate-y-0.5';
  } else {
    return 'group-hover:scale-110 group-hover:rotate-6';
  }
};

export default function ToolCard({ icon: Icon, title, description, status, onClick }: ToolCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 group touch-manipulation overflow-hidden
        ${status === 'available' ? 'hover:scale-105 active:scale-95 hover:-translate-y-1' : 'opacity-75'}
      `}
    >
      {/* Status Badge */}
      {status === 'available' && (
        <div className="absolute top-4 right-4 group-hover:animate-bounce">
          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2 py-1 rounded-full transition-all duration-300 group-hover:bg-green-200 dark:group-hover:bg-green-800">
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
        w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ease-in-out
        ${status === 'available' 
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 group-hover:scale-110 group-hover:rotate-3' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
        }
      `}>
        <Icon className={`h-6 w-6 transition-all duration-300 ease-in-out ${
          status === 'available' 
            ? getIconAnimation(title)
            : ''
        }`} />
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
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out group-hover:translate-x-1 group-hover:-translate-y-1">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-700 transition-colors duration-300">
            <svg className="w-3 h-3 text-white group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Subtle background animation */}
      {status === 'available' && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-blue-50/0 group-hover:from-blue-50/20 group-hover:via-blue-50/10 group-hover:to-blue-50/20 dark:from-blue-900/0 dark:via-blue-900/0 dark:to-blue-900/0 dark:group-hover:from-blue-900/20 dark:group-hover:via-blue-900/10 dark:group-hover:to-blue-900/20 transition-all duration-500 ease-in-out rounded-lg"></div>
      )}
    </div>
  );
}
