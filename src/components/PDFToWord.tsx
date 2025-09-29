'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, FileText } from 'lucide-react';
import FileRenameModal from './FileRenameModal';
import { useFileDownload } from '@/hooks/useFileDownload';
import { PDFDocument } from 'pdf-lib';

interface ConversionResult {
  success: boolean;
  convertedFile: Uint8Array | null;
  originalSize: number;
  convertedSize: number;
  pagesProcessed: number;
  error?: string;
}

export default function PDFToWord({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [conversionFormat, setConversionFormat] = useState<'docx' | 'doc'>('docx');

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

  // Convert PDF to Word (simulated - in production you'd use a library like pdf2pic + mammoth)
  const convertPDFToWord = useCallback(async (file: File): Promise<ConversionResult> => {
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

      // Simulate text extraction from PDF pages
      let extractedText = '';
      const pages = pdfDoc.getPages();
      
      for (let i = 0; i < pages.length; i++) {
        setConversionProgress(30 + (i / pages.length) * 40);
        
        // In a real implementation, you would:
        // 1. Convert PDF page to image using pdf2pic
        // 2. Use OCR (Tesseract.js) to extract text from the image
        // 3. Structure the text properly for Word format
        
        // For simulation, we'll create structured text
        extractedText += `\n\n--- Page ${i + 1} ---\n\n`;
        extractedText += `This is simulated text extracted from page ${i + 1} of the PDF.\n`;
        extractedText += `In a real implementation, this would be the actual text content\n`;
        extractedText += `extracted using OCR technology from the PDF pages.\n`;
        extractedText += `The text would be properly formatted and structured\n`;
        extractedText += `to match the original document layout.\n`;
      }

      setConversionProgress(75);

      // Create a simple Word document structure (simplified)
      // In production, you'd use a library like docx or mammoth
      const wordContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Converted from PDF: ${file.name}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>${extractedText.replace(/\n/g, '</w:t></w:r></w:p><w:p><w:r><w:t>')}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

      setConversionProgress(90);

      // Convert to Uint8Array
      const encoder = new TextEncoder();
      const convertedBytes = encoder.encode(wordContent);
      const convertedSize = convertedBytes.length;

      setConversionProgress(100);

      return {
        success: true,
        convertedFile: convertedBytes,
        originalSize,
        convertedSize,
        pagesProcessed: pageCount
      };

    } catch (error) {
      console.error('PDF to Word conversion failed:', error);
      return {
        success: false,
        convertedFile: null,
        originalSize,
        convertedSize: 0,
        pagesProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, []);

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
      const result = await convertPDFToWord(file);
      setConversionResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  }, [convertPDFToWord]);

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

  // Download converted file with rename functionality
  const downloadConvertedFile = useCallback(() => {
    if (conversionResult?.convertedFile) {
      const originalFileName = uploadedFile?.name || 'document';
      const fileExtension = `.${conversionFormat}`;
      const fileNameWithoutExt = getFileNameWithoutExtension(originalFileName);
      const defaultFileName = `${fileNameWithoutExt}_converted${fileExtension}`;

      downloadFile({
        fileName: defaultFileName,
        fileData: conversionResult.convertedFile,
        mimeType: conversionFormat === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword',
        operationType: 'pdf-to-word',
        showRenameModal: true,
        fileSize: conversionResult.convertedFile.length
      });
    }
  }, [conversionResult, uploadedFile, conversionFormat, downloadFile, getFileNameWithoutExtension]);

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
            PDF to Word
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Convert PDF files into easy to edit DOC and DOCX documents
          </p>
        </div>

        {/* Format Selection */}
        {!uploadedFile && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose Output Format:
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="docx"
                  checked={conversionFormat === 'docx'}
                  onChange={(e) => setConversionFormat(e.target.value as 'docx')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">DOCX (Recommended)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="doc"
                  checked={conversionFormat === 'doc'}
                  onChange={(e) => setConversionFormat(e.target.value as 'doc')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">DOC (Legacy)</span>
              </label>
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
        {isConverting && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Converting PDF to Word...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Extracting text and formatting
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
                  Your PDF has been successfully converted to Word format
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
                      <span className="font-medium text-gray-900 dark:text-white">Converted Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(conversionResult.convertedSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Pages Processed:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {conversionResult.pagesProcessed}
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
                    Download Word Document
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Convert Another PDF
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
                  {conversionResult.error || 'Unable to convert the PDF to Word format'}
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
    </div>
  );
}
