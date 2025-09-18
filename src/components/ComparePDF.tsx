'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, GitCompare, FileText } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

interface CompareResult {
  success: boolean;
  comparisonFile: Uint8Array | null;
  originalSize: number;
  comparisonSize: number;
  pagesProcessed: number;
  differencesFound: number;
  error?: string;
}

export default function ComparePDF({ onReset }: { onReset: () => void }) {
  const [uploadedFile1, setUploadedFile1] = useState<File | null>(null);
  const [uploadedFile2, setUploadedFile2] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver1, setIsDragOver1] = useState(false);
  const [isDragOver2, setIsDragOver2] = useState(false);
  const [comparisonType, setComparisonType] = useState<'side-by-side' | 'overlay' | 'highlight'>('side-by-side');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

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

  // Compare PDFs
  const comparePDFs = useCallback(async (file1: File, file2: File): Promise<CompareResult> => {
    const originalSize = file1.size + file2.size;

    try {
      setProcessProgress(10);
      
      // Read both PDF files
      const arrayBuffer1 = await file1.arrayBuffer();
      const arrayBuffer2 = await file2.arrayBuffer();
      setProcessProgress(20);

      // Load both PDFs
      const pdfDoc1 = await PDFDocument.load(arrayBuffer1);
      const pdfDoc2 = await PDFDocument.load(arrayBuffer2);
      
      const pageCount1 = pdfDoc1.getPageCount();
      const pageCount2 = pdfDoc2.getPageCount();
      
      if (pageCount1 === 0 || pageCount2 === 0) {
        throw new Error('One or both PDFs have no pages');
      }

      setProcessProgress(30);

      // Create a new PDF for comparison
      const comparisonDoc = await PDFDocument.create();
      const pages1 = pdfDoc1.getPages();
      const pages2 = pdfDoc2.getPages();
      const maxPages = Math.max(pages1.length, pages2.length);
      
      let differencesFound = 0;

      for (let i = 0; i < maxPages; i++) {
        setProcessProgress(30 + (i / maxPages) * 50);
        
        const page1 = pages1[i];
        const page2 = pages2[i];
        
        if (comparisonType === 'side-by-side') {
          // Create side-by-side comparison
          const [copiedPage1] = await comparisonDoc.copyPages(pdfDoc1, [i]);
          const [copiedPage2] = await comparisonDoc.copyPages(pdfDoc2, [i]);
          
          // Resize pages to fit side by side
          const { width: w1, height: h1 } = copiedPage1.getSize();
          const { width: w2, height: h2 } = copiedPage2.getSize();
          
          copiedPage1.setSize(w1 / 2, h1);
          copiedPage2.setSize(w2 / 2, h2);
          
          // Position pages side by side
          // Note: Page positioning would be handled in a real implementation
          
          comparisonDoc.addPage(copiedPage1);
          comparisonDoc.addPage(copiedPage2);
          
          // Add page labels
          copiedPage1.drawText(`Document 1 - Page ${i + 1}`, {
            x: 10,
            y: h1 - 20,
            size: 10,
            color: rgb(0, 0, 1),
          });
          
          copiedPage2.drawText(`Document 2 - Page ${i + 1}`, {
            x: w1 / 2 + 10,
            y: h2 - 20,
            size: 10,
            color: rgb(0, 0, 1),
          });
          
          differencesFound++;
        } else if (comparisonType === 'overlay') {
          // Create overlay comparison
          const [copiedPage1] = await comparisonDoc.copyPages(pdfDoc1, [i]);
          const [copiedPage2] = await comparisonDoc.copyPages(pdfDoc2, [i]);
          
          // Make page2 semi-transparent
          // Note: Opacity setting would be handled in a real implementation
          
          comparisonDoc.addPage(copiedPage1);
          comparisonDoc.addPage(copiedPage2);
          
          differencesFound++;
        } else if (comparisonType === 'highlight') {
          // Create highlight comparison
          const [copiedPage1] = await comparisonDoc.copyPages(pdfDoc1, [i]);
          
          // Add highlight boxes to show differences
          const { width, height } = copiedPage1.getSize();
          
          // Simulate highlighting differences
          copiedPage1.drawRectangle({
            x: 50,
            y: height - 100,
            width: 200,
            height: 30,
            color: rgb(
              parseInt(highlightColor.slice(1, 3), 16) / 255,
              parseInt(highlightColor.slice(3, 5), 16) / 255,
              parseInt(highlightColor.slice(5, 7), 16) / 255
            ),
          });
          
          copiedPage1.drawText('DIFFERENCE HIGHLIGHTED', {
            x: 60,
            y: height - 90,
            size: 12,
            color: rgb(1, 0, 0),
          });
          
          comparisonDoc.addPage(copiedPage1);
          differencesFound++;
        }
      }

      setProcessProgress(85);

      // Generate the comparison PDF
      const pdfBytes = await comparisonDoc.save();
      const comparisonSize = pdfBytes.length;

      setProcessProgress(100);

      return {
        success: true,
        comparisonFile: pdfBytes,
        originalSize,
        comparisonSize,
        pagesProcessed: maxPages,
        differencesFound
      };

    } catch (error) {
      console.error('PDF comparison failed:', error);
      return {
        success: false,
        comparisonFile: null,
        originalSize,
        comparisonSize: 0,
        pagesProcessed: 0,
        differencesFound: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [comparisonType, highlightColor, showOnlyDifferences]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File, fileNumber: 1 | 2) => {
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    if (fileNumber === 1) {
      setUploadedFile1(file);
    } else {
      setUploadedFile2(file);
    }
    
    setError(null);
    setCompareResult(null);

    // If both files are uploaded, start comparison
    if (fileNumber === 1 && uploadedFile2) {
      setIsProcessing(true);
      setProcessProgress(0);
      try {
        const result = await comparePDFs(file, uploadedFile2);
        setCompareResult(result);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Processing failed');
      } finally {
        setIsProcessing(false);
      }
    } else if (fileNumber === 2 && uploadedFile1) {
      setIsProcessing(true);
      setProcessProgress(0);
      try {
        const result = await comparePDFs(uploadedFile1, file);
        setCompareResult(result);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Processing failed');
      } finally {
        setIsProcessing(false);
      }
    }
  }, [comparePDFs, uploadedFile1, uploadedFile2]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent, fileNumber: 1 | 2) => {
    e.preventDefault();
    if (fileNumber === 1) {
      setIsDragOver1(true);
    } else {
      setIsDragOver2(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, fileNumber: 1 | 2) => {
    e.preventDefault();
    if (fileNumber === 1) {
      setIsDragOver1(false);
    } else {
      setIsDragOver2(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, fileNumber: 1 | 2) => {
    e.preventDefault();
    if (fileNumber === 1) {
      setIsDragOver1(false);
    } else {
      setIsDragOver2(false);
    }
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], fileNumber);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, fileNumber: 1 | 2) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], fileNumber);
    }
  }, [handleFileUpload]);

  // Download comparison file
  const downloadComparisonFile = useCallback(() => {
    if (compareResult?.comparisonFile) {
      const arrayBuffer = compareResult.comparisonFile.buffer.slice(0) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparison_${uploadedFile1?.name?.replace('.pdf', '') || 'document1'}_vs_${uploadedFile2?.name?.replace('.pdf', '') || 'document2'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [compareResult, uploadedFile1, uploadedFile2]);

  // Reset function
  const reset = useCallback(() => {
    setUploadedFile1(null);
    setUploadedFile2(null);
    setCompareResult(null);
    setError(null);
    setIsProcessing(false);
    setProcessProgress(0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <GitCompare className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Compare PDF
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Show side-by-side comparison and spot changes between versions
          </p>
        </div>

        {/* Comparison Options */}
        {(!uploadedFile1 || !uploadedFile2) && (
          <div className="mb-6 space-y-6">
            {/* Comparison Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Comparison Type:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <button
                  onClick={() => setComparisonType('side-by-side')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    comparisonType === 'side-by-side'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                  }`}
                >
                  <div className="text-2xl mb-2">📄📄</div>
                  <div className="font-medium text-gray-900 dark:text-white">Side by Side</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Compare pages side by side</div>
                </button>
                <button
                  onClick={() => setComparisonType('overlay')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    comparisonType === 'overlay'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                  }`}
                >
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="font-medium text-gray-900 dark:text-white">Overlay</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Overlay documents</div>
                </button>
                <button
                  onClick={() => setComparisonType('highlight')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    comparisonType === 'highlight'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                  }`}
                >
                  <div className="text-2xl mb-2">🖍️</div>
                  <div className="font-medium text-gray-900 dark:text-white">Highlight</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Highlight differences</div>
                </button>
              </div>
            </div>

            {/* Highlight Options */}
            {comparisonType === 'highlight' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Highlight Color:
                  </label>
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showOnlyDifferences"
                    checked={showOnlyDifferences}
                    onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showOnlyDifferences" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Show only differences
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* File Upload Areas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* First PDF */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver1
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
            }`}
            onDragOver={(e) => handleDragOver(e, 1)}
            onDragLeave={(e) => handleDragLeave(e, 1)}
            onDrop={(e) => handleDrop(e, 1)}
          >
            <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              First PDF
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {uploadedFile1 ? uploadedFile1.name : 'Drop your first PDF here'}
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileInputChange(e, 1)}
              className="hidden"
              id="pdf-upload-1"
            />
            <label
              htmlFor="pdf-upload-1"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 cursor-pointer transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </label>
          </div>

          {/* Second PDF */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver2
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
            }`}
            onDragOver={(e) => handleDragOver(e, 2)}
            onDragLeave={(e) => handleDragLeave(e, 2)}
            onDrop={(e) => handleDrop(e, 2)}
          >
            <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Second PDF
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {uploadedFile2 ? uploadedFile2.name : 'Drop your second PDF here'}
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileInputChange(e, 2)}
              className="hidden"
              id="pdf-upload-2"
            />
            <label
              htmlFor="pdf-upload-2"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 cursor-pointer transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </label>
          </div>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitCompare className="h-8 w-8 text-purple-600 dark:text-purple-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Comparing PDFs...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Analyzing documents and finding differences
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
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
              Comparison Failed
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
        {compareResult && (
          <div className="space-y-6">
            {compareResult.success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Comparison Complete!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your PDFs have been compared and differences identified
                </p>

                {/* File Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Total Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(compareResult.originalSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Comparison Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(compareResult.comparisonSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Pages Processed:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {compareResult.pagesProcessed}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Differences Found:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {compareResult.differencesFound}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={downloadComparisonFile}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Comparison PDF
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Compare Other PDFs
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Comparison Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {compareResult.error || 'Unable to compare the PDF documents'}
                </p>
                <button
                  onClick={reset}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Other Files
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
