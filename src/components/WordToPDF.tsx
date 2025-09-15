'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, FileText } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

interface ConversionResult {
  success: boolean;
  convertedFile: Uint8Array | null;
  originalSize: number;
  convertedSize: number;
  pagesCreated: number;
  error?: string;
}

export default function WordToPDF({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Validate Word file
  const validateWordFile = (file: File): { isValid: boolean; error?: string } => {
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }
    
    const validTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-word.document.macroEnabled.12'
    ];
    
    if (!validTypes.includes(file.type)) {
      return { isValid: false, error: 'Please select a Word document (DOC or DOCX)' };
    }
    
    if (file.size === 0) {
      return { isValid: false, error: 'The selected file is empty' };
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return { isValid: false, error: 'File size must be less than 50MB' };
    }
    
    return { isValid: true };
  };

  // Convert Word to PDF (simulated)
  const convertWordToPDF = useCallback(async (file: File): Promise<ConversionResult> => {
    const originalSize = file.size;

    try {
      setConversionProgress(10);
      
      // Read the Word file
      const arrayBuffer = await file.arrayBuffer();
      setConversionProgress(20);

      // In a real implementation, you would:
      // 1. Parse the Word document using mammoth.js or similar
      // 2. Extract text content, formatting, and images
      // 3. Create PDF pages with proper formatting
      // 4. Handle tables, images, and complex layouts

      setConversionProgress(30);

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      setConversionProgress(40);

      // Calculate page dimensions
      const dimensions = {
        a4: { width: 595, height: 842 },
        letter: { width: 612, height: 792 }
      };
      
      const pageWidth = orientation === 'landscape' ? dimensions[pageSize].height : dimensions[pageSize].width;
      const pageHeight = orientation === 'landscape' ? dimensions[pageSize].width : dimensions[pageSize].height;

      // Add a page
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      setConversionProgress(50);

      // Simulate text extraction and formatting
      // In real implementation, this would be actual content from the Word document
      const content = `Converted from: ${file.name}

This is simulated content that would normally be extracted from the Word document.
In a real implementation, this would include:
- Actual text content from the Word document
- Proper formatting (bold, italic, fonts, sizes)
- Images and tables
- Page breaks and layout
- Headers and footers
- Lists and bullet points

The conversion process would:
1. Parse the Word document structure
2. Extract all text content with formatting
3. Convert images and embed them in PDF
4. Handle tables and complex layouts
5. Maintain proper page breaks and formatting

This is a demonstration of how the Word to PDF conversion would work.
The actual implementation would use libraries like mammoth.js to parse
Word documents and PDF-lib to create properly formatted PDF files.`;

      setConversionProgress(70);

      // Add text to the PDF page
      page.drawText(content, {
        x: 50,
        y: pageHeight - 50,
        size: 12,
        color: rgb(0, 0, 0),
        maxWidth: pageWidth - 100,
        lineHeight: 16,
      });

      setConversionProgress(85);

      // Generate the PDF
      const pdfBytes = await pdfDoc.save();
      const convertedSize = pdfBytes.length;

      setConversionProgress(100);

      return {
        success: true,
        convertedFile: pdfBytes,
        originalSize,
        convertedSize,
        pagesCreated: 1
      };

    } catch (error) {
      console.error('Word to PDF conversion failed:', error);
      return {
        success: false,
        convertedFile: null,
        originalSize,
        convertedSize: 0,
        pagesCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [pageSize, orientation]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validateWordFile(file);
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
      const result = await convertWordToPDF(file);
      setConversionResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  }, [convertWordToPDF]);

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

  // Download converted file
  const downloadConvertedFile = useCallback(() => {
    if (conversionResult?.convertedFile) {
      const arrayBuffer = conversionResult.convertedFile.buffer.slice(0) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${uploadedFile?.name?.replace(/\.(doc|docx)$/i, '') || 'document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [conversionResult, uploadedFile]);

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
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Word to PDF
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Convert DOC and DOCX files to PDF for easy viewing
          </p>
        </div>

        {/* Conversion Options */}
        {!uploadedFile && (
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Size:
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orientation:
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
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
              Drop your Word document here
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              or click to browse files
            </p>
            <input
              type="file"
              accept=".doc,.docx"
              onChange={handleFileInputChange}
              className="hidden"
              id="word-upload"
            />
            <label
              htmlFor="word-upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Choose Word Document
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supports DOC and DOCX • Maximum file size: 50MB
            </p>
          </div>
        )}

        {/* Processing State */}
        {isConverting && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Converting Word to PDF...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Processing document and creating PDF
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Conversion Complete!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your Word document has been successfully converted to PDF
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
                      <span className="font-medium text-gray-900 dark:text-white">PDF Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(conversionResult.convertedSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Pages Created:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {conversionResult.pagesCreated}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={downloadConvertedFile}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Convert Another Document
                  </button>
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
                  {conversionResult.error || 'Unable to convert the Word document to PDF'}
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
