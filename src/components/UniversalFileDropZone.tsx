'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Image, FileSpreadsheet, Presentation, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useUserActivityTracker } from '@/hooks/useUserActivityTracker';

export interface FileTypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  extensions: string[];
}

const FILE_TYPE_CONFIGS: Record<string, FileTypeConfig> = {
  pdf: {
    icon: FileText,
    color: 'text-red-500',
    label: 'PDF',
    extensions: ['.pdf']
  },
  image: {
    icon: Image,
    color: 'text-green-500',
    label: 'Image',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
  },
  spreadsheet: {
    icon: FileSpreadsheet,
    color: 'text-green-600',
    label: 'Spreadsheet',
    extensions: ['.xlsx', '.xls', '.csv']
  },
  presentation: {
    icon: Presentation,
    color: 'text-orange-500',
    label: 'Presentation',
    extensions: ['.pptx', '.ppt']
  }
};

export interface UniversalFileDropZoneProps {
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  onFilesAccepted: (files: File[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  description?: string;
  showPreview?: boolean;
  showFileTypes?: boolean;
  variant?: 'default' | 'minimal' | 'card';
}

export default function UniversalFileDropZone({
  accept = { 'application/pdf': ['.pdf'] },
  maxSize = 50 * 1024 * 1024,
  maxFiles = 1,
  onFilesAccepted,
  onError,
  disabled = false,
  className = '',
  title = 'Drop files here',
  description = 'or click to browse',
  showPreview = true,
  showFileTypes = true,
  variant = 'default'
}: UniversalFileDropZoneProps) {
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const { trackAction } = useUserActivityTracker();

  const handleDrop = useCallback((files: File[]) => {
    setPreviewFiles(files);
    onFilesAccepted(files);
    trackAction('file-drop-zone', 'files_accepted', {
      fileCount: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0)
    });
  }, [onFilesAccepted, trackAction]);

  const handleError = useCallback((error: string) => {
    onError?.(error);
    trackAction('file-drop-zone', 'error', { error });
  }, [onError, trackAction]);

  const {
    getRootProps,
    isDragActive,
    isDragReject,
    files,
    errors,
    reset
  } = useDragAndDrop({
    accept,
    maxSize,
    maxFiles,
    onDrop: handleDrop,
    onError: handleError,
    disabled,
    className: 'transition-all duration-200 ease-in-out',
    activeClassName: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105',
    rejectClassName: 'border-red-500 bg-red-50 dark:bg-red-900/20'
  });

  const getFileIcon = (file: File) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    for (const [type, config] of Object.entries(FILE_TYPE_CONFIGS)) {
      if (config.extensions.includes(extension)) {
        const IconComponent = config.icon;
        return <IconComponent className={`h-8 w-8 ${config.color}`} />;
      }
    }
    
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAcceptedTypes = () => {
    return Object.values(accept).flat().join(', ');
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return 'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center';
      case 'card':
        return 'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900';
      default:
        return 'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 text-center bg-gray-50 dark:bg-gray-700';
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={`${getVariantClasses()} ${className}`}>
        <div {...getRootProps()}>
          <input type="file" multiple={maxFiles > 1} accept={getAcceptedTypes()} className="hidden" />
          <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isDragActive ? 'Drop files here' : title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main drop zone */}
      <div
        {...getRootProps()}
        className={`${getVariantClasses()} cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <input type="file" multiple={maxFiles > 1} accept={getAcceptedTypes()} className="hidden" />
        
        {/* Upload icon */}
        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          {isDragReject ? (
            <AlertCircle className="w-8 h-8 text-red-500" />
          ) : isDragActive ? (
            <Upload className="w-8 h-8 text-blue-500 animate-bounce" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Title and description */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isDragActive ? 'Drop files here' : isDragReject ? 'Invalid file type' : title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {isDragReject ? 'Please drop valid files' : description}
          </p>
        </div>

        {/* File type indicators */}
        {showFileTypes && (
          <div className="flex items-center justify-center space-x-4 mb-4">
            {Object.entries(FILE_TYPE_CONFIGS).map(([type, config]) => {
              const IconComponent = config.icon;
              return (
                <div key={type} className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                  <IconComponent className={`h-4 w-4 ${config.color}`} />
                  <span>{config.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* File size and count limits */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Max file size: {formatFileSize(maxSize)}</p>
          {maxFiles > 1 && <p>Max files: {maxFiles}</p>}
        </div>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">File Upload Errors</h4>
              <ul className="mt-1 text-sm text-red-700 dark:text-red-300">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* File preview */}
      {showPreview && (files.length > 0 || previewFiles.length > 0) && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Selected Files ({files.length || previewFiles.length})
            </h4>
            <button
              onClick={reset}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {(files.length > 0 ? files : previewFiles).map((file, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
