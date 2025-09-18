'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, Hash } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

interface PageNumberResult {
  success: boolean;
  editedFile: Uint8Array | null;
  originalSize: number;
  editedSize: number;
  pagesProcessed: number;
  error?: string;
}

export default function AddPageNumbers({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [pageNumberResult, setPageNumberResult] = useState<PageNumberResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [position, setPosition] = useState<'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'>('bottom-center');
  const [format, setFormat] = useState<'1' | '1 of 10' | 'Page 1' | 'Page 1 of 10' | '1 / 10'>('1');
  const [fontSize, setFontSize] = useState(12);
  const [fontColor, setFontColor] = useState('#000000');
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(0);

  // Validate PDF file
  const validatePDFFile = (file: File): { isValid: boolean; error?: string } => {
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }
    
    if (file.type !== 'application/pdf') {
      return { isValid: false, error: 'Please select a PDF file' };
    }
    
    if (file.size === 0) {
      return { isValid: false, error: 'The selected file is empty' };
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return { isValid: false, error: 'File size must be less than 50MB' };
    }
    
    return { isValid: true };
  };

  // Add page numbers to PDF
  const addPageNumbers = useCallback(async (file: File): Promise<PageNumberResult> => {
    const originalSize = file.size;

    try {
      setProcessProgress(10);
      
      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      setProcessProgress(20);

      // Load the PDF
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      if (pageCount === 0) {
        throw new Error('PDF has no pages');
      }

      setProcessProgress(30);

      // Set end page if not specified
      const finalEndPage = endPage || pageCount;
      const pagesToProcess = Math.min(finalEndPage, pageCount);

      // Add page numbers to each page
      const pages = pdfDoc.getPages();
      
      for (let i = 0; i < pagesToProcess; i++) {
        setProcessProgress(30 + (i / pagesToProcess) * 50);
        
        const page = pages[i];
        const { width, height } = page.getSize();
        const pageNumber = startPage + i;
        
        // Format the page number text
        let pageText = '';
        switch (format) {
          case '1':
            pageText = pageNumber.toString();
            break;
          case '1 of 10':
            pageText = `${pageNumber} of ${pageCount}`;
            break;
          case 'Page 1':
            pageText = `Page ${pageNumber}`;
            break;
          case '1 / 10':
            pageText = `${pageNumber} / ${pageCount}`;
            break;
        }
        
        // Calculate position
        let x = 0;
        let y = 0;
        const margin = 20;
        
        switch (position) {
          case 'top-left':
            x = margin;
            y = height - margin - fontSize;
            break;
          case 'top-center':
            x = (width - pageText.length * fontSize * 0.6) / 2;
            y = height - margin - fontSize;
            break;
          case 'top-right':
            x = width - pageText.length * fontSize * 0.6 - margin;
            y = height - margin - fontSize;
            break;
          case 'bottom-left':
            x = margin;
            y = margin;
            break;
          case 'bottom-center':
            x = (width - pageText.length * fontSize * 0.6) / 2;
            y = margin;
            break;
          case 'bottom-right':
            x = width - pageText.length * fontSize * 0.6 - margin;
            y = margin;
            break;
        }
        
        // Add page number to the page
        page.drawText(pageText, {
          x,
          y,
          size: fontSize,
          color: rgb(
            parseInt(fontColor.slice(1, 3), 16) / 255,
            parseInt(fontColor.slice(3, 5), 16) / 255,
            parseInt(fontColor.slice(5, 7), 16) / 255
          ),
        });
      }

      setProcessProgress(85);

      // Generate the edited PDF
      const pdfBytes = await pdfDoc.save();
      const editedSize = pdfBytes.length;

      setProcessProgress(100);

      return {
        success: true,
        editedFile: pdfBytes,
        originalSize,
        editedSize,
        pagesProcessed: pagesToProcess
      };

    } catch (error) {
      console.error('Page number addition failed:', error);
      return {
        success: false,
        editedFile: null,
        originalSize,
        editedSize: 0,
        pagesProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [position, format, fontSize, fontColor, startPage, endPage]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setPageNumberResult(null);
    setIsProcessing(true);
    setProcessProgress(0);

    try {
      const result = await addPageNumbers(file);
      setPageNumberResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  }, [addPageNumbers]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Download edited file
  const downloadEditedFile = useCallback(() => {
    if (pageNumberResult?.editedFile) {
      const arrayBuffer = pageNumberResult.editedFile.buffer.slice(0) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `numbered_${uploadedFile?.name || 'document.pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [pageNumberResult, uploadedFile]);

  // Reset function
  const reset = useCallback(() => {
    setUploadedFile(null);
    setPageNumberResult(null);
    setError(null);
    setIsProcessing(false);
    setProcessProgress(0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Hash className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Add Page Numbers
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Add page numbers to PDFs with custom positions and styling
          </p>
        </div>

        {/* Page Number Options */}
        {!uploadedFile && (
          <div className="mb-6 space-y-6">
            {/* Position Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Page Number Position:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {[
                  { value: 'top-left', label: 'Top Left' },
                  { value: 'top-center', label: 'Top Center' },
                  { value: 'top-right', label: 'Top Right' },
                  { value: 'bottom-left', label: 'Bottom Left' },
                  { value: 'bottom-center', label: 'Bottom Center' },
                  { value: 'bottom-right', label: 'Bottom Right' }
                ].map((pos) => (
                  <button
                    key={pos.value}
                    onClick={() => setPosition(pos.value as 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right')}
                    className={`p-3 border-2 rounded-lg text-center transition-colors ${
                      position === pos.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{pos.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format and Styling */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number Format:
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as '1' | '1 of 10' | 'Page 1' | 'Page 1 of 10' | '1 / 10')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="1">1</option>
                  <option value="1 of 10">1 of 10</option>
                  <option value="Page 1">Page 1</option>
                  <option value="1 / 10">1 / 10</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Size:
                </label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  min="8"
                  max="48"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Color and Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Color:
                </label>
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Page:
                </label>
                <input
                  type="number"
                  value={startPage}
                  onChange={(e) => setStartPage(Number(e.target.value))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Page (0 = all):
                </label>
                <input
                  type="number"
                  value={endPage}
                  onChange={(e) => setEndPage(Number(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!uploadedFile && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop your PDF here
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              or click to browse files
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Choose PDF File
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Maximum file size: 50MB
            </p>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Hash className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Adding Page Numbers...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Processing pages and adding page numbers
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {processProgress}% complete
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Processing Failed
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error}
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {pageNumberResult && (
          <div className="space-y-6">
            {pageNumberResult.success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Page Numbers Added!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your PDF has been successfully updated with page numbers
                </p>

                {/* File Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Original Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(pageNumberResult.originalSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Updated Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(pageNumberResult.editedSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Pages Processed:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {pageNumberResult.pagesProcessed}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={downloadEditedFile}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Updated PDF
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Process Another PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Processing Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {pageNumberResult.error || 'Unable to add page numbers to the PDF'}
                </p>
                <button
                  onClick={reset}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Another File
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
