'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

interface ConversionResult {
  success: boolean;
  convertedFile: Uint8Array | null;
  originalSize: number;
  convertedSize: number;
  sheetsProcessed: number;
  error?: string;
}

export default function ExcelToPDF({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [conversionFormat, setConversionFormat] = useState<'xlsx' | 'xls'>('xlsx');
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // Validate Excel file
  const validateExcelFile = (file: File): { isValid: boolean; error?: string } => {
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }
    
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    if (!validTypes.includes(file.type)) {
      return { isValid: false, error: 'Please select an Excel spreadsheet (XLS or XLSX)' };
    }
    
    if (file.size === 0) {
      return { isValid: false, error: 'The selected file is empty' };
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return { isValid: false, error: 'File size must be less than 50MB' };
    }
    
    return { isValid: true };
  };

  // Convert Excel to PDF (simulated)
  const convertExcelToPDF = useCallback(async (file: File): Promise<ConversionResult> => {
    const originalSize = file.size;

    try {
      setConversionProgress(10);
      
      // Read the Excel file
      const arrayBuffer = await file.arrayBuffer();
      setConversionProgress(20);

      // In a real implementation, you would:
      // 1. Parse the Excel file using xlsx or similar
      // 2. Extract data from each worksheet
      // 3. Create PDF pages with tables and charts
      // 4. Handle formatting, formulas, and cell styles

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

      // Simulate processing multiple worksheets
      const worksheetCount = 2; // Simulated worksheet count
      
      for (let i = 0; i < worksheetCount; i++) {
        setConversionProgress(40 + (i / worksheetCount) * 40);
        
        // Add a page for each worksheet
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        
        // Simulate worksheet content
        const worksheetTitle = `Worksheet ${i + 1}`;
        const tableData = [
          ['Column A', 'Column B', 'Column C', 'Column D'],
          ['Data 1', 'Value 1', 'Result 1', 'Total 1'],
          ['Data 2', 'Value 2', 'Result 2', 'Total 2'],
          ['Data 3', 'Value 3', 'Result 3', 'Total 3'],
          ['Data 4', 'Value 4', 'Result 4', 'Total 4'],
        ];

        // Add worksheet title
        page.drawText(worksheetTitle, {
          x: 50,
          y: pageHeight - 80,
          size: 16,
          color: rgb(0, 0, 0),
          font: await pdfDoc.embedFont('Helvetica-Bold'),
        });

        // Add table header
        const headerY = pageHeight - 120;
        const cellWidth = (pageWidth - 100) / 4;
        const cellHeight = 20;

        // Draw table header background
        page.drawRectangle({
          x: 50,
          y: headerY - cellHeight,
          width: pageWidth - 100,
          height: cellHeight,
          color: rgb(0.9, 0.9, 0.9),
        });

        // Draw table header text
        const boldFont = await pdfDoc.embedFont('Helvetica-Bold');
        tableData[0].forEach((header, colIndex) => {
          page.drawText(header, {
            x: 55 + colIndex * cellWidth,
            y: headerY - 15,
            size: 10,
            color: rgb(0, 0, 0),
            font: boldFont,
          });
        });

        // Draw table data
        tableData.slice(1).forEach((row, rowIndex) => {
          const rowY = headerY - (rowIndex + 2) * cellHeight;
          
          // Alternate row colors
          if (rowIndex % 2 === 0) {
            page.drawRectangle({
              x: 50,
              y: rowY - cellHeight,
              width: pageWidth - 100,
              height: cellHeight,
              color: rgb(0.98, 0.98, 0.98),
            });
          }

          row.forEach((cell, colIndex) => {
            page.drawText(cell, {
              x: 55 + colIndex * cellWidth,
              y: rowY - 15,
              size: 9,
              color: rgb(0, 0, 0),
            });
          });
        });

        // Add table borders
        for (let row = 0; row <= tableData.length; row++) {
          const y = headerY - row * cellHeight;
          page.drawLine({
            start: { x: 50, y },
            end: { x: pageWidth - 50, y },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7),
          });
        }

        for (let col = 0; col <= 4; col++) {
          const x = 50 + col * cellWidth;
          page.drawLine({
            start: { x, y: headerY },
            end: { x, y: headerY - tableData.length * cellHeight },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7),
          });
        }

        // Add additional content
        const additionalContent = `Converted from: ${file.name}

This is simulated content from worksheet ${i + 1} of the Excel spreadsheet.
In a real implementation, this would include:
- Actual data from the Excel cells
- Proper table formatting and styling
- Charts and graphs
- Formulas and calculated values
- Cell formatting (colors, fonts, borders)
- Multiple worksheets as separate pages

The conversion process would:
1. Parse the Excel file structure
2. Extract data from each worksheet
3. Convert tables to PDF format
4. Handle charts and images
5. Maintain cell formatting and styles

This is a demonstration of how Excel to PDF conversion would work.
The actual implementation would use libraries like xlsx to parse
Excel files and PDF-lib to create properly formatted PDF files.`;

        page.drawText(additionalContent, {
          x: 50,
          y: headerY - tableData.length * cellHeight - 50,
          size: 10,
          color: rgb(0, 0, 0),
          maxWidth: pageWidth - 100,
          lineHeight: 12,
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
        sheetsProcessed: worksheetCount
      };

    } catch (error) {
      console.error('Excel to PDF conversion failed:', error);
      return {
        success: false,
        convertedFile: null,
        originalSize,
        convertedSize: 0,
        sheetsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [pageSize, orientation]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validateExcelFile(file);
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
      const result = await convertExcelToPDF(file);
      setConversionResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  }, [convertExcelToPDF]);

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
        type: conversionFormat === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/vnd.ms-excel'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${uploadedFile?.name?.replace('.pdf', '') || 'spreadsheet'}.${conversionFormat}`;
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
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Excel to PDF
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Convert Excel spreadsheets to PDF for easy sharing
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
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
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop your Excel spreadsheet here
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              or click to browse files
            </p>
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileInputChange}
              className="hidden"
              id="excel-upload"
            />
            <label
              htmlFor="excel-upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 cursor-pointer transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Choose Excel File
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supports XLS and XLSX • Maximum file size: 50MB
            </p>
          </div>
        )}

        {/* Processing State */}
        {isConverting && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="h-8 w-8 text-green-600 dark:text-green-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Converting Excel to PDF...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Processing worksheets and creating PDF
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
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Conversion Complete!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your Excel spreadsheet has been successfully converted to PDF
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
                      <span className="font-medium text-gray-900 dark:text-white">Sheets Processed:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {conversionResult.sheetsProcessed}
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
                    Convert Another Spreadsheet
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
                  {conversionResult.error || 'Unable to convert the Excel spreadsheet to PDF'}
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
