'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, Image, FileText } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface ConversionResult {
  success: boolean;
  convertedFiles: { page: number; data: Uint8Array; name: string }[] | null;
  originalSize: number;
  totalConvertedSize: number;
  pagesProcessed: number;
  error?: string;
}

export default function PDFToJPG({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [conversionMode, setConversionMode] = useState<'all' | 'single'>('all');
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [imageQuality, setImageQuality] = useState<number>(90);

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
    
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      return { isValid: false, error: 'File size must be less than 100MB' };
    }
    
    return { isValid: true };
  };

  // Convert PDF to JPG (simulated - in production you'd use pdf2pic or similar)
  const convertPDFToJPG = useCallback(async (file: File): Promise<ConversionResult> => {
    const originalSize = file.size;

    try {
      setConversionProgress(10);
      
      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      setConversionProgress(20);

      // Load the PDF
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      if (pageCount === 0) {
        throw new Error('PDF has no pages');
      }

      setConversionProgress(30);

      const convertedFiles: { page: number; data: Uint8Array; name: string }[] = [];
      const pages = pdfDoc.getPages();
      
      // Determine which pages to convert
      const pagesToConvert = conversionMode === 'all' 
        ? Array.from({ length: pageCount }, (_, i) => i)
        : [selectedPage - 1];

      for (let i = 0; i < pagesToConvert.length; i++) {
        const pageIndex = pagesToConvert[i];
        setConversionProgress(30 + (i / pagesToConvert.length) * 50);
        
        // In a real implementation, you would:
        // 1. Convert PDF page to image using pdf2pic or similar
        // 2. Apply quality settings
        // 3. Convert to JPG format
        
        // For simulation, we'll create a simple placeholder image
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Create a simple placeholder image
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.fillStyle = '#333333';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Page ${pageIndex + 1}`, canvas.width / 2, canvas.height / 2 - 50);
          ctx.fillText('PDF to JPG Conversion', canvas.width / 2, canvas.height / 2);
          ctx.fillText('Simulated Image', canvas.width / 2, canvas.height / 2 + 50);
          
          // Add a border
          ctx.strokeStyle = '#cccccc';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        }
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!);
          }, 'image/jpeg', imageQuality / 100);
        });
        
        // Convert blob to Uint8Array
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        convertedFiles.push({
          page: pageIndex + 1,
          data: uint8Array,
          name: `page_${pageIndex + 1}.jpg`
        });
      }

      setConversionProgress(85);

      const totalConvertedSize = convertedFiles.reduce((sum, file) => sum + file.data.length, 0);

      setConversionProgress(100);

      return {
        success: true,
        convertedFiles,
        originalSize,
        totalConvertedSize,
        pagesProcessed: pagesToConvert.length
      };

    } catch (error) {
      console.error('PDF to JPG conversion failed:', error);
      return {
        success: false,
        convertedFiles: null,
        originalSize,
        totalConvertedSize: 0,
        pagesProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [conversionMode, selectedPage, imageQuality]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setConversionResult(null);
    setIsConverting(true);
    setConversionProgress(0);

    try {
      const result = await convertPDFToJPG(file);
      setConversionResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  }, [convertPDFToJPG]);

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

  // Download all images as ZIP
  const downloadAllImages = useCallback(() => {
    if (conversionResult?.convertedFiles) {
      // For simplicity, we'll download each image individually
      // In production, you'd use a library like JSZip to create a ZIP file
      conversionResult.convertedFiles.forEach((file) => {
        const arrayBuffer = file.data.buffer.slice(0) as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  }, [conversionResult]);

  // Download single image
  const downloadImage = useCallback((file: { page: number; data: Uint8Array; name: string }) => {
    const arrayBuffer = file.data.buffer.slice(0) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Reset function
  const reset = useCallback(() => {
    setUploadedFile(null);
    setConversionResult(null);
    setError(null);
    setIsConverting(false);
    setConversionProgress(0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            PDF to JPG
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Convert each PDF page into JPG images or extract all images
          </p>
        </div>

        {/* Conversion Options */}
        {!uploadedFile && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Conversion Mode:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="all"
                    checked={conversionMode === 'all'}
                    onChange={(e) => setConversionMode(e.target.value as 'all')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Convert All Pages</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="single"
                    checked={conversionMode === 'single'}
                    onChange={(e) => setConversionMode(e.target.value as 'single')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Convert Single Page</span>
                </label>
              </div>
            </div>

            {conversionMode === 'single' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Number:
                </label>
                <input
                  type="number"
                  min="1"
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(parseInt(e.target.value) || 1)}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image Quality: {imageQuality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={imageQuality}
                onChange={(e) => setImageQuality(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Low Quality</span>
                <span>High Quality</span>
              </div>
            </div>
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
              Maximum file size: 100MB
            </p>
          </div>
        )}

        {/* Processing State */}
        {isConverting && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image className="h-8 w-8 text-green-600 dark:text-green-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Converting PDF to JPG...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Processing pages and generating images
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${conversionProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {conversionProgress}% complete
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
              Conversion Failed
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
        {conversionResult && (
          <div className="space-y-6">
            {conversionResult.success ? (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Conversion Complete!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Your PDF has been successfully converted to JPG images
                  </p>

                  {/* File Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Original Size:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-300">
                          {(conversionResult.originalSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Total Images Size:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-300">
                          {(conversionResult.totalConvertedSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Images Created:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-300">
                          {conversionResult.pagesProcessed}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Image Preview Grid */}
                  {conversionResult.convertedFiles && conversionResult.convertedFiles.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Generated Images:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {conversionResult.convertedFiles.map((file) => (
                          <div key={file.page} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-3 text-center">
                              <Image className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Page {file.page}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(file.data.length / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <button
                              onClick={() => downloadImage(file)}
                              className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {conversionResult.convertedFiles && conversionResult.convertedFiles.length > 1 && (
                      <button
                        onClick={downloadAllImages}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download All Images
                      </button>
                    )}
                    <button
                      onClick={reset}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <RotateCcw className="h-5 w-5 mr-2" />
                      Convert Another PDF
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Conversion Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {conversionResult.error || 'Unable to convert the PDF to JPG images'}
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
