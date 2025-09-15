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
  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 group
        ${status === 'available' ? 'hover:scale-105' : 'opacity-75'}
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
        w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors
        ${status === 'available' 
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
        }
      `}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Content */}
      <div>
        <h3 className={`
          text-lg font-semibold mb-2 transition-colors
          ${status === 'available' 
            ? 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400' 
            : 'text-gray-500 dark:text-gray-400'
          }
        `}>
          {title}
        </h3>
        <p className={`
          text-sm leading-relaxed
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
