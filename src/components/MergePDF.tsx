'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, RotateCcw, Loader2, CheckCircle, AlertCircle, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import ProgressIndicator from './ProgressIndicator';
import SuccessAnimation from './SuccessAnimation';
import { useProgress } from '@/hooks/useProgress';

interface MergePDFProps {
  onReset?: () => void;
}

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pages: number;
}

export default function MergePDF({ onReset }: MergePDFProps) {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [mergedFile, setMergedFile] = useState<Uint8Array | null>(null);

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
      { id: 'validate', label: 'Validating PDF files', estimatedTime: 2 },
      { id: 'load-pdfs', label: 'Loading PDF documents', estimatedTime: 4 },
      { id: 'merge-pages', label: 'Merging pages', estimatedTime: 6 },
      { id: 'optimize', label: 'Optimizing merged PDF', estimatedTime: 3 },
      { id: 'finalize', label: 'Finalizing output', estimatedTime: 2 }
    ],
    onComplete: () => {
      // Merge completed successfully
    },
    onError: (err) => {
      console.error('Merge error:', err);
    },
    onCancel: async () => {
      resetProgress();
    }
  });

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file drop/selection
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Clear any previous errors by resetting progress
    resetProgress();
    
    const newPdfFiles: PDFFile[] = [];
    
    acceptedFiles.forEach((file) => {
      if (file.type === 'application/pdf') {
        const id = Math.random().toString(36).substr(2, 9);
        newPdfFiles.push({
          id,
          file,
          name: file.name,
          size: file.size,
          pages: 0 // Will be updated after loading
        });
      }
    });

    if (newPdfFiles.length > 0) {
      setPdfFiles(prev => [...prev, ...newPdfFiles]);
      
      // Load PDFs to get page counts
      newPdfFiles.forEach(async (pdfFile) => {
        try {
          const arrayBuffer = await pdfFile.file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const pageCount = pdfDoc.getPageCount();
          
          setPdfFiles(prev => prev.map(f => 
            f.id === pdfFile.id ? { ...f, pages: pageCount } : f
          ));
        } catch (err) {
          console.error('Error loading PDF:', err);
        }
      });
    } else {
      setStepError('validate', 'Please upload PDF files only.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    maxFiles: 20,
    maxSize: 50 * 1024 * 1024, // 50MB per file
  });

  // Remove PDF from list
  const removePdf = (id: string) => {
    setPdfFiles(prev => prev.filter(f => f.id !== id));
  };

  // Move PDF up in order
  const moveUp = (index: number) => {
    if (index > 0) {
      setPdfFiles(prev => {
        const newFiles = [...prev];
        [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
        return newFiles;
      });
    }
  };

  // Move PDF down in order
  const moveDown = (index: number) => {
    if (index < pdfFiles.length - 1) {
      setPdfFiles(prev => {
        const newFiles = [...prev];
        [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
        return newFiles;
      });
    }
  };

  // Merge PDFs
  const mergePDFs = async () => {
    if (pdfFiles.length < 2) {
      setStepError('validate', 'Please upload at least 2 PDF files to merge.');
      return;
    }

    try {
      startProcessing();
      resetProgress();

      // Step 1: Validate PDF files
      completeStep('validate');
      
      // Step 2: Load PDF documents
      completeStep('load-pdfs');

      // Create new PDF document
      const mergedPdf = await PDFDocument.create();

      // Step 3: Merge pages
      completeStep('merge-pages');

      // Process each PDF
      for (let i = 0; i < pdfFiles.length; i++) {
        try {
          const arrayBuffer = await pdfFiles[i].file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          
          // Copy all pages from this PDF
          const pageIndices = Array.from({ length: pdfDoc.getPageCount() }, (_, index) => index);
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
          
          // Add pages to merged PDF
          copiedPages.forEach(page => mergedPdf.addPage(page));
        } catch (err) {
          console.error(`Error processing PDF ${pdfFiles[i].name}:`, err);
          throw new Error(`Failed to process ${pdfFiles[i].name}. The file may be corrupted.`);
        }
      }

      // Step 4: Optimize merged PDF
      completeStep('optimize');

      // Save merged PDF
      const mergedBytes = await mergedPdf.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      setMergedFile(mergedBytes);

      // Step 5: Finalize
      completeStep('finalize');
    } catch (err) {
      console.error('Merge error:', err);
      setStepError('merge-pages', err instanceof Error ? err.message : 'Failed to merge PDFs. Please try again.');
    }
  };

  // Download merged file
  const downloadMergedFile = () => {
    if (!mergedFile) return;

    const blob = new Blob([mergedFile as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'merged-document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset everything
  const resetAll = () => {
    setPdfFiles([]);
    setMergedFile(null);
    resetProgress();
  };

  return (
    <div className="w-full max-w-6xl mx-auto">

      {/* Upload Section */}
      {pdfFiles.length === 0 && (
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
                {isDragActive ? 'Drop your PDFs here' : 'Upload PDF files to merge'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop multiple PDF files here, or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Maximum 20 files, 50MB each
              </p>
            </div>
            
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Choose PDF Files
            </button>
          </div>
        </div>
      )}

      {/* PDF List */}
      {pdfFiles.length > 0 && !mergedFile && (
        <div className="space-y-6">
          {/* File List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                PDF Files to Merge ({pdfFiles.length})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Drag to reorder or use the arrow buttons
              </p>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pdfFiles.map((pdfFile, index) => (
                <div key={pdfFile.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {pdfFile.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(pdfFile.size)} • {pdfFile.pages} pages
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === pdfFiles.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removePdf(pdfFile.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={mergePDFs}
              disabled={isProcessing || pdfFiles.length < 2}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Merging PDFs...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 mr-2" />
                  Merge PDFs
                </>
              )}
            </button>
            
            <button
              onClick={resetAll}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Merge Progress */}
      {isProcessing && (
        <ProgressIndicator
          steps={steps}
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
                Merge Failed
              </h3>
              <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {mergedFile && (
        <div>
          <SuccessAnimation
            title="PDFs Merged Successfully!"
            message={`Your ${pdfFiles.length} PDF files have been merged into one document.`}
            stats={[
              { label: 'Files Merged', value: pdfFiles.length.toString() },
              { label: 'Total Pages', value: pdfFiles.reduce((sum, file) => sum + file.pages, 0).toString() },
              { label: 'File Size', value: formatFileSize(mergedFile.length) }
            ]}
            onAction={downloadMergedFile}
            actionLabel="Download Merged PDF"
            actionIcon={<Download className="h-5 w-5" />}
          />
          
          {/* Additional Action Button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={resetAll}
              className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Merge More PDFs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
