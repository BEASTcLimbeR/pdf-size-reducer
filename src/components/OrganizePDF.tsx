'use client';

import React, { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, RotateCcw, ArrowUp, ArrowDown, Trash2, CheckCircle, AlertCircle, FileText, GripVertical } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface PageInfo {
  id: number;
  pageNumber: number;
  thumbnail: string;
}

interface DraggablePageItemProps {
  page: PageInfo;
  index: number;
  movePage: (fromIndex: number, toIndex: number) => void;
  movePageUp: (index: number) => void;
  movePageDown: (index: number) => void;
  removePage: (index: number) => void;
  totalPages: number;
}

const DraggablePageItem: React.FC<DraggablePageItemProps> = ({
  page,
  index,
  movePage,
  movePageUp,
  movePageDown,
  removePage,
  totalPages
}) => {
  const [{ isDragging, canDrag }, drag, preview] = useDrag({
    type: 'page',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      canDrag: monitor.canDrag(),
    }),
    end: (item, monitor) => {
      // Reset any visual states when drag ends
    },
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'page',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        movePage(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
    drop: (item: { index: number }) => {
      // Handle drop completion
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <>
      <div
        ref={(node) => drag(drop(node))}
        className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ease-in-out transform ${
          isDragging 
            ? 'opacity-30 scale-95 rotate-2 shadow-2xl bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' 
            : isOver && canDrop
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-lg scale-[1.02]'
            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:shadow-lg hover:scale-[1.01] hover:bg-gray-100 dark:hover:bg-gray-600'
        }`}
        style={{
          transform: isDragging ? 'rotate(2deg) scale(0.95)' : 'rotate(0deg) scale(1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform, opacity',
        }}
      >
      <div className="flex items-center">
        <div className={`mr-3 transition-all duration-200 ${
          isDragging ? 'scale-110 text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}>
          <GripVertical className="h-5 w-5 cursor-move" />
        </div>
        <div className={`w-16 h-20 rounded border flex items-center justify-center text-sm font-medium transition-all duration-200 ${
          isDragging 
            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300' 
            : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-300'
        }`}>
          {page.pageNumber}
        </div>
        <div className="ml-4">
          <p className={`font-medium transition-colors duration-200 ${
            isDragging ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
          }`}>
            Page {page.pageNumber}
          </p>
          <p className={`text-sm transition-colors duration-200 ${
            isDragging ? 'text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'
          }`}>
            Original page {page.id + 1}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => movePageUp(index)}
          disabled={index === 0}
          className="p-2 rounded-md transition-all duration-200 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95"
          title="Move up"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          onClick={() => movePageDown(index)}
          disabled={index === totalPages - 1}
          className="p-2 rounded-md transition-all duration-200 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95"
          title="Move down"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          onClick={() => removePage(index)}
          className="p-2 rounded-md transition-all duration-200 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95"
          title="Remove page"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      </div>
      
      {/* Custom Drag Preview */}
      {isDragging && (
        <div
          ref={preview}
          className="fixed pointer-events-none z-50 opacity-80"
          style={{
            transform: 'rotate(2deg) scale(0.95)',
          }}
        >
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 rounded-lg shadow-2xl">
            <div className="flex items-center">
              <GripVertical className="h-5 w-5 text-blue-500 mr-3" />
              <div className="w-16 h-20 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600 rounded flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300">
                {page.pageNumber}
              </div>
              <div className="ml-4">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Page {page.pageNumber}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Original page {page.id + 1}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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

  const movePage = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setPages(prevPages => {
      const newPages = [...prevPages];
      const [movedPage] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, movedPage);

      // Update page numbers
      return newPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1
      }));
    });
  }, []);

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
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-6xl mx-auto p-6">

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

              <div className="space-y-3 relative">
                {pages.map((page, index) => (
                  <div
                    key={page.id}
                    className="transition-all duration-300 ease-in-out"
                    style={{
                      transform: 'translateZ(0)', // Enable hardware acceleration
                    }}
                  >
                    <DraggablePageItem
                      page={page}
                      index={index}
                      movePage={movePage}
                      movePageUp={movePageUp}
                      movePageDown={movePageDown}
                      removePage={removePage}
                      totalPages={pages.length}
                    />
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
    </DndProvider>
  );
}
