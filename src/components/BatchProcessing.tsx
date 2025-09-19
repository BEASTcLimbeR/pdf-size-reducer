'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Download, 
  RotateCcw, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  Presentation, 
  Zap, 
  Droplets,
  Merge,
  Archive,
  X,
  Settings
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { 
  batchCompressPDFs, 
  batchConvertToJPG, 
  batchWatermarkPDFs, 
  formatFileSize,
  CompressionOptions,
  WatermarkOptions
} from '@/utils/batchOperations';

interface BatchProcessingProps {
  onReset?: () => void;
}

interface BatchFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: Uint8Array;
  error?: string;
}

interface BatchOperation {
  id: string;
  name: string;
  icon: any;
  description: string;
  color: string;
}

export default function BatchProcessing({ onReset }: BatchProcessingProps) {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
    quality: 'medium',
    removeMetadata: true,
    removeAnnotations: false
  });
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>({
    text: 'CONFIDENTIAL',
    opacity: 0.5,
    position: 'center'
  });

  const operations: BatchOperation[] = [
    {
      id: 'compress',
      name: 'Batch Compress',
      icon: Zap,
      description: 'Reduce file size of multiple PDFs',
      color: 'blue'
    },
    {
      id: 'convert-jpg',
      name: 'Batch Convert to JPG',
      icon: Image,
      description: 'Convert all PDFs to JPG images',
      color: 'green'
    },
    {
      id: 'convert-word',
      name: 'Batch Convert to Word',
      icon: FileText,
      description: 'Convert all PDFs to Word documents',
      color: 'purple'
    },
    {
      id: 'watermark',
      name: 'Batch Watermark',
      icon: Droplets,
      description: 'Add watermarks to all PDFs',
      color: 'orange'
    },
    {
      id: 'merge-sets',
      name: 'Batch Merge Sets',
      icon: Merge,
      description: 'Merge multiple PDF sets at once',
      color: 'red'
    }
  ];


  // Handle file drop/selection
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: BatchFile[] = acceptedFiles
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        status: 'pending',
        progress: 0
      }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  // Remove file from batch
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Clear all files
  const clearAllFiles = () => {
    setFiles([]);
    setSelectedOperation(null);
    setOverallProgress(0);
  };

  // Update file status
  const updateFileStatus = (fileId: string, status: BatchFile['status'], progress: number = 0, result?: Uint8Array, error?: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, status, progress, result, error }
        : file
    ));
  };

  // Batch compress PDFs
  const batchCompress = async () => {
    setIsProcessing(true);
    setOverallProgress(0);
    
    const totalFiles = files.length;
    let completedFiles = 0;

    await batchCompressPDFs(
      files,
      compressionOptions,
      (fileId, progress) => {
        updateFileStatus(fileId, 'processing', progress);
      },
      (fileId, result) => {
        updateFileStatus(fileId, 'completed', 100, result);
        completedFiles++;
        setOverallProgress((completedFiles / totalFiles) * 100);
      },
      (fileId, error) => {
        updateFileStatus(fileId, 'error', 0, undefined, error);
        completedFiles++;
        setOverallProgress((completedFiles / totalFiles) * 100);
      }
    );

    setIsProcessing(false);
  };

  // Batch convert to JPG
  const handleBatchConvertToJPG = async () => {
    setIsProcessing(true);
    setOverallProgress(0);
    
    const totalFiles = files.length;
    let completedFiles = 0;

    await batchConvertToJPG(
      files,
      (fileId, progress) => {
        updateFileStatus(fileId, 'processing', progress);
      },
      (fileId, result) => {
        updateFileStatus(fileId, 'completed', 100, result);
        completedFiles++;
        setOverallProgress((completedFiles / totalFiles) * 100);
      },
      (fileId, error) => {
        updateFileStatus(fileId, 'error', 0, undefined, error);
        completedFiles++;
        setOverallProgress((completedFiles / totalFiles) * 100);
      }
    );

    setIsProcessing(false);
  };

  // Batch watermark
  const batchWatermark = async () => {
    setIsProcessing(true);
    setOverallProgress(0);
    
    const totalFiles = files.length;
    let completedFiles = 0;

    await batchWatermarkPDFs(
      files,
      watermarkOptions,
      (fileId, progress) => {
        updateFileStatus(fileId, 'processing', progress);
      },
      (fileId, result) => {
        updateFileStatus(fileId, 'completed', 100, result);
        completedFiles++;
        setOverallProgress((completedFiles / totalFiles) * 100);
      },
      (fileId, error) => {
        updateFileStatus(fileId, 'error', 0, undefined, error);
        completedFiles++;
        setOverallProgress((completedFiles / totalFiles) * 100);
      }
    );

    setIsProcessing(false);
  };

  // Execute selected batch operation
  const executeBatchOperation = async () => {
    if (!selectedOperation) return;

    switch (selectedOperation) {
      case 'compress':
        await batchCompress();
        break;
      case 'convert-jpg':
        await handleBatchConvertToJPG();
        break;
      case 'watermark':
        await batchWatermark();
        break;
      default:
        console.log('Operation not implemented yet');
    }
  };

  // Download all results
  const downloadAllResults = () => {
    const completedFiles = files.filter(file => file.status === 'completed' && file.result);
    
    if (completedFiles.length === 0) return;

    // Create a ZIP file with all results
    // In a real implementation, you'd use a library like JSZip
    completedFiles.forEach((file, index) => {
      const blob = new Blob([new Uint8Array(file.result!)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_processed.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  // Get status icon
  const getStatusIcon = (status: BatchFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-5 w-5 text-gray-400" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const completedFiles = files.filter(file => file.status === 'completed').length;
  const errorFiles = files.filter(file => file.status === 'error').length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Batch Process PDFs
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Process multiple PDF files at once. Upload your files, choose an operation, and let us handle the rest!
        </p>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            Process Multiple Files
          </span>
          <span className="flex items-center">
            <Zap className="h-4 w-4 mr-1 text-blue-500" />
            Save Time & Effort
          </span>
          <span className="flex items-center">
            <Archive className="h-4 w-4 mr-1 text-purple-500" />
            Download All Results
          </span>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="mb-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isDragActive ? 'Drop PDFs here' : 'Drag & drop PDFs here, or click to select'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select multiple PDF files to process at once
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Files ({files.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </button>
              <button
                onClick={clearAllFiles}
                className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(file.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {file.status === 'processing' && (
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <span className="text-xs text-red-500">{file.error}</span>
                  )}
                  
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Processing Settings
          </h4>
          
          {selectedOperation === 'compress' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Compression Quality
                </label>
                <select
                  value={compressionOptions.quality}
                  onChange={(e) => setCompressionOptions(prev => ({ ...prev, quality: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Low (Maximum compression)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Best quality)</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={compressionOptions.removeMetadata}
                    onChange={(e) => setCompressionOptions(prev => ({ ...prev, removeMetadata: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Remove metadata</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={compressionOptions.removeAnnotations}
                    onChange={(e) => setCompressionOptions(prev => ({ ...prev, removeAnnotations: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Remove annotations</span>
                </label>
              </div>
            </div>
          )}

          {selectedOperation === 'watermark' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={watermarkOptions.text}
                  onChange={(e) => setWatermarkOptions(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Opacity: {watermarkOptions.opacity}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={watermarkOptions.opacity}
                  onChange={(e) => setWatermarkOptions(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position
                </label>
                <select
                  value={watermarkOptions.position}
                  onChange={(e) => setWatermarkOptions(prev => ({ ...prev, position: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="center">Center</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Operation Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Choose Operation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operations.map((operation) => (
            <button
              key={operation.id}
              onClick={() => setSelectedOperation(operation.id)}
              disabled={files.length === 0 || isProcessing}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedOperation === operation.id
                  ? `border-${operation.color}-500 bg-${operation.color}-50 dark:bg-${operation.color}-900/20`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${files.length === 0 || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <operation.icon className={`h-8 w-8 mx-auto mb-2 text-${operation.color}-600`} />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {operation.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {operation.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Progress and Actions */}
      {files.length > 0 && selectedOperation && (
        <div className="space-y-6">
          {/* Overall Progress */}
          {isProcessing && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Processing Files
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>Completed: {completedFiles}</span>
                <span>Errors: {errorFiles}</span>
                <span>Total: {files.length}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={executeBatchOperation}
              disabled={!selectedOperation || files.length === 0 || isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Start Batch Processing
                </>
              )}
            </button>

            {completedFiles > 0 && (
              <button
                onClick={downloadAllResults}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Download className="h-5 w-5 mr-2" />
                Download All Results ({completedFiles})
              </button>
            )}

            <button
              onClick={onReset}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <RotateCcw className="h-5 w-5 mr-2 inline" />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
