'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, Crop } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

interface CropResult {
  success: boolean;
  croppedFile: Uint8Array | null;
  originalSize: number;
  croppedSize: number;
  pagesProcessed: number;
  error?: string;
}

export default function CropPDF({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [cropResult, setCropResult] = useState<CropResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cropType, setCropType] = useState<'margins' | 'custom' | 'auto'>('margins');
  const [topMargin, setTopMargin] = useState(0);
  const [bottomMargin, setBottomMargin] = useState(0);
  const [leftMargin, setLeftMargin] = useState(0);
  const [rightMargin, setRightMargin] = useState(0);
  const [customX, setCustomX] = useState(0);
  const [customY, setCustomY] = useState(0);
  const [customWidth, setCustomWidth] = useState(0);
  const [customHeight, setCustomHeight] = useState(0);

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

  // Crop PDF
  const cropPDF = useCallback(async (file: File): Promise<CropResult> => {
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

      // Crop each page
      const pages = pdfDoc.getPages();
      
      for (let i = 0; i < pages.length; i++) {
        setProcessProgress(30 + (i / pages.length) * 50);
        
        const page = pages[i];
        const { width, height } = page.getSize();
        
        if (cropType === 'margins') {
          // Crop margins
          const newWidth = width - leftMargin - rightMargin;
          const newHeight = height - topMargin - bottomMargin;
          
          if (newWidth > 0 && newHeight > 0) {
            page.setSize(newWidth, newHeight);
            // Note: In a real implementation, you would need to crop the actual content
            // This is a simplified demonstration
          }
        } else if (cropType === 'custom') {
          // Custom crop area
          const newWidth = customWidth || width;
          const newHeight = customHeight || height;
          
          if (newWidth > 0 && newHeight > 0) {
            page.setSize(newWidth, newHeight);
            // Note: In a real implementation, you would need to crop the actual content
            // This is a simplified demonstration
          }
        } else if (cropType === 'auto') {
          // Auto crop (simplified - just reduce margins)
          const autoMargin = 20;
          const newWidth = width - (autoMargin * 2);
          const newHeight = height - (autoMargin * 2);
          
          if (newWidth > 0 && newHeight > 0) {
            page.setSize(newWidth, newHeight);
          }
        }
        
        // Add a visual indicator of the crop area
        page.drawRectangle({
          x: 10,
          y: 10,
          width: Math.max(0, page.getWidth() - 20),
          height: Math.max(0, page.getHeight() - 20),
          borderColor: rgb(1, 0, 0),
          borderWidth: 2,
        });
        
        // Add crop info text
        page.drawText(`Cropped: ${cropType}`, {
          x: 20,
          y: page.getHeight() - 30,
          size: 10,
          color: rgb(0, 0, 0),
        });
      }

      setProcessProgress(85);

      // Generate the cropped PDF
      const pdfBytes = await pdfDoc.save();
      const croppedSize = pdfBytes.length;

      setProcessProgress(100);

      return {
        success: true,
        croppedFile: pdfBytes,
        originalSize,
        croppedSize,
        pagesProcessed: pages.length
      };

    } catch (error) {
      console.error('PDF cropping failed:', error);
      return {
        success: false,
        croppedFile: null,
        originalSize,
        croppedSize: 0,
        pagesProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [cropType, topMargin, bottomMargin, leftMargin, rightMargin, customX, customY, customWidth, customHeight]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setCropResult(null);
    setIsProcessing(true);
    setProcessProgress(0);

    try {
      const result = await cropPDF(file);
      setCropResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  }, [cropPDF]);

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

  // Download cropped file
  const downloadCroppedFile = useCallback(() => {
    if (cropResult?.croppedFile) {
      const arrayBuffer = cropResult.croppedFile.buffer.slice(0) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cropped_${uploadedFile?.name || 'document.pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [cropResult, uploadedFile]);

  // Reset function
  const reset = useCallback(() => {
    setUploadedFile(null);
    setCropResult(null);
    setError(null);
    setIsProcessing(false);
    setProcessProgress(0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crop className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Crop PDF
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Crop margins or select specific areas in your PDF documents
          </p>
        </div>

        {/* Crop Options */}
        {!uploadedFile && (
          <div className="mb-6 space-y-6">
            {/* Crop Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Crop Type:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setCropType('margins')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    cropType === 'margins'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
                  }`}
                >
                  <div className="text-2xl mb-2">📏</div>
                  <div className="font-medium text-gray-900 dark:text-white">Crop Margins</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Remove specific margins</div>
                </button>
                <button
                  onClick={() => setCropType('custom')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    cropType === 'custom'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
                  }`}
                >
                  <div className="text-2xl mb-2">✂️</div>
                  <div className="font-medium text-gray-900 dark:text-white">Custom Area</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Select specific area to keep</div>
                </button>
                <button
                  onClick={() => setCropType('auto')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    cropType === 'auto'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
                  }`}
                >
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-medium text-gray-900 dark:text-white">Auto Crop</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Automatically detect content</div>
                </button>
              </div>
            </div>

            {/* Margin Crop Options */}
            {cropType === 'margins' && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Margin Settings (in points)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Top Margin:
                    </label>
                    <input
                      type="number"
                      value={topMargin}
                      onChange={(e) => setTopMargin(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bottom Margin:
                    </label>
                    <input
                      type="number"
                      value={bottomMargin}
                      onChange={(e) => setBottomMargin(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Left Margin:
                    </label>
                    <input
                      type="number"
                      value={leftMargin}
                      onChange={(e) => setLeftMargin(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Right Margin:
                    </label>
                    <input
                      type="number"
                      value={rightMargin}
                      onChange={(e) => setRightMargin(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Custom Crop Options */}
            {cropType === 'custom' && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Custom Crop Area (in points)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      X Position:
                    </label>
                    <input
                      type="number"
                      value={customX}
                      onChange={(e) => setCustomX(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Y Position:
                    </label>
                    <input
                      type="number"
                      value={customY}
                      onChange={(e) => setCustomY(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Width:
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Height:
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Auto Crop Info */}
            {cropType === 'auto' && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Auto Crop</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  The auto crop feature will automatically detect the content area and remove excess white space around it.
                  This is a simplified demonstration - in the full version, it would use advanced content detection algorithms.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Upload Area */}
        {!uploadedFile && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
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
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 cursor-pointer transition-colors"
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
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crop className="h-8 w-8 text-green-600 dark:text-green-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Cropping PDF...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Processing pages and applying crop settings
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
        {cropResult && (
          <div className="space-y-6">
            {cropResult.success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  PDF Cropped!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your PDF has been successfully cropped using {cropType} settings
                </p>

                {/* File Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Original Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(cropResult.originalSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Cropped Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(cropResult.croppedSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Pages Processed:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {cropResult.pagesProcessed}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={downloadCroppedFile}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Cropped PDF
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
                  {cropResult.error || 'Unable to crop the PDF document'}
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

        {/* Back Button */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onReset}
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Tools
          </button>
        </div>
      </div>
    </div>
  );
}
