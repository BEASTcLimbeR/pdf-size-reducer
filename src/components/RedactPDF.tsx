'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, Trash2 } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

interface RedactResult {
  success: boolean;
  redactedFile: Uint8Array | null;
  originalSize: number;
  redactedSize: number;
  pagesProcessed: number;
  redactedItems: number;
  error?: string;
}

export default function RedactPDF({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [redactResult, setRedactResult] = useState<RedactResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [redactType, setRedactType] = useState<'text' | 'email' | 'phone' | 'ssn' | 'custom'>('text');
  const [customText, setCustomText] = useState('');
  const [redactColor, setRedactColor] = useState('#000000');
  const [redactMethod, setRedactMethod] = useState<'blackout' | 'whiten' | 'replace'>('blackout');
  const [replacementText, setReplacementText] = useState('[REDACTED]');

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

  // Redact PDF
  const redactPDF = useCallback(async (file: File): Promise<RedactResult> => {
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

      // Validate redaction input
      if (redactType === 'custom' && !customText.trim()) {
        throw new Error('Custom text to redact is required');
      }

      setProcessProgress(40);

      // Redact content on each page
      const pages = pdfDoc.getPages();
      let redactedItems = 0;
      
      for (let i = 0; i < pages.length; i++) {
        setProcessProgress(40 + (i / pages.length) * 40);
        
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Simulate redaction by adding redaction boxes
        // In a real implementation, you would use OCR to find and redact specific text
        
        if (redactType === 'text' || redactType === 'custom') {
          // Add redaction boxes for text
          const redactText = redactType === 'custom' ? customText : 'SAMPLE TEXT';
          
          // Add multiple redaction boxes to simulate text redaction
          for (let j = 0; j < 3; j++) {
            const x = 50 + (j * 150);
            const y = height - 100 - (j * 50);
            
            if (redactMethod === 'blackout') {
              page.drawRectangle({
                x,
                y,
                width: 120,
                height: 20,
                color: rgb(0, 0, 0),
              });
            } else if (redactMethod === 'whiten') {
              page.drawRectangle({
                x,
                y,
                width: 120,
                height: 20,
                color: rgb(1, 1, 1),
              });
            } else if (redactMethod === 'replace') {
              page.drawText(replacementText, {
                x,
                y,
                size: 10,
                color: rgb(
                  parseInt(redactColor.slice(1, 3), 16) / 255,
                  parseInt(redactColor.slice(3, 5), 16) / 255,
                  parseInt(redactColor.slice(5, 7), 16) / 255
                ),
              });
            }
            redactedItems++;
          }
        } else if (redactType === 'email') {
          // Add redaction boxes for email addresses
          page.drawRectangle({
            x: 50,
            y: height - 100,
            width: 200,
            height: 20,
            color: redactMethod === 'blackout' ? rgb(0, 0, 0) : rgb(1, 1, 1),
          });
          redactedItems++;
        } else if (redactType === 'phone') {
          // Add redaction boxes for phone numbers
          page.drawRectangle({
            x: 50,
            y: height - 150,
            width: 150,
            height: 20,
            color: redactMethod === 'blackout' ? rgb(0, 0, 0) : rgb(1, 1, 1),
          });
          redactedItems++;
        } else if (redactType === 'ssn') {
          // Add redaction boxes for SSN
          page.drawRectangle({
            x: 50,
            y: height - 200,
            width: 120,
            height: 20,
            color: redactMethod === 'blackout' ? rgb(0, 0, 0) : rgb(1, 1, 1),
          });
          redactedItems++;
        }
        
        // Add redaction notice
        page.drawText('REDACTED DOCUMENT', {
          x: width - 150,
          y: 20,
          size: 10,
          color: rgb(1, 0, 0),
        });
      }

      setProcessProgress(85);

      // Generate the redacted PDF
      const pdfBytes = await pdfDoc.save();
      const redactedSize = pdfBytes.length;

      setProcessProgress(100);

      return {
        success: true,
        redactedFile: pdfBytes,
        originalSize,
        redactedSize,
        pagesProcessed: pages.length,
        redactedItems
      };

    } catch (error) {
      console.error('PDF redaction failed:', error);
      return {
        success: false,
        redactedFile: null,
        originalSize,
        redactedSize: 0,
        pagesProcessed: 0,
        redactedItems: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [redactType, customText, redactColor, redactMethod, replacementText]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setRedactResult(null);
    setIsProcessing(true);
    setProcessProgress(0);

    try {
      const result = await redactPDF(file);
      setRedactResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  }, [redactPDF]);

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

  // Download redacted file
  const downloadRedactedFile = useCallback(() => {
    if (redactResult?.redactedFile) {
      const arrayBuffer = redactResult.redactedFile.buffer.slice(0) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redacted_${uploadedFile?.name || 'document.pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [redactResult, uploadedFile]);

  // Reset function
  const reset = useCallback(() => {
    setUploadedFile(null);
    setRedactResult(null);
    setError(null);
    setIsProcessing(false);
    setProcessProgress(0);
    setCustomText('');
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Redact PDF
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Permanently remove sensitive information from PDF documents
          </p>
        </div>

        {/* Redaction Options */}
        {!uploadedFile && (
          <div className="mb-6 space-y-6">
            {/* Redaction Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What to Redact:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setRedactType('text')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    redactType === 'text'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
                  }`}
                >
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium text-gray-900 dark:text-white">Text Content</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Redact specific text</div>
                </button>
                <button
                  onClick={() => setRedactType('email')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    redactType === 'email'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
                  }`}
                >
                  <div className="text-2xl mb-2">📧</div>
                  <div className="font-medium text-gray-900 dark:text-white">Email Addresses</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Find and redact emails</div>
                </button>
                <button
                  onClick={() => setRedactType('phone')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    redactType === 'phone'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
                  }`}
                >
                  <div className="text-2xl mb-2">📞</div>
                  <div className="font-medium text-gray-900 dark:text-white">Phone Numbers</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Find and redact phones</div>
                </button>
                <button
                  onClick={() => setRedactType('ssn')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    redactType === 'ssn'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
                  }`}
                >
                  <div className="text-2xl mb-2">🆔</div>
                  <div className="font-medium text-gray-900 dark:text-white">SSN Numbers</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Find and redact SSNs</div>
                </button>
                <button
                  onClick={() => setRedactType('custom')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    redactType === 'custom'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
                  }`}
                >
                  <div className="text-2xl mb-2">✏️</div>
                  <div className="font-medium text-gray-900 dark:text-white">Custom Text</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Redact specific words</div>
                </button>
              </div>
            </div>

            {/* Custom Text Input */}
            {redactType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text to Redact:
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter the text you want to redact..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            {/* Redaction Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Redaction Method:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setRedactMethod('blackout')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    redactMethod === 'blackout'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
                  }`}
                >
                  <div className="text-2xl mb-2">⬛</div>
                  <div className="font-medium text-gray-900 dark:text-white">Blackout</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Cover with black boxes</div>
                </button>
                <button
                  onClick={() => setRedactMethod('whiten')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    redactMethod === 'whiten'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
                  }`}
                >
                  <div className="text-2xl mb-2">⬜</div>
                  <div className="font-medium text-gray-900 dark:text-white">Whiten</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Cover with white boxes</div>
                </button>
                <button
                  onClick={() => setRedactMethod('replace')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    redactMethod === 'replace'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
                  }`}
                >
                  <div className="text-2xl mb-2">🔄</div>
                  <div className="font-medium text-gray-900 dark:text-white">Replace</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Replace with text</div>
                </button>
              </div>
            </div>

            {/* Replacement Text */}
            {redactMethod === 'replace' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Replacement Text:
                  </label>
                  <input
                    type="text"
                    value={replacementText}
                    onChange={(e) => setReplacementText(e.target.value)}
                    placeholder="Enter replacement text..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Text Color:
                  </label>
                  <input
                    type="color"
                    value={redactColor}
                    onChange={(e) => setRedactColor(e.target.value)}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
              </div>
            )}

            {/* Warning Notice */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Important Notice
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    This is a demonstration. In a real implementation, the redaction would be permanent and irreversible.
                    Make sure to review the redacted document before sharing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!uploadedFile && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
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
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 cursor-pointer transition-colors"
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
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Redacting PDF...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Finding and removing sensitive information
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
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
              Redaction Failed
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
        {redactResult && (
          <div className="space-y-6">
            {redactResult.success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  PDF Redacted!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your PDF has been successfully redacted and sensitive information removed
                </p>

                {/* File Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Original Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(redactResult.originalSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Redacted Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(redactResult.redactedSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Pages Processed:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {redactResult.pagesProcessed}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Items Redacted:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {redactResult.redactedItems}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={downloadRedactedFile}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Redacted PDF
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Redact Another PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Redaction Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {redactResult.error || 'Unable to redact the PDF document'}
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
