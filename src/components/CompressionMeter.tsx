'use client';

import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface CompressionMeterProps {
  reductionPercentage: number;
  originalSize: number;
  compressedSize: number;
}

export default function CompressionMeter({ 
  reductionPercentage, 
  originalSize, 
  compressedSize 
}: CompressionMeterProps) {
  // Determine compression level and color
  const getCompressionLevel = (percentage: number) => {
    if (percentage >= 50) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle };
    if (percentage >= 25) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: CheckCircle };
    if (percentage >= 10) return { level: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle };
    return { level: 'Minimal', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Info };
  };

  const compressionInfo = getCompressionLevel(reductionPercentage);
  const IconComponent = compressionInfo.icon;

  // Calculate savings in different units
  const savingsBytes = originalSize - compressedSize;
  const savingsKB = Math.round(savingsBytes / 1024);
  const savingsMB = Math.round(savingsBytes / (1024 * 1024) * 100) / 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="text-center mb-6">
        <div className={`inline-flex items-center px-4 py-2 rounded-full ${compressionInfo.bgColor} dark:bg-gray-700 mb-4`}>
          <IconComponent className={`h-5 w-5 mr-2 ${compressionInfo.color}`} />
          <span className={`font-semibold ${compressionInfo.color} dark:text-white`}>
            {compressionInfo.level} Compression
          </span>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {reductionPercentage.toFixed(1)}% Size Reduction
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400">
          {savingsBytes > 1024 * 1024 
            ? `Saved ${savingsMB} MB` 
            : `Saved ${savingsKB} KB`
          } of space
        </p>
      </div>

      {/* Visual Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Compression Level</span>
          <span>{reductionPercentage.toFixed(1)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${
              reductionPercentage >= 50 ? 'bg-gradient-to-r from-green-400 to-green-600' :
              reductionPercentage >= 25 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
              reductionPercentage >= 10 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
              'bg-gradient-to-r from-orange-400 to-orange-600'
            }`}
            style={{ width: `${Math.min(reductionPercentage, 100)}%` }}
          />
        </div>
        
        {/* Compression Level Markers */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-2">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Size Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {originalSize > 1024 * 1024 
              ? `${(originalSize / (1024 * 1024)).toFixed(2)} MB`
              : `${(originalSize / 1024).toFixed(2)} KB`
            }
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Original Size</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {compressedSize > 1024 * 1024 
              ? `${(compressedSize / (1024 * 1024)).toFixed(2)} MB`
              : `${(compressedSize / 1024).toFixed(2)} KB`
            }
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Compressed Size</div>
        </div>
      </div>

      {/* Compression Tips */}
      {reductionPercentage < 10 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start">
            <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Low compression achieved</p>
              <p>Try using "Low Quality" setting for better compression, or the PDF may already be optimized.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
