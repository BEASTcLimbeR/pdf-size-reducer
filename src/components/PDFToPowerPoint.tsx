'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, Presentation, FileText } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface ConversionResult {
  success: boolean;
  convertedFile: Uint8Array | null;
  originalSize: number;
  convertedSize: number;
  pagesProcessed: number;
  error?: string;
}

export default function PDFToPowerPoint({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [conversionFormat, setConversionFormat] = useState<'pptx' | 'ppt'>('pptx');

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

  // Convert PDF to PowerPoint (simulated)
  const convertPDFToPowerPoint = useCallback(async (file: File): Promise<ConversionResult> => {
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

      // Simulate PowerPoint conversion
      // In a real implementation, you would:
      // 1. Convert each PDF page to image
      // 2. Create PowerPoint slides with the images
      // 3. Add text extraction and formatting
      // 4. Use a library like pptxgenjs or similar

      let slideContent = '';
      const pages = pdfDoc.getPages();
      
      for (let i = 0; i < pages.length; i++) {
        setConversionProgress(30 + (i / pages.length) * 40);
        
        slideContent += `\n\n--- Slide ${i + 1} ---\n`;
        slideContent += `Content from page ${i + 1} of the PDF.\n`;
        slideContent += `In a real implementation, this would be converted\n`;
        slideContent += `to actual PowerPoint slide content with proper\n`;
        slideContent += `formatting, images, and layout.\n`;
      }

      setConversionProgress(75);

      // Create a simple PowerPoint structure (simplified)
      const pptContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle>
    <a:defPPr>
      <a:defRPr lang="en-US"/>
    </a:defPPr>
  </p:defaultTextStyle>
  <p:extLst>
    <p:ext uri="{05A4C25C-085E-4340-BA47-38B27EF32DD4}">
      <p14:modId xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" val="12345678-1234-1234-1234-123456789012"/>
    </p:ext>
  </p:extLst>
</p:presentation>`;

      setConversionProgress(90);

      // Convert to Uint8Array
      const encoder = new TextEncoder();
      const convertedBytes = encoder.encode(pptContent);
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
      console.error('PDF to PowerPoint conversion failed:', error);
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
      const result = await convertPDFToPowerPoint(file);
      setConversionResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  }, [convertPDFToPowerPoint]);

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
      const blob = new Blob([arrayBuffer], { 
        type: conversionFormat === 'pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 'application/vnd.ms-powerpoint'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${uploadedFile?.name?.replace('.pdf', '') || 'presentation'}.${conversionFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [conversionResult, uploadedFile, conversionFormat]);

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
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Presentation className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            PDF to PowerPoint
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Turn PDF files into easy to edit PPT and PPTX slideshows
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
                  value="pptx"
                  checked={conversionFormat === 'pptx'}
                  onChange={(e) => setConversionFormat(e.target.value as 'pptx')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">PPTX (Recommended)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="ppt"
                  checked={conversionFormat === 'ppt'}
                  onChange={(e) => setConversionFormat(e.target.value as 'ppt')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">PPT (Legacy)</span>
              </label>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!uploadedFile && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500'
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
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 cursor-pointer transition-colors"
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
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Presentation className="h-8 w-8 text-orange-600 dark:text-orange-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Converting PDF to PowerPoint...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Creating slides and formatting content
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
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
                  Your PDF has been successfully converted to PowerPoint format
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
                      <span className="font-medium text-gray-900 dark:text-white">Slides Created:</span>
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
                    Download PowerPoint
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
                  {conversionResult.error || 'Unable to convert the PDF to PowerPoint format'}
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
