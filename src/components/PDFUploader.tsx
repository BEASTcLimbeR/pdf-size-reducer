'use client';

import { useCallback, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { validatePDFFile } from '@/utils/pdfCompression';
import { useUserActivityTracker } from '@/hooks/useUserActivityTracker';
import UniversalFileDropZone from './UniversalFileDropZone';
import EnhancedProgressBar from './EnhancedProgressBar';

interface PDFUploaderProps {
  onFileUpload: (file: File) => void;
}

export default function PDFUploader({ onFileUpload }: PDFUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingSteps, setProcessingSteps] = useState([
    { id: 'validate', label: 'Validating PDF file', status: 'pending' as const, estimatedTime: 2 },
    { id: 'process', label: 'Processing file', status: 'pending' as const, estimatedTime: 3 },
    { id: 'complete', label: 'Upload complete', status: 'pending' as const, estimatedTime: 1 }
  ]);
  const { trackFileOperation, trackError } = useUserActivityTracker();

  // Function to validate file type and size using utility
  const validateFile = (file: File): string | null => {
    const validation = validatePDFFile(file);
    return validation.isValid ? null : validation.error || 'Invalid file';
  };

  // Handle file processing with enhanced progress tracking
  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);
    const startTime = Date.now();
    
    try {
      // Step 1: Validate file
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'validate' ? { ...step, status: 'active', startTime: Date.now() } : step
      ));
      
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setProcessingSteps(prev => prev.map(step => 
          step.id === 'validate' ? { ...step, status: 'error', error: validationError } : step
        ));
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'validate' ? { ...step, status: 'completed', endTime: Date.now() } : step
      ));
      
      // Step 2: Process file
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'process' ? { ...step, status: 'active', startTime: Date.now() } : step
      ));
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'process' ? { ...step, status: 'completed', endTime: Date.now() } : step
      ));
      
      // Step 3: Complete
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'complete' ? { ...step, status: 'active', startTime: Date.now() } : step
      ));
      
      const processingTime = Date.now() - startTime;
      
      // Track successful file operation
      trackFileOperation('pdf-uploader', 'file_uploaded', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        success: true,
        processingTime
      });
      
      onFileUpload(file);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'complete' ? { ...step, status: 'completed', endTime: Date.now() } : step
      ));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      setProcessingSteps(prev => prev.map(step => 
        step.status === 'active' ? { ...step, status: 'error', error: errorMessage } : step
      ));
      
      trackError('pdf-uploader', 'processing_failed', errorMessage, {
        fileName: file.name,
        fileSize: file.size,
        processingTime: Date.now() - startTime
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onFileUpload, trackFileOperation, trackError]);

  // Handle files from drop zone
  const handleFilesAccepted = useCallback((files: File[]) => {
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // Handle errors from drop zone
  const handleError = useCallback((error: string) => {
    setError(error);
    trackError('pdf-uploader', 'drop_zone_error', error);
  }, [trackError]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      {isProcessing && (
        <EnhancedProgressBar
          steps={processingSteps}
          currentStepIndex={processingSteps.findIndex(step => step.status === 'active')}
          isProcessing={isProcessing}
          showTimeEstimate={true}
          showCancelButton={false}
          variant="detailed"
          className="mb-6"
        />
      )}

      {/* File Drop Zone */}
      <UniversalFileDropZone
        accept={{ 'application/pdf': ['.pdf'] }}
        maxSize={50 * 1024 * 1024} // 50MB
        maxFiles={1}
        onFilesAccepted={handleFilesAccepted}
        onError={handleError}
        disabled={isProcessing}
        title="Upload your PDF file"
        description="Drag and drop your PDF file here, or click to browse"
        showPreview={true}
        showFileTypes={true}
        variant="card"
      />

      {/* Error Display */}
      {error && (
        <div className="mt-4 flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mt-8 text-center">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          How it works:
        </h4>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold mr-2">
              1
            </div>
            Upload your PDF
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold mr-2">
              2
            </div>
            We compress it
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold mr-2">
              3
            </div>
            Download result
          </div>
        </div>
      </div>
    </div>
  );
}