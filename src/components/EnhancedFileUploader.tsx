'use client';

import { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Loader2, FileText, Image, FileSpreadsheet, Presentation, Archive } from 'lucide-react';
import UniversalFileDropZone from './UniversalFileDropZone';
import EnhancedProgressBar from './EnhancedProgressBar';
import { useUserActivityTracker } from '@/hooks/useUserActivityTracker';

export interface FileType {
  id: string;
  name: string;
  extensions: string[];
  mimeTypes: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  maxSize: number;
}

const SUPPORTED_FILE_TYPES: FileType[] = [
  {
    id: 'pdf',
    name: 'PDF',
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    icon: FileText,
    color: 'text-red-500',
    maxSize: 50 * 1024 * 1024 // 50MB
  },
  {
    id: 'image',
    name: 'Image',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'],
    icon: Image,
    color: 'text-green-500',
    maxSize: 20 * 1024 * 1024 // 20MB
  },
  {
    id: 'spreadsheet',
    name: 'Spreadsheet',
    extensions: ['.xlsx', '.xls', '.csv'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'],
    icon: FileSpreadsheet,
    color: 'text-green-600',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  {
    id: 'presentation',
    name: 'Presentation',
    extensions: ['.pptx', '.ppt'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint'],
    icon: Presentation,
    color: 'text-orange-500',
    maxSize: 25 * 1024 * 1024 // 25MB
  },
  {
    id: 'archive',
    name: 'Archive',
    extensions: ['.zip', '.rar', '.7z'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    icon: Archive,
    color: 'text-purple-500',
    maxSize: 100 * 1024 * 1024 // 100MB
  }
];

export interface EnhancedFileUploaderProps {
  acceptedFileTypes?: string[];
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
  processingSteps?: Array<{
    id: string;
    label: string;
    estimatedTime: number;
  }>;
  isProcessing?: boolean;
  onProcessingComplete?: () => void;
}

export default function EnhancedFileUploader({
  acceptedFileTypes = ['pdf'],
  maxFiles = 1,
  onFilesAccepted,
  onError,
  disabled = false,
  className = '',
  title = 'Upload your files',
  description = 'Drag and drop your files here, or click to browse',
  showPreview = true,
  showFileTypes = true,
  variant = 'default',
  processingSteps = [],
  isProcessing = false,
  onProcessingComplete
}: EnhancedFileUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState<'pending' | 'active' | 'completed' | 'error'>('pending');
  const { trackFileOperation, trackError } = useUserActivityTracker();

  // Get accepted file types configuration
  const fileTypes = SUPPORTED_FILE_TYPES.filter(type => 
    acceptedFileTypes.includes(type.id)
  );

  // Create accept object for dropzone
  const accept = fileTypes.reduce((acc, type) => {
    type.mimeTypes.forEach(mimeType => {
      if (!acc[mimeType]) {
        acc[mimeType] = [];
      }
      acc[mimeType].push(...type.extensions);
    });
    return acc;
  }, {} as Record<string, string[]>);

  // Get maximum file size
  const maxSize = Math.max(...fileTypes.map(type => type.maxSize));

  // Handle file processing with progress tracking
  const processFiles = useCallback(async (files: File[]) => {
    if (processingSteps.length === 0) {
      onFilesAccepted(files);
      return;
    }

    setError(null);
    setCurrentStep(0);
    setStepStatus('active');

    try {
      for (let i = 0; i < processingSteps.length; i++) {
        setCurrentStep(i);
        setStepStatus('active');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, processingSteps[i].estimatedTime * 1000));
        
        setStepStatus('completed');
        
        // Small delay between steps
        if (i < processingSteps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      onFilesAccepted(files);
      onProcessingComplete?.();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      setStepStatus('error');
      trackError('enhanced-file-uploader', 'processing_failed', errorMessage);
    }
  }, [processingSteps, onFilesAccepted, onProcessingComplete, trackError]);

  // Handle files from drop zone
  const handleFilesAccepted = useCallback((files: File[]) => {
    trackFileOperation('enhanced-file-uploader', 'files_accepted', {
      fileName: files.map(f => f.name).join(', '),
      fileSize: files.reduce((sum, file) => sum + file.size, 0),
      fileType: files[0]?.type || 'unknown',
      success: true,
      processingTime: 0
    });

    if (processingSteps.length > 0) {
      processFiles(files);
    } else {
      onFilesAccepted(files);
    }
  }, [processFiles, onFilesAccepted, trackFileOperation]);

  // Handle errors from drop zone
  const handleError = useCallback((error: string) => {
    setError(error);
    trackError('enhanced-file-uploader', 'drop_zone_error', error);
    onError?.(error);
  }, [onError, trackError]);

  // Get current processing step
  const currentProcessingStep = processingSteps[currentStep];
  const progressSteps = processingSteps.map((step, index) => ({
    id: step.id,
    label: step.label,
    status: index < currentStep ? 'completed' as const :
            index === currentStep ? stepStatus :
            'pending' as const,
    estimatedTime: step.estimatedTime
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Bar */}
      {isProcessing && processingSteps.length > 0 && (
        <EnhancedProgressBar
          steps={progressSteps}
          currentStepIndex={currentStep}
          isProcessing={isProcessing}
          showTimeEstimate={true}
          showCancelButton={false}
          variant="detailed"
          className="mb-6"
        />
      )}

      {/* File Drop Zone */}
      <UniversalFileDropZone
        accept={accept}
        maxSize={maxSize}
        maxFiles={maxFiles}
        onFilesAccepted={handleFilesAccepted}
        onError={handleError}
        disabled={disabled || isProcessing}
        title={title}
        description={description}
        showPreview={showPreview}
        showFileTypes={showFileTypes}
        variant={variant}
      />

      {/* Error Display */}
      {error && (
        <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
        </div>
      )}

      {/* File Type Information */}
      {showFileTypes && fileTypes.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Supported file types:
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {fileTypes.map(type => {
              const IconComponent = type.icon;
              return (
                <div key={type.id} className="flex items-center space-x-2 text-sm">
                  <IconComponent className={`h-4 w-4 ${type.color}`} />
                  <span className="text-gray-600 dark:text-gray-400">
                    {type.name} (max {Math.round(type.maxSize / (1024 * 1024))}MB)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}