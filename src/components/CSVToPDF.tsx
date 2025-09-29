'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, FileSpreadsheet, FileText } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';
import EnhancedProgressBar from './EnhancedProgressBar';
import SuccessAnimation from './SuccessAnimation';
import FileRenameModal from './FileRenameModal';
import { useProgress } from '@/hooks/useProgress';
import { useUserActivityTracker } from '@/hooks/useUserActivityTracker';
import { useFileDownload } from '@/hooks/useFileDownload';
// Dynamic import for pdf-lib to avoid chunk loading issues

interface ConversionResult {
  convertedFile: Uint8Array;
  originalSize: number;
  convertedSize: number;
  pagesCount: number;
  rowsCount: number;
}

export default function CSVToPDF({ onReset }: { onReset: () => void }) {
  const [csvContent, setCsvContent] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [tableSettings, setTableSettings] = useState({
    fontSize: 10,
    includeHeaders: true,
    pageOrientation: 'portrait' as 'portrait' | 'landscape',
  });
  const { trackFileOperation, trackWorkflowStep, trackUserPreference, trackPerformance } = useUserActivityTracker();
  
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

  const {
    steps,
    isProcessing,
    error,
    startProcessing,
    completeStep,
    setStepError,
    cancelProcessing,
    resetProgress
  } = useProgress({
    steps: [
      { id: 'validate', label: 'Validating CSV data', estimatedTime: 2 },
      { id: 'parse', label: 'Parsing CSV content', estimatedTime: 3 },
      { id: 'create-pdf', label: 'Creating PDF document', estimatedTime: 5 },
      { id: 'format-table', label: 'Formatting table layout', estimatedTime: 4 },
      { id: 'finalize', label: 'Finalizing PDF', estimatedTime: 2 }
    ],
    onComplete: () => {
      // Conversion completed successfully
    },
    onError: (err) => {
      console.error('Conversion error:', err);
    },
    onCancel: async () => {
      // Handle cancellation
      resetProgress();
    }
  });

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setError(null);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvContent(e.target?.result as string || '');
      };
      reader.readAsText(file);
    } else {
      setError('Please select a valid CSV file');
    }
  }, []);

  const parseCSV = useCallback((content: string) => {
    const lines = content.trim().split('\n');
    return lines.map(line => {
      // Simple CSV parsing (handles basic cases)
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  }, []);

  const handleConvert = useCallback(async () => {
    if (!csvContent.trim()) {
      setStepError('validate', 'Please enter CSV content or upload a CSV file');
      return;
    }

    const startTime = Date.now();
    startProcessing();

    // Track conversion start
    trackFileOperation('csv-to-pdf', 'conversion_started', {
      fileName: csvFile?.name || 'text_input',
      fileSize: csvContent.length,
      fileType: 'text/csv',
      success: false,
      processingTime: 0
    });

    try {
      // Step 1: Validate CSV data
      await new Promise(resolve => setTimeout(resolve, 1000));
      completeStep('validate');
      trackWorkflowStep('csv-to-pdf', 'validate', {
        stepNumber: 1,
        totalSteps: 5,
        stepDuration: 1000,
        success: true
      });

      // Step 2: Parse CSV content
      await new Promise(resolve => setTimeout(resolve, 1000));
      const rows = parseCSV(csvContent);
      if (rows.length === 0) {
        throw new Error('No data found in CSV');
      }
      completeStep('parse');
      trackWorkflowStep('csv-to-pdf', 'parse', {
        stepNumber: 2,
        totalSteps: 5,
        stepDuration: 1000,
        success: true
      });

      // Step 3: Create PDF document
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { PDFDocument, rgb } = await import('pdf-lib');
      completeStep('create-pdf');
      trackWorkflowStep('csv-to-pdf', 'create_pdf', {
        stepNumber: 3,
        totalSteps: 5,
        stepDuration: 1000,
        success: true
      });

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont('Helvetica');
      const boldFont = await pdfDoc.embedFont('Helvetica-Bold');
      
      const pageWidth = tableSettings.pageOrientation === 'landscape' ? 841.89 : 595.28;
      const pageHeight = tableSettings.pageOrientation === 'landscape' ? 595.28 : 841.89;
      
      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let yPosition = pageHeight - 50;
      const lineHeight = tableSettings.fontSize + 4;
      const margin = 50;
      const maxWidth = pageWidth - (margin * 2);
      
      // Calculate column widths
      const numColumns = rows[0].length;
      const columnWidth = maxWidth / numColumns;
      
      // Add title
      currentPage.drawText('CSV to PDF Conversion', {
        x: margin,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
      
      // Step 4: Format table layout
      await new Promise(resolve => setTimeout(resolve, 1000));
      completeStep('format-table');
      trackWorkflowStep('csv-to-pdf', 'format_table', {
        stepNumber: 4,
        totalSteps: 5,
        stepDuration: 1000,
        success: true
      });
      
      // Add table
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        
        // Check if we need a new page
        if (yPosition < 100) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - 50;
        }
        
        // Draw row background for headers
        if (tableSettings.includeHeaders && rowIndex === 0) {
          currentPage.drawRectangle({
            x: margin,
            y: yPosition - 5,
            width: maxWidth,
            height: lineHeight + 5,
            color: rgb(0.9, 0.9, 0.9),
          });
        }
        
        // Draw cell borders and content
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const cellX = margin + (colIndex * columnWidth);
          const cellContent = row[colIndex].substring(0, 20); // Truncate long content
          
          // Draw cell border
          currentPage.drawRectangle({
            x: cellX,
            y: yPosition - 5,
            width: columnWidth,
            height: lineHeight + 5,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 0.5,
          });
          
          // Draw cell content
          currentPage.drawText(cellContent, {
            x: cellX + 5,
            y: yPosition,
            size: tableSettings.fontSize,
            font: (tableSettings.includeHeaders && rowIndex === 0) ? boldFont : font,
            color: rgb(0, 0, 0),
          });
        }
        
        yPosition -= lineHeight + 5;
      }
      
      // Add footer
      const lastPage = pdfDoc.getPages()[pdfDoc.getPages().length - 1];
      lastPage.drawText('Generated by DocNestly', {
        x: margin,
        y: 30,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });

      pdfDoc.setCreator('DocNestly - CSV to PDF');
      pdfDoc.setTitle('CSV to PDF Conversion');
      pdfDoc.setSubject('Converted CSV data to PDF table');

      // Step 5: Finalize PDF
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pdfBytes = await pdfDoc.save();
      
      const conversionResult: ConversionResult = {
        convertedFile: pdfBytes,
        originalSize: csvContent.length,
        convertedSize: pdfBytes.length,
        pagesCount: pdfDoc.getPages().length,
        rowsCount: rows.length,
      };

      setResult(conversionResult);
      completeStep('finalize');
      
      // Track successful conversion
      const totalProcessingTime = Date.now() - startTime;
      trackFileOperation('csv-to-pdf', 'conversion_completed', {
        fileName: csvFile?.name || 'text_input',
        fileSize: csvContent.length,
        fileType: 'text/csv',
        success: true,
        processingTime: totalProcessingTime
      });
      
      trackPerformance('csv-to-pdf', 'csv_to_pdf_conversion', {
        duration: totalProcessingTime,
        fileSize: csvContent.length,
        success: true
      });
      
      trackWorkflowStep('csv-to-pdf', 'finalize', {
        stepNumber: 5,
        totalSteps: 5,
        stepDuration: 1000,
        success: true
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setStepError('validate', `Failed to convert CSV to PDF: ${errorMessage}`);
      console.error('Conversion error:', err);
      
      // Track conversion failure
      trackFileOperation('csv-to-pdf', 'conversion_failed', {
        fileName: csvFile?.name || 'text_input',
        fileSize: csvContent.length,
        fileType: 'text/csv',
        success: false,
        processingTime: Date.now() - startTime,
        error: errorMessage
      });
    }
  }, [csvContent, tableSettings, parseCSV, startProcessing, completeStep, setStepError, trackFileOperation, trackWorkflowStep, trackPerformance, csvFile]);

  const handleDownload = useCallback(() => {
    if (!result) return;

    const originalFileName = csvFile?.name || 'converted-csv';
    const fileExtension = '.pdf';
    const fileNameWithoutExt = getFileNameWithoutExtension(originalFileName);
    const defaultFileName = `${fileNameWithoutExt}_converted${fileExtension}`;

    downloadFile({
      fileName: defaultFileName,
      fileData: result.convertedFile,
      mimeType: 'application/pdf',
      operationType: 'csv-to-pdf',
      showRenameModal: true,
      fileSize: result.convertedSize
    });
  }, [result, csvFile, downloadFile, getFileNameWithoutExtension]);

  const handleReset = useCallback(() => {
    setCsvContent('');
    setCsvFile(null);
    setResult(null);
    resetProgress();
    
    // Track reset
    trackFileOperation('csv-to-pdf', 'tool_reset', {
      fileName: 'none',
      fileSize: 0,
      fileType: 'none',
      success: true,
      processingTime: 0
    });
  }, [resetProgress, trackFileOperation]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            CSV to PDF Converter
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Convert CSV files to PDF tables with customizable formatting
          </p>
        </div>

        {!result ? (
          <div className="space-y-6">
            {/* Enhanced Progress Bar */}
            {isProcessing && (
              <EnhancedProgressBar
                steps={steps.map(step => ({
                  id: step.id,
                  label: step.label,
                  status: step.status,
                  progress: step.progress,
                  estimatedTime: step.estimatedTime,
                  startTime: step.startTime,
                  endTime: step.endTime,
                  error: step.error
                }))}
                currentStepIndex={steps.findIndex(step => step.status === 'active')}
                isProcessing={isProcessing}
                showTimeEstimate={true}
                showCancelButton={true}
                onCancel={cancelProcessing}
                variant="detailed"
                className="mb-6"
              />
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}
            {/* Input Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Choose Input Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setInputMode('text')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    inputMode === 'text'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <FileText className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="font-medium">Paste CSV</div>
                  <div className="text-sm text-gray-500">Enter CSV content</div>
                </button>
                <button
                  onClick={() => setInputMode('file')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    inputMode === 'file'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Upload className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="font-medium">Upload File</div>
                  <div className="text-sm text-gray-500">Select CSV file</div>
                </button>
              </div>
            </div>

            {/* CSV Content Input */}
            {inputMode === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CSV Content
                </label>
                <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="Paste your CSV content here..."
                  className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white font-mono text-sm"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter CSV data with comma-separated values
                </p>
              </div>
            )}

            {/* File Upload */}
            {inputMode === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
                    <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {csvFile ? csvFile.name : 'Click to upload CSV file'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Supports .csv files up to 10MB
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Table Settings */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Table Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Size
                  </label>
                  <select
                    value={tableSettings.fontSize}
                    onChange={(e) => setTableSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  >
                    <option value={8}>8pt</option>
                    <option value={9}>9pt</option>
                    <option value={10}>10pt</option>
                    <option value={11}>11pt</option>
                    <option value={12}>12pt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Orientation
                  </label>
                  <select
                    value={tableSettings.pageOrientation}
                    onChange={(e) => setTableSettings(prev => ({ ...prev, pageOrientation: e.target.value as 'portrait' | 'landscape' }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={tableSettings.includeHeaders}
                      onChange={(e) => setTableSettings(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                      className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Include Headers
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            {!isProcessing && (
              <button
                onClick={handleConvert}
                disabled={!csvContent.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Convert to PDF
              </button>
            )}
          </div>
        ) : (
          <SuccessAnimation
            title="Conversion Complete!"
            message="Your CSV has been successfully converted to PDF"
            stats={[
              {
                label: 'Original Size',
                value: `${result.originalSize.toLocaleString()} characters`,
                icon: <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              },
              {
                label: 'PDF Size',
                value: `${(result.convertedSize / 1024).toFixed(2)} KB`,
                icon: <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
              },
              {
                label: 'Pages',
                value: result.pagesCount.toString(),
                icon: <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              },
              {
                label: 'Rows',
                value: result.rowsCount.toString(),
                icon: <FileSpreadsheet className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              }
            ]}
            onAction={handleDownload}
            actionLabel="Download PDF"
            actionIcon={<Download className="h-5 w-5" />}
            showConfetti={true}
            className="mb-6"
          />
        )}

        {/* Reset Button */}
        {result && (
          <div className="text-center">
            <button
              onClick={handleReset}
              className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Convert Another
            </button>
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
