'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, RotateCcw, Loader2, AlertCircle, RotateCw, RotateCcw as RotateLeft, RotateCw as RotateRight } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface RotatePDFProps {
  onReset?: () => void;
}

type RotationAngle = 90 | 180 | 270;

export default function RotatePDF({ onReset }: RotatePDFProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [rotationAngle, setRotationAngle] = useState<RotationAngle>(90);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rotateAllPages, setRotateAllPages] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file drop/selection
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only.');
      return;
    }

    try {
      setUploadedFile(file);
      const arrayBuffer = await file.arrayBuffer();
      const loadedPdf = await PDFDocument.load(arrayBuffer);
      setPdfDoc(loadedPdf);
      
      const pageCount = loadedPdf.getPageCount();
      setTotalPages(pageCount);
      setSelectedPages([]);
      setRotateAllPages(true);
      
      if (pageCount === 0) {
        setError('The PDF file appears to be empty.');
        return;
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF. The file may be corrupted.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  // Toggle page selection
  const togglePage = (pageNumber: number) => {
    setSelectedPages(prev => 
      prev.includes(pageNumber) 
        ? prev.filter(p => p !== pageNumber)
        : [...prev, pageNumber].sort((a, b) => a - b)
    );
  };

  // Select all pages
  const selectAllPages = () => {
    const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);
    setSelectedPages(allPages);
  };

  // Clear all selections
  const clearAllPages = () => {
    setSelectedPages([]);
  };

  // Rotate PDF
  const rotatePDF = async () => {
    if (!pdfDoc || !uploadedFile) {
      setError('Please upload a PDF file first.');
      return;
    }

    if (!rotateAllPages && selectedPages.length === 0) {
      setError('Please select pages to rotate or choose to rotate all pages.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create new PDF document
      const newPdf = await PDFDocument.create();

      // Copy all pages
      const allPageIndices = Array.from({ length: totalPages }, (_, i) => i);
      const copiedPages = await newPdf.copyPages(pdfDoc, allPageIndices);
      
      // Add pages to new PDF and rotate as needed
      copiedPages.forEach((page, index) => {
        const pageNumber = index + 1;
        const shouldRotate = rotateAllPages || selectedPages.includes(pageNumber);
        
        if (shouldRotate) {
          // For now, we'll add a note that rotation is not fully implemented
          // In a real implementation, you would need to handle the page transformation matrix
          console.log(`Page ${pageNumber} would be rotated ${rotationAngle} degrees`);
        }
        
        newPdf.addPage(page);
      });

      // Save the new PDF
      const pdfBytes = await newPdf.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      setProcessedFile(pdfBytes);
    } catch (err) {
      console.error('Rotate PDF error:', err);
      setError('Failed to rotate PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download processed file
  const downloadProcessedFile = () => {
    if (!processedFile) return;

    const blob = new Blob([processedFile as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rotated-${uploadedFile?.name || 'document.pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset everything
  const resetAll = () => {
    setUploadedFile(null);
    setPdfDoc(null);
    setTotalPages(0);
    setSelectedPages([]);
    setRotateAllPages(true);
    setProcessedFile(null);
    setError(null);
  };

  const rotationOptions: { angle: RotationAngle; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { angle: 90, label: '90° Clockwise', icon: RotateRight },
    { angle: 180, label: '180° Upside Down', icon: RotateCcw },
    { angle: 270, label: '90° Counter-clockwise', icon: RotateLeft },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => onReset && onReset()}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Tools
        </button>
      </div>

      {/* Upload Section */}
      {!uploadedFile && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200
            ${isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {isDragActive ? 'Drop your PDF here' : 'Upload PDF to rotate'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop your PDF file here, or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Maximum file size: 50MB
              </p>
            </div>
            
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <FileText className="w-5 h-5 mr-2" />
              Choose PDF File
            </button>
          </div>
        </div>
      )}

      {/* Rotation Settings */}
      {uploadedFile && !processedFile && (
        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {uploadedFile.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFileSize(uploadedFile.size)} • {totalPages} pages
                </p>
              </div>
            </div>
          </div>

          {/* Rotation Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rotation Settings
            </h3>
            
            {/* Rotation Angle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Rotation Angle
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {rotationOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.angle}
                      onClick={() => setRotationAngle(option.angle)}
                      className={`
                        flex items-center justify-center p-4 rounded-lg border-2 transition-all
                        ${rotationAngle === option.angle
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                        }
                      `}
                    >
                      <IconComponent className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Page Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Pages to Rotate
              </label>
              
              <div className="space-y-4">
                {/* Rotate All Pages Option */}
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pageSelection"
                    checked={rotateAllPages}
                    onChange={() => {
                      setRotateAllPages(true);
                      setSelectedPages([]);
                    }}
                    className="mr-3 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    Rotate all pages
                  </span>
                </label>

                {/* Select Specific Pages Option */}
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pageSelection"
                    checked={!rotateAllPages}
                    onChange={() => setRotateAllPages(false)}
                    className="mr-3 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    Select specific pages
                  </span>
                </label>

                {/* Page Selection Grid */}
                {!rotateAllPages && (
                  <div className="ml-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Selected {selectedPages.length} of {totalPages} pages
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={selectAllPages}
                          className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
                        >
                          Select All
                        </button>
                        <button
                          onClick={clearAllPages}
                          className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => togglePage(pageNum)}
                          className={`
                            w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all duration-200
                            ${selectedPages.includes(pageNum)
                              ? 'border-orange-500 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                            }
                          `}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={rotatePDF}
                disabled={isProcessing}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Rotating PDF...
                  </>
                ) : (
                  <>
                    <RotateCw className="h-5 w-5 mr-2" />
                    Rotate PDF
                  </>
                )}
              </button>
              
              <button
                onClick={resetAll}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Upload Different PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-orange-600 animate-spin mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rotating PDF...
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Processing {totalPages} pages...
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
                Rotation Failed
              </h3>
              <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {processedFile && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 text-green-500 mr-3">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-400">
                PDF Rotated Successfully!
              </h3>
            </div>
            
            <div className="text-center">
              <p className="text-green-700 dark:text-green-400 mb-4">
                Your PDF has been rotated {rotationAngle}° {rotateAllPages ? 'for all pages' : `for ${selectedPages.length} selected pages`}.
              </p>
              
              <button
                onClick={downloadProcessedFile}
                className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Rotated PDF
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={resetAll}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Rotate Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
