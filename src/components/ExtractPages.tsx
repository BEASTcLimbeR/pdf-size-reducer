'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, RotateCcw, Loader2, AlertCircle, Scissors, Plus, Minus } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface ExtractPagesProps {
  onReset?: () => void;
}

export default function ExtractPages({ onReset }: ExtractPagesProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pagesToExtract, setPagesToExtract] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedFiles, setExtractedFiles] = useState<Uint8Array[]>([]);
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
      setPagesToExtract([]);
      
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

  // Toggle page selection
  const togglePage = (pageNumber: number) => {
    setPagesToExtract(prev => 
      prev.includes(pageNumber) 
        ? prev.filter(p => p !== pageNumber)
        : [...prev, pageNumber].sort((a, b) => a - b)
    );
  };

  // Select all pages
  const selectAllPages = () => {
    const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);
    setPagesToExtract(allPages);
  };

  // Clear all selections
  const clearAllPages = () => {
    setPagesToExtract([]);
  };

  // Extract selected pages
  const extractPages = async () => {
    if (!pdfDoc || !uploadedFile || pagesToExtract.length === 0) {
      setError('Please select pages to extract.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const extractedFilesArray: Uint8Array[] = [];

      // Extract each selected page as a separate PDF
      for (const pageNum of pagesToExtract) {
        const newPdf = await PDFDocument.create();
        const pageIndex = pageNum - 1;
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);
        newPdf.addPage(copiedPage);

        const pdfBytes = await newPdf.save({
          useObjectStreams: false,
          addDefaultPage: false,
        });

        extractedFilesArray.push(pdfBytes);
      }

      setExtractedFiles(extractedFilesArray);
    } catch (err) {
      console.error('Extract pages error:', err);
      setError('Failed to extract pages. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download all extracted files
  const downloadAllFiles = async () => {
    if (extractedFiles.length === 0) return;

    // Download files individually
    extractedFiles.forEach((fileData, index) => {
      const pageNum = pagesToExtract[index];
      const blob = new Blob([fileData as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `page-${pageNum}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  // Download single file
  const downloadFile = (fileData: Uint8Array, pageNum: number) => {
    const blob = new Blob([fileData as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `page-${pageNum}.pdf`;
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
    setPagesToExtract([]);
    setExtractedFiles([]);
    setError(null);
  };

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
                {isDragActive ? 'Drop your PDF here' : 'Upload PDF to extract pages'}
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

      {/* Page Selection */}
      {uploadedFile && !extractedFiles.length && (
        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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

          {/* Page Selection Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Pages to Extract
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllPages}
                  className="flex items-center px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Select All
                </button>
                <button
                  onClick={clearAllPages}
                  className="flex items-center px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Clear All
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected {pagesToExtract.length} of {totalPages} pages to extract
              </p>
              {pagesToExtract.length > 0 && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Pages to extract: {pagesToExtract.join(', ')}
                </p>
              )}
            </div>

            {/* Page Grid */}
            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-2 mb-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => togglePage(pageNum)}
                  className={`
                    w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all duration-200
                    ${pagesToExtract.includes(pageNum)
                      ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }
                  `}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={extractPages}
                disabled={isProcessing || pagesToExtract.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Extracting Pages...
                  </>
                ) : (
                  <>
                    <Scissors className="h-5 w-5 mr-2" />
                    Extract Selected Pages
                  </>
                )}
              </button>
              
              <button
                onClick={resetAll}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Upload Different PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Extracting Pages...
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Processing {pagesToExtract.length} selected pages...
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
                Extraction Failed
              </h3>
              <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {extractedFiles.length > 0 && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 text-green-500 mr-3">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-400">
                Pages Extracted Successfully!
              </h3>
            </div>
            
            <div className="text-center">
              <p className="text-green-700 dark:text-green-400 mb-4">
                {extractedFiles.length} page(s) have been extracted as separate PDF files.
              </p>
              
              <button
                onClick={downloadAllFiles}
                className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="h-5 w-5 mr-2" />
                Download All Files
              </button>
            </div>
          </div>

          {/* Individual Files */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Extracted Files ({extractedFiles.length})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {extractedFiles.map((fileData, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Page {pagesToExtract[index]}.pdf
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(fileData.length)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => downloadFile(fileData, pagesToExtract[index])}
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
              Extract Pages from Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
