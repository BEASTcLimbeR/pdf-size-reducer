'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, FileText, PenTool } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

interface SignResult {
  success: boolean;
  signedFile: Uint8Array | null;
  originalSize: number;
  signedSize: number;
  pagesProcessed: number;
  error?: string;
}

export default function SignPDF({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [signResult, setSignResult] = useState<SignResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [signatureType, setSignatureType] = useState<'text' | 'draw' | 'upload'>('text');
  const [signatureText, setSignatureText] = useState('');
  const [signaturePosition, setSignaturePosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'>('bottom-right');
  const [signatureSize, setSignatureSize] = useState(12);
  const [signatureColor, setSignatureColor] = useState('#000000');
  const [signatureDate, setSignatureDate] = useState(true);
  const [signatureReason, setSignatureReason] = useState('');

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

  // Sign PDF
  const signPDF = useCallback(async (file: File): Promise<SignResult> => {
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

      // Validate signature input
      if (signatureType === 'text' && !signatureText.trim()) {
        throw new Error('Signature text is required');
      }

      setProcessProgress(40);

      // Add signature to each page
      const pages = pdfDoc.getPages();
      
      for (let i = 0; i < pages.length; i++) {
        setProcessProgress(40 + (i / pages.length) * 40);
        
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Calculate signature position
        let x = 0;
        let y = 0;
        const margin = 20;
        
        switch (signaturePosition) {
          case 'bottom-right':
            x = width - 200;
            y = margin;
            break;
          case 'bottom-left':
            x = margin;
            y = margin;
            break;
          case 'top-right':
            x = width - 200;
            y = height - margin - 50;
            break;
          case 'top-left':
            x = margin;
            y = height - margin - 50;
            break;
          case 'center':
            x = (width - 200) / 2;
            y = height / 2;
            break;
        }
        
        // Add signature text
        if (signatureType === 'text') {
          page.drawText(signatureText, {
            x,
            y,
            size: signatureSize,
            color: rgb(
              parseInt(signatureColor.slice(1, 3), 16) / 255,
              parseInt(signatureColor.slice(3, 5), 16) / 255,
              parseInt(signatureColor.slice(5, 7), 16) / 255
            ),
          });
        } else if (signatureType === 'draw') {
          // Add drawn signature placeholder
          page.drawText('[DRAWN SIGNATURE]', {
            x,
            y,
            size: signatureSize,
            color: rgb(
              parseInt(signatureColor.slice(1, 3), 16) / 255,
              parseInt(signatureColor.slice(3, 5), 16) / 255,
              parseInt(signatureColor.slice(5, 7), 16) / 255
            ),
          });
        } else if (signatureType === 'upload') {
          // Add uploaded signature placeholder
          page.drawText('[UPLOADED SIGNATURE]', {
            x,
            y,
            size: signatureSize,
            color: rgb(
              parseInt(signatureColor.slice(1, 3), 16) / 255,
              parseInt(signatureColor.slice(3, 5), 16) / 255,
              parseInt(signatureColor.slice(5, 7), 16) / 255
            ),
          });
        }
        
        // Add signature line
        page.drawLine({
          start: { x, y: y - 5 },
          end: { x: x + 150, y: y - 5 },
          thickness: 1,
          color: rgb(
            parseInt(signatureColor.slice(1, 3), 16) / 255,
            parseInt(signatureColor.slice(3, 5), 16) / 255,
            parseInt(signatureColor.slice(5, 7), 16) / 255
          ),
        });
        
        // Add date if enabled
        if (signatureDate) {
          const currentDate = new Date().toLocaleDateString();
          page.drawText(`Date: ${currentDate}`, {
            x,
            y: y - 20,
            size: 10,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
        
        // Add reason if provided
        if (signatureReason) {
          page.drawText(`Reason: ${signatureReason}`, {
            x,
            y: y - 35,
            size: 10,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      }

      setProcessProgress(85);

      // Generate the signed PDF
      const pdfBytes = await pdfDoc.save();
      const signedSize = pdfBytes.length;

      setProcessProgress(100);

      return {
        success: true,
        signedFile: pdfBytes,
        originalSize,
        signedSize,
        pagesProcessed: pages.length
      };

    } catch (error) {
      console.error('PDF signing failed:', error);
      return {
        success: false,
        signedFile: null,
        originalSize,
        signedSize: 0,
        pagesProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [signatureType, signatureText, signaturePosition, signatureSize, signatureColor, signatureDate, signatureReason]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setSignResult(null);
    setIsProcessing(true);
    setProcessProgress(0);

    try {
      const result = await signPDF(file);
      setSignResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  }, [signPDF]);

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

  // Download signed file
  const downloadSignedFile = useCallback(() => {
    if (signResult?.signedFile) {
      const arrayBuffer = signResult.signedFile.buffer.slice(0) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed_${uploadedFile?.name || 'document.pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [signResult, uploadedFile]);

  // Reset function
  const reset = useCallback(() => {
    setUploadedFile(null);
    setSignResult(null);
    setError(null);
    setIsProcessing(false);
    setProcessProgress(0);
    setSignatureText('');
    setSignatureReason('');
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
            Sign PDF
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Sign yourself or request electronic signatures from others
          </p>
        </div>

        {/* Signature Options */}
        {!uploadedFile && (
          <div className="mb-6 space-y-6">
            {/* Signature Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Signature Type:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setSignatureType('text')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    signatureType === 'text'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  <div className="text-2xl mb-2">✍️</div>
                  <div className="font-medium text-gray-900 dark:text-white">Text Signature</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Type your name as signature</div>
                </button>
                <button
                  onClick={() => setSignatureType('draw')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    signatureType === 'draw'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  <div className="text-2xl mb-2">🖊️</div>
                  <div className="font-medium text-gray-900 dark:text-white">Draw Signature</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Draw your signature</div>
                </button>
                <button
                  onClick={() => setSignatureType('upload')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    signatureType === 'upload'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  <div className="text-2xl mb-2">📁</div>
                  <div className="font-medium text-gray-900 dark:text-white">Upload Signature</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Upload signature image</div>
                </button>
              </div>
            </div>

            {/* Text Signature Options */}
            {signatureType === 'text' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Signature Text:
                    </label>
                    <input
                      type="text"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="Enter your signature text..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Font Size:
                    </label>
                    <input
                      type="number"
                      value={signatureSize}
                      onChange={(e) => setSignatureSize(Number(e.target.value))}
                      min="8"
                      max="48"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Signature Color:
                    </label>
                    <input
                      type="color"
                      value={signatureColor}
                      onChange={(e) => setSignatureColor(e.target.value)}
                      className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Position:
                    </label>
                    <select
                      value={signaturePosition}
                      onChange={(e) => setSignaturePosition(e.target.value as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                      <option value="center">Center</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Draw Signature Options */}
            {signatureType === 'draw' && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Draw Signature</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Drawing signature functionality is currently in development. In the full version, you would be able to:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                  <li>Draw your signature with mouse or touch</li>
                  <li>Save and reuse signature templates</li>
                  <li>Adjust signature size and position</li>
                  <li>Export signature as image</li>
                </ul>
              </div>
            )}

            {/* Upload Signature Options */}
            {signatureType === 'upload' && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Upload Signature</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Upload signature functionality is currently in development. In the full version, you would be able to:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                  <li>Upload signature images (PNG, JPG, SVG)</li>
                  <li>Resize and position uploaded signatures</li>
                  <li>Save signature templates for reuse</li>
                  <li>Support transparent backgrounds</li>
                </ul>
              </div>
            )}

            {/* Additional Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="signatureDate"
                  checked={signatureDate}
                  onChange={(e) => setSignatureDate(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="signatureDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include signature date
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Signature Reason (optional):
                </label>
                <input
                  type="text"
                  value={signatureReason}
                  onChange={(e) => setSignatureReason(e.target.value)}
                  placeholder="e.g., I approve this document"
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
              <PenTool className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Signing PDF...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Adding signature to your document
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
              Signing Failed
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
        {signResult && (
          <div className="space-y-6">
            {signResult.success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  PDF Signed!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your PDF has been successfully signed
                </p>

                {/* File Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Original Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(signResult.originalSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Signed Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(signResult.signedSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Pages Processed:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {signResult.pagesProcessed}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={downloadSignedFile}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Signed PDF
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Sign Another PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Signing Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {signResult.error || 'Unable to sign the PDF document'}
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
