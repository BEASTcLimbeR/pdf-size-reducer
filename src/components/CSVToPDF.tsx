'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, FileSpreadsheet, FileText } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

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
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tableSettings, setTableSettings] = useState({
    fontSize: 10,
    includeHeaders: true,
    pageOrientation: 'portrait' as 'portrait' | 'landscape',
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
      setError('Please enter CSV content or upload a CSV file');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      // Parse CSV content
      const rows = parseCSV(csvContent);
      if (rows.length === 0) {
        throw new Error('No data found in CSV');
      }

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

      const pdfBytes = await pdfDoc.save();
      
      const conversionResult: ConversionResult = {
        convertedFile: pdfBytes,
        originalSize: csvContent.length,
        convertedSize: pdfBytes.length,
        pagesCount: pdfDoc.getPages().length,
        rowsCount: rows.length,
      };

      setResult(conversionResult);
    } catch (err) {
      setError('Failed to convert CSV to PDF. Please check your CSV format and try again.');
      console.error('Conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  }, [csvContent, tableSettings, parseCSV]);

  const handleDownload = useCallback(() => {
    if (!result) return;

    const arrayBuffer = result.convertedFile.buffer.slice(0) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-csv.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  const handleReset = useCallback(() => {
    setCsvContent('');
    setCsvFile(null);
    setResult(null);
    setError(null);
    setIsConverting(false);
  }, []);

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

            {/* Error Message */}
            {error && (
              <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={isConverting || !csvContent.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              {isConverting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Converting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Convert to PDF
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Conversion Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your CSV has been successfully converted to PDF
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Original Size</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {result.originalSize.toLocaleString()} characters
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">PDF Size</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {(result.convertedSize / 1024).toFixed(2)} KB
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Pages</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {result.pagesCount}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Rows</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {result.rowsCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Download PDF
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Convert Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
