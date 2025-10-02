'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, RotateCcw, Loader2, CheckCircle, AlertCircle, Scissors } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import SuccessAnimation from './SuccessAnimation';

interface SplitPDFProps {
  onReset?: () => void;
}

interface SplitOption {
  id: string;
  name: string;
  description: string;
  pages: string;
}

export default function SplitPDF({ onReset }: SplitPDFProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [splitOption, setSplitOption] = useState<'all' | 'range' | 'custom'>('all');
  const [customPages, setCustomPages] = useState('');
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitFiles, setSplitFiles] = useState<Uint8Array[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file drop/selection
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only.');
      return;
    }

    try {
      setUploadedFile(file);
      const arrayBuffer = await file.arrayBuffer();
      const loadedPdf = await PDFDocument.load(arrayBuffer);
      setPdfDoc(loadedPdf);
      
      const pageCount = loadedPdf.getPageCount();
      setTotalPages(pageCount);
      setEndPage(pageCount);
      
      if (pageCount === 0) {
        setError('The PDF file appears to be empty.');
        return;
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF. The file may be corrupted.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  // Split PDF based on selected option
  const splitPDF = async () => {
    if (!pdfDoc || !uploadedFile) return;

    try {
      setIsSplitting(true);
      setError(null);
      setSplitFiles([]);

      const newSplitFiles: Uint8Array[] = [];

      if (splitOption === 'all') {
        // Split into individual pages
        for (let i = 0; i < totalPages; i++) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(copiedPage);
          
          const pdfBytes = await newPdf.save();
          newSplitFiles.push(pdfBytes);
        }
      } else if (splitOption === 'range') {
        // Split by page range
        if (startPage < 1 || endPage > totalPages || startPage > endPage) {
          setError('Invalid page range. Please check your input.');
          return;
        }

        const newPdf = await PDFDocument.create();
        const pageIndices = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage - 1 + i);
        const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        newSplitFiles.push(pdfBytes);
      } else if (splitOption === 'custom') {
        // Split by custom page selection
        const pageNumbers = customPages
          .split(',')
          .map(p => parseInt(p.trim()))
          .filter(p => !isNaN(p) && p >= 1 && p <= totalPages)
          .sort((a, b) => a - b);

        if (pageNumbers.length === 0) {
          setError('Please enter valid page numbers.');
          return;
        }

        const newPdf = await PDFDocument.create();
        const pageIndices = pageNumbers.map(p => p - 1);
        const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        newSplitFiles.push(pdfBytes);
      }

      setSplitFiles(newSplitFiles);
    } catch (err) {
      console.error('Split error:', err);
      setError('Failed to split PDF. Please try again.');
    } finally {
      setIsSplitting(false);
    }
  };

  // Download all split files as ZIP
  const downloadAllFiles = async () => {
    if (splitFiles.length === 0) return;

    // For now, download files individually
    // In a real implementation, you'd use a ZIP library like JSZip
    splitFiles.forEach((fileData, index) => {
      const blob = new Blob([fileData as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `page-${index + 1}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  // Download single file
  const downloadFile = (fileData: Uint8Array, filename: string) => {
    const blob = new Blob([fileData as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset everything
  const resetAll = () => {
    setUploadedFile(null);
    setPdfDoc(null);
    setTotalPages(0);
    setSplitFiles([]);
    setError(null);
    setCustomPages('');
    setStartPage(1);
    setEndPage(1);
    setSplitOption('all');
  };

  const splitOptions: SplitOption[] = [
    {
      id: 'all',
      name: 'Split into individual pages',
      description: 'Create a separate PDF for each page',
      pages: `${totalPages} files`
    },
    {
      id: 'range',
      name: 'Split by page range',
      description: 'Extract a specific range of pages',
      pages: '1 file'
    },
    {
      id: 'custom',
      name: 'Split by page selection',
      description: 'Choose specific pages to extract',
      pages: '1 file'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">

      {/* Upload Section */}
      {!uploadedFile && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200
            ${isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {isDragActive ? 'Drop your PDF here' : 'Upload PDF to split'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop your PDF file here, or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Maximum file size: 50MB
              </p>
            </div>
            
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <FileText className="w-5 h-5 mr-2" />
              Choose PDF File
            </button>
          </div>
        </div>
      )}

      {/* Split Options */}
      {uploadedFile && !splitFiles.length && (
        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {uploadedFile.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFileSize(uploadedFile.size)} • {totalPages} pages
                </p>
              </div>
            </div>
          </div>

          {/* Split Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Choose Split Method
            </h3>
            
            <div className="space-y-4">
              {splitOptions.map((option) => (
                <label key={option.id} className="flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="splitOption"
                    value={option.id}
                    checked={splitOption === option.id}
                    onChange={(e) => setSplitOption(e.target.value as 'all' | 'range' | 'custom')}
                    className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {option.name}
                      </h4>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {option.pages}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Range Input */}
            {splitOption === 'range' && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Page Range
                </h4>
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Start Page
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={startPage}
                      onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      End Page
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={endPage}
                      onChange={(e) => setEndPage(parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Pages {startPage} to {endPage} will be extracted
                </p>
              </div>
            )}

            {/* Custom Pages Input */}
            {splitOption === 'custom' && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Page Numbers
                </h4>
                <input
                  type="text"
                  placeholder="e.g., 1, 3, 5-8, 10"
                  value={customPages}
                  onChange={(e) => setCustomPages(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Enter page numbers separated by commas. Use ranges like 5-8 for consecutive pages.
                </p>
              </div>
            )}

            {/* Split Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={splitPDF}
                disabled={isSplitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                {isSplitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Splitting PDF...
                  </>
                ) : (
                  <>
                    <Scissors className="h-5 w-5 mr-2" />
                    Split PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-center">
            <button
              onClick={resetAll}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Upload Different PDF
            </button>
          </div>
        </div>
      )}

      {/* Split Progress */}
      {isSplitting && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Splitting PDF...
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Processing {totalPages} pages...
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
                Split Failed
              </h3>
              <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success State with Animation */}
      {splitFiles.length > 0 && (
        <div className="space-y-6">
          <SuccessAnimation
            title="PDF Split Successfully!"
            message={`Your PDF has been split into ${splitFiles.length} file(s).`}
            stats={[
              {
                label: 'Files Created',
                value: splitFiles.length.toString(),
                icon: <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              },
              {
                label: 'Total Pages',
                value: totalPages.toString(),
                icon: <Scissors className="h-5 w-5 text-green-600 dark:text-green-400" />
              }
            ]}
            onAction={downloadAllFiles}
            actionLabel="Download All Files"
            actionIcon={<Download className="h-5 w-5" />}
            showConfetti={true}
          />

          {/* Individual Files */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Split Files ({splitFiles.length})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {splitFiles.map((fileData, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Page {index + 1}.pdf
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(fileData.length)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => downloadFile(fileData, `page-${index + 1}.pdf`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={resetAll}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Split Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
