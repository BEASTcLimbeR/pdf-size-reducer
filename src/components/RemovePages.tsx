'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, RotateCcw, Loader2, AlertCircle, Trash2, Plus, Minus } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface RemovePagesProps {
  onReset?: () => void;
}

export default function RemovePages({ onReset }: RemovePagesProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pagesToRemove, setPagesToRemove] = useState<number[]>([]);
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
      setPagesToRemove([]);
      
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
    setPagesToRemove(prev => 
      prev.includes(pageNumber) 
        ? prev.filter(p => p !== pageNumber)
        : [...prev, pageNumber].sort((a, b) => a - b)
    );
  };

  // Select all pages
  const selectAllPages = () => {
    const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);
    setPagesToRemove(allPages);
  };

  // Clear all selections
  const clearAllPages = () => {
    setPagesToRemove([]);
  };

  // Remove selected pages
  const removePages = async () => {
    if (!pdfDoc || !uploadedFile || pagesToRemove.length === 0) {
      setError('Please select pages to remove.');
      return;
    }

    if (pagesToRemove.length >= totalPages) {
      setError('Cannot remove all pages. At least one page must remain.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create new PDF document
      const newPdf = await PDFDocument.create();

      // Copy all pages except the ones to remove
      const pagesToKeep = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(pageNum => !pagesToRemove.includes(pageNum));

      if (pagesToKeep.length === 0) {
        throw new Error('No pages to keep after removal.');
      }

      const pageIndices = pagesToKeep.map(pageNum => pageNum - 1);
      const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      // Save the new PDF
      const pdfBytes = await newPdf.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      setProcessedFile(pdfBytes);
    } catch (err) {
      console.error('Remove pages error:', err);
      setError('Failed to remove pages. Please try again.');
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
    link.download = `removed-pages-${uploadedFile?.name || 'document.pdf'}`;
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
    setPagesToRemove([]);
    setProcessedFile(null);
    setError(null);
  };

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
                {isDragActive ? 'Drop your PDF here' : 'Upload PDF to remove pages'}
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

      {/* Page Selection */}
      {uploadedFile && !processedFile && (
        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
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

          {/* Page Selection Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Pages to Remove
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllPages}
                  className="flex items-center px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Select All
                </button>
                <button
                  onClick={clearAllPages}
                  className="flex items-center px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Clear All
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected {pagesToRemove.length} of {totalPages} pages to remove
              </p>
              {pagesToRemove.length > 0 && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Pages to remove: {pagesToRemove.join(', ')}
                </p>
              )}
            </div>

            {/* Page Grid */}
            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-2 mb-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => togglePage(pageNum)}
                  className={`
                    w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all duration-200
                    ${pagesToRemove.includes(pageNum)
                      ? 'border-red-500 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }
                  `}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={removePages}
                disabled={isProcessing || pagesToRemove.length === 0}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Removing Pages...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5 mr-2" />
                    Remove Selected Pages
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
              <Loader2 className="h-8 w-8 text-red-600 animate-spin mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Removing Pages...
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
                Operation Failed
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
                Pages Removed Successfully!
              </h3>
            </div>
            
            <div className="text-center">
              <p className="text-green-700 dark:text-green-400 mb-4">
                {pagesToRemove.length} page(s) have been removed from your PDF.
              </p>
              
              <button
                onClick={downloadProcessedFile}
                className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Modified PDF
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={resetAll}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Remove Pages from Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
