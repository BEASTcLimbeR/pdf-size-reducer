'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Eye, Trash2, RotateCcw, Download, Info, Zap } from 'lucide-react';

interface PDFFileWithPreview extends File {
  id: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  progress?: number;
  pageCount?: number;
  fileSize?: string;
  lastModifiedFormatted?: string;
}

interface EnhancedPDFUploaderProps {
  onFileUpload: (file: File) => void;
  onFilesUpload?: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
  multiple?: boolean;
  showPreview?: boolean;
  showFileInfo?: boolean;
}

export default function EnhancedPDFUploader({
  onFileUpload,
  onFilesUpload,
  maxFiles = 5,
  maxSize = 50,
  className = '',
  multiple = false,
  showPreview = true,
  showFileInfo = true
}: EnhancedPDFUploaderProps) {
  const [files, setFiles] = useState<PDFFileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // PDF validation
  const validatePDF = (file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Please upload a PDF file only';
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return 'File must have .pdf extension';
    }

    return null;
  };

  // Generate PDF preview (first page)
  const generatePDFPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // This would typically use PDF.js to render the first page
          // For now, we'll create a placeholder
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 200;
          canvas.height = 280;
          
          if (ctx) {
            // Draw PDF placeholder
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, 200, 280);
            
            ctx.fillStyle = '#6b7280';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PDF Preview', 100, 140);
            ctx.fillText(file.name, 100, 160);
          }
          
          resolve(canvas.toDataURL());
        } catch (error) {
          console.error('Error generating PDF preview:', error);
          resolve('');
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Add files to state
  const addFiles = useCallback(async (newFiles: File[]) => {
    const validFiles: PDFFileWithPreview[] = [];
    
    for (const file of newFiles) {
      // Validate that we have a proper File object
      if (!file || typeof file !== 'object' || !file.name || typeof file.size !== 'number') {
        console.error('Invalid file object received:', file);
        continue;
      }
      
      const error = validatePDF(file);
      const fileWithPreview: PDFFileWithPreview = Object.assign(file, {
        id: Math.random().toString(36).substr(2, 9),
        status: error ? 'error' : 'pending',
        error: error || undefined,
        progress: 0,
        fileSize: formatFileSize(file.size),
        lastModifiedFormatted: new Date(file.lastModified).toLocaleDateString()
      });

      // Generate preview
      if (!error && showPreview) {
        try {
          fileWithPreview.preview = await generatePDFPreview(file);
        } catch (err) {
          console.error('Error generating preview:', err);
        }
      }

      validFiles.push(fileWithPreview);
    }

    setFiles(prev => {
      const updated = [...prev, ...validFiles];
      return updated.slice(0, maxFiles);
    });
  }, [maxFiles, maxSize, showPreview]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
  };

  // Handle drag events with counter to prevent flickering
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length > 0) {
      addFiles(pdfFiles);
    }
  }, [addFiles]);

  // Remove file
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Clear all files
  const clearAllFiles = () => {
    setFiles([]);
    setUploadProgress(0);
  };

  // Upload files
  const uploadFiles = async () => {
    const validFiles = files.filter(file => file.status === 'pending' && !file.error);
    
    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        // Update file status to uploading
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
        ));

        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, progress } : f
          ));
        }

        // Mark as success
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'success' as const, progress: 100 } : f
        ));

        setUploadProgress(((i + 1) / validFiles.length) * 100);

        // Call the appropriate callback
        if (multiple && onFilesUpload) {
          onFilesUpload([file]);
        } else if (onFileUpload) {
          // Ensure we're passing a proper File object
          if (file && typeof file.arrayBuffer === 'function') {
            onFileUpload(file);
          } else {
            console.error('Invalid file object being passed to onFileUpload:', file);
          }
        }
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' ? { ...f, status: 'error' as const, error: 'Upload failed' } : f
      ));
    } finally {
      setIsUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status icon
  const getStatusIcon = (file: PDFFileWithPreview) => {
    switch (file.status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'uploading': return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  // Reset drag counter when component unmounts
  useEffect(() => {
    return () => {
      setDragCounter(0);
    };
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {/* Enhanced Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
          ${files.length > 0 ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Upload Content */}
        <div className="space-y-6">
          {/* Animated Upload Icon */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center transform transition-transform duration-300 hover:scale-110">
            <Upload className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          
          {/* Upload Text */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isDragOver ? 'Drop your PDFs here!' : 'Upload PDF Files'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {isDragOver 
                ? 'Release to upload your files' 
                : 'Drag and drop your PDF files here, or click to browse'
              }
            </p>
            
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Choose PDF Files
            </button>
          </div>

          {/* File Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>PDF files only</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Max {maxSize}MB per file</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Info className="h-4 w-4" />
              <span>Up to {maxFiles} files</span>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-8">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 font-medium">
              Uploading PDFs... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500/10 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <p className="text-blue-600 font-semibold text-lg">Drop your PDFs here!</p>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              Selected PDFs ({files.length})
            </h4>
            <div className="flex space-x-3">
              <button
                onClick={clearAllFiles}
                className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All</span>
              </button>
              <button
                onClick={uploadFiles}
                disabled={isUploading || files.every(f => f.status !== 'pending')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isUploading ? 'Uploading...' : 'Process PDFs'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-200"
              >
                {/* File Preview */}
                {showPreview && file.preview && (
                  <div className="mb-3">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                  </div>
                )}

                {/* File Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h5 className="font-medium text-gray-900 dark:text-white text-sm truncate flex-1 mr-2">
                      {file.name}
                    </h5>
                    {getStatusIcon(file)}
                  </div>

                  {showFileInfo && (
                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <p>Size: {file.fileSize}</p>
                      <p>Modified: {file.lastModifiedFormatted}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {file.error && (
                    <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {file.error}
                    </p>
                  )}

                  {/* Progress Bar */}
                  {file.status === 'uploading' && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress || 0}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {files.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex space-x-6">
              <span className="text-green-600 font-medium">
                ✓ {files.filter(f => f.status === 'success').length} ready
              </span>
              <span className="text-blue-600 font-medium">
                ⏳ {files.filter(f => f.status === 'uploading').length} processing
              </span>
              <span className="text-red-600 font-medium">
                ✗ {files.filter(f => f.status === 'error').length} failed
              </span>
            </div>
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              Total: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
