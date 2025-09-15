'use client';

import React, { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, RotateCcw, ArrowUp, ArrowDown, Trash2, CheckCircle, AlertCircle, FileText, GripVertical } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface PageInfo {
  id: number;
  pageNumber: number;
  thumbnail: string;
}

interface OrganizePDFProps {
  onReset?: () => void;
}

export default function OrganizePDF({ onReset }: OrganizePDFProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [organizedFile, setOrganizedFile] = useState<Uint8Array | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      setFile(file);
      setError(null);
      setSuccess(false);
      setOrganizedFile(null);
      loadPDFPages(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const loadPDFPages = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();

      // Create page info array
      const pagesInfo: PageInfo[] = [];
      for (let i = 0; i < pageCount; i++) {
        pagesInfo.push({
          id: i,
          pageNumber: i + 1,
          thumbnail: `Page ${i + 1}` // Simple text representation
        });
      }

      setPages(pagesInfo);
    } catch (err) {
      setError('Failed to load PDF. Please try again.');
      console.error('Error loading PDF:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newPages = [...pages];
    const [movedPage] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, movedPage);

    // Update page numbers
    const updatedPages = newPages.map((page, index) => ({
      ...page,
      pageNumber: index + 1
    }));

    setPages(updatedPages);
  };

  const movePageUp = (index: number) => {
    if (index > 0) {
      movePage(index, index - 1);
    }
  };

  const movePageDown = (index: number) => {
    if (index < pages.length - 1) {
      movePage(index, index + 1);
    }
  };

  const removePage = (index: number) => {
    const newPages = pages.filter((_, i) => i !== index);
    const updatedPages = newPages.map((page, i) => ({
      ...page,
      pageNumber: i + 1
    }));
    setPages(updatedPages);
  };

  const handleOrganizePDF = async () => {
    if (!file || pages.length === 0) return;

    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdfDoc = await PDFDocument.create();

      // Add pages in the new order
      for (const pageInfo of pages) {
        const [originalPage] = await newPdfDoc.copyPages(pdfDoc, [pageInfo.id]);
        newPdfDoc.addPage(originalPage);
      }

      const organizedPdfBytes = await newPdfDoc.save();
      setOrganizedFile(organizedPdfBytes);
      setSuccess(true);
    } catch (err) {
      setError('Failed to organize PDF. Please try again.');
      console.error('Error organizing PDF:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadOrganizedPDF = () => {
    if (!organizedFile) return;

    const blob = new Blob([organizedFile as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file ? `organized_${file.name}` : 'organized.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setPages([]);
    setError(null);
    setSuccess(false);
    setOrganizedFile(null);
    if (onReset) onReset();
  };

  if (success && organizedFile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              PDF Successfully Organized!
            </h3>
          </div>
          <p className="text-green-700 dark:text-green-300 mb-4">
            Your PDF has been reorganized with the new page order. You can now download the organized PDF.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadOrganizedPDF}
              className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Organized PDF
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Organize Another PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => onReset && onReset()}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Tools
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Organize PDF
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Upload a PDF and drag pages to reorder them. You can also remove unwanted pages and arrange them in your preferred order.
        </p>
      </div>

      {!file ? (
        <div className="max-w-2xl mx-auto">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isDragActive ? 'Drop the PDF here' : 'Upload a PDF file'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Drag and drop your PDF here, or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supports PDF files up to 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {file.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {pages.length} pages
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-red-800 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}

          {/* Pages List */}
          {pages.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Page Order ({pages.length} pages)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Drag pages to reorder or use the arrow buttons
                </p>
              </div>

              <div className="space-y-2">
                {pages.map((page, index) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center">
                      <GripVertical className="h-5 w-5 text-gray-400 mr-3 cursor-move" />
                      <div className="w-16 h-20 bg-white dark:bg-gray-600 rounded border flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                        {page.pageNumber}
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Page {page.pageNumber}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Original page {page.id + 1}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => movePageUp(index)}
                        disabled={index === 0}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => movePageDown(index)}
                        disabled={index === pages.length - 1}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removePage(index)}
                        className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                        title="Remove page"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={handleOrganizePDF}
                  disabled={isProcessing || pages.length === 0}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Organizing PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mr-2" />
                      Organize PDF ({pages.length} pages)
                    </>
                  )}
                </button>
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="h-5 w-5 mr-2 inline" />
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
