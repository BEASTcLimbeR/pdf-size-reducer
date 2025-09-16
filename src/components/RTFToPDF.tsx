'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, FileText, Type } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

interface ConversionResult {
  convertedFile: Uint8Array;
  originalSize: number;
  convertedSize: number;
  pagesCount: number;
  paragraphsCount: number;
}

export default function RTFToPDF({ onReset }: { onReset: () => void }) {
  const [rtfContent, setRtfContent] = useState('');
  const [rtfFile, setRtfFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formatSettings, setFormatSettings] = useState({
    fontSize: 12,
    lineSpacing: 1.2,
    pageSize: 'a4' as 'a4' | 'letter' | 'legal',
    orientation: 'portrait' as 'portrait' | 'landscape',
    fontFamily: 'helvetica' as 'helvetica' | 'times' | 'courier',
    includePageNumbers: true,
    preserveFormatting: true,
  });

  const pageSizes = {
    a4: [595.28, 841.89],
    letter: [612, 792],
    legal: [612, 1008],
  };

  const fonts = {
    helvetica: 'Helvetica',
    times: 'Times-Roman',
    courier: 'Courier',
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/rtf' || file.name.endsWith('.rtf'))) {
      setRtfFile(file);
      setError(null);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        setRtfContent(e.target?.result as string || '');
      };
      reader.readAsText(file);
    } else {
      setError('Please select a valid RTF file (.rtf)');
    }
  }, []);

  // Simple RTF parser to extract plain text and basic formatting
  const parseRTF = useCallback((rtfText: string) => {
    // Remove RTF control codes and extract plain text
    const plainText = rtfText
      .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF commands
      .replace(/[{}]/g, '') // Remove braces
      .replace(/\\[\\{}]/g, '') // Remove escaped characters
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .trim();

    // Split into paragraphs
    const paragraphs = plainText.split('\n\n').filter(p => p.trim().length > 0);
    
    return {
      plainText,
      paragraphs,
    };
  }, []);

  const handleConvert = useCallback(async () => {
    if (!rtfContent.trim()) {
      setError('Please enter RTF content or upload an RTF file');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const { plainText, paragraphs } = parseRTF(rtfContent);
      
      if (plainText.trim().length === 0) {
        throw new Error('No readable content found in RTF file');
      }

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(fonts[formatSettings.fontFamily]);
      const boldFont = await pdfDoc.embedFont('Helvetica-Bold');
      
      const pageWidth = formatSettings.orientation === 'landscape' 
        ? pageSizes[formatSettings.pageSize][1] 
        : pageSizes[formatSettings.pageSize][0];
      const pageHeight = formatSettings.orientation === 'landscape' 
        ? pageSizes[formatSettings.pageSize][0] 
        : pageSizes[formatSettings.pageSize][1];
      
      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let yPosition = pageHeight - 50;
      const margin = 50;
      const maxWidth = pageWidth - (margin * 2);
      const lineHeight = formatSettings.fontSize * formatSettings.lineSpacing;
      
      // Add title
      currentPage.drawText('RTF to PDF Conversion', {
        x: margin,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
      
      // Add content
      let paragraphCount = 0;
      
      for (const paragraph of paragraphs) {
        // Check if we need a new page
        if (yPosition < 100) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - 50;
        }
        
        // Split paragraph into lines
        const lines = paragraph.split('\n');
        
        for (const line of lines) {
          if (yPosition < 100) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - 50;
          }
          
          // Handle long lines by wrapping them
          const words = line.split(' ');
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const textWidth = font.widthOfTextAtSize(testLine, formatSettings.fontSize);
            
            if (textWidth > maxWidth && currentLine) {
              // Draw current line and start new one
              currentPage.drawText(currentLine, {
                x: margin,
                y: yPosition,
                size: formatSettings.fontSize,
                font: font,
                color: rgb(0, 0, 0),
              });
              yPosition -= lineHeight;
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          
          // Draw remaining line
          if (currentLine.trim()) {
            currentPage.drawText(currentLine, {
              x: margin,
              y: yPosition,
              size: formatSettings.fontSize,
              font: font,
              color: rgb(0, 0, 0),
            });
            yPosition -= lineHeight;
          }
        }
        
        // Add space between paragraphs
        yPosition -= lineHeight * 0.5;
        paragraphCount++;
      }
      
      // Add page numbers if enabled
      if (formatSettings.includePageNumbers) {
        const pages = pdfDoc.getPages();
        pages.forEach((page, index) => {
          page.drawText(`Page ${index + 1}`, {
            x: pageWidth - 100,
            y: 30,
            size: 10,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });
        });
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

      pdfDoc.setCreator('DocNestly - RTF to PDF');
      pdfDoc.setTitle('RTF to PDF Conversion');
      pdfDoc.setSubject('Converted RTF content to PDF document');

      const pdfBytes = await pdfDoc.save();
      
      const conversionResult: ConversionResult = {
        convertedFile: pdfBytes,
        originalSize: rtfContent.length,
        convertedSize: pdfBytes.length,
        pagesCount: pdfDoc.getPages().length,
        paragraphsCount: paragraphCount,
      };

      setResult(conversionResult);
    } catch (err) {
      setError('Failed to convert RTF to PDF. Please check your RTF file and try again.');
      console.error('Conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  }, [rtfContent, formatSettings, parseRTF]);

  const handleDownload = useCallback(() => {
    if (!result) return;

    const arrayBuffer = result.convertedFile.buffer.slice(0) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-rtf.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  const handleReset = useCallback(() => {
    setRtfContent('');
    setRtfFile(null);
    setResult(null);
    setError(null);
    setIsConverting(false);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Type className="h-8 w-8 text-pink-600 dark:text-pink-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            RTF to PDF Converter
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Convert Rich Text Format files to PDF documents
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
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <FileText className="h-6 w-6 mx-auto mb-2 text-pink-600" />
                  <div className="font-medium">Paste RTF</div>
                  <div className="text-sm text-gray-500">Enter RTF content</div>
                </button>
                <button
                  onClick={() => setInputMode('file')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    inputMode === 'file'
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Upload className="h-6 w-6 mx-auto mb-2 text-pink-600" />
                  <div className="font-medium">Upload File</div>
                  <div className="text-sm text-gray-500">Select .rtf file</div>
                </button>
              </div>
            </div>

            {/* RTF Content Input */}
            {inputMode === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RTF Content
                </label>
                <textarea
                  value={rtfContent}
                  onChange={(e) => setRtfContent(e.target.value)}
                  placeholder="Paste your RTF content here..."
                  className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white font-mono text-sm"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter the RTF content you want to convert to PDF
                </p>
              </div>
            )}

            {/* File Upload */}
            {inputMode === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload RTF File
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".rtf,application/rtf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="rtf-upload"
                  />
                  <label
                    htmlFor="rtf-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
                    <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {rtfFile ? rtfFile.name : 'Click to upload RTF file'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Supports .rtf files up to 10MB
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Format Settings */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Format Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Size
                  </label>
                  <select
                    value={formatSettings.fontSize}
                    onChange={(e) => setFormatSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  >
                    <option value={8}>8pt</option>
                    <option value={9}>9pt</option>
                    <option value={10}>10pt</option>
                    <option value={11}>11pt</option>
                    <option value={12}>12pt</option>
                    <option value={14}>14pt</option>
                    <option value={16}>16pt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Family
                  </label>
                  <select
                    value={formatSettings.fontFamily}
                    onChange={(e) => setFormatSettings(prev => ({ ...prev, fontFamily: e.target.value as 'helvetica' | 'times' | 'courier' }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  >
                    <option value="helvetica">Helvetica</option>
                    <option value="times">Times Roman</option>
                    <option value="courier">Courier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Size
                  </label>
                  <select
                    value={formatSettings.pageSize}
                    onChange={(e) => setFormatSettings(prev => ({ ...prev, pageSize: e.target.value as 'a4' | 'letter' | 'legal' }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  >
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                    <option value="legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Orientation
                  </label>
                  <select
                    value={formatSettings.orientation}
                    onChange={(e) => setFormatSettings(prev => ({ ...prev, orientation: e.target.value as 'portrait' | 'landscape' }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Line Spacing
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step="0.1"
                    value={formatSettings.lineSpacing}
                    onChange={(e) => setFormatSettings(prev => ({ ...prev, lineSpacing: parseFloat(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formatSettings.includePageNumbers}
                      onChange={(e) => setFormatSettings(prev => ({ ...prev, includePageNumbers: e.target.checked }))}
                      className="mr-2 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Include Page Numbers
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formatSettings.preserveFormatting}
                      onChange={(e) => setFormatSettings(prev => ({ ...prev, preserveFormatting: e.target.checked }))}
                      className="mr-2 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Preserve Formatting
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
              disabled={isConverting || !rtfContent.trim()}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              {isConverting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Converting...
                </>
              ) : (
                <>
                  <Type className="h-5 w-5 mr-2" />
                  Convert to PDF
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full mx-auto">
              <CheckCircle className="h-8 w-8 text-pink-600 dark:text-pink-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Conversion Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your RTF file has been successfully converted to PDF
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
                  <div className="text-gray-500 dark:text-gray-400">Paragraphs</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {result.paragraphsCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
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
