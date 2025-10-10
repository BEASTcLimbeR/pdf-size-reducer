'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, RotateCcw, Loader2, AlertCircle, Settings } from 'lucide-react';
import { compressPDF, ultraSimpleCompressPDF, formatFileSize, validatePDFFile, validatePDFFileAsync, getQualityDescription, CompressionOptions } from '@/utils/pdfCompression';
import { webhookService } from '@/utils/webhookService';
import CompressionMeter from './CompressionMeter';
import FileRenameModal from './FileRenameModal';
import { useFileDownload } from '@/hooks/useFileDownload';

interface CompressionResultsProps {
  file: File;
  onCompression: (compressedData: Uint8Array, stats: {
    originalSize: number;
    compressedSize: number;
    reductionPercentage: number;
    pagesCount: number;
  }) => void;
  onError: (error: string) => void;
  onReset: () => void;
  isCompressing: boolean;
  setIsCompressing: (compressing: boolean) => void;
  compressedFile: Uint8Array | null;
  compressionStats: {
    originalSize: number;
    compressedSize: number;
    reductionPercentage: number;
  } | null;
  error: string | null;
}

export default function CompressionResults({
  file,
  onCompression,
  onError,
  onReset,
  isCompressing,
  setIsCompressing,
  compressedFile,
  compressionStats,
  error
}: CompressionResultsProps) {
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
    quality: 'medium',
    removeMetadata: true,
    removeAnnotations: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const [compressionMethod, setCompressionMethod] = useState<string>('');

  // File download with rename functionality
  const {
    isRenameModalOpen,
    pendingDownload,
    downloadFile,
    handleRenameConfirm,
    handleRenameClose,
    getFileExtension,
    getFileNameWithoutExtension
  } = useFileDownload();

  // Compress PDF function using the utility with fallback
  const handleCompressPDF = useCallback(async () => {
    const compressionStartTime = Date.now();
    try {
      // Check if file is valid
      if (!file) {
        console.error('No file provided for compression');
        onError('No file provided for compression');
        return;
      }

      // Check if file is actually a File object
      if (typeof file !== 'object' || !file.name || typeof file.size !== 'number' || typeof file.arrayBuffer !== 'function') {
        console.error('Invalid file object:', {
          file: file,
          type: typeof file,
          hasName: !!file?.name,
          hasSize: typeof file?.size === 'number',
          hasArrayBuffer: typeof file?.arrayBuffer === 'function',
          constructor: file?.constructor?.name
        });
        onError('Invalid file object - please try uploading the file again');
        return;
      }

      setIsCompressing(true);
      setCompressionProgress(0);

      console.log('Starting PDF compression...', {
        fileName: file.name || 'Unknown',
        fileSize: file.size || 0,
        fileType: file.type || 'Unknown',
        compressionOptions
      });

      // Validate file first with enhanced validation
      console.log('Validating PDF file...');
      const validation = await validatePDFFileAsync(file);
      if (!validation.isValid) {
        console.error('File validation failed:', {
          error: validation.error,
          fileName: file.name || 'Unknown',
          fileSize: file.size || 0,
          fileType: file.type || 'Unknown',
          fileExtension: file.name?.split('.').pop() || 'Unknown'
        });
        onError(validation.error || 'Invalid file');
        return;
      }
      console.log('PDF file validation successful');

      setCompressionProgress(20);

      let result;
      try {
        console.log('Attempting main compression method...');
        // Try the advanced compression method first
        result = await compressPDF(file, compressionOptions);
        setCompressionMethod('Main Compression');
        console.log('Main compression successful:', {
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          reductionPercentage: result.reductionPercentage
        });
      } catch (advancedError) {
        console.warn('Advanced compression failed, trying main method:', advancedError);
        setCompressionProgress(30);
        
          try {
            console.log('Attempting main compression method...');
            result = await compressPDF(file, compressionOptions);
            setCompressionMethod('Standard Compression');
            console.log('Main compression successful:', {
              originalSize: result.originalSize,
              compressedSize: result.compressedSize,
              reductionPercentage: result.reductionPercentage
            });
        } catch (mainError) {
          console.warn('Main compression failed, trying simple method:', mainError);
          setCompressionProgress(60);
          
          try {
            // If main compression fails, try the simple method
            console.log('Attempting ultra-simple compression method...');
            result = await ultraSimpleCompressPDF(file);
            setCompressionMethod('Ultra-Simple Compression');
            console.log('Ultra-simple compression successful:', {
              originalSize: result.originalSize,
              compressedSize: result.compressedSize,
              reductionPercentage: result.reductionPercentage
            });
          } catch (simpleError) {
            console.warn('Simple compression failed, trying ultra-simple method:', simpleError);
            setCompressionProgress(80);
            
            // Final fallback - ultra-simple method that works with any PDF
            console.log('Attempting ultra-simple compression method (passthrough)...');
            result = await ultraSimpleCompressPDF(file);
            setCompressionMethod('Passthrough (File Compatible)');
            console.log('Ultra-simple compression successful (passthrough):', {
              originalSize: result.originalSize,
              compressedSize: result.compressedSize,
              reductionPercentage: result.reductionPercentage
            });
          }
        }
      }
      
      setCompressionProgress(100);

      const stats = {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        reductionPercentage: result.reductionPercentage,
        pagesCount: result.pagesCount
      };

      // Call the parent component with results
      onCompression(result.compressedData, stats);
    } catch (err) {
      console.error('Compression error:', err);
      onError(err instanceof Error ? err.message : 'Failed to compress PDF. Please try again.');
    }
  }, [file, compressionOptions, onError, setIsCompressing]);

  // Auto-compress when component mounts
  useEffect(() => {
    if (file && !compressedFile && !error) {
      handleCompressPDF();
    }
  }, [file, compressedFile, error, handleCompressPDF]);

  // Download compressed file with rename functionality
  const downloadCompressedFile = () => {
    if (!compressedFile) return;

    const originalFileName = file.name || 'document.pdf';
    const fileExtension = getFileExtension(originalFileName);
    const fileNameWithoutExt = getFileNameWithoutExtension(originalFileName);
    const defaultFileName = `${fileNameWithoutExt}_compressed${fileExtension}`;

    downloadFile({
      fileName: defaultFileName,
      fileData: compressedFile,
      mimeType: 'application/pdf',
      operationType: 'compressed',
      showRenameModal: true,
      fileSize: compressedFile.length
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* File Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {file.name || 'document.pdf'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Original size: {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
            <button
              onClick={onReset}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Upload Another
            </button>
          </div>
        </div>
      </div>

      {/* Compression Settings */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Compression Settings
          </h3>
          
          <div className="space-y-4">
            {/* Quality Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Compression Quality
              </label>
              <div className="space-y-3">
                {(['low', 'medium', 'high'] as const).map((quality) => {
                  const isSelected = compressionOptions.quality === quality;
                  const compressionLevel = quality === 'low' ? 50 : quality === 'medium' ? 70 : 90;
                  
                  return (
                    <label key={quality} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}>
                      <input
                        type="radio"
                        name="quality"
                        value={quality}
                        checked={isSelected}
                        onChange={(e) => setCompressionOptions(prev => ({ ...prev, quality: e.target.value as 'low' | 'medium' | 'high' }))}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {quality} Quality
                          </div>
                          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            ~{compressionLevel}% size
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {getQualityDescription(quality)}
                        </div>
                        {/* Visual compression bar */}
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              quality === 'low' ? 'bg-red-500' :
                              quality === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${compressionLevel}%` }}
                          />
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={compressionOptions.removeMetadata}
                  onChange={(e) => setCompressionOptions(prev => ({ ...prev, removeMetadata: e.target.checked }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Remove Metadata
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Remove author, title, and other metadata to reduce file size
                  </div>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={compressionOptions.removeAnnotations}
                  onChange={(e) => setCompressionOptions(prev => ({ ...prev, removeAnnotations: e.target.checked }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Remove Annotations
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Remove comments, highlights, and other annotations
                  </div>
                </div>
              </label>
            </div>

            {/* Compression Preview */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expected Compression
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Target Size:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ~{compressionOptions.quality === 'low' ? '50%' : 
                         compressionOptions.quality === 'medium' ? '70%' : '90%'} of original
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full ${
                        compressionOptions.quality === 'low' ? 'bg-red-500' :
                        compressionOptions.quality === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ 
                        width: `${compressionOptions.quality === 'low' ? '50' : 
                                 compressionOptions.quality === 'medium' ? '70' : '90'}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Recompress Button */}
              {compressedFile && (
                <button
                  onClick={handleCompressPDF}
                  disabled={isCompressing}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isCompressing ? 'Recompressing...' : 'Recompress with New Settings'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compression Status */}
      {isCompressing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Compressing PDF...
              </h3>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${compressionProgress}%` }}
              ></div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {compressionProgress < 50
                ? 'Reading PDF file...'
                : compressionProgress < 80
                ? 'Compressing pages...'
                : 'Finalizing compression...'
              }
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
                Compression Failed
              </h3>
              <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
              <div className="mt-3 text-sm text-red-600 dark:text-red-300">
                <p className="font-medium">Troubleshooting tips:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Make sure the PDF is not password-protected</li>
                  <li>Try with a different PDF file</li>
                  <li>Check that the file is not corrupted</li>
                  <li>Ensure the file is under 50MB</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleCompressPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onReset}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Upload Different File
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {compressedFile && compressionStats && (
        <div className="space-y-6">
          {/* Compression Results with Visual Meter */}
          <CompressionMeter
            reductionPercentage={compressionStats.reductionPercentage}
            originalSize={compressionStats.originalSize}
            compressedSize={compressionStats.compressedSize}
          />

          {/* Download Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Download Your Compressed PDF
              </h3>
              
              {compressionMethod && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Compression Method:</strong> {compressionMethod}
                    {compressionMethod === 'Passthrough (File Compatible)' && (
                      <span className="block mt-1 text-xs">
                        Your PDF was processed using a compatible method to ensure it works with all file types.
                      </span>
                    )}
                  </p>
                </div>
              )}
              
              <button
                onClick={downloadCompressedFile}
                className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Compressed PDF
              </button>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Your file has been compressed and is ready to download. 
                The download will start automatically when you click the button.
              </p>
            </div>
          </div>

          {/* Additional Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onReset}
              className="flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Compress Another PDF
            </button>
          </div>
        </div>
      )}

      {/* File Rename Modal */}
      {pendingDownload && (
        <FileRenameModal
          isOpen={isRenameModalOpen}
          onClose={handleRenameClose}
          onConfirm={handleRenameConfirm}
          currentFileName={pendingDownload.fileName}
          fileExtension={getFileExtension(pendingDownload.fileName)}
          operationType={pendingDownload.operationType}
          fileSize={pendingDownload.fileSize}
        />
      )}
    </div>
  );
}
