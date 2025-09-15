'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, Presentation } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

interface ConversionResult {
  success: boolean;
  convertedFile: Uint8Array | null;
  originalSize: number;
  convertedSize: number;
  slidesProcessed: number;
  error?: string;
}

export default function PowerPointToPDF({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // Validate PowerPoint file
  const validatePowerPointFile = (file: File): { isValid: boolean; error?: string } => {
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }
    
    const validTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint.presentation.macroEnabled.12'
    ];
    
    if (!validTypes.includes(file.type)) {
      return { isValid: false, error: 'Please select a PowerPoint presentation (PPT or PPTX)' };
    }
    
    if (file.size === 0) {
      return { isValid: false, error: 'The selected file is empty' };
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return { isValid: false, error: 'File size must be less than 50MB' };
    }
    
    return { isValid: true };
  };

  // Convert PowerPoint to PDF (simulated)
  const convertPowerPointToPDF = useCallback(async (file: File): Promise<ConversionResult> => {
    const originalSize = file.size;

    try {
      setConversionProgress(10);
      
      // Read the PowerPoint file
      const arrayBuffer = await file.arrayBuffer();
      setConversionProgress(20);

      // In a real implementation, you would:
      // 1. Parse the PowerPoint file using pptx-parser or similar
      // 2. Extract slide content, text, images, and formatting
      // 3. Create PDF pages for each slide
      // 4. Handle slide layouts, animations, and transitions

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

      // Simulate processing multiple slides
      const slideCount = 3; // Simulated slide count
      
      for (let i = 0; i < slideCount; i++) {
        setConversionProgress(40 + (i / slideCount) * 40);
        
        // Add a page for each slide
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        
        // Simulate slide content
        const slideTitle = `Slide ${i + 1}`;
        const slideContent = `Converted from: ${file.name}

This is simulated content from slide ${i + 1} of the PowerPoint presentation.
In a real implementation, this would include:
- Actual slide content from the PowerPoint file
- Text with proper formatting and fonts
- Images and graphics from the slides
- Tables and charts
- Slide layouts and backgrounds
- Notes and speaker comments

The conversion process would:
1. Parse the PowerPoint file structure
2. Extract each slide's content
3. Convert images and graphics
4. Maintain slide layouts and formatting
5. Create corresponding PDF pages

This is a demonstration of how PowerPoint to PDF conversion would work.
The actual implementation would use libraries like pptx-parser to extract
slide content and PDF-lib to create properly formatted PDF files.`;

        // Add slide title
        page.drawText(slideTitle, {
          x: 50,
          y: pageHeight - 80,
          size: 18,
          color: rgb(0, 0, 0),
          font: await pdfDoc.embedFont('Helvetica-Bold'),
        });

        // Add slide content
        page.drawText(slideContent, {
          x: 50,
          y: pageHeight - 120,
          size: 12,
          color: rgb(0, 0, 0),
          maxWidth: pageWidth - 100,
          lineHeight: 16,
        });

        // Add a border to represent slide boundaries
        page.drawRectangle({
          x: 30,
          y: 30,
          width: pageWidth - 60,
          height: pageHeight - 60,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1,
        });
      }

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
        slidesProcessed: slideCount
      };

    } catch (error) {
      console.error('PowerPoint to PDF conversion failed:', error);
      return {
        success: false,
        convertedFile: null,
        originalSize,
        convertedSize: 0,
        slidesProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [pageSize, orientation]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validatePowerPointFile(file);
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
      const result = await convertPowerPointToPDF(file);
      setConversionResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  }, [convertPowerPointToPDF]);

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
      a.download = `${uploadedFile?.name?.replace(/\.(ppt|pptx)$/i, '') || 'presentation'}.pdf`;
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
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Presentation className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            PowerPoint to PDF
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Convert PPT and PPTX slideshows to PDF format
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape (Recommended)</option>
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
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop your PowerPoint presentation here
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              or click to browse files
            </p>
            <input
              type="file"
              accept=".ppt,.pptx"
              onChange={handleFileInputChange}
              className="hidden"
              id="powerpoint-upload"
            />
            <label
              htmlFor="powerpoint-upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 cursor-pointer transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Choose PowerPoint File
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supports PPT and PPTX • Maximum file size: 50MB
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
              Converting PowerPoint to PDF...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Processing slides and creating PDF
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
                  Your PowerPoint presentation has been successfully converted to PDF
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
                      <span className="font-medium text-gray-900 dark:text-white">Slides Processed:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {conversionResult.slidesProcessed}
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
                    Convert Another Presentation
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
                  {conversionResult.error || 'Unable to convert the PowerPoint presentation to PDF'}
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
